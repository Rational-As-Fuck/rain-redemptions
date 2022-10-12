import { Card } from "flowbite-react";
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Footer(_props: any) {
  return (
    <div className="max-w-sm md:max-w-xl pb-5">
      <Card>
        <h5 className="text-2xl font-bold tracking-tight text-blue-500">
          Degen Trash Pandas $RAIN Redemption
        </h5>
        <p className="text-xs md:text-sm font-display text-gray-700 dark:text-gray-400">
          Connect the wallet that holds your Pandas.
        </p>
        <div className="m-auto"><WalletMultiButton /></div>
        <Link href='/redemptionChecker'>
          <a href="#" className="m-auto text-xs md:text-sm font-display inline-flex items-center text-gray-700 hover:underline">
            Check a Panda Redemtion status here
            <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
          </a>
        </Link>
      </Card>
    </div>

    );
  };