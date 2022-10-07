import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image';
import Link from 'next/link';

// import pandaLogo from '../public/LogoTransp.png';
// import wordLogo from '../public/WordLogo.png';
import CheddarBlock from '../public/CheddarBlock.png';
import metaHunters from '../public/meta_hunters.png';
import imso from '../public/imso.png';

export default function Header(props : { showWalletConnect: boolean }) {
  const { showWalletConnect } = props;

  let buttonClassName = [
    "rounded-2xl",
    "bg-violet-600",
    "mt-4",
    "p-6",
    "w-52",
    "hover:ring",
    "hover:ring-white",
    "hover:bg-violet-400",
    "focus:ring",
    "focus:ring-white",
    "focus:bg-violet-600",
    "active:bg-slate-300",
    "active:text-black",
    "font-semibold"
  ];

  return (
    <div className="flex flex-col items-center justify-center pt-12 mx-5">
      <div className="w-72 md:w-96 mb-4">
        <Image
          src={metaHunters}
          alt="Meta Hunters"
        />
        <div className="projects flex flex-row items-center justify-center py-2 mx-15">
          <Image
            src={CheddarBlock}
            alt="Trash Pandas"
            height={200}
            width={200}
          />
          <Image
            src={imso}
            alt="Trash Pandas"
            height={200}
            width={200}
          />
        </div>
      </div>
      { !showWalletConnect && (
      <div className="text-5xl max-w-lg leading-relaxed">
        $RAIN Redemption
      </div>
      )}
      {/* {showWalletConnect && (
        <div className='flex flex-col items-center justify-center'>
          <div className="mt-6 mb-4">
            <WalletMultiButton>
              Select Wallet (redeem $RAIN)
            </WalletMultiButton>
          </div>
          OR
          <div>
            <Link href="/redemptionChecker" passHref>
              <button className={buttonClassName.join(" ")}>Check a Trash Panda NFT</button>
            </Link>
          </div>
        </div>
      )} */}
    </div>
  )
};