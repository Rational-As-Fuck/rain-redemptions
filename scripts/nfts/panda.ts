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

const PANDA_CREATORS = [
  {
    address: new web3.PublicKey("CLErvyrMpi66RAxNV2wveSi25NxHb8G383MSVuGDgZzp"),
    verified: true,
    share: 1
  } as Creator,
  {
    address: new web3.PublicKey("HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx"),
    verified: true,
    share: 1
  } as Creator,
];
const PANDA_IMAGES = [
  "https://arweave.net/p8JZu7IfJVz8ePvlGJ0OHtBFPRoiF6HGNsYoma4P0wU",
  "https://arweave.net/Hq70dCqKQyWoFzu8B_6F3pFKMN71FEalRckcEbB_-xo",
  "https://arweave.net/8obNqxHUYnmbaYfX8vsx3Im6xMQNQvuZICnunmcF72M",
  "https://arweave.net/3MM7REQ-RIiV3-DmhmqYfMy1ZNJ7SsHrdwKtvKg0Pwk",
];

export async function createPandaNFT(owner: web3.PublicKey, pandaCreatorLabel: string = 'panda-creator') {
  const [_pandaCreatorPubKey, pandaCreatorPrivateKey] = await amman.loadKeypair(pandaCreatorLabel)

  const pandaMetaplex = new Metaplex(connection);
  pandaMetaplex.use(keypairIdentity(pandaCreatorPrivateKey));
  pandaMetaplex.use(mockStorage());

  const { nft } = await pandaMetaplex.nfts().create({
    name: `Degen Trash Panda #${Math.floor(Math.random() * 20000)}`,
    symbol: "DTP",
    uri: PANDA_IMAGES[Math.floor(Math.random() * PANDA_IMAGES.length)],
    creators: [
      PANDA_CREATORS[Math.floor(Math.random() * PANDA_CREATORS.length)],
    ],
    payer: pandaCreatorPrivateKey,
    owner
  });
  console.log(`Created panda NFT with mint - ${nft.mint.toString()} - to owner - ${owner.toString()}`);

  return nft;
}

const createPandaArgs = [
  new CLI.Argument("[ownerPublicKey]", "The public key of where to send the created NFT").argParser((arg) => new web3.PublicKey(arg)),
  new CLI.Argument("[count]", "The number of pandas to create. Defaults to 1").argParser((arg) => parseInt(arg)),
];
CLI.programCommandWithArgs("create", createPandaArgs, async (ownerPublicKey, count: number = 1) => {
  const [pandaCreatorPubKey, _pandaCreatorPrivateKey] = await amman.loadOrGenKeypair('panda-creator');
  console.log("🪂 panda-creator:", pandaCreatorPubKey.toString());
  await amman.airdrop(connection, pandaCreatorPubKey, 2);

  let owner;
  if (ownerPublicKey) {
    console.log("🪂 owner:", ownerPublicKey.toString());
    await amman.airdrop(connection, ownerPublicKey, 2);
    owner = ownerPublicKey;
  } else {
    const [pandaHolderPubKey, _pandaHolderPrivateKey] = await amman.loadOrGenKeypair('panda-holder');
    console.log("🪂 panda-holder:", pandaHolderPubKey.toString());
    await amman.airdrop(connection, pandaHolderPubKey, 2);
    owner = pandaHolderPubKey;
  }

  console.log(`🦝  mint ${count} DTP NFTs to owner: ${owner.toString()}`);
  await Promise.all([...new Array(count)].map((_elem, index) => {
    console.log(`Creating panda NFT ${index + 1}`);
    return createPandaNFT(owner);
  }));
}, false);

CLI.Program.parseAsync(process.argv);