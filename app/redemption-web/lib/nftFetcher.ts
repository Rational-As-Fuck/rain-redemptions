import * as Web3 from '@solana/web3.js';
import { programs as MetaplexPrograms } from '@metaplex/js';

const { metadata: { Metadata } } =  MetaplexPrograms;

import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
} from "../node_modules/@solana/spl-token";

import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { DTP_TYPE, getDTPType, NFT } from './nft';
import { CREATORS } from './constants';

export const fetchNFTs = async (connection: Web3.Connection, publicKey: Web3.PublicKey, setNFTS: any, setFetchedNFTs: any) => {
  if (publicKey) {
    let tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { programId: new Web3.PublicKey(TOKEN_PROGRAM_ID) });
    const tokens = tokenAccounts.value.map((e) => {
      const accountInfo = AccountLayout.decode(e.account.data);
      console.log(`${new Web3.PublicKey(accountInfo.mint)}   ${accountInfo.amount}`);
      if (accountInfo.amount == BigInt(1)) {
        return { mint: new Web3.PublicKey(accountInfo.mint), tokenAccount: accountInfo, address: e.pubkey };
      } else {
        return null;
      }
    }).filter((e) => e != null);
    const nfts = await Promise.all(tokens.map((token) => createNFTForNFTToken(connection, token)));
    setNFTS(nfts.filter((e) => !!e));
    setFetchedNFTs(true)
  }
};

export const createNFTForNFTToken = async (connection: Web3.Connection, token: {mint: Web3.PublicKey, tokenAccount: any, address: Web3.PublicKey} | null) => {
  if (!token) {
    return null;
  }

  try {
    const metadata = await Metadata.findByMint(connection, token.mint);
    if (metadata && metadata.data.data.creators) {
      const nftCreators = metadata.data.data.creators?.map(e => e.address);
      const verifiedDTPCreators = nftCreators.filter(creator => CREATORS.includes(creator));
      if (verifiedDTPCreators.length > 0) {
        const imageUrl = await (await fetch(metadata.data.data.uri)).json();
        return new NFT(imageUrl.image, getDTPType(verifiedDTPCreators[0]), token.mint, metadata, token, token.address, false);
      }
    } 
  } catch (e) {
    console.error("Error fetching image url for nft", e);
  }

  return null;
};

export const updateIfNftsAreRedeemed = async (nfts: NFT[], redemptionProgram: Redemption, setNfts: any) => {
  setNfts(await Promise.all(nfts.map(async (nft) => {
    console.log("Checking if NFT is redeemed", nft.mint);
    let redeemed = await redemptionProgram.isNFTRedeemed(nft.mint);
    console.log("Nft redemption status", redeemed);
    nft.isRedeemed = redeemed;
    if (nft.dtpType === DTP_TYPE.RUG) {
      let redeemed = await redemptionProgram.isRugSetNFTRedeemed(nft.mint);
      console.log("Nft rug set redemption status", redeemed);
      nft.isRedeemedForSet = redeemed;
    }
    return nft;
  })));
}
