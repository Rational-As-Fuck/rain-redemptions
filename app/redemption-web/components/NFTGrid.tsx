import React from "react";

import { Redemption } from "@raindrops-protocol/rain-redemptions";

import { NFTSet, redeemRugSet } from "../lib/nftSet";
import { NFT, DTP_TYPE, redeemPandaOrRugNFT } from '../lib/nft';
import NFTGridItem from "./NFTGridItem";
import NFTSetGridItem from "./NFTSetGridItem";
import NoNFTS from './NoNFTs';

type NFTGridProps = { program: Redemption, loading: boolean, nfts: NFT[] };
type NFTGridState = { isRedeeming: boolean };
export class NFTGrid extends React.Component<NFTGridProps, NFTGridState> {
  constructor(props: NFTGridProps) {
    super(props);

    this.state = {
      isRedeeming: false,
    }
  }

  render() {
    const pandas = this.props.nfts.filter((e: NFT) => e.dtpType === DTP_TYPE.PANDA);
    console.log("pandas", pandas.length);
    const rugs = this.props.nfts.filter((e: NFT) => e.dtpType === DTP_TYPE.RUG);
    const rugsNotSetRedeemed = this.props.nfts.filter((e: NFT) => e.dtpType === DTP_TYPE.RUG && !e.isRedeemedForSet)
    console.log("rugsNotSetRedeemed", rugsNotSetRedeemed)
    const rugSets = new NFTSet(DTP_TYPE.RUG, rugsNotSetRedeemed);

    const redemptionFn = async (nft: NFT, program: Redemption) => {
      nft.isRedeeming = true;
      this.setState({ isRedeeming: true });
      try {
        await redeemPandaOrRugNFT(nft, program);
      } catch (e) {
        console.error(e);
      }
      nft.isRedeeming = false;
      this.setState({ isRedeeming: false });
    };

    const setRedemptionFn = async (nfts: NFT[], program: Redemption) => {
      nfts.forEach((e: NFT) => { e.isRedeemingSet = true; });
      this.setState({ isRedeeming: true });
      try {
        await redeemRugSet(nfts, program);
      } catch (e) {
        console.error(e);
      }
      nfts.forEach((e: NFT) => { e.isRedeemingSet = false; });
      this.setState({ isRedeeming: false });
    };

    if (this.props.loading) {
      return (
        <span className="mt-auto mb-auto text-5xl">LOADING...</span>
      )
    }

    if (this.props.nfts.length === 0) {
      return (
        <NoNFTS />
      )
    }

    return (
      <div className='mt-12'>
        <div>
          <div className='mt-14 mb-8 text-5xl'>Pandas</div>
          <div className="grid  grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 sm:gap-x-16 lg:gap-x-20">
            {pandas.length > 0 && pandas.map((nft: NFT, index: number) => (
              <NFTGridItem nft={nft} isRedeemed={nft.isRedeemed} index={"panda-" + index} program={this.props.program} redemptionFn={redemptionFn} />
            ))}
          </div>
        </div>
        { rugs.length > 0 && (
          <div>
            <div>
              <div className='mt-14 mb-8 text-5xl'>Rugs</div>
              <div className="grid  grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 sm:gap-x-16 lg:gap-x-20">
                {rugs.map((nft: NFT, index: number) => (
                  <NFTGridItem nft={nft} isRedeemed={nft.isRedeemed} index={"rug-" + index} program={this.props.program} redemptionFn={redemptionFn} />
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
                    <button className="group hover:rounded-xl hover:ring hover:ring-white " onClick={() => setRedemptionFn(set, this.props.program)}>
                      <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-y-4 sm:gap-y-12 lg:gap-y-16 gap-x-4 sm:gap-x-16 lg:gap-x-20">
                        {set.map((nft: NFT, index: number) => (
                          <NFTSetGridItem nfts={set} nft={nft} index={"rugset-" + index} program={this.props.program} redemptionFn={() => setRedemptionFn(set, this.props.program)} />
                        ))}
                      </div>
                      <div className="group-hover:bg-violet-600 w-full rounded-b-xl py-4 lg:py-6 group-active:bg-slate-300 group-active:text-black">Redeem Set</div>
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
}

