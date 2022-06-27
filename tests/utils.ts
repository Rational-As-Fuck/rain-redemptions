import * as anchor from "@project-serum/anchor";
import * as fs from "fs";
import { web3 } from "@project-serum/anchor";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  createInitializeMintInstruction,
  TokenAccount,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
// } from "../node_modules/@solana/spl-token";
} from "../node_modules/@solana/spl-token/lib/cjs";
import { Transaction } from "@raindrops-protocol/sol-kit";
import { programs as MetaplexPrograms } from '@metaplex/js';
const { metadata: { Metadata, CreateMetadataV2, DataV2, Creator, CreateMasterEditionV3 } } =  MetaplexPrograms;
import { Keypair } from '@solana/web3.js';

import { PDA } from "../app/lib/src/index";
// import { PDA } from "../app/lib/build";

import Connection = anchor.web3.Connection;
import PublicKey = anchor.web3.PublicKey;
import BN = anchor.BN;

export function loadWalletKey(keypair): web3.Keypair {
  if (!keypair || keypair == "") {
    throw new Error("Keypair is required!");
  }

  const loaded = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString()))
  );
  return loaded;
}

export { mintTo, getOrCreateAssociatedTokenAccount, getAccount } from "../node_modules/@solana/spl-token/lib/cjs";

export const mintToKeypair = async (connection: Connection, mint: [PublicKey, Keypair], receiver: Keypair, amount: number): Promise<TokenAccount> => {
  const [mintPublicKey, mintKeypair] = mint;

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    receiver,
    mintPublicKey,
    receiver.publicKey,
  );

  await mintTo(
    connection,
    receiver,
    mintPublicKey,
    tokenAccount.address,
    mintKeypair,
    amount,
  );

  return tokenAccount;
}

export async function newMint(wallet, mintAuthority, freezeAuthority, connection, decimals = 9) {
  return await createMint(
    connection,
    wallet,
    mintAuthority,
    freezeAuthority,
    decimals
  );
};

export async function airdrop(
    connection: anchor.web3.Connection,
    publicKey: anchor.web3.PublicKey
) {
    return connection.confirmTransaction(
        await connection.requestAirdrop(publicKey, 2e9)
    );
}

export async function newNFTMintPredefinedPubkey(
    connection: anchor.web3.Connection,
    nftMintPredefinedKeyPair: anchor.web3.Keypair,
    nftMintKeypair: anchor.web3.Keypair,
): Promise<void> {
    let tx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: nftMintKeypair.publicKey,
            newAccountPubkey: nftMintPredefinedKeyPair.publicKey,
            space: MINT_SIZE,
            lamports: await getMinimumBalanceForRentExemptMint(connection),
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            nftMintPredefinedKeyPair.publicKey,
            0,
            nftMintKeypair.publicKey,
            nftMintKeypair.publicKey,
        )
    );

    await connection.confirmTransaction(
        await connection.sendTransaction(tx, [nftMintKeypair, nftMintPredefinedKeyPair])
    );
}

export async function createNFT(
    connection: anchor.web3.Connection,
    nftMintKeypair: anchor.web3.Keypair,
    wallet: anchor.web3.PublicKey,
    uri: string = "",
    predefinedMintKeyPair: anchor.web3.Keypair = null,
): Promise<[anchor.web3.PublicKey, anchor.web3.PublicKey]> {
    let nftMint = predefinedMintKeyPair?.publicKey;
    let nftTokenAccount;
    if (predefinedMintKeyPair) {
        await newNFTMintPredefinedPubkey(
            connection,
            predefinedMintKeyPair,
            nftMintKeypair,
        );
    } else {
        nftMint = await newMint(
            nftMintKeypair,
            nftMintKeypair.publicKey,
            nftMintKeypair.publicKey,
            connection,
            0,
        );
    }

    nftTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        nftMintKeypair,
        nftMint,
        wallet,
    );
    await mintTo(
        connection,
        nftMintKeypair,
        nftMint,
        nftTokenAccount.address,
        nftMintKeypair,
        1,
    );

    let createMetadata = new CreateMetadataV2({
        feePayer: nftMintKeypair.publicKey,
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
    await connection.confirmTransaction(
        (await Transaction.sendTransactionWithRetryWithKeypair(
            connection,
            nftMintKeypair,
            createMetadata.instructions,
            [nftMintKeypair]
        )
    ).txid);

    let createMasterEdition = new CreateMasterEditionV3({
        feePayer: nftMintKeypair.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash('confirmed')).blockhash,
    }, {
        edition: (await PDA.Redemption.getNFTMasterEditionPDA(nftMint))[0],
        metadata: (await Metadata.getPDA(nftMint)),
        mint: nftMint,
        mintAuthority: nftMintKeypair.publicKey,
        updateAuthority: nftMintKeypair.publicKey,
    })
    await connection.confirmTransaction(
        (await Transaction.sendTransactionWithRetryWithKeypair(
            connection,
            nftMintKeypair,
            createMasterEdition.instructions,
            [nftMintKeypair]
        )
    ).txid);

    return [nftMint, nftTokenAccount.address];
}