// import * as Web3 from '@solana/web3.js';
// import { programs as MetaplexPrograms } from '@metaplex/js';

import { Redemption, Instructions, State } from "@raindrop-studios/rain-redemptions";

import { NFT, DTP_TYPE } from './nft';
import { RUG_LEVEL_URIS, RAIN_MINT } from './constants';
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { getOrCreateAssociatedTokenAccount } from './token';
import { AnchorProvider } from '@project-serum/anchor';

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
      if (RUG_LEVEL_URIS.includes(e.uri)) {
        if (!acc[e.uri]) {
          acc[e.uri] = [];
        }
        acc[e.uri].push(e);
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
  console.log(`Redeeming RUG Set`);
  console.log(`RAIN mint ${RAIN_MINT}`)

  const nftTokenAddresses = await Promise.all(nftSet.map(async (nft) => {
    return { 
      mint: nft.mint,
      tokenAddress: await getAssociatedTokenAddress(
        nft.mint,
        (program.client.provider as AnchorProvider).wallet.publicKey
      )
    };
  }))

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

  const redemptionAccounts: Instructions.Redemption.RedeemNFTSetForRainAccounts = {
    nftMint1: nftTokenAddresses[0].mint,
    nftMint2: nftTokenAddresses[1].mint,
    nftMint3: nftTokenAddresses[2].mint,
    nftMint4: nftTokenAddresses[3].mint,
    nftMint5: nftTokenAddresses[4].mint,
    nftMint6: nftTokenAddresses[5].mint,
    nftTokenAccount1: nftTokenAddresses[0].tokenAddress,
    nftTokenAccount2: nftTokenAddresses[1].tokenAddress,
    nftTokenAccount3: nftTokenAddresses[2].tokenAddress,
    nftTokenAccount4: nftTokenAddresses[3].tokenAddress,
    nftTokenAccount5: nftTokenAddresses[4].tokenAddress,
    nftTokenAccount6: nftTokenAddresses[5].tokenAddress,
    destRainTokenAccount: destRainTokenAccount.address,
  }

  console.log(`Calling redemption program to redeem: ${program.client.provider.connection.rpcEndpoint}`)
  try {
    await program.redeemRugSetOwnershipRainTokens(
      {},
      redemptionAccounts,
      { commitment: "finalized", timeout: 60_000 }
    );
  } catch (e) {
    console.error("Error redeeming nft set", e);
  }
};

export const redeemRugSetMultiTransaction = async (nftSet: NFT[], program: Redemption) => {
  console.log(`Redeeming RUG Set Multi`);
  console.log(`RAIN mint ${RAIN_MINT}`)

  const nftTokenAddresses = await Promise.all(nftSet.map(async (nft) => {
    return { 
      mint: nft.mint,
      tokenAddress: await getAssociatedTokenAddress(
        nft.mint,
        (program.client.provider as AnchorProvider).wallet.publicKey
      )
    };
  }))

  let destRainTokenAccountAddress;
  try {
    if (RAIN_MINT)
      destRainTokenAccountAddress = await getAssociatedTokenAddress(
        RAIN_MINT,
        (program.client.provider as AnchorProvider).wallet.publicKey
      );
  } catch (e) {
    console.error("Error getting rain token account", e);
  }
  
  console.log(`Dest rain token account ${destRainTokenAccountAddress?.toString()}`)
  if (!destRainTokenAccountAddress) {
    console.error("Error getting rain token account");
    return;
  }
  
  let redemptionAccountsVerify: Instructions.Redemption.RedeemMultiTransactionNFTSetVerifyAccounts = {
    nftMint1: nftTokenAddresses[0].mint,
    nftMint2: nftTokenAddresses[1].mint,
    nftMint3: nftTokenAddresses[2].mint,
    nftMint4: nftTokenAddresses[3].mint,
    nftMint5: nftTokenAddresses[4].mint,
    nftMint6: nftTokenAddresses[5].mint,
    nftTokenAccount1: nftTokenAddresses[0].tokenAddress,
    nftTokenAccount2: nftTokenAddresses[1].tokenAddress,
    nftTokenAccount3: nftTokenAddresses[2].tokenAddress,
    nftTokenAccount4: nftTokenAddresses[3].tokenAddress,
    nftTokenAccount5: nftTokenAddresses[4].tokenAddress,
    nftTokenAccount6: nftTokenAddresses[5].tokenAddress,
  }

  let redemptionAccounts: Instructions.Redemption.RedeemNFTSetForRainAccounts = {
    ...redemptionAccountsVerify,
    destRainTokenAccount: destRainTokenAccountAddress,
  } 

  console.log(`Calling redemption program to redeem: ${program.client.provider.connection.rpcEndpoint}`)
  try {
    console.log(`Checking for any inprogress rug set multi transaction redemption`);
    const nftSetRedeemedState = await program.fetchNFTSetRedeemedState(
      redemptionAccountsVerify.nftMint1,
      { commitment: "confirmed" }
    );

    if (!nftSetRedeemedState) {
      console.log(`Calling first multi rug set`);
      await program.redeemMultiTransactionRugSetOwnershipRainTokensFirst(
        redemptionAccountsVerify,
        { commitment: "confirmed", timeout: 60_000 }
      );
    }

    if (!nftSetRedeemedState || nftSetRedeemedState.status === State.Redemption.NFTSetRedemptionStateStatus.VERIFYING) {
      console.log(`Calling second multi rug set`);
      await program.redeemMultiTransactionRugSetOwnershipRainTokensSecond(
        redemptionAccountsVerify,
        { commitment: "confirmed", timeout: 60_000 }
      );
    }

    if (!nftSetRedeemedState || nftSetRedeemedState.status === State.Redemption.NFTSetRedemptionStateStatus.VERIFYING || nftSetRedeemedState.status === State.Redemption.NFTSetRedemptionStateStatus.VERIFIED) {
      console.log(`Calling final multi rug set`);
      await program.redeemMultiTransactionRugSetOwnershipRainTokensFinal(
        redemptionAccounts,
        { commitment: "finalized", timeout: 60_000 }
      );
    }
  } catch (e) {
    console.error("Error redeeming nft set", e);
  }
};