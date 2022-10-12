import Image from 'next/image'
import imsoSmall from '../public/imso_small.png';
import pandaHead from '../public/LogoTransp.png';
import { BsPlusLg } from 'react-icons/bs';
import Link from 'next/link';

export default function Footer(_props: any) {
  return (
    <div className="footer mt-auto bg-black w-screen border-light-100 border-t-2">
      <div>
        <div className="flex flex-row items-center justify-center p-2">
          <p className="hidden md:inline pr-5 mt-2">Brought to you by</p>
            <a href="https://imsonft.io/">
              <Image
                  src={imsoSmall}
                  alt="ImsoNFT"
                  height={30}
                  width={75}
                  objectFit="scale-down"
              />
            </a>
          <div><BsPlusLg style={{ marginLeft: '15px', marginRight: '15px' }} /></div>
            <a href="https://degentrashpandas.com/">
              <Image
              src={pandaHead}
              alt="DTP"
              height={40}
              width={65}
              objectFit="scale-down"
              />
            </a>
        </div>
      </div>
    </div>
  );
};