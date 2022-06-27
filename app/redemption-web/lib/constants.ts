import { web3 } from '@project-serum/anchor';

enum Environment {
  Localnet = "localnet",
  Devnet = "devnet",
  Mainnet = "mainnet",
}

let environment: string = Environment.Localnet;

switch (process.env.VERCEL_ENV) {
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
    environment = process.env.SOLANA_ENV ? process.env.SOLANA_ENV : environment;
}

let walletPubKey, programConnection;
let endpoint = "https://trashpandas.rpcpool.com";
let rainMint = new web3.PublicKey("rainH85N1vCoerCi4cQ3w6mCf7oYUdrsTFtFzpaRwjL");

switch(environment) {
  case Environment.Localnet:
    endpoint = "http://127.0.0.1:8899";

    rainMint = process.env.RAIN_MINT ?
      new web3.PublicKey(process.env.RAIN_MINT) :
      rainMint;

    walletPubKey = process.env.TEST_WALLET_PUBKEY ?
      new web3.PublicKey(process.env.TEST_WALLET_PUBKEY) :
      new web3.PublicKey("Gxb6LbG8Bn1gRY75nDwv7mKdPh5pZyPqgJufwm4m69gS");
    break;
  case Environment.Devnet:
    endpoint = "https://solana-mainnet.phantom.tech";
  default:
    break;
};

programConnection = new web3.Connection(endpoint);
  
export const RAIN_MINT = rainMint;
export const WALLET_PUBKEY = walletPubKey;
export const PROGRAM_CONNECTION = programConnection;
export const ENDPOINT = endpoint;
export const ENVIRONMENT = environment;

export const PANDA_CREATORS = [
  "CLErvyrMpi66RAxNV2wveSi25NxHb8G383MSVuGDgZzp",
  "HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx",
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