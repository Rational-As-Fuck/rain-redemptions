import { LOCALHOST } from '@metaplex-foundation/amman';
import { Amman } from '@metaplex-foundation/amman-client';
import { web3 } from '@project-serum/anchor'
import {
  Metaplex,
  keypairIdentity,
  mockStorage
} from "@metaplex-foundation/js";
import {
  Creator,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  CLI,
} from '@raindrop-studios/sol-command';

const { Connection } = web3;

const amman = Amman.instance()
const connection = new Connection(LOCALHOST)

const RUG_CREATOR = {
  address: new web3.PublicKey("BHRFPSHHtLqjbcvVCmGrCjgbUagwnKDxp4CbUgoED3tT"),
  verified: true,
  share: 1
} as Creator;
const RUG_IMAGES = [
  "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/",
  "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ",
  "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys",
  "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0",
  "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM",
  "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4",
];

export async function createRugNFT(owner: web3.PublicKey, rugCreatorLabel: string = 'rug-creator') {
  const [_rugCreatorPubKey, rugCreatorPrivateKey] = await amman.loadKeypair(rugCreatorLabel)

  const rugMetaplex = new Metaplex(connection);
  rugMetaplex.use(keypairIdentity(rugCreatorPrivateKey));
  rugMetaplex.use(mockStorage());

  const { nft } = await rugMetaplex.nfts().create({
    name: `Rugged by Pit the Panda`,
    symbol: "DTPR",
    uri: RUG_IMAGES[Math.floor(Math.random() * RUG_IMAGES.length)],
    creators: [
      RUG_CREATOR,
    ],
    payer: rugCreatorPrivateKey,
    owner
  });
  console.log(`Created rug NFT with mint - ${nft.mint.toString()} - to owner - ${owner.toString()}`);

  return nft;
}

const createRugArgs = [
  new CLI.Argument("[ownerPublicKey]", "The public key of where to send the created NFT").argParser((arg) => new web3.PublicKey(arg)),
  new CLI.Argument("[count]", "The number of rugs to create. Defaults to 1").argParser((arg) => parseInt(arg)),
];
CLI.programCommandWithArgs("create", createRugArgs, async (ownerPublicKey, count: number = 1) => {
  const [rugCreatorPubKey, _rugCreatorPrivateKey] = await amman.loadOrGenKeypair('rug-creator');
  console.log("🪂 rug-creator:", rugCreatorPubKey.toBase58());
  await amman.airdrop(connection, rugCreatorPubKey, 2);

  let owner;
  if (ownerPublicKey) {
    console.log("🪂 owner:", ownerPublicKey.toString());
    await amman.airdrop(connection, ownerPublicKey, 2);
    owner = ownerPublicKey;
  } else {
    const [rugHolderPubKey, _rugHolderPrivateKey] = await amman.loadOrGenKeypair('rug-holder');
    console.log("🪂 rug-holder:", rugHolderPubKey.toString());
    await amman.airdrop(connection, rugHolderPubKey, 2);
    owner = rugHolderPubKey;
  }

  console.log(`🦝🏴‍☠️  mint ${count} DTP rug NFTs to owner: ${owner.toString()}`);
  await Promise.all([...new Array(count)].map((_elem, index) => {
    console.log(`Creating rug NFT ${index + 1}`);
    return createRugNFT(owner);
  }));
}, false);

CLI.Program.parseAsync(process.argv);