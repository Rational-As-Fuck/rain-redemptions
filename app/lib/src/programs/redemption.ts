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
  ): Promise<void> {
    const instruction = await this.instruction.initialize(
      args,
      accounts
    );

    await this.sendWithRetry(
      instruction,
      []
    );
  }

  async enableTreasury(
    accounts: RedemptionInstruction.TreasuryAuthorityAccounts,
  ): Promise<void> {
    const instruction = await this.instruction.enableTreasury(
      accounts
    );

    await this.sendWithRetry(
      instruction,
      [accounts.updateAuthority]
    );
  }

  async disableTreasury(
    accounts: RedemptionInstruction.TreasuryAuthorityAccounts,
  ): Promise<void> {
    const instruction = await this.instruction.disableTreasury(
      accounts
    );

    await this.sendWithRetry(
      instruction,
      [accounts.updateAuthority]
    );
  }

  async fetchTreasury(): Promise<Treasury> {
    const redemptionTreasuryPDA = (await getTreasuryPDA())[0];
    let treasuryObj = await this.client.account.treasury.fetch(redemptionTreasuryPDA);
    return new Treasury(redemptionTreasuryPDA, treasuryObj);
  }

  async isNFTRedeemed(
    nftMint: web3.PublicKey,
  ): Promise<boolean> {
    const [nftRedeemedPDA, _nftRedeemedBump] = await getNFTRedeemedPDA(nftMint);
    let nftRedeemed;
    try {
      nftRedeemed = await this.client.account.nftRedeemed.getAccountInfo(nftRedeemedPDA);
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
  ): Promise<boolean> {
    const [nftRedeemedPDA, _nftRedeemedBump] = await getNFTSetRedeemedPDA(nftMint);
    let nftRedeemed;

    try {
      nftRedeemed = await this.client.account.nftRedeemed.getAccountInfo(nftRedeemedPDA);
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
  ): Promise<void> {
    const instruction = await this.instruction.redeemPandaOwnershipRainTokens(
      args,
      accounts
    );

    await this.sendWithRetry(
      instruction,
      []
    );
  }

  async redeemRugOwnershipRainTokens(
    args: RedemptionInstruction.RedeemNFTForRainArgs,
    accounts: RedemptionInstruction.RedeemNFTForRainAccounts,
  ): Promise<void> {
    const instruction = await this.instruction.redeemRugOwnershipRainTokens(
      args,
      accounts
    );

    await this.sendWithRetry(
      instruction,
      []
    );
  }

  async redeemRugSetOwnershipRainTokens(
    args: RedemptionInstruction.RedeemNFTSetForRainArgs,
    accounts: RedemptionInstruction.RedeemNFTSetForRainAccounts,
  ): Promise<void> {
    const instruction = await this.instruction.redeemRugSetOwnershipRainTokens(
      args,
      accounts
    );

    await this.sendWithRetry(
      instruction,
      []
    );
  }
};