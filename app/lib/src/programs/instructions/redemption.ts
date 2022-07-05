import { web3, BN, AnchorProvider } from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import { Program, Instruction as SolKitInstruction, InstructionUtils } from "@raindrops-protocol/sol-kit";

import { getTreasuryPDA, getRainVaultPDA, getNFTRedeemedPDA, getNFTSetRedeemedPDA, getNFTMetadataPDA, getNFTMasterEditionPDA } from "../../pda/redemption";
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

export interface RedeemNFTSetForRainArgs {};

export interface RedeemNFTSetForRainAccounts {
  nftMint1: web3.PublicKey,
  nftMint2: web3.PublicKey,
  nftMint3: web3.PublicKey,
  nftMint4: web3.PublicKey,
  nftMint5: web3.PublicKey,
  nftMint6: web3.PublicKey,
  nftTokenAccount1: web3.PublicKey,
  nftTokenAccount2: web3.PublicKey,
  nftTokenAccount3: web3.PublicKey,
  nftTokenAccount4: web3.PublicKey,
  nftTokenAccount5: web3.PublicKey,
  nftTokenAccount6: web3.PublicKey,
  destRainTokenAccount: web3.PublicKey,
};

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

  async redeemRugOwnershipRainTokens(
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
        .redeemRugOwnershipRainTokens()
        .accounts({
          treasury: treasuryPDA,
          nftRedeemed: nftRedeemedPDA,
          owner: (this.program.client.provider as AnchorProvider).wallet.publicKey,
          nftMint: accounts.nftMint,
          nftTokenAccount: accounts.nftTokenAccount,
          nftMetadataAccount: nftMetadataPDA,
          nftMasterEditionAccount: nftMasterEditionPDA,
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

  async redeemRugSetOwnershipRainTokens(
    _args: RedeemNFTSetForRainArgs,
    accounts: RedeemNFTSetForRainAccounts,
    _additionalArgs: RedeemNFTForRainAdditionalArgs = {}
  ) {
    const [treasuryPDA, _treasuryBump] = await getTreasuryPDA();

    const [rainVaultPDA, _bump] = await getRainVaultPDA();

    const [nftRedeemedPDA1, _bump2] = await getNFTSetRedeemedPDA(accounts.nftMint1);
    const [nftMetadataPDA1, _bump3] = await getNFTMetadataPDA(accounts.nftMint1);

    const [nftRedeemedPDA2, _bump4] = await getNFTSetRedeemedPDA(accounts.nftMint2);
    const [nftMetadataPDA2, _bump5] = await getNFTMetadataPDA(accounts.nftMint2);

    const [nftRedeemedPDA3, _bump6] = await getNFTSetRedeemedPDA(accounts.nftMint3);
    const [nftMetadataPDA3, _bump7] = await getNFTMetadataPDA(accounts.nftMint3);

    const [nftRedeemedPDA4, _bump8] = await getNFTSetRedeemedPDA(accounts.nftMint4);
    const [nftMetadataPDA4, _bump9] = await getNFTMetadataPDA(accounts.nftMint4);

    const [nftRedeemedPDA5, _bump10] = await getNFTSetRedeemedPDA(accounts.nftMint5);
    const [nftMetadataPDA5, _bump11] = await getNFTMetadataPDA(accounts.nftMint5);

    const [nftRedeemedPDA6, _bump12] = await getNFTSetRedeemedPDA(accounts.nftMint6);
    const [nftMetadataPDA6, _bump13] = await getNFTMetadataPDA(accounts.nftMint6);

    const instructionAccounts = {
      treasury: treasuryPDA,
      nftRedeemed1: nftRedeemedPDA1,
      nftMint1: accounts.nftMint1,
      nftTokenAccount1: accounts.nftTokenAccount1,
      nftMetadataAccount1: nftMetadataPDA1,
      nftRedeemed2: nftRedeemedPDA2,
      nftMint2: accounts.nftMint2,
      nftTokenAccount2: accounts.nftTokenAccount2,
      nftMetadataAccount2: nftMetadataPDA2,
      nftRedeemed3: nftRedeemedPDA3,
      nftMint3: accounts.nftMint3,
      nftTokenAccount3: accounts.nftTokenAccount3,
      nftMetadataAccount3: nftMetadataPDA3,
      nftRedeemed4: nftRedeemedPDA4,
      nftMint4: accounts.nftMint4,
      nftTokenAccount4: accounts.nftTokenAccount4,
      nftMetadataAccount4: nftMetadataPDA4,
      nftRedeemed5: nftRedeemedPDA5,
      nftMint5: accounts.nftMint5,
      nftTokenAccount5: accounts.nftTokenAccount5,
      nftMetadataAccount5: nftMetadataPDA5,
      nftRedeemed6: nftRedeemedPDA6,
      nftMint6: accounts.nftMint6,
      nftTokenAccount6: accounts.nftTokenAccount6,
      nftMetadataAccount6: nftMetadataPDA6,
      owner: (this.program.client.provider as AnchorProvider).wallet.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      rainVault: rainVaultPDA,
      destRainTokenAccount: accounts.destRainTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    };

    return [
      await this.program.client.methods
        .redeemRugSetOwnershipRainTokens()
        .accounts(instructionAccounts)
        .instruction(),
    ];
  }
};