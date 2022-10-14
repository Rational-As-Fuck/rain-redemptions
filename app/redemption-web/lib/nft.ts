import * as Web3 from '@solana/web3.js';
import { JsonMetadata } from "@metaplex-foundation/js";

import { IMSOClaim } from "../../lib/src/";

import { PANDA_CREATORS, RAIN_MINT } from './constants';
import { getOrCreateAssociatedTokenAccount } from './token';
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { AnchorProvider } from '@project-serum/anchor';

export enum DTP_TYPE {
  PANDA = "PANDA"
}

export class NFT {
  uri: string;
  imageUrl: string;
  dtpType: DTP_TYPE;
  mint: Web3.PublicKey;
  metadata: JsonMetadata<string>;
  isRedeemed: boolean;
  isRedeemedForSet: boolean;
  tokenAccount: any;
  tokenAccountAddress: Web3.PublicKey;
  isRedeeming: boolean = false;
  isRedeemingSet: boolean = false;

  constructor(
    uri: string,
    imageUrl: string,
    dtpType: DTP_TYPE,
    mint: Web3.PublicKey,
    metadata: JsonMetadata<string>,
    tokenAccount: any,
    tokenAccountAddress: Web3.PublicKey,
    isRedeemed: boolean = false,
    isRedeemedForSet: boolean = false,
    isRedeeming: boolean = false,
    isRedeemingSet: boolean = false
  ) {
    this.uri = uri;
    this.imageUrl = imageUrl;
    this.dtpType = dtpType;
    this.mint = mint;
    this.metadata = metadata;
    this.tokenAccount = tokenAccount;
    this.tokenAccountAddress = tokenAccountAddress;
    this.isRedeemed = isRedeemed;
    this.isRedeemedForSet = isRedeemedForSet;
    this.isRedeeming = isRedeeming;
    this.isRedeemingSet = isRedeemingSet;
  }
}

export const getDTPType = (creator: string) => {
  if (PANDA_CREATORS.includes(creator)) {
    return DTP_TYPE.PANDA;
  } else {
    throw new Error(`Unknown creator: ${creator}`);
  }
};

// async function sleep(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

export const redeemPanda = async (nft: NFT, program: IMSOClaim) => {
  // await sleep(5000);

  // TODO:
  // MagicEden are dicks and moved ATA accounts in the past when an NFT
  // was bought. Need to find a different way to derive the ATA to handle
  // that dumbass move.
  const nftTokenAccountAddress = await getAssociatedTokenAddress(
    nft.mint,
    (program.client.provider as AnchorProvider).wallet.publicKey
  );

  console.log(`Redeeming ${nft.dtpType}`);
  console.log(`RAIN mint ${RAIN_MINT}`)
  console.log(`NFT Token account address ${nftTokenAccountAddress}`)
  let destRainTokenAccount;
  try {
    if (RAIN_MINT)
      destRainTokenAccount = await getAssociatedTokenAddress(
        RAIN_MINT,
        (program.client.provider as AnchorProvider).wallet.publicKey
      );
  } catch (e) {
    console.error("Error getting rain token account", e);
  }
  
  console.log(`Dest rain token account ${destRainTokenAccount}`)
  if (!destRainTokenAccount) {
    console.error("Error getting rain token account");
    return;
  }
  const redemptionAccounts = {
    nftMint: nft.mint,
    nftTokenAccount: nftTokenAccountAddress,
    destRainTokenAccount: destRainTokenAccount
  }

  console.log(`Calling redemption program to redeem: ${program.client.provider.connection.rpcEndpoint}`)
  try {
    
    if (nft.dtpType === DTP_TYPE.PANDA) {

      console.log(`The redemption accounts are:`);
      console.log(redemptionAccounts);
      try {
        debugger;
        const redemptionResult = await program.redeemPandaOwnershipRainTokens(
          {},
          redemptionAccounts,
          { commitment: "finalized", timeout: 60_000 }
        );
        console.log(redemptionResult);
      } catch (err) {
        console.log(err);
        debugger;
      }
    } else {
      throw new Error("Unknown DTP nft type");
    }
  } catch (e) {
    console.error("Error redeeming nft", e);
  }

  console.log("Checking if NFT was redeemed", nft.mint);
  let redeemed = await program.isNFTRedeemed(nft.mint);
  console.log("Nft redemption status", redeemed);
  nft.isRedeemed = redeemed;
};
