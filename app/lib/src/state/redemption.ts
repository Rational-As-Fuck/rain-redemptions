import { web3 } from "@project-serum/anchor";

export class Treasury {
  key: web3.PublicKey | null;
  updateAuthority: web3.PublicKey | null;
  rainMint: web3.PublicKey | null;
  rainVault: web3.PublicKey | null;
  redemptionMultiplier: number;
  bump: number;
  enabled: boolean;

  constructor(key, data) {
    this.key = key;
    this.updateAuthority = data.updateAuthority;
    this.rainMint = data.rainMint;
    this.rainVault = data.rainVault;
    this.redemptionMultiplier = data.redemptionMultiplier;
    this.bump = data.bump;
    this.enabled = data.enabled;
  }
}

export enum NFTSetRedemptionStateStatus {
    INIT,
    VERIFYING,
    VERIFIED,
    REDEEMED,
}
export namespace NFTSetRedemptionStateStatus {
  export function getStatus(status): NFTSetRedemptionStateStatus {
    const statusKey = Object.keys(status).shift();
    switch (statusKey) {
      case "init":
        return NFTSetRedemptionStateStatus.INIT;
      case "verifying":
        return NFTSetRedemptionStateStatus.VERIFYING;
      case "verified":
        return NFTSetRedemptionStateStatus.VERIFIED;
      case "redeemed":
        return NFTSetRedemptionStateStatus.REDEEMED;
      default:
        throw new Error(`Unknown status type: ${statusKey}`);
    }
  }
};

export class NFTRedemptionState {
  key: web3.PublicKey;
  tokenKey: web3.PublicKey;
  metadataKey: web3.PublicKey;
  isVerified: boolean;

  constructor(data) {
    this.key = data.key;
    this.tokenKey = data.tokenKey;
    this.metadataKey = data.metadataKey;
    this.isVerified = data.isVerified;
  }
}
export class NFTSetRedemptionState {
  status: NFTSetRedemptionStateStatus | null;
  nft1: NFTRedemptionState | null;
  nft2: NFTRedemptionState | null;
  nft3: NFTRedemptionState | null;
  nft4: NFTRedemptionState | null;
  nft5: NFTRedemptionState | null;
  nft6: NFTRedemptionState | null;

  constructor(data) {
    this.status = NFTSetRedemptionStateStatus.getStatus(data.status);
    this.nft1 = new NFTRedemptionState(data.nft1);
    this.nft2 = new NFTRedemptionState(data.nft2);
    this.nft3 = new NFTRedemptionState(data.nft3);
    this.nft4 = new NFTRedemptionState(data.nft4);
    this.nft5 = new NFTRedemptionState(data.nft5);
    this.nft6 = new NFTRedemptionState(data.nft6);
  }
}