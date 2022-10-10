import { web3 } from "@project-serum/anchor";
import { REDEMPTION_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from "../constants/programIds";

import { IMSOClaim } from "../programs/imso_claim";

const TOKEN_METADATA_PROGRAM_PREFIX = "metadata";

export const getTreasuryPDA = async (): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(IMSOClaim.PREFIX), Buffer.from("treasury")],
    REDEMPTION_PROGRAM_ID
  );
};

export const getRainVaultPDA = async (): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(IMSOClaim.PREFIX), Buffer.from("rain_vault")],
    REDEMPTION_PROGRAM_ID
  );
};

export const getNFTRedeemedPDA = async (nftMint: web3.PublicKey): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(IMSOClaim.PREFIX), Buffer.from("imso_claim"), nftMint.toBuffer()],
    REDEMPTION_PROGRAM_ID
  );
};

export const getNFTMetadataPDA = async (mint: web3.PublicKey): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(TOKEN_METADATA_PROGRAM_PREFIX), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
};

export const getNFTMasterEditionPDA = async (mint: web3.PublicKey): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(TOKEN_METADATA_PROGRAM_PREFIX), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
    TOKEN_METADATA_PROGRAM_ID
  );
};