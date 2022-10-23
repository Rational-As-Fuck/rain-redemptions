use {
    anchor_lang::{
        prelude::*,
        solana_program::{
            sysvar:: {
                self,
                SysvarId,
            },
        },
    },
    anchor_spl::{
        self,
        token::{ Mint, TokenAccount, Token, Transfer },
    },
    metaplex_token_metadata::state::{ Metadata, Data },
    arrayref::array_ref,
    std::str::FromStr,
    metaplex_token_metadata::solana_program::msg,
};

declare_id!("7HXG93N6ino2vUfa3qb9suTbGq7ts7o1pdTs27ayP9pw");

pub const DISCRIMINATOR_SIZE: usize = 8;
const REDEMPTION_AMOUNT: f64 = 400.0; 
const PREFIX: &[u8] = b"imso_claim";
const BLOCK_HASHES: &str = "SysvarRecentB1ockHashes11111111111111111111";

const PANDA_VERIFIED_CREATORS: &[&str] = &[
    "CLErvyrMpi66RAxNV2wveSi25NxHb8G383MSVuGDgZzp", // Old candymachine
    "HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx", // New candymachine
    // /////////////////////////////////////////////////
    "ERmHNhqr5bXGRiRWV81q4anLuiy1zXEuJkxfRb5TYwBm",
    "Db5BpnSHPvAuqH4s7gMCWQkN7F7fRGR7D4z5qPpQMysd",// Testing
];

const RAIN_MINT_DECIMALS: u8 = 5;

#[program]
pub mod imso_claim {
    use super::*;

    pub fn initialize<'info>(ctx: Context<InitializeTreasury<'info>>, args: Treasury) -> Result<()> {

        let treasury = &mut ctx.accounts.treasury;
       
        treasury.set_inner(args.clone());
        treasury.rain_mint = ctx.accounts.rain_mint.key();
        treasury.rain_vault = ctx.accounts.rain_vault.key();
        treasury.bump = *ctx.bumps.get("treasury").unwrap();
        
        treasury.update_authority = args.update_authority;
        treasury.enabled = false;
        Ok(())
    }

    pub fn update_treasury<'info>(ctx: Context<TreasuryAuthority<'info>>, args: Treasury) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.set_inner(args);
        Ok(())
    }

    pub fn enable_treasury<'info>(ctx: Context<TreasuryAuthority<'info>>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.enabled = true;
        Ok(())
    }

    pub fn disable_treasury<'info>(ctx: Context<TreasuryAuthority<'info>>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.enabled = false;
        Ok(())
    }

    pub fn redeem_panda_ownership_rain_tokens<'info>(ctx: Context<RedeemNFTForRain<'info>>) -> Result<()> {
        treasury_enabled_or_error(&ctx.accounts.treasury).unwrap();
        
        verify_nft_ownership(
            &ctx.accounts.nft_token_account,
            &ctx.accounts.nft_mint.key(),
            &ctx.accounts.owner,
            &ctx.accounts.token_metadata_program.key(),
            Some(&ctx.accounts.nft_master_edition_account),
            &ctx.accounts.nft_metadata_account,
            PANDA_VERIFIED_CREATORS
        ).unwrap();

        let amount: f64;
        amount = REDEMPTION_AMOUNT; 
        transfer_rain(
            &ctx.accounts.rain_vault,
            &ctx.accounts.dest_rain_token_account,
            &ctx.accounts.token_program,
            &ctx.bumps.get("rain_vault").unwrap().to_le_bytes(),
            amount,
        ).unwrap();

        let nft_redeemed = &mut ctx.accounts.nft_redeemed;
        nft_redeemed.recent_slothash = get_slothash(&ctx.accounts.recent_slothashes).unwrap();
        nft_redeemed.bump = *ctx.bumps.get("nft_redeemed").unwrap();

        Ok(())
    }
}

fn treasury_enabled_or_error(treasury: &Treasury) -> Result<()>{
    if treasury.enabled {
        Ok(())
    } else {
        err!(RedemptionErrorCode::TreasuryDisabled)
    }
}

fn verify_nft_ownership<'info>(
    nft_token_account: &Account<'info, TokenAccount>,
    nft_mint: &Pubkey,
    owner: &Signer<'info>,
    token_metadata_program: &Pubkey,
    nft_master_edition_account: Option<&AccountInfo<'info>>,
    nft_metadata_account: &AccountInfo<'info>,
    valid_creators: &[&str],
) -> Result<Data> {
    assert_eq!(nft_token_account.owner, owner.key());
    assert_eq!(nft_token_account.mint, *nft_mint);
    assert_eq!(nft_token_account.amount, 1);

    let master_edition_seed = &[
        "metadata".as_bytes(),
        &token_metadata_program.to_bytes(),
        nft_token_account.mint.as_ref(),
        "edition".as_bytes(),
    ];

    if nft_master_edition_account.is_some() {
        let (master_edition_key, _master_edition_bump) = Pubkey::find_program_address(
            master_edition_seed,
            token_metadata_program,
        );

        assert_eq!(master_edition_key, nft_master_edition_account.unwrap().key());

        if nft_master_edition_account.unwrap().data_is_empty() {
            return Err(ErrorCode::AccountNotInitialized.into());
        }
    }

    let nft_metadata_account = nft_metadata_account;
    let nft_mint_account_pubkey = nft_mint;

    let metadata_seed = &[
        "metadata".as_bytes(),
        &token_metadata_program.to_bytes(),
        nft_mint_account_pubkey.as_ref(),
    ];

    let (metadata_key, _metadata_bump) = Pubkey::find_program_address(
        metadata_seed,
        token_metadata_program,
    );

    assert_eq!(metadata_key, nft_metadata_account.key());

    if nft_metadata_account.data_is_empty() {
        return Err(ErrorCode::AccountNotInitialized.into());
    }

    let nft_metadata_account = &mut Metadata::from_account_info(&nft_metadata_account).unwrap(); 

    let valid_creators_keys = &mut valid_creators.iter().map(|creator| {
        Pubkey::from_str(creator).unwrap()
    });

    let creator = &nft_metadata_account.data.creators.as_ref().unwrap()[0];
    assert_eq!(
        valid_creators_keys.find(|key| *key == creator.address),
        Some(creator.address)
    );

    if !creator.verified {
        return Err(RedemptionErrorCode::NFTCreatorNotVerified.into());
    }

    Ok(nft_metadata_account.data.clone())
}

fn transfer_rain<'info>(
    rain_vault: &Account<'info, TokenAccount>,
    dest_rain_token_account: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    rain_vault_bump: &[u8],
    amount_tokens: f64,
) -> Result<()> {
    let signer_seeds = vec![
        PREFIX.as_ref(),
        b"rain_vault".as_ref(),
        rain_vault_bump,
    ];
    
    let wrapped_signer_seeds = vec![signer_seeds.as_slice()];

    let transfer_instruction = Transfer {
        from: rain_vault.to_account_info(),
        to: dest_rain_token_account.to_account_info(),
        authority: rain_vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        transfer_instruction,
        wrapped_signer_seeds.as_slice(),
    );

    Ok(anchor_spl::token::transfer(cpi_ctx, float_amount_to_amount(amount_tokens)).unwrap())
}

// Copied from spl-token
// https://github.com/solana-labs/solana-program-library/blob/3d92f8f4dc4fab63b9eb68f33185d9c2829abcfe/token/program/src/lib.rs#L26
fn float_amount_to_amount(ui_amount: f64) -> u64 {
    (ui_amount * 10_usize.pow(RAIN_MINT_DECIMALS as u32) as f64) as u64
}

fn get_slothash(
    recent_slothashes: &AccountInfo,
) -> Result<u64>{
    if recent_slothashes.key().to_string() == BLOCK_HASHES {
        msg!("recent_blockhashes is deprecated and will break soon");
    }
    if recent_slothashes.key() != sysvar::slot_hashes::SlotHashes::id()
        && recent_slothashes.key().to_string() != BLOCK_HASHES
    {
        return Err(ErrorCode::AccountSysvarMismatch.into());
    }

    let data = recent_slothashes.data.borrow();
    let most_recent = array_ref![data, 12, 8];

    Ok(u64::from_le_bytes(*most_recent))
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [PREFIX, b"treasury"],
        bump,
        space = Treasury::SPACE,
    )]
    treasury: Account<'info, Treasury>,
    #[account(
        init,
        payer = payer,
        seeds = [PREFIX, b"rain_vault"],
        bump,
        token::mint = rain_mint,
        token::authority = rain_vault,
    )]
    rain_vault: Account<'info, TokenAccount>,

    rain_mint: Account<'info, Mint>,

    #[account(mut)]
    payer: Signer<'info>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TreasuryAuthority<'info> {
    #[account(
        mut,
        seeds = [PREFIX, b"treasury"],
        bump = treasury.bump
    )]
    treasury: Account<'info, Treasury>,
    #[account(
        constraint = treasury.update_authority == update_authority.key()
    )]
    update_authority: Signer<'info>
}

#[derive(Accounts)]
pub struct RedeemNFTForRain<'info> {
    #[account(
        seeds = [PREFIX, b"treasury"],
        bump = treasury.bump
    )]
    treasury: Box<Account<'info, Treasury>>,
    #[account(
        init,
        seeds = [PREFIX, b"imso_claim", nft_mint.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed: Box<Account<'info, NFTRedeemed>>,

    #[account(mut)]
    owner: Signer<'info>,

    nft_mint: Box<Account<'info, Mint>>,
    nft_token_account: Account<'info, TokenAccount>,

    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account: AccountInfo<'info>,
    /// CHECK: account checked against PDA generated from the nft_token_account
    /// in instruction processor which in turn verifies this account
    nft_master_edition_account: AccountInfo<'info>,
    #[account(address = Pubkey::new(metaplex_token_metadata::id().as_ref()))]
    /// CHECK: account is checked that the address matches metaplex_token_metadata::id crate
    token_metadata_program: AccountInfo<'info>,

    #[account(
        mut,
        address = (*treasury).rain_vault.key(),
        seeds = [PREFIX, b"rain_vault"],
        bump,
    )]
    rain_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = dest_rain_token_account.owner == owner.key(),
        constraint = dest_rain_token_account.mint == (*treasury).rain_mint.key()
    )]
    dest_rain_token_account: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
    // Recent slothash to use in nft_redeemed account data
    /// CHECK: account checked in instruction processor
    recent_slothashes: UncheckedAccount<'info>,
}

#[account]
#[derive(Default)]
pub struct Treasury {
    pub update_authority: Pubkey,
    pub rain_mint: Pubkey,
    pub rain_vault: Pubkey,
    pub redemption_multiplier: f64,
    pub enabled: bool,
    pub bump: u8,
}
impl Treasury {
    const SPACE: usize = 32 * 3 + 8 + 1 + 1 + DISCRIMINATOR_SIZE;
}

#[account]
#[derive(Default)]
pub struct NFTRedeemed {
    pub recent_slothash: u64,
    pub bump: u8,
}
impl NFTRedeemed {
    const SPACE: usize = 8 + 1 + DISCRIMINATOR_SIZE;
}

#[derive(AnchorDeserialize, AnchorSerialize, Copy, Clone, Debug, Default)]
pub struct NftRedemptionState {
    pub key: Pubkey,
    pub token_key: Pubkey,
    pub metadata_key: Pubkey,
    pub is_verified: bool,
}

#[error_code]
pub enum RedemptionErrorCode {
    #[msg("Treasury is disabled")]
    TreasuryDisabled,
    #[msg("NFT Creator not verified")]
    NFTCreatorNotVerified
}
