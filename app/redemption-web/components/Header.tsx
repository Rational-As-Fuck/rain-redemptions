import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image'

import pandaLogo from '../public/LogoTransp.png';
import wordLogo from '../public/WordLogo.png';

export default function Header(props : { showWalletConnect: boolean }) {
  const { showWalletConnect } = props;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="w-96">
        <Image
          src={pandaLogo}
          alt="Trash Panda Logo"
          height={120}
          width={142}
        />
        <Image
          src={wordLogo}
          alt="Trash Pandas"
          height={351}
          width={700}
        />
      </div>
      <div className="text-3xl max-w-lg leading-relaxed">
        Trash with Frens
        <br/>
        $RAIN Redemption
      </div>
      {showWalletConnect && (
        <div className="mt-6 ml-auto mr-auto">
          <WalletMultiButton />
        </div>
      )}
    </div>
  )
};