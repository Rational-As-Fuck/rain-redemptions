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
import { convertStringsToPublicKeys } from "@raindrop-studios/sol-kit/dist/src/instruction/utils";

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
    console.log(args);
    console.log(accounts);
    console.log(_additionalArgs);

    debugger;
    const [treasuryPDA, _treasuryBump] = await getTreasuryPDA();
    console.log(`treasuryPDA is `, treasuryPDA.toString());
    console.log(`_treasuryBump is `, _treasuryBump);

    const [rainVaultPDA, _bump] = await getRainVaultPDA();
    console.log(`rainVaultPDA is ${rainVaultPDA.toString()}`);
    console.log(`_bump is ${_bump}`);
    const [nftRedeemedPDA, _nftRedeemedBump] = await getNFTRedeemedPDA(accounts.nftMint);
    console.log(`nftRedeemedPDA is ${nftRedeemedPDA.toString()}`);
    console.log(`_nftRedeemedBump is ${_nftRedeemedBump}`);
    const [nftMetadataPDA, _nftMetadataBump] = await getNFTMetadataPDA(accounts.nftMint);
    console.log(`nftMetadataPDA is ${nftMetadataPDA.toString()}`);
    console.log(`_nftMetadataBump is ${_nftMetadataBump}`);
    const [nftMasterEditionPDA, _nftMasterEditionBump] = await getNFTMasterEditionPDA(accounts.nftMint);
    console.log(`nftMasterEditionPDA is ${nftMasterEditionPDA.toString()}`);
    console.log(`_nftMasterEditionBump is ${_nftMasterEditionBump}`);
    console.log(`calling redeemPandaOwnershipRainTokens with `);
    console.log(`treasuryPDA: ${treasuryPDA.toString()}`);
    console.log(`nftRedeemedPDA: ${nftRedeemedPDA.toString()}`);
    console.log(`owner: ${(this.program.client.provider as AnchorProvider).wallet.publicKey.toString()}`);
    console.log(`nftMint: ${accounts.nftMint.toString()}`);
    console.log(`nftTokenAccount: ${accounts.nftTokenAccount.toString()}`);
    console.log(`nftMasterEditionAccount: ${nftMasterEditionPDA.toString()}`);
    console.log(`nftMetadataAccount: ${nftMetadataPDA.toString()}`);
    console.log(`tokenMetadataProgram: ${TOKEN_METADATA_PROGRAM_ID}`);
    console.log(`rainVault: ${rainVaultPDA.toString()}`);
    console.log(`destRainTokenAccount: ${accounts.destRainTokenAccount.toString()}`);
    console.log(`tokenProgram: ${TOKEN_PROGRAM_ID}`);
    console.log(`systemProgram: ${SystemProgram.programId.toString()}`);
    console.log(`rent: ${web3.SYSVAR_RENT_PUBKEY}`);
    console.log(`recentSlothashes: ${web3.SYSVAR_SLOT_HASHES_PUBKEY.toString()}`);
    debugger;
    const redeemMethod = this.program.client.methods.redeemPandaOwnershipRainTokens();
    debugger;
    const accountList = await redeemMethod.accounts({
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
    });
    debugger;
    const programInst = await accountList.instruction();
    debugger;
    return [programInst];
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