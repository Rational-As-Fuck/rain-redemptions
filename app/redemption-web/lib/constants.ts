import { web3 } from '@project-serum/anchor';

enum Environment {
  Localnet = "localnet",
  Devnet = "devnet",
  Mainnet = "mainnet",
}

let environment: string = Environment.Devnet;

switch (process.env.NEXT_PUBLIC_VERCEL_ENV) {
  case "production":
    environment = Environment.Mainnet;
    break;
  case "preview":
    environment = Environment.Mainnet;
    break;
  case "development":
    environment = Environment.Devnet;
    break;
  default:
    environment = process.env.NEXT_PUBLIC_SOLANA_ENV ? process.env.NEXT_PUBLIC_SOLANA_ENV : environment;
}

console.log(environment)

let walletPubKey, programConnection;
let endpoint = "https://trashpandas.rpcpool.com";
let rainMint = new web3.PublicKey("rainH85N1vCoerCi4cQ3w6mCf7oYUdrsTFtFzpaRwjL");

switch(environment) {
  case Environment.Localnet:
    endpoint = "http://127.0.0.1:8899";

    if (process.env.NEXT_PUBLIC_RAIN_MINT) {
      rainMint = new web3.PublicKey(process.env.NEXT_PUBLIC_RAIN_MINT);
    }

    if (process.env.NEXT_PUBLIC_TEST_WALLET_PUBKEY) {
      walletPubKey = new web3.PublicKey(process.env.NEXT_PUBLIC_TEST_WALLET_PUBKEY);
    }
    break;
  case Environment.Devnet:
    endpoint = "https://solana-devnet.g.alchemy.com/v2/t0-XFKw5rFAafXfyWRmjzgm_ygXilUk4";
  default:
    break;
};

console.log(endpoint);

programConnection = new web3.Connection(endpoint);
  
export const RAIN_MINT = rainMint;
export const WALLET_PUBKEY = walletPubKey;
export const PROGRAM_CONNECTION = programConnection;
export const ENDPOINT = endpoint;
export const ENVIRONMENT = environment;

export const PANDA_CREATORS = [
  "CLErvyrMpi66RAxNV2wveSi25NxHb8G383MSVuGDgZzp",
  "HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx",
  "4k21XuJGiDSgdb9w7zMEcobJgnnPkiMpH3nM4uiQzao9",
];
export const RUG_CREATOR = "BHRFPSHHtLqjbcvVCmGrCjgbUagwnKDxp4CbUgoED3tT";

export const CREATORS = [
  ...PANDA_CREATORS,
  RUG_CREATOR,
]

export const RUG_LEVEL_URIS = [
  "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/",
  "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ",
  "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys",
  "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0",
  "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM",
  "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4",
]