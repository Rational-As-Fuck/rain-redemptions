import { Amman, LOCALHOST } from '@metaplex-foundation/amman';
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
} from "../node_modules/@solana/spl-token";
import { web3 } from '@project-serum/anchor'
import { programs as MetaplexPrograms } from '@metaplex/js';
import { Transaction as SolKitTransaction } from "@raindrops-protocol/sol-kit";

const { metadata: { Metadata, CreateMetadataV2, DataV2, Creator, CreateMasterEditionV3 } } =  MetaplexPrograms;
const { Connection, Transaction, SystemProgram } = web3;

const amman = Amman.instance()
const connection = new Connection(LOCALHOST)

const TOKEN_METADATA_PROGRAM_PREFIX = "metadata";
export const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const getNFTMasterEditionPDA = async (mint: web3.PublicKey): Promise<[web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(TOKEN_METADATA_PROGRAM_PREFIX), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
    TOKEN_METADATA_PROGRAM_ID
  );
};

async function createMint([payerPubKey, payerPrivateKey]: [any, web3.Keypair], [mintPubKey, mintPrivateKey], decimals, label) {
  let tx = new Transaction().add(
    // create mint account
    SystemProgram.createAccount({
      fromPubkey: payerPubKey,
      newAccountPubkey: mintPubKey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    // init mint account
    createInitializeMintInstruction(
      mintPubKey, // mint pubkey
      decimals,
      mintPubKey, // mint authority
      null, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
    )
  );

  const txAddr = await connection.sendTransaction(tx, [payerPrivateKey, mintPrivateKey]);
  await amman.addr.addLabel(label, mintPubKey);
  await amman.addr.addLabel(`tx-${label}`, txAddr);
  await connection.confirmTransaction(
    txAddr
  );
  
  return mintPubKey;
};

async function mintTokens(mintPubKey, mintPrivateKey: web3.Keypair, mintToOwnerPubKey, mintToOwnerPrivateKey, amount, label) {
  const mintToAta = await getOrCreateAssociatedTokenAccount(
    connection,
    mintToOwnerPrivateKey,
    mintPubKey,
    mintToOwnerPubKey
  );

  await amman.addr.addLabelIfUnknown(label, mintToAta.address);

  await mintTo(
    connection,
    mintToOwnerPrivateKey,
    mintPubKey,
    mintToAta.address,
    mintPrivateKey,
    amount
  );
}

async function createPandaNFT(wallet) {
  const [_pandaPubKey, pandaPrivateKey] = await amman.genLabeledKeypair('panda')
  await createNFT("panda1", pandaPrivateKey, wallet, "uri")
}

async function createRugNFT() {

}

async function createNFT(
    label: string,
    nftMintKeypair: web3.Keypair,
    wallet: web3.Keypair,
    uri: string = "",
): Promise<[web3.PublicKey, web3.PublicKey]> {
  console.log("create mint")
  let nftMint = await createMint(
      [wallet.publicKey, wallet],
      [nftMintKeypair.publicKey, nftMintKeypair],
      0,
      `${label}-nft-mint`
  );

  console.log("ata")
  let nftTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      nftMint,
      wallet.publicKey,
  );
  console.log("mintto")
  await mintTo(
      connection,
      wallet,
      nftMint,
      nftTokenAccount.address,
      nftMintKeypair,
      1,
  );

  let createMetadata = new CreateMetadataV2({
      feePayer: wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash('confirmed')).blockhash,
  }, {
      metadata: (await Metadata.getPDA(nftMint)),
      metadataData: new DataV2({
          name: "",
          symbol: "",
          uri: uri,
          sellerFeeBasisPoints: 100,
          creators: [
              new Creator({
                  address: nftMintKeypair.publicKey.toBase58(), 
                  verified: true, 
                  share: 100, 
              })
          ],
          collection: null,
          uses: null,
      }),
      updateAuthority: nftMintKeypair.publicKey,
      mint: nftMint,
      mintAuthority: nftMintKeypair.publicKey,
  });
  console.log("createmeta")
  await connection.confirmTransaction(
      (await SolKitTransaction.sendTransactionWithRetryWithKeypair(
          connection,
          wallet,
          createMetadata.instructions,
          [nftMintKeypair]
      )
  ).txid);

  console.log("createmaster")
  let createMasterEdition = new CreateMasterEditionV3({
      feePayer: wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash('confirmed')).blockhash,
  }, {
      edition: (await getNFTMasterEditionPDA(nftMint))[0],
      metadata: (await Metadata.getPDA(nftMint)),
      mint: nftMint,
      mintAuthority: nftMintKeypair.publicKey,
      updateAuthority: nftMintKeypair.publicKey,
  })
  await connection.confirmTransaction(
      (await SolKitTransaction.sendTransactionWithRetryWithKeypair(
          connection,
          wallet,
          createMasterEdition.instructions,
          [nftMintKeypair]
      )
  ).txid);

  await amman.addr.addLabel(label, nftTokenAccount.address);
  return [nftMint, nftTokenAccount.address];
}

async function main() {
  const [rainPubKey, rainPrivateKey] = await amman.genLabeledKeypair('rain')
  const [rainMintPubKey, rainMintPrivateKey] = await amman.genLabeledKeypair('rain-mint')
  console.log("🪂 rain:", rainPubKey.toBase58())
  await amman.airdrop(connection, rainPubKey, 2)
  console.log("🏦 create rain token mint:", rainMintPubKey.toBase58())
  await createMint([rainPubKey, rainPrivateKey], [rainMintPubKey, rainMintPrivateKey], 5, 'rain-token-mint');

  const [rainSupplyPubKey, rainSupplyPrivateKey] = await amman.genLabeledKeypair('rain-supply')
  console.log("🪂 rain supply:", rainSupplyPubKey.toBase58())
  await amman.airdrop(connection, rainSupplyPubKey, 2)
  console.log("🖨  mint rain tokens:", rainSupplyPubKey.toBase58())
  await mintTokens(rainMintPubKey, rainMintPrivateKey, rainSupplyPubKey, rainSupplyPrivateKey, 1_200_000*10e5, 'ata-rain-supply');

  const [pandaHolderPubKey, pandaHolderPrivateKey] = await amman.genLabeledKeypair('panda-holder');
  console.log("🪂 panda-holder:", pandaHolderPubKey.toBase58());
  await amman.airdrop(connection, pandaHolderPubKey, 2);
  console.log("🦝  mint DTP NFT:", pandaHolderPubKey.toBase58());
  await createPandaNFT(pandaHolderPrivateKey);
};

main();