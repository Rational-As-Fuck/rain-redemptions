import type { NextPage } from 'next'
import Image from 'next/image';
import Link from 'next/link';
import * as Anchor from "@project-serum/anchor";
import { useEffect, useState } from 'react';
import { Metaplex, Nft } from "@metaplex-foundation/js";

import { Redemption } from "@raindrop-studios/rain-redemptions";
import { Wallet } from "@raindrop-studios/sol-kit";

import pandaLogo from '../public/LogoTransp.png';
import wordLogo from '../public/WordLogo.png';

import { PROGRAM_CONNECTION, CREATORS } from '../lib/constants';
import { getDTPType, DTP_TYPE } from '../lib/nft';

import { Navbar } from '../components/NavBar';
import Header from "../components/Header";
import Footer from '../components/Footer';

const lookupNFT = async (program: Redemption | undefined, mintAddress: string, setResults: any) => {
  console.log("lookupNFT");
  if (mintAddress && program) {
    console.log("mintAddress && program");
    const mintPubKey = new Anchor.web3.PublicKey(mintAddress);
    if (mintPubKey) {
      console.log("mintPubKey");
      const metaplex = new Metaplex(PROGRAM_CONNECTION);
      try {
        const nft = await metaplex.nfts().findByMint(mintPubKey);
        if (nft) {
          console.log("nft");
          const nftCreators = nft.creators?.map(e => e.address.toString()) || [];
          const verifiedDTPCreators = nftCreators.filter(creator => CREATORS.includes(creator));
          if (verifiedDTPCreators.length > 0) {
            console.log("verified Creators");
            await nft.metadataTask.run();
            const isRedeemed = await program.isNFTRedeemed(mintPubKey, { commitment: "finalized" });
            const isRedeemedAsSet = await program.isRugSetNFTRedeemed(mintPubKey, { commitment: "finalized" });
            const result = {
              image: nft.metadata.image,
              dtpType: getDTPType(verifiedDTPCreators[0]),
              isDTPRedeemable: true,
              redeemed: isRedeemed,
              redeemedInSet: isRedeemedAsSet
            };
            console.log(result)
            setResults(result);
            return
          }
        }
      } catch (error) {
        setResults({ ...REDEMPTION_RESULT_TEST, isDTPRedeemable: false })
        return;
      }
    }
  }
  setResults(REDEMPTION_RESULT_TEST)
  return;
}

const setRedemptionProgramWrapper = async (program: Promise<any>, setRedemptionProgram: any) => {
  setRedemptionProgram(await program);
};

type RedemptionCheckResult = {
  isDTPRedeemable: boolean,
  dtpType:  DTP_TYPE,
  image: string,
  redeemed: boolean,
  redeemedInSet: boolean,
}
let REDEMPTION_RESULT_TEST = {
  isDTPRedeemable: true,
  dtpType: "PANDA",
  image: "",
  redeemed: false,
  redeemedInSet: false
} as RedemptionCheckResult;

const RedemptionChecker: NextPage = () => {
  const [mintAddress, setMintAddress] = useState("");
  const [redemptionProgram, setRedemptionProgram] = useState();
  const [redemptionResult, setRedemptionResult] = useState(REDEMPTION_RESULT_TEST);

  useEffect(() => {
      const provider = new Anchor.AnchorProvider(
        PROGRAM_CONNECTION, 
        Wallet.WebWallet.fakeWallet(),
        {},
      );
      const config = {
        asyncSigning: true,
        provider       
      };
      setRedemptionProgramWrapper(Redemption.getProgramWithConfig(Redemption, config)
      , setRedemptionProgram);
  }, []);

  let buttonClassName = [
    "rounded-2xl",
    "bg-violet-600",
    "mt-4",
    "p-6",
    "w-56",
    "font-display",
    "text-lg",
    "font-semibold",
  ];

  if (mintAddress.length <= 42) {
    buttonClassName = [
      ...buttonClassName,
      "bg-slate-300",
      "text-black",
      "opacity-50",
      "font-display",
      "text-lg",
      "font-semibold",
    ];
  } else {
    buttonClassName = [
      ...buttonClassName,
      "hover:ring",
      "hover:ring-white",
      "hover:bg-violet-400",
      "focus:ring",
      "focus:ring-white",
      "focus:bg-violet-600",
      "active:bg-slate-300",
      "active:text-black",
      "font-display",
      "text-lg",
      "font-semibold",
    ];
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center pt-2 bg-space">
      <main className="flex w-full flex-1 flex-col items-center px-6 text-center">
        <Navbar />
        <Header showWalletConnect={false} />
        <div className="flex flex-col items-center justify-center py-2">

          {!redemptionResult.isDTPRedeemable && (
            <div className='mt-32 text-6xl'>
              Not a compatible NFT
            </div>
          )}

          {redemptionResult.isDTPRedeemable && redemptionResult.image && (
            <div className="mt-32 pt-4">
              <div className="text-4xl">
                { redemptionResult.dtpType }
              </div>
              <div className="mt-4 text-white flex flex-col items-center">
                {redemptionResult.image && (
                  <div style={{ height: 320, width: 320 }} className={`rounded-2xl ${redemptionResult.redeemed ? "bg-slate-300" : ""}` }>
                    <Image
                      src={redemptionResult.image}
                      alt="NFT image"
                      height={320}
                      width={320}
                      className={`rounded-2xl ${redemptionResult.redeemed ? "opacity-50" : ""}` }
                    />
                  </div>
                )}
                <div className='mt-2 mb-12 text-2xl'>
                  <div className='mt-8'>
                    {redemptionResult.redeemed ? "": "Not"} Redeemed
                    <br />
                    { redemptionResult.dtpType === DTP_TYPE.RUG && (
                      <div>
                        and
                        <br/>
                        {redemptionResult.redeemedInSet ? "": "Not"} Redeemed as part of set
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <label className="mt-28 ml-10 mr-10 text-2xl font-display">
            Mint address of the NFT
            <input 
              id="mintInput"
              value={mintAddress}
              onChange={(event) => setMintAddress(event.target.value)
              }
              onKeyUp={(event) => {
                if (event.key === "Enter" && mintAddress.length >= 43) {
                  lookupNFT(redemptionProgram, mintAddress, setRedemptionResult)
                }
              }}
              className="mt-4 p-5 w-full rounded-2xl text-black text-lg text-center font-serif"
            ></input>
          </label>
          <button 
            disabled={mintAddress.length <= 42}
            className={buttonClassName.join(" ")}
            onClick={() => lookupNFT(redemptionProgram, mintAddress, setRedemptionResult)}
          >Check NFT</button>

        </div>
      </main>
    </div>
  )
};

export default RedemptionChecker;