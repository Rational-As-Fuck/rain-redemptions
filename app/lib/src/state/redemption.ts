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
