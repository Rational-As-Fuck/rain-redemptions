import Image from 'next/image'

import trashKing from '../public/TrashKing.png';
import pandaLogo from '../public/LogoTransp.png';

export default function NoNFTS(_props: any) {
  return (
    <div>
      <Image
        src={pandaLogo}
        alt="Trash Panda Logo"
        height={120}
        width={142}
      />
      <div className="mt-auto mb-auto text-4xl max-w-lg">
        You have no
        <br/>
        Trash Pandas
        <br/>
        You are
        <div className='mt-10 text-8xl md:text-9xl animate-pulse'>
          NGMI
        </div>
      </div>
      <div className="mt-auto">
        <Image
          src={trashKing}
          alt="Trash King"
          height={300}
          width={300}
        />
      </div>
    </div>
  );
};