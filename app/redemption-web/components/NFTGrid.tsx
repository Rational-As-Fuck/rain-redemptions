import { useCallback, useState, useEffect } from 'react';

import { Redemption } from "@raindrop-studios/rain-redemptions";

import { RAIN_MINT } from "../lib/constants";
import { getOrCreateAssociatedTokenAccount } from '../lib/token';
import { NFTSet, redeemRugSet, redeemRugSetMultiTransaction } from "../lib/nftSet";
import { NFT, DTP_TYPE, redeemPandaOrRugNFT } from '../lib/nft';
import Loading from "./Loading";
import NFTGridItem from "./NFTGridItem";
import NFTSetGridItem from "./NFTSetGridItem";
import NoNFTS from './NoNFTs';

const createRainATA = async (program: any, setCreatingRainATA: any, setCreatedRainATASuccess: any, update: any) => {
  setCreatingRainATA(true);
  update();
  const destRainTokenAccount = await getOrCreateAssociatedTokenAccount(
    program,
    RAIN_MINT
  );
  console.log("getOrCreateAssociatedTokenAccount");

  setCreatingRainATA(false);
  setCreatedRainATASuccess(!!destRainTokenAccount);
  update();
  if (!destRainTokenAccount) {
    console.error("There was an error creating/getting the rain token account");
    return;
  }
}

function updateCreatingRainAccountText(creatingText: string, setCreatingText: any, setTimerId: any) {
  console.log("updating creating");
  if (creatingText.includes("...")) {
    creatingText = "CREATING";
    setCreatingText(creatingText);
  } else {
    creatingText += ".";
    setCreatingText(creatingText);
  }
  setTimerId(setTimeout(() => updateCreatingRainAccountText(creatingText, setCreatingText, setTimerId), 1000));
}
let timerType: ReturnType<typeof setInterval> | undefined;

type NFTGridProps = { program: Redemption, loading: boolean, nfts: NFT[], hasRainATA: boolean };
// type NFTGridState = { isRedeeming: boolean };

const HOVER_SET_CLASSES_GRID = [
  "bg-slate-100",
  "text-black",
  "rounded-2xl",
]

export default function NFTGrid(props: NFTGridProps) {
  const [creatingRainATA, setCreatingRainATA] = useState(false);
  const [createdRainATASuccess, setCreatedRainATASuccess] = useState(false);
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);

  const [creatingText, setCreatingText] = useState("Create $RAIN token account");
  const [creatingTimerId, setCreatingTimerId] = useState(timerType);

  useEffect(() => {
    if (creatingRainATA)
      updateCreatingRainAccountText("CREATING", setCreatingText, setCreatingTimerId);
  }, [creatingRainATA]);

  console.log("props.loading", props.loading);
  if (props.loading) {
    return (
      <Loading />
    )
  } 

  console.log("props.nft.length", props.nfts.length);
  if (props.nfts.length === 0) {
    return (
      <NoNFTS />
    )
  }

  console.log("props.hasRainATA", props.hasRainATA)
  console.log("creatingRainATA", creatingRainATA)
  console.log("createdRainATASuccess", createdRainATASuccess)
  if ((!createdRainATASuccess && !props.hasRainATA)) {
    console.log("rendering button");
    let buttonClassName = [
      "rounded-2xl",
      "bg-violet-600",
      "mt-20",
      "p-6",
      "w-52",
    ];

    if (creatingRainATA) {
      buttonClassName = [
        ...buttonClassName,
        "bg-slate-300",
        "text-black",
        "opacity-50",
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
      ];
    }


    return (
      <button
        disabled={creatingRainATA}
        onClick={
          () => createRainATA(props.program, setCreatingRainATA, setCreatedRainATASuccess, forceUpdate)
        } className={buttonClassName.join(" ")}
      >{creatingText}</button>
    )
  } else if (creatingTimerId) {
    clearTimeout(creatingTimerId);
    setCreatingTimerId(undefined);
  }


  const pandas = props.nfts.filter((e: NFT) => e.dtpType === DTP_TYPE.PANDA);
  console.log("pandas", pandas.length);
  const rugs = props.nfts.filter((e: NFT) => e.dtpType === DTP_TYPE.RUG);
  const rugsNotSetRedeemed = props.nfts.filter((e: NFT) => e.dtpType === DTP_TYPE.RUG && !e.isRedeemedForSet)
  console.log("rugsNotSetRedeemed", rugsNotSetRedeemed)
  const rugSets = new NFTSet(DTP_TYPE.RUG, rugsNotSetRedeemed);

  const redemptionFn = async (nft: NFT, program: Redemption) => {
    console.log("nft.isRedeeming = true");
    nft.isRedeeming = true;
    forceUpdate();
    // this.setState({ isRedeeming: true });
    try {
      await redeemPandaOrRugNFT(nft, program);
    } catch (e) {
      console.error(e);
    }
    console.log("nft.isRedeeming = false");
    nft.isRedeeming = false;
    forceUpdate();
    // this.setState({ isRedeeming: false });
  };

  const setRedemptionFn = async (nfts: NFT[], program: Redemption) => {
    nfts.forEach((e: NFT) => { e.isRedeemingSet = true; });
    forceUpdate();
    // this.setState({ isRedeeming: true });
    try {
      await redeemRugSetMultiTransaction(nfts, program);
      nfts.forEach((e: NFT) => { e.isRedeemedForSet = true; });
    } catch (e) {
      console.error(e);
    }
    nfts.forEach((e: NFT) => { e.isRedeemingSet = false; });
    forceUpdate();
    // this.setState({ isRedeeming: false });
  };

  return (
    <div className='mt-12'>
      <div>
        <div className='mt-14 mb-8 text-4xl'>Your Pandas</div>
        <div className="grid  grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 sm:gap-x-16 lg:gap-x-20">
          {pandas.length > 0 && pandas.map((nft: NFT, index: number) => (
            <NFTGridItem nft={nft} isRedeemed={nft.isRedeemed} index={"panda-" + index} program={props.program} redemptionFn={redemptionFn} />
          ))}
        </div>
      </div>
      { rugs.length > 0 && (
        <div>
          <div>
            <div className='mt-14 mb-8 text-5xl'>Rugs</div>
            <div className="grid  grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 sm:gap-x-16 lg:gap-x-20">
              {rugs.map((nft: NFT, index: number) => (
                <NFTGridItem nft={nft} isRedeemed={nft.isRedeemed} index={"rug-" + index} program={props.program} redemptionFn={redemptionFn} />
              ))}
            </div>
          </div>
          <div>
            <div className='mt-14 mb-8 text-5xl'>Rug Sets</div>
            { rugSets.sets.length === 0 && (<div>{rugSets.numberRemainingToFinishSet} Rug{rugSets.numberRemainingToFinishSet === 1 ? "" : "s" } left to finish set</div>)}
            <div className="">
              {rugSets.sets.map((set: NFT[], index: number) => (
                <div>
                  <div className='mt-14 mb-8 text-5xl'>Set {index + 1}</div>
                  <button disabled={set[0].isRedeemingSet || set[0].isRedeemedForSet} className={`group hover:rounded-xl hover:ring hover:ring-white ${set[0].isRedeemingSet || set[0].isRedeemedForSet ? HOVER_SET_CLASSES_GRID.join(" ") : ""}`} onClick={() => setRedemptionFn(set, props.program)}>
                    <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-y-4 sm:gap-y-12 lg:gap-y-16 gap-x-4 sm:gap-x-16 lg:gap-x-20">
                      {set.map((nft: NFT, index: number) => (
                        <NFTSetGridItem nfts={set} nft={nft} index={"rugset-" + index} program={props.program} redemptionFn={() => setRedemptionFn(set, props.program)} />
                      ))}
                    </div>
                    <div className={`group-hover:bg-violet-600 w-full rounded-b-xl py-4 lg:py-6 group-active:bg-slate-300 group-active:text-black ${set[0].isRedeemingSet || set[0].isRedeemedForSet ? "mt-4 bg-slate-300 text-black" : "" }`}>{set[0].isRedeemingSet ? "Redeeming..." : "Redeem Set"}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

