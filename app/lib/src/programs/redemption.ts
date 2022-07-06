import { web3 } from "@project-serum/anchor";
import { Program } from "@raindrops-protocol/sol-kit";

import * as RedemptionInstruction from "./instructions/redemption";
import { Treasury } from "../state/redemption";
import { getTreasuryPDA, getNFTRedeemedPDA, getNFTSetRedeemedPDA } from "../pda/redemption";
import { REDEMPTION_PROGRAM_ID } from "../constants/programIds";

export class Redemption extends Program.Program {
  declare instruction: RedemptionInstruction.Instruction;
  static PREFIX = "trash_with_frens_redemption";
  PROGRAM_ID = REDEMPTION_PROGRAM_ID;

  constructor() {
    super();
    this.instruction = new RedemptionInstruction.Instruction({ program: this });
  }

  async initialize(
    args: RedemptionInstruction.InitializeArgs,
    accounts: RedemptionInstruction.InitializeAccounts,
    options?: { commitment: web3.Commitment },
  ): Promise<{ txid: string; slot: number }> {
    const instruction = await this.instruction.initialize(
      args,
      accounts
    );

    return this.sendWithRetry(
      instruction,
      [],
      options
    );
  }

  async enableTreasury(
    accounts: RedemptionInstruction.TreasuryAuthorityAccounts,
    options?: { commitment: web3.Commitment },
  ): Promise<{ txid: string; slot: number }> {
    const instruction = await this.instruction.enableTreasury(
      accounts
    );

    return this.sendWithRetry(
      instruction,
      [accounts.updateAuthority],
      options
    );
  }

  async disableTreasury(
    accounts: RedemptionInstruction.TreasuryAuthorityAccounts,
    options?: { commitment: web3.Commitment },
  ): Promise<{ txid: string; slot: number }> {
    const instruction = await this.instruction.disableTreasury(
      accounts
    );

    return this.sendWithRetry(
      instruction,
      [accounts.updateAuthority],
      options
    );
  }

  async fetchTreasury(
    options: { commitment: web3.Commitment } = { commitment: "finalized" },
  ): Promise<Treasury> {
    const redemptionTreasuryPDA = (await getTreasuryPDA())[0];
    let treasuryObj = await this.client.account.treasury.fetch(redemptionTreasuryPDA, options.commitment);
    return new Treasury(redemptionTreasuryPDA, treasuryObj);
  }

  async isNFTRedeemed(
    nftMint: web3.PublicKey,
    options: { commitment: web3.Commitment } = { commitment: "finalized" },
  ): Promise<boolean> {
    const [nftRedeemedPDA, _nftRedeemedBump] = await getNFTRedeemedPDA(nftMint);
    let nftRedeemed;
    try {
      nftRedeemed = await this.client.account.nftRedeemed.getAccountInfo(nftRedeemedPDA, options.commitment);
    } catch (error) {
      nftRedeemed = false;
    }

    if (!!nftRedeemed) {
      return true;
    };

    return false;
  }

  async isRugSetNFTRedeemed(
    nftMint: web3.PublicKey,
    options: { commitment: web3.Commitment } = { commitment: "finalized" },
  ): Promise<boolean> {
    const [nftRedeemedPDA, _nftRedeemedBump] = await getNFTSetRedeemedPDA(nftMint);
    let nftRedeemed;

    try {
      nftRedeemed = await this.client.account.nftRedeemed.getAccountInfo(nftRedeemedPDA, options.commitment);
    } catch (e) {
      nftRedeemed = false;
    }
    if (!!nftRedeemed){
      return true;
    };

    return false;
  }

  async redeemPandaOwnershipRainTokens(
    args: RedemptionInstruction.RedeemNFTForRainArgs,
    accounts: RedemptionInstruction.RedeemNFTForRainAccounts,
    options?: { commitment: web3.Commitment },
  ): Promise<{ txid: string; slot: number }> {
    const instruction = await this.instruction.redeemPandaOwnershipRainTokens(
      args,
      accounts
    );

    return this.sendWithRetry(
      instruction,
      [],
      options
    );
  }

  async redeemRugOwnershipRainTokens(
    args: RedemptionInstruction.RedeemNFTForRainArgs,
    accounts: RedemptionInstruction.RedeemNFTForRainAccounts,
    options?: { commitment: web3.Commitment },
  ): Promise<{ txid: string; slot: number }> {
    const instruction = await this.instruction.redeemRugOwnershipRainTokens(
      args,
      accounts
    );

    return this.sendWithRetry(
      instruction,
      [],
      options
    );
  }

  async redeemRugSetOwnershipRainTokens(
    args: RedemptionInstruction.RedeemNFTSetForRainArgs,
    accounts: RedemptionInstruction.RedeemNFTSetForRainAccounts,
    options?: { commitment: web3.Commitment },
  ): Promise<{ txid: string; slot: number }> {
    const instruction = await this.instruction.redeemRugSetOwnershipRainTokens(
      args,
      accounts
    );

    return this.sendWithRetry(
      instruction,
      [],
      options
    );
  }
};
