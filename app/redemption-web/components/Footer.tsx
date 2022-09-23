import Image from 'next/image'
import imsoSmall from '../public/imso_small.png';
import pandaHead from '../public/LogoTransp.png';
import { BsPlusLg } from 'react-icons/bs';

export default function Footer(_props: any) {
  return (
    <div className="mt-auto bg-black w-screen border-light-100 border-t-2">
      <div>
        <div className="flex flex-row items-center justify-center">
          <p className="pr-5 mt-2">Brought to you by</p>
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
              height={50}
              width={72}
              objectFit="scale-down"
            />
        </div>
      </div>
    </div>
  );
};