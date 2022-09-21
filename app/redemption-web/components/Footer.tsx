import Image from 'next/image'
import imsoSmall from '../public/imso_small.png';
import pandaHead from '../public/LogoTransp.png';
import { BsPlusLg } from 'react-icons/bs';

export default function Footer(_props: any) {
  return (
    <div className="mt-auto">
      <div>
        <div className="flex flex-row items-center justify-center">
          <p className="pr-5 mt-5">Brought to you by</p>
          <Image
              src={imsoSmall}
              alt="ImsoNFT"
              height={40}
              width={100}
              objectFit="scale-down"
            />
            <div><BsPlusLg style={{ marginLeft: '25px', marginRight: '25px' }} /></div>
            <Image
              src={pandaHead}
              alt="DTP"
              height={55}
              width={80}
              objectFit="scale-down"
            />
        </div>
      </div>
    </div>
  );
};