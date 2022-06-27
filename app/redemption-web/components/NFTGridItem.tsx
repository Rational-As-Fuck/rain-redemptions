import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { NFT } from '../lib/nft';

export default function NFTGridItem(props: { nft: NFT, isRedeemed: boolean, index: number, program: Redemption, redemptionFn: (nft: NFT, program: Redemption) => Promise<void> }) {
  const { nft, isRedeemed, index, program, redemptionFn } = props;

  console.log("Rendering grid item, redeemed", isRedeemed)
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

      "hover:bg-violet-600",
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
    buttonText = "Redeeming...";
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