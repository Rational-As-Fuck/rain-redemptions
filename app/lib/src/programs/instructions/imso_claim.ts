import { web3, AnchorProvider } from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import { Program, Instruction as SolKitInstruction, InstructionUtils } from "@raindrop-studios/sol-kit";

import {
  getTreasuryPDA,
  getRainVaultPDA,
  getNFTRedeemedPDA,
  getNFTMetadataPDA,
  getNFTMasterEditionPDA,
} from "../../pda/imso_claim";
import { TOKEN_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from "../../constants/programIds";

export interface InitializeArgs {
  updateAuthority: web3.PublicKey,
  rainMint?: web3.PublicKey,
  rainVault?: web3.PublicKey,
  redemptionMultiplier: number,
  bump?: number,
};

export interface InitializeAccounts {
  rainMint: web3.PublicKey,
};

export interface InitializeAdditionalArgs {};

export interface TreasuryAuthorityAccounts {
  updateAuthority: web3.Keypair,
};

export interface RedeemNFTForRainArgs {
  treasuryBump?: number,
};

export interface RedeemNFTForRainAccounts {
  nftMint: web3.PublicKey,
  nftTokenAccount: web3.PublicKey,
  destRainTokenAccount: web3.PublicKey,
};

export interface RedeemNFTForRainAdditionalArgs {};

export class Instruction extends SolKitInstruction {
  constructor(args: { program: Program.Program }) {
    super(args);
  }

  async initialize(
    args: InitializeArgs,
    accounts: InitializeAccounts,
    _additionalArgs: InitializeAdditionalArgs = {}
  ) {
    const [treasuryPDA, treasuryBump] = await getTreasuryPDA();
    args.bump = treasuryBump;
    InstructionUtils.convertNumbersToBNs(args, ["bump", "redemptionMultiplier"]);

    const [rainVaultPDA, _bump] = await getRainVaultPDA();

    return [
      await this.program.client.methods
        .initialize(args)
        .accounts({
          treasury: treasuryPDA,
          rainVault: rainVaultPDA,
          rainMint: accounts.rainMint,
          payer: (this.program.client.provider as AnchorProvider).wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction(),
    ];
  }

  async enableTreasury(
    accounts: TreasuryAuthorityAccounts,
  ) {
    const [treasuryPDA, _treasuryBump] = await getTreasuryPDA();

    return [
      await this.program.client.methods
        .enableTreasury()
        .accounts({
          treasury: treasuryPDA,
          updateAuthority: accounts.updateAuthority.publicKey,
        })
        .instruction(),
    ];
  }

  async disableTreasury(
    accounts: TreasuryAuthorityAccounts,
  ) {
    const [treasuryPDA, _treasuryBump] = await getTreasuryPDA();

    return [
      await this.program.client.methods
        .disableTreasury()
        .accounts({
          treasury: treasuryPDA,
          updateAuthority: accounts.updateAuthority.publicKey,
        })
        .instruction(),
    ];
  }

  async redeemPandaOwnershipRainTokens(
    args: RedeemNFTForRainArgs,
    accounts: RedeemNFTForRainAccounts,
    _additionalArgs: RedeemNFTForRainAdditionalArgs = {}
  ) {
    const [treasuryPDA, _treasuryBump] = await getTreasuryPDA();

    const [rainVaultPDA, _bump] = await getRainVaultPDA();
    const [nftRedeemedPDA, _nftRedeemedBump] = await getNFTRedeemedPDA(accounts.nftMint);
    const [nftMetadataPDA, _nftMetadataBump] = await getNFTMetadataPDA(accounts.nftMint);
    const [nftMasterEditionPDA, _nftMasterEditionBump] = await getNFTMasterEditionPDA(accounts.nftMint);

    return [
      await this.program.client.methods
        .redeemPandaOwnershipRainTokens()
        .accounts({
          treasury: treasuryPDA,
          nftRedeemed: nftRedeemedPDA,
          owner: (this.program.client.provider as AnchorProvider).wallet.publicKey,
          nftMint: accounts.nftMint,
          nftTokenAccount: accounts.nftTokenAccount,
          nftMasterEditionAccount: nftMasterEditionPDA,
          nftMetadataAccount: nftMetadataPDA,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          rainVault: rainVaultPDA,
          destRainTokenAccount: accounts.destRainTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          recentSlothashes: web3.SYSVAR_SLOT_HASHES_PUBKEY,
        })
        .instruction(),
    ];
  }
};

const printAccounts = (accounts: any) => {
  Object.keys(accounts).forEach((key) => {
    const account = accounts[key];
    if(account instanceof web3.PublicKey) {
      console.log(key, account.toString());
      return;
    }

    if(account.publicKey) {
      console.log(key, account.publicKey.toString());
      return;
    }

    console.log(key, "is not a public key", account.toString());
  });
};