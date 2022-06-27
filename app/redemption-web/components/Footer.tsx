import Image from 'next/image'

import gameImage from '../public/GameImage.png';

export default function Footer(_props: any) {
  return (
    <div>
      <div className='mt-auto'>
        <Image
          src={gameImage}
          alt="Panda with Shovel"
          height={500}
          width={700}
        />
      </div>
    </div>
  );
};