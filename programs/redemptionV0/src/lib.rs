pub mod constants;

use {
    crate::constants::{
        XALT_1_MINTS,
        XALT_2_MINTS,
        XALT_3_MINTS,
        XALT_4_MINTS,
        XALT_5_MINTS,
        XALT_6_MINTS,
        XALT_7_MINTS,
    },
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
    std::collections::HashSet,
    std::hash::Hash,
};

declare_id!("tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP");

pub const DISCRIMINATOR_SIZE: usize = 8;
const PREFIX: &[u8] = b"trash_with_frens_redemption";
const BLOCK_HASHES: &str = "SysvarRecentB1ockHashes11111111111111111111";

const PANDA_VERIFIED_CREATORS: &[&str] = &[
    "CLErvyrMpi66RAxNV2wveSi25NxHb8G383MSVuGDgZzp", // Old candymachine
    "HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx", // New candymachine
    // /////////////////////////////////////////////////
    "ERmHNhqr5bXGRiRWV81q4anLuiy1zXEuJkxfRb5TYwBm", // Testing
];
const RUG_VERIFIED_CREATOR: &[&str] = &[
    "BHRFPSHHtLqjbcvVCmGrCjgbUagwnKDxp4CbUgoED3tT",
    // /////////////////////////////////////////////////
    "3bVAFGEMHyfQnjmgiKrvXAurJrw3psLu5Md1caGpDhaZ", // Testing
];

// Number of pandas minted (April 7th) = 16,881   source (https://moonrank.app/collection/degen_trash_pandas)
//
// Total rugs = 1,843
// Gold rugs = 60
// Red rugs = 60
// Purple rugs = 146
// Green rugs = 300
// Blue rugs = 613
// Black rugs = 664
// Possible complete sets = 60
//
// Total XALTs = 694
// RUGGED_COUNT: 2 = 283
// PSYCHOLOGICAL_TRAUMA_LEVEL: Medium = 127
// WEN: 2 hours = 81
// TELL_ME_A_JOKE: Mint Date = 81
// EXILED: Just kidding. = 69
// MONOLIFF?: Mono-LEAF! = 29
// B_AND_J: â™¥ = 24
//
// The redemption multiplier will vary to be split 50/30/20 between Rugs/xAlt Pandas/regular Pandas
//
// Formula:
//      ((REDEMPTION_MULTIPLIER*(#PANDA-#PANDA_XALT)) * PANDA_SHARE) + ((2*REDEMPTION_MULTIPLIER*#PANDA_XALT1) + (3*REDEMPTION_MULTIPLIER*#PANDA_XALT2) +
//      (4*REDEMPTION_MULTIPLIER*#PANDA_XALT3) + (5*REDEMPTION_MULTIPLIER*#PANDA_XALT4) + (6*REDEMPTION_MULTIPLIER*#PANDA_XALT5) + 
//      (7*REDEMPTION_MULTIPLIER*#PANDA_XALT6) + (8*REDEMPTION_MULTIPLIER*#PANDA_XALT7)) * XALT_SHARE) + ((REDEMPTION_MULTIPLIER*#RUGLVL1) +
//      (RUG_LV2_MULTIPLIER*REDEMPTION_MULTIPLIER*#RUGLVL2) + (RUG_LV3_MULTIPLIER*REDEMPTION_MULTIPLIER*#RUGLVL3) +
//      (RUG_LV4_MULTIPLIER*REDEMPTION_MULTIPLIER*#RUGLVL4) + (RUG_LV5_MULTIPLIER*REDEMPTION_MULTIPLIER*#RUGLVL5) +
//      (RUG_LV6_MULTIPLIER*REDEMPTION_MULTIPLIER*#RUGLVL6) + (RUG_COMPLETE_MULTIPLIER*REDEMPTION_MULTIPLER*COMPLETESETS) * RUG_SHARE) = 1_000_000
//
// Calculation with splits:
// r = RUG_SHARE, y = PANDA_SHARE, z = XALT_SHARE
//
//  Pandas no xalt          xalt1       xalt2        xalt3       xalt4       xalt5       xalt6       xalt7        Black        Blue        Green        Purple        Red          Gold       Full Set
// (XY*(16881 - 694)) + ((2*XZ*283) + (3*XZ*127) + (4*XZ*81) + (5*XZ*81) + (6*XZ*69) + (7*XZ*29) + (8*XZ*24)) + ((XR*664) + (3*XR*613) + (5*XR*300) + (8*XR*146) + (12*XR*60) + (20*XR*60) + (50*XR*60)) = 1000000
//
// Solution:
// X = 1000000/(10091r + 16187y + 2485z)
//
// Simplified (r = .5, y = .3, z = .2):
// X = 96.16679168 ~= 96
//
// xalt_level_multipliers
// 2,3,4,5,6,7,8
//
// rug_level_multipliers
// 1, 3, 5, 8, 12, 20
//
// Panda
// amount = 96.16679168 * .3
// Panda xalt
// amount = 96.16679168 * .2 * xalt_level_multiplier
// Rug
// amount = 96.16679168 * .5 * rug_level_multiplier
// Rug Set
// amount = 96.16679168 * .5 * 50 
// 
//////////////////////////////////////////////////////////////////
// Final calculations
//////////////////////
// Panda = 28.85003
// Panda (XALT - RUGGED_COUNT: 2) = 38.46671
// Panda (XALT - PSYCHOLOGICAL_TRAUMA_LEVEL: Medium) = 57.70007
// Panda (XALT - WEN: 2 hours) = 76.93343
// Panda (XALT - TELL_ME_A_JOKE: Mint Date) = 96.16679
// Panda (XALT - EXILED: Just kidding.) = 115.40015
// Panda (XALT - MONOLIFF?: Mono-LEAF!) = 134.63350
// Panda (XALT - B_AND_J: â™¥) = 153.86686
// Rug (Black) = 48.08339
// Rug (Blue) = 144.25018
// Rug (Green) = 240.41697
// Rug (Purple) = 384.66716
// Rug (Red) = 577.00075
// Rug (Gold) = 961.66791
// Rug Set = 2404.16977
//////////////////////////////////////////////////////////////////
const REDEMPTION_MULTIPLIER: f64 = 96.166791; 
const RUG_SHARE: f64 = 0.5;
const XALT_SHARE: f64 = 0.2;
const PANDA_SHARE: f64 = 0.3;
const RAIN_MINT_DECIMALS: u8 = 5;

#[program]
pub mod redemption_v0 {
    use super::*;

    pub fn initialize<'info>(ctx: Context<InitializeTreasury<'info>>, args: Treasury) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.set_inner(args.clone());
        treasury.rain_mint = ctx.accounts.rain_mint.key();
        treasury.rain_vault = ctx.accounts.rain_vault.key();
        treasury.bump = *ctx.bumps.get("treasury").unwrap();
        if args.redemption_multiplier == 0.0 {
            treasury.redemption_multiplier = REDEMPTION_MULTIPLIER;
        }
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
        let redemption_multipler = ctx.accounts.treasury.redemption_multiplier;
        let (is_xalt, xalt_multiplier) = is_panda_xalt(ctx.accounts.nft_mint.key());

        let amount: f64;
        if is_xalt {
            amount = redemption_multipler * XALT_SHARE * xalt_multiplier as f64;
        } else {
            amount = redemption_multipler * PANDA_SHARE; 
        }
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

    pub fn redeem_rug_ownership_rain_tokens<'info>(ctx: Context<RedeemNFTForRain<'info>>) -> Result<()> {
        treasury_enabled_or_error(&ctx.accounts.treasury).unwrap();
        let rug_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account,
            &ctx.accounts.nft_mint.key(),
            &ctx.accounts.owner,
            &ctx.accounts.token_metadata_program.key(),
            Some(&ctx.accounts.nft_master_edition_account),
            &ctx.accounts.nft_metadata_account,
            RUG_VERIFIED_CREATOR
        ).unwrap();
        let redemption_multipler = ctx.accounts.treasury.redemption_multiplier;

        // Transfer rain tokens to Rug NFT owner
        let rug_level = RugLevel::uri_to_level(rug_metadata_data.uri.trim_matches(char::from(0))).unwrap();   
        let amount = (redemption_multipler * RUG_SHARE) * rug_level.multiplier() as f64;
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

    pub fn redeem_rug_set_ownership_rain_tokens<'info>(ctx: Context<RedeemNFTSetForRain<'info>>) -> Result<()> {
        treasury_enabled_or_error(&ctx.accounts.treasury).unwrap();
        let token_metadata_program_key = &ctx.accounts.token_metadata_program.key();

        let rug_1_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account_1,
            &ctx.accounts.nft_mint_1.key(),
            &ctx.accounts.owner,
            &token_metadata_program_key,
            None,
            &ctx.accounts.nft_metadata_account_1,
            RUG_VERIFIED_CREATOR
        ).unwrap();

        let rug_2_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account_2,
            &ctx.accounts.nft_mint_2.key(),
            &ctx.accounts.owner,
            &token_metadata_program_key,
            None,
            &ctx.accounts.nft_metadata_account_2,
            RUG_VERIFIED_CREATOR
        ).unwrap();

        let rug_3_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account_3,
            &ctx.accounts.nft_mint_3.key(),
            &ctx.accounts.owner,
            &token_metadata_program_key,
            None,
            &ctx.accounts.nft_metadata_account_3,
            RUG_VERIFIED_CREATOR
        ).unwrap();

        let rug_4_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account_4,
            &ctx.accounts.nft_mint_4.key(),
            &ctx.accounts.owner,
            &token_metadata_program_key,
            None,
            &ctx.accounts.nft_metadata_account_4,
            RUG_VERIFIED_CREATOR
        ).unwrap();

        let rug_5_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account_5,
            &ctx.accounts.nft_mint_5.key(),
            &ctx.accounts.owner,
            &token_metadata_program_key,
            None,
            &ctx.accounts.nft_metadata_account_5,
            RUG_VERIFIED_CREATOR
        ).unwrap();

        let rug_6_metadata_data = verify_nft_ownership(
            &ctx.accounts.nft_token_account_6,
            &ctx.accounts.nft_mint_6.key(),
            &ctx.accounts.owner,
            &token_metadata_program_key,
            None,
            &ctx.accounts.nft_metadata_account_6,
            RUG_VERIFIED_CREATOR
        ).unwrap();

        let redemption_multipler = ctx.accounts.treasury.redemption_multiplier;

        let rug_level_1 = RugLevel::uri_to_level(rug_1_metadata_data.uri.trim_matches(char::from(0))).unwrap();   
        let rug_level_2 = RugLevel::uri_to_level(rug_2_metadata_data.uri.trim_matches(char::from(0))).unwrap();   
        let rug_level_3 = RugLevel::uri_to_level(rug_3_metadata_data.uri.trim_matches(char::from(0))).unwrap();   
        let rug_level_4 = RugLevel::uri_to_level(rug_4_metadata_data.uri.trim_matches(char::from(0))).unwrap();   
        let rug_level_5 = RugLevel::uri_to_level(rug_5_metadata_data.uri.trim_matches(char::from(0))).unwrap();   
        let rug_level_6 = RugLevel::uri_to_level(rug_6_metadata_data.uri.trim_matches(char::from(0))).unwrap();   

        let rug_levels = vec![
            rug_level_1,
            rug_level_2,
            rug_level_3,
            rug_level_4,
            rug_level_5,
            rug_level_6,
        ];

        assert!(has_unique_elements(rug_levels));

        let amount = (redemption_multipler * RUG_SHARE) * RugLevel::complete_set_multiplier() as f64;
        transfer_rain(
            &ctx.accounts.rain_vault,
            &ctx.accounts.dest_rain_token_account,
            &ctx.accounts.token_program,
            &ctx.bumps.get("rain_vault").unwrap().to_le_bytes(),
            amount,
        ).unwrap();

        let nft_redeemed_1 = &mut ctx.accounts.nft_redeemed_1;
        nft_redeemed_1.bump = *ctx.bumps.get("nft_redeemed_1").unwrap();
        let nft_redeemed_2 = &mut ctx.accounts.nft_redeemed_2;
        nft_redeemed_2.bump = *ctx.bumps.get("nft_redeemed_2").unwrap();
        let nft_redeemed_3 = &mut ctx.accounts.nft_redeemed_3;
        nft_redeemed_3.bump = *ctx.bumps.get("nft_redeemed_3").unwrap();
        let nft_redeemed_4 = &mut ctx.accounts.nft_redeemed_4;
        nft_redeemed_4.bump = *ctx.bumps.get("nft_redeemed_4").unwrap();
        let nft_redeemed_5 = &mut ctx.accounts.nft_redeemed_5;
        nft_redeemed_5.bump = *ctx.bumps.get("nft_redeemed_5").unwrap();
        let nft_redeemed_6 = &mut ctx.accounts.nft_redeemed_6;
        nft_redeemed_6.bump = *ctx.bumps.get("nft_redeemed_6").unwrap();

        Ok(())
    }
}

fn has_unique_elements<T>(iter: T) -> bool
where
    T: IntoIterator,
    T::Item: Eq + Hash,
{
    let mut uniq = HashSet::new();
    iter.into_iter().all(move |x| uniq.insert(x))
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

fn is_panda_xalt(
    mint: Pubkey
) -> (bool, u8) {
    let mint_key = &mut mint.to_string();
    let mint_key = mint_key.as_str();

    if XALT_1_MINTS.contains(&mint_key) {
        return (true, 2)
    }
    if XALT_2_MINTS.contains(&mint_key) {
        return (true, 3)
    }
    if XALT_3_MINTS.contains(&mint_key) {
        return (true, 4)
    }
    if XALT_4_MINTS.contains(&mint_key) {
        return (true, 5)
    }
    if XALT_5_MINTS.contains(&mint_key) {
        return (true, 6)
    }
    if XALT_6_MINTS.contains(&mint_key) {
        return (true, 7)
    }
    if XALT_7_MINTS.contains(&mint_key) {
        return (true, 8)
    }
    (false, 0)
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
        seeds = [PREFIX, b"redemption", nft_mint.key().as_ref()],
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

#[derive(Accounts)]
pub struct RedeemNFTSetForRain<'info> {
    #[account(
        seeds = [PREFIX, b"treasury"],
        bump = treasury.bump
    )]
    treasury: Box<Account<'info, Treasury>>,
    #[account(
        init,
        seeds = [PREFIX, b"redemption", b"rug_set", nft_mint_1.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed_1: Box<Account<'info, NFTRedeemed>>,
    #[account(
        init,
        seeds = [PREFIX, b"redemption", b"rug_set", nft_mint_2.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed_2: Box<Account<'info, NFTRedeemed>>,
    #[account(
        init,
        seeds = [PREFIX, b"redemption", b"rug_set", nft_mint_3.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed_3: Box<Account<'info, NFTRedeemed>>,
    #[account(
        init,
        seeds = [PREFIX, b"redemption", b"rug_set", nft_mint_4.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed_4: Box<Account<'info, NFTRedeemed>>,
    #[account(
        init,
        seeds = [PREFIX, b"redemption", b"rug_set", nft_mint_5.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed_5: Box<Account<'info, NFTRedeemed>>,
    #[account(
        init,
        seeds = [PREFIX, b"redemption", b"rug_set", nft_mint_6.key().as_ref()],
        payer = owner,
        bump,
        space = NFTRedeemed::SPACE,
    )]
    nft_redeemed_6: Box<Account<'info, NFTRedeemed>>,


    nft_mint_1: Box<Account<'info, Mint>>,
    nft_token_account_1: Box<Account<'info, TokenAccount>>,
    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account_1: AccountInfo<'info>,

    nft_mint_2: Box<Account<'info, Mint>>,
    nft_token_account_2: Box<Account<'info, TokenAccount>>,
    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account_2: AccountInfo<'info>,

    nft_mint_3: Box<Account<'info, Mint>>,
    nft_token_account_3: Box<Account<'info, TokenAccount>>,
    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account_3: AccountInfo<'info>,

    nft_mint_4: Box<Account<'info, Mint>>,
    nft_token_account_4: Box<Account<'info, TokenAccount>>,
    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account_4: AccountInfo<'info>,

    nft_mint_5: Box<Account<'info, Mint>>,
    nft_token_account_5: Box<Account<'info, TokenAccount>>,
    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account_5: AccountInfo<'info>,

    nft_mint_6: Box<Account<'info, Mint>>,
    nft_token_account_6: Box<Account<'info, TokenAccount>>,
    /// CHECK: account checked against PDA generated from the token_metadata_account
    /// in instruction processor which in turn verifies this account
    nft_metadata_account_6: AccountInfo<'info>,

    #[account(mut)]
    owner: Signer<'info>,

    #[account(address = Pubkey::new(metaplex_token_metadata::id().as_ref()))]
    /// CHECK: account is checked that the address matches metaplex_token_metadata::id crate
    token_metadata_program: AccountInfo<'info>,

    #[account(
        mut,
        address = treasury.rain_vault.key(),
        seeds = [PREFIX, b"rain_vault"],
        bump,
    )]
    rain_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = dest_rain_token_account.owner == owner.key(),
        constraint = dest_rain_token_account.mint == treasury.rain_mint.key()
    )]
    dest_rain_token_account: Box<Account<'info, TokenAccount>>,

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
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

#[error_code]
pub enum RedemptionErrorCode {
    #[msg("Treasury is disabled")]
    TreasuryDisabled,
    #[msg("NFT Creator not verified")]
    NFTCreatorNotVerified,
    #[msg("metadata URI for Rug is invalid")]
    RugURIInvalid,
}

#[derive(PartialEq, Eq, Hash)]
enum RugLevel {
    LV1, // black
    LV2, // blue
    LV3, // green
    LV4, // purple
    LV5, // red
    LV6, // gold
}
impl RugLevel {
    fn complete_set_multiplier() ->  u8 {
        50
    }
    fn uri_to_level(uri: &str) -> Result<RugLevel> {
        match uri {
            "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/" => Ok(RugLevel::LV1),
            "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ" => Ok(RugLevel::LV2),
            "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys" => Ok(RugLevel::LV3),
            "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0" => Ok(RugLevel::LV4),
            "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM" => Ok(RugLevel::LV5),
            "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4" => Ok(RugLevel::LV6),
            _ => err!(RedemptionErrorCode::RugURIInvalid),
        }
    }
    fn multiplier(&self) -> u64 {
        match *self {
            RugLevel::LV1 => 1,
            RugLevel::LV2 => 3,
            RugLevel::LV3 => 5,
            RugLevel::LV4 => 8,
            RugLevel::LV5 => 12,
            RugLevel::LV6 => 20,
        }
    }
}
