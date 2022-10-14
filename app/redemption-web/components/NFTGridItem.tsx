import { IMSOClaim } from "../../lib/src/";
import { useState, useEffect } from 'react';

import { NFT } from '../lib/nft';

function updateRedeemingText(redeemingText: string, setRedeemingText: any, setTimerId: any) {
//  console.log("updating redeeming");
  if (redeemingText.includes("...")) {
    redeemingText = "Redeeming";
    setRedeemingText(redeemingText);
  } else {
    redeemingText += ".";
    setRedeemingText(redeemingText);
  }
  setTimerId(setTimeout(() => updateRedeemingText(redeemingText, setRedeemingText, setTimerId), 1000));
}
let timerType: ReturnType<typeof setInterval> | undefined;

export default function NFTGridItem(props: { nft: NFT, isRedeemed: boolean, index: string, program: IMSOClaim, redemptionFn: (nft: NFT, program: IMSOClaim) => Promise<void> }) {
  const { nft, isRedeemed, index, program, redemptionFn } = props;
  const [redeemingText, setRedeemingText] = useState("Redeeming");
  const [timerId, setTimerId] = useState(timerType);
  useEffect(() => {
    if (nft.isRedeeming)
      updateRedeemingText(redeemingText, setRedeemingText, setTimerId);
  }, [nft.isRedeeming]);

 // console.log("Rendering grid item, redeemed", isRedeemed)
 // console.log(nft.imageUrl)
 // console.log("index", index);
  let buttonClassName = [
    "group",
    "focus:outline-none",
    "rounded-2xl",
  ];

  let redeemButtonTextClassName = [
    "mt-3",
    "mb-3", 
  ];

  let imgClassName = [
    "rounded-2xl",
  ];

  if (isRedeemed || nft.isRedeeming) {
    buttonClassName = [
      ...buttonClassName,
      "bg-slate-300",
      "text-black",
    ];

    imgClassName = [
      ...imgClassName,
      "opacity-50",
      "rounded-b-none",
    ]
  }
  
  if (!isRedeemed && !nft.isRedeeming) {
    buttonClassName = [
      ...buttonClassName,
      "focus:ring",
      "focus:ring-white",
      "focus:bg-violet-600",

      "hover:bg-violet-400",
      "hover:ring",
      "hover:ring-white",

      "active:bg-slate-300",
      "active:text-black",
    ];

    imgClassName = [
      ...imgClassName,
      "group-hover:rounded-b-none",
    ];
  }

  let buttonText = "Redeem";
  if (isRedeemed) {
    redeemButtonTextClassName = [
      ...redeemButtonTextClassName,
      "line-through"
    ];
    buttonText = "Redeemed";
  }

  if (nft.isRedeeming) {
    buttonText = redeemingText;
  }

  if (!nft.isRedeeming) {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(undefined);
    }
  }

  //TODO: Handle the case where you are clicked on an item and hover off it and then back. The bottom rounded edges will become visible.

  return (
    <div key={index} className="sla flex flex-col justify-center items-center mb-10 col-span-2 grid-item">
      <button onClick={() => redemptionFn(nft, program)} disabled={nft.isRedeemed || nft.isRedeeming} className={buttonClassName.join(" ")}>
        <img draggable="false" className={imgClassName.join(" ")} src={nft.imageUrl} width={200} height={200} />
          <div className={redeemButtonTextClassName.join(" ")}>{buttonText}</div>
      </button>
    </div>
  );
}