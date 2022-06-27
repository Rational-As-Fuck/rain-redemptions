import type { NextPage } from 'next'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as Anchor from "@project-serum/anchor";

import { useEffect, useState } from 'react';
import Head from 'next/head'

import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { NFTGrid } from "../components/NFTGrid";
import Header from "../components/Header";
import Footer from '../components/Footer';
import WebWallet from "../lib/WebWallet";
import { fetchNFTs, updateIfNftsAreRedeemed } from "../lib/nftFetcher";
import { NFT } from '../lib/nft';
import { WALLET_PUBKEY, PROGRAM_CONNECTION } from '../lib/constants';

const setRedemptionProgramWrapper = async (program: Promise<any>, setRedemptionProgram: any) => {
  setRedemptionProgram(await program);
};

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } = useWallet();
  let wallet_connected = !!publicKey; 

  let _nfts: NFT[] = [];
  const [nfts, setNFTs] = useState(_nfts);
  const [fetchedNFTs, setFetchedNFTs] = useState(false);
  const [redemptionProgram, setRedemptionProgram] = useState();

  // Initialize program connection and fetch NFTs from connected wallet
  useEffect(() => {
    if (publicKey && signTransaction && signAllTransactions) {
      const provider = new Anchor.Provider(
        PROGRAM_CONNECTION, 
        new WebWallet(publicKey, signTransaction, signAllTransactions, sendTransaction), {
          preflightCommitment: "processed",
          commitment: "processed",
        }
      );
      const config = {
        asyncSigning: true,
        provider       
      };
      setRedemptionProgramWrapper(Redemption.getProgramWithConfig(Redemption, config)
      , setRedemptionProgram);
     }

     if (publicKey) {
      fetchNFTs(connection, WALLET_PUBKEY || publicKey, setNFTs, setFetchedNFTs)
     }
  }, [connection, publicKey]);

  // Check if NFTS have been redeemed after fetching
  useEffect(() => {
    if (redemptionProgram && nfts) {
      updateIfNftsAreRedeemed(nfts, redemptionProgram, setNFTs);
    }
  }, [fetchedNFTs, redemptionProgram]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Trash with Frens $RAIN</title>
        <link rel="icon" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" sizes="16x16" href="/favicon-16x16.png" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center px-6 text-center">
        {/* // HEADER
        // Wallet not connected yet, show the header with the wallet connect button */}
        { !wallet_connected && (<Header showWalletConnect={true} /> )}

        {/* // Wallet connected, show wallet menu button */}
        { wallet_connected && (<div className="m-6 md:ml-auto"><WalletMultiButton /></div>)}
        {/* // Wallet connected, and we haven't fetched NFTS, or we have fetched NFTS and the wallet has some */}
        { (wallet_connected && !fetchedNFTs) || (wallet_connected && fetchedNFTs && nfts.length > 0) && (<Header showWalletConnect={false} /> ) }
        {/* //////////////////////////////////////////////////////////////////////////////////////////////// */}


        {/* // BODY */}
        { wallet_connected && redemptionProgram && (<NFTGrid nfts={nfts} loading={!fetchedNFTs} program={redemptionProgram} />) }
        {/* //////////////////////////////////////////////////////////////////////////////////////////////// */}

        
        {/* // FOOTER with no wallet connected */}
        { !wallet_connected && (<Footer />) }
        {/* //////////////////////////////////////////////////////////////////////////////////////////////// */}

      </main>
    </div>
  )
}

export default Home
