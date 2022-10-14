import { IMSOClaim } from "../../lib/src/";

import { NFT } from '../lib/nft';

export default function NFTSetGridItem(props: { nft: NFT, nfts: NFT[], index: string, program: IMSOClaim, redemptionFn: (nfts: NFT[], program: IMSOClaim) => Promise<void> }) {
  const { nft, nfts, index, program, redemptionFn } = props;

  console.log("Rendering grid set item")
  let buttonClassName = [
    "group",
    "focus:outline-none",
    "rounded-2xl",
  ];

  let imgClassName = [
    "rounded-2xl",
  ];

  if (nft.isRedeemedForSet || nft.isRedeemingSet) {
    buttonClassName = [
      ...buttonClassName,
      "bg-slate-300",
      "text-black",
    ];

    imgClassName = [
      ...imgClassName,
      "opacity-50",
    ]
  }
  
  //TODO: Handle the case where you are clicked on an item and hover off it and then back. The bottom rounded edges will become visible.

  return (
    <div key={index} className="sla flex flex-col justify-center items-center col-span-2 grid-item pt-4 pl-4 pr-4">
      <img draggable="false" className={imgClassName.join(" ")} src={nft.imageUrl} width={200} height={200} />
    </div>
  );
}