import type { NextPage } from 'next'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as Anchor from "@project-serum/anchor";

import { useEffect, useState } from 'react';
import Head from 'next/head'

import { Wallet } from "@raindrop-studios/sol-kit";
import { Redemption } from "@raindrop-studios/rain-redemptions";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import NFTGrid from "../components/NFTGrid";
import { Navbar } from '../components/NavBar';
import Header from "../components/Header";
import Footer from '../components/Footer';
import Loading from "../components/Loading";
import { fetchNFTs, updateIfNftsAreRedeemed } from "../lib/nftFetcher";
import { NFT } from '../lib/nft';
import { WALLET_PUBKEY, PROGRAM_CONNECTION, RAIN_MINT } from '../lib/constants';

const setRedemptionProgramWrapper = async (program: Promise<any>, setRedemptionProgram: any) => {
  setRedemptionProgram(await program);
};

const fetchNFTsAndCheckForRainATA = async (
  connection: any,
  publicKey: any,
  setNFTS: any,
  setFetchedNFTs: any,
  setHasRainATA: any
) => {
  console.log("fetchNFTsAndCheckForRainATA");
  const nfts = await fetchNFTs(connection, WALLET_PUBKEY || publicKey);
  console.log("nfts", nfts);
  if (nfts && nfts.length > 0) {
    console.log("getting ATA");
    const associatedTokenAddress = await getAssociatedTokenAddress(
      RAIN_MINT,
      publicKey
    );

    let accountInfo;
    if (associatedTokenAddress) {
      accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    }

    if (accountInfo) {
      console.log(`Rain token account already exists ${associatedTokenAddress}`)
    }

    console.log("setNFTS");
    setNFTS(nfts);
    console.log("setHasRainATA", !!associatedTokenAddress);
    setHasRainATA(!!accountInfo);
    setFetchedNFTs(true);
    return;
  }

  setNFTS(nfts);
  setFetchedNFTs(true);
};

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } = useWallet();
  let wallet_connected = !!publicKey; 

  let _nfts: NFT[] = [];
  const [nfts, setNFTs] = useState(_nfts);
  const [fetchedNFTs, setFetchedNFTs] = useState(false);
  const [hasRainATA, setHasRainATA] = useState(false);
  const [redemptionProgram, setRedemptionProgram] = useState();

  // Initialize program connection and fetch NFTs from connected wallet
  useEffect(() => {
    setNFTs(_nfts);
    setFetchedNFTs(false);
    console.log("public key", publicKey);
    if (publicKey && signTransaction && signAllTransactions) {
      console.log("public key top");
      const provider = new Anchor.AnchorProvider(
        PROGRAM_CONNECTION, 
        new Wallet.WebWallet(publicKey, signTransaction, signAllTransactions, sendTransaction), {
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
      console.log("public key fetch");
      fetchNFTsAndCheckForRainATA(connection, WALLET_PUBKEY || publicKey, setNFTs, setFetchedNFTs, setHasRainATA);
     }
  }, [connection, publicKey]);
  // }, [publicKey]);

  // Check if NFTS have been redeemed after fetching
  useEffect(() => {
    if (redemptionProgram && nfts) {
      updateIfNftsAreRedeemed(nfts, redemptionProgram, setNFTs);
    }
  }, [fetchedNFTs, redemptionProgram]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center pt-2 bg-space min-h-screen">
      <Head>
        <title>DTP $RAIN Redemption</title>
        <link rel="icon" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" sizes="16x16" href="/favicon-16x16.png" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center px-6 text-center">
        <Navbar />
        {/* // HEADER
        // Wallet not connected yet, show the header with the wallet connect button */}
        { !wallet_connected && (<Header showWalletConnect={true} /> )}

        {/* // Wallet connected, show wallet menu button */}
        { wallet_connected && (<div className="m-6 md:ml-auto"><WalletMultiButton /></div>)}
        {/* // Wallet connected, and we haven't fetched NFTS, or we have fetched NFTS and the wallet has some */}
        { (wallet_connected && !fetchedNFTs) || (wallet_connected && fetchedNFTs && nfts.length > 0) && (<Header showWalletConnect={false} /> ) }
        {/* //////////////////////////////////////////////////////////////////////////////////////////////// */}


        {/* // BODY */}
        { wallet_connected && !redemptionProgram && (<Loading />)}
        { wallet_connected && redemptionProgram && (<NFTGrid nfts={nfts} hasRainATA={hasRainATA} loading={!fetchedNFTs} program={redemptionProgram} />) }
        {/* //////////////////////////////////////////////////////////////////////////////////////////////// */}

        
        {/* // FOOTER with no wallet connected */}
        {/* { !wallet_connected && (<Footer />) } */}
        <Footer />
        {/* //////////////////////////////////////////////////////////////////////////////////////////////// */}

      </main>
    </div>
  )
}

export default Home
