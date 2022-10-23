import { web3 } from '@project-serum/anchor';

enum Environment {
  Localnet = "localnet",
  Devnet = "devnet",
  Mainnet = "mainnet",
}

let environment: string = Environment.Localnet;

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
//let endpoint = "https://trashpandas.rpcpool.com";
let endpoint ="https://127.0.0.1:8899";
//let endpoint = "https://solana-devnet.g.alchemy.com/v2/t0-XFKw5rFAafXfyWRmjzgm_ygXilUk4";
// let rainMint = new web3.PublicKey("rainH85N1vCoerCi4cQ3w6mCf7oYUdrsTFtFzpaRwjL");
//let rainMint = new web3.PublicKey("J8oPSr8PSBEm5BA6o4fou1q4UiHLWAqqSZxs88jiwmHp");
let rainMint = new web3.PublicKey("7CtqjfzKSYXafskXjSR1s52HjyNJXRBRSXiabWLkDThc");

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
    //endpoint = "https://ssc-dao.genesysgo.net/";
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

export const CREATORS = [
  ...PANDA_CREATORS
]
