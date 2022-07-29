import { web3 } from "@project-serum/anchor";
import { REDEMPTION_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from "../constants/programIds";

import { Redemption } from "../programs/redemption";

const TOKEN_METADATA_PROGRAM_PREFIX = "metadata";

export const getTreasuryPDA = async (): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(Redemption.PREFIX), Buffer.from("treasury")],
    REDEMPTION_PROGRAM_ID
  );
};

export const getRainVaultPDA = async (): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(Redemption.PREFIX), Buffer.from("rain_vault")],
    REDEMPTION_PROGRAM_ID
  );
};

export const getNFTRedeemedPDA = async (nftMint: web3.PublicKey): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(Redemption.PREFIX), Buffer.from("redemption"), nftMint.toBuffer()],
    REDEMPTION_PROGRAM_ID
  );
};

export const getNFTSetRedeemedPDA = async (nftMint: web3.PublicKey): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(Redemption.PREFIX), Buffer.from("redemption"), Buffer.from("rug_set"), nftMint.toBuffer()],
    REDEMPTION_PROGRAM_ID
  );
};

export const getNFTSetRedeemedStatePDA = async (
  nftMints: web3.PublicKey[],
  owner: web3.PublicKey
): Promise<[web3.PublicKey, number]> => {
  // const shortenedNFTMints = nftMints.map(nftMint => nftMint.toBytes().slice(0, 2));
  // const sortedNFTMints = shortenedNFTMints.sort();//(a, b) => a.(b));
  // console.log(Buffer.from(sortedNFTMints.join("")));
  return await web3.PublicKey.findProgramAddress([
      Buffer.from(Redemption.PREFIX),
      Buffer.from("set_redeemed_state"),
      owner.toBuffer(),
      nftMints[0].toBuffer(),
      // Buffer.from(sortedNFTMints.join(""))//Buffer.from(sortedNFTMints.join(""))
    ],
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