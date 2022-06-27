// import * as Web3 from '@solana/web3.js';
// import { programs as MetaplexPrograms } from '@metaplex/js';

import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { NFT, DTP_TYPE } from './nft';
import { RUG_LEVEL_URIS } from './constants';

export class NFTSet {
  dtpType: DTP_TYPE;
  nfts: NFT[];
  sets: NFT[][];
  numberRemainingToFinishSet: number;

  constructor(dtpType: DTP_TYPE, nfts: NFT[]) {
    this.dtpType = dtpType;
    this.nfts = nfts.filter((e: NFT) => e.dtpType === this.dtpType);
    this.sets = [];
    this.numberRemainingToFinishSet = RUG_LEVEL_URIS.length; 
    this.calculateSets();
  }

  calculateSets() {
    const nftsByLevel = this.nfts.reduce((acc: any, e) => {
      if (RUG_LEVEL_URIS.includes(e.metadata.data.data.uri)) {
        if (!acc[e.metadata.data.data.uri]) {
          acc[e.metadata.data.data.uri] = [];
        }
        acc[e.metadata.data.data.uri].push(e);
      }
      return acc;
    }, {});

    this.numberRemainingToFinishSet = RUG_LEVEL_URIS.length - Object.keys(nftsByLevel).length;
    while(Object.keys(nftsByLevel).length === RUG_LEVEL_URIS.length) {
      const currentSet = this.buildASet(nftsByLevel);
      if (currentSet) {
        this.sets.push(currentSet);
      }
    }
  }

  buildASet(nftsByLevel: any) {
    let currentSet: NFT[] = [];
    RUG_LEVEL_URIS.forEach((e: string) => {
      if (nftsByLevel[e] && nftsByLevel[e].length > 0) {
        currentSet = currentSet.concat(nftsByLevel[e].shift());
        if (nftsByLevel[e].length === 0) {
          delete nftsByLevel[e];
        }
      }
    });

    if (currentSet.length === RUG_LEVEL_URIS.length) {
      return currentSet;
    }
    this.numberRemainingToFinishSet = RUG_LEVEL_URIS.length - currentSet.length;
    return null;
  }
}

export const redeemRugSet = async (nftSet: NFT[], program: Redemption) => {
  // console.log(`Redeeming ${nft.dtpType}`);
  // console.log(`RAIN mint ${RAIN_MINT}`)
  // console.log(`NFT Token account address ${nft.tokenAccountAddress}`)
  // let destRainTokenAccount;
  // try {
  //   destRainTokenAccount = await getOrCreateAssociatedTokenAccount(program, nft.mint);
  // } catch (e) {
  //   console.error("Error creating rain token account", e);
  // }
  
  // console.log(`Dest rain token account ${destRainTokenAccount?.address}`)
  // if (!destRainTokenAccount) {
  //   console.error("Error creating rain account");
  //   return;
  // }
  // const redemptionAccounts = {
  //   nftMint: nft.mint,
  //   nftTokenAccount: nft.tokenAccountAddress,
  //   destRainTokenAccount: destRainTokenAccount.address
  // }

  // console.log(`Calling redemption program to redeem: ${program.program.provider.connection.rpcEndpoint}`)
  // try {
  //   if (nft.dtpType === DTP_TYPE.PANDA) {
  //     await program.redeemPandaOwnershipRainTokens({}, redemptionAccounts);
  //   } else if (nft.dtpType === DTP_TYPE.RUG) {
  //     await program.redeemRugOwnershipRainTokens({}, redemptionAccounts);
  //   } else {
  //     throw new Error("Unknown DTP nft type");
  //   }
  // } catch (e) {
  //   console.error("Error redeeming nft", e);
  // }

  // console.log("Checking if NFT was redeemed", nft.mint);
  // let redeemed = await program.isNFTRedeemed(nft.mint);
  // console.log("Nft redemption status", redeemed);
  // nft.isRedeemed = redeemed;
};