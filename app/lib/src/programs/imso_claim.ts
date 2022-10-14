import { AnchorProvider, web3 } from "@project-serum/anchor";
import { Program, SendOptions, Transaction } from "@raindrop-studios/sol-kit";

import * as ImsoClaimInstruction from "./instructions/imso_claim";
import { Treasury } from "../state/imso_claim";
import {
  getTreasuryPDA,
  getNFTRedeemedPDA
} from "../pda/imso_claim";
import { REDEMPTION_PROGRAM_ID } from "../constants/programIds";

export class IMSOClaim extends Program.Program {
  declare instruction: ImsoClaimInstruction.Instruction;
  static PREFIX = "imso_claim";
  PROGRAM_ID = REDEMPTION_PROGRAM_ID;

  constructor() {
    super();
    this.instruction = new ImsoClaimInstruction.Instruction({ program: this });
  }

  async initialize(
    args: ImsoClaimInstruction.InitializeArgs,
    accounts: ImsoClaimInstruction.InitializeAccounts,
    options?: { commitment: web3.Commitment, timeout?: number },
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
    accounts: ImsoClaimInstruction.TreasuryAuthorityAccounts,
    options?: { commitment: web3.Commitment, timeout?: number },
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
    accounts: ImsoClaimInstruction.TreasuryAuthorityAccounts,
    options?: { commitment: web3.Commitment, timeout?: number },
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

 

  async redeemPandaOwnershipRainTokens(
    args: ImsoClaimInstruction.RedeemNFTForRainArgs,
    accounts: ImsoClaimInstruction.RedeemNFTForRainAccounts,
    options?: { commitment: web3.Commitment, timeout?: number },
  ): Promise<{ txid: string; slot: number }> {
    debugger;
    console.log(`args:`,args);
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
};
