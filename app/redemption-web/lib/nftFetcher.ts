import * as Web3 from '@solana/web3.js';
import { Metaplex, Nft } from "@metaplex-foundation/js";

import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
} from "../node_modules/@solana/spl-token";

import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { DTP_TYPE, getDTPType, NFT } from './nft';
import { CREATORS } from './constants';

export const fetchNFTs = async (connection: Web3.Connection, publicKey: Web3.PublicKey, setNFTS: any, setFetchedNFTs: any) => {
  if (publicKey) {
    // let tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { programId: new Web3.PublicKey(TOKEN_PROGRAM_ID) });
    const metaplex = new Metaplex(connection);
    console.log(`Looking for nfts for wallet ${publicKey.toString()}`);
    let nfts = await metaplex.nfts().findAllByOwner(publicKey);
    console.log(nfts);
    // const tokens = tokenAccounts.value.map((e) => {
    //   const accountInfo = AccountLayout.decode(e.account.data);
    //   console.log(`${new Web3.PublicKey(accountInfo.mint)}   ${accountInfo.amount}`);
    //   if (accountInfo.amount == BigInt(1)) {
    //     return { mint: new Web3.PublicKey(accountInfo.mint), tokenAccount: accountInfo, address: e.pubkey };
    //   } else {
    //     return null;
    //   }
    // }).filter((e) => e != null);
    // const nfts = await Promise.all(tokens.map((token) => createNFTForNFTToken(connection, token)));
    const fetchedNfts = await Promise.all(nfts.map((nft) => verifyCreatorIsDTP(nft)))
    const filteredNfts = fetchedNfts.filter((e) => !!e);
    console.log(filteredNfts);
    setNFTS(filteredNfts);
    setFetchedNFTs(true)
  }
};

export const verifyCreatorIsDTP = async (nft: Nft) => {
  if (!nft) {
    return null;
  }

  try {
    // const nftMetadata = await nft.metadataTask.run();
    // console.log(nftMetadata);
    if (nft.creators) {
      const nftCreators = nft.creators?.map(e => e.address.toString()) || [];
      const verifiedDTPCreators = nftCreators.filter(creator => CREATORS.includes(creator));
      console.log(verifiedDTPCreators);
      if (verifiedDTPCreators.length > 0) {
        const nftMetadata = await nft.metadataTask.run();
        if (!nft.metadata.image) {
          console.error("A verified DTP nft does not have an image url", nft.mint);
          return null;
        }
        const imageUrl = nft.metadata.image;
        // const imageUrl = await (await fetch(nft.metadata.image)).json();
        // return new NFT(imageUrl, getDTPType(verifiedDTPCreators[0]), nft.mint, nftMetadata, nft. token, token.address, false);
        return new NFT(nft.uri, imageUrl, getDTPType(verifiedDTPCreators[0]), nft.mint, nftMetadata, null, Web3.PublicKey.default, false);
      }
    } 
  } catch (e) {
    console.error("Error fetching image url for nft", e);
  }

  return null;
};

export const createNFTForNFTToken = async (connection: Web3.Connection, token: {mint: Web3.PublicKey, tokenAccount: any, address: Web3.PublicKey} | null) => {
  if (!token) {
    return null;
  }

  const metaplex = new Metaplex(connection);
  try {
    const nft = await metaplex.nfts().findByMint(token.mint);
    if (nft && nft.creators) {
      const nftCreators = nft.creators?.map(e => e.address.toString());
      const verifiedDTPCreators = nftCreators.filter(creator => CREATORS.includes(creator));
      if (verifiedDTPCreators.length > 0) {
        if (!nft.metadata.image) {
          console.error("A verified DTP nft does not have an image url", token.mint);
          return null;
        }
        // const imageUrl = await (await fetch(nft.metadata.image)).json();
        const imageUrl = nft.metadata.image;
        return new NFT(imageUrl, getDTPType(verifiedDTPCreators[0]), token.mint, nft.metadata, token, token.address, false);
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
