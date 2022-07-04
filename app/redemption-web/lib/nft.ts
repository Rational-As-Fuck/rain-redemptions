import * as Web3 from '@solana/web3.js';
import { JsonMetadata } from "@metaplex-foundation/js";

import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { PANDA_CREATORS, RUG_CREATOR, RAIN_MINT } from './constants';
import { getOrCreateAssociatedTokenAccount } from './token';

export enum DTP_TYPE {
  PANDA = "PANDA",
  RUG = "RUG",
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
  } else if (RUG_CREATOR === creator) {
    return DTP_TYPE.RUG;
  } else {
    throw new Error(`Unknown creator: ${creator}`);
  }
};

// async function sleep(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

export const redeemPandaOrRugNFT = async (nft: NFT, program: Redemption) => {
  // await sleep(5000);

  console.log(`Redeeming ${nft.dtpType}`);
  console.log(`RAIN mint ${RAIN_MINT}`)
  console.log(`NFT Token account address ${nft.tokenAccountAddress}`)
  let destRainTokenAccount;
  try {
    if (RAIN_MINT)
      destRainTokenAccount = await getOrCreateAssociatedTokenAccount(program, RAIN_MINT);
  } catch (e) {
    console.error("Error creating rain token account", e);
  }
  
  console.log(`Dest rain token account ${destRainTokenAccount?.address}`)
  if (!destRainTokenAccount) {
    console.error("Error creating rain account");
    return;
  }
  const redemptionAccounts = {
    nftMint: nft.mint,
    nftTokenAccount: nft.tokenAccountAddress,
    destRainTokenAccount: destRainTokenAccount.address
  }

  console.log(`Calling redemption program to redeem: ${program.client.provider.connection.rpcEndpoint}`)
  try {
    if (nft.dtpType === DTP_TYPE.PANDA) {
      await program.redeemPandaOwnershipRainTokens({
      }, redemptionAccounts);
    } else if (nft.dtpType === DTP_TYPE.RUG) {
      await program.redeemRugOwnershipRainTokens({}, redemptionAccounts);
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
