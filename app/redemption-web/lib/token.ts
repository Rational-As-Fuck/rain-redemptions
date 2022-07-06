import * as Web3 from '@solana/web3.js';
import {
  // AccountLayout,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,

} from "@solana/spl-token";
import { AnchorProvider } from '@project-serum/anchor';

import { Redemption } from "@raindrops-protocol/rain-redemptions";

// import { RAIN_MINT } from './constants';

export const getOrCreateAssociatedTokenAccount = async (program: Redemption, mint: Web3.PublicKey) => {
  const associatedTokenAddress = await getAssociatedTokenAddress(
    mint,
    (program.client.provider as AnchorProvider).wallet.publicKey
  );

  let accountInfo;
  if (associatedTokenAddress) {
    accountInfo = await program.client.provider.connection.getAccountInfo(associatedTokenAddress);
  }

  if (accountInfo) {
    console.log(`Rain token account already exists ${associatedTokenAddress}`)
    return { address: associatedTokenAddress, account: accountInfo };
  }

  let createInstruction = createAssociatedTokenAccountInstruction(
    (program.client.provider as AnchorProvider).wallet.publicKey,
    associatedTokenAddress,
    (program.client.provider as AnchorProvider).wallet.publicKey,
    mint,
  );

  const latestBlockhashAndContext = await program.client.provider.connection.getLatestBlockhashAndContext();

  console.log((program.client.provider as AnchorProvider).wallet.publicKey.toBase58());
  let tx = new Web3.Transaction();
  tx.add(createInstruction);
  tx.feePayer = (program.client.provider as AnchorProvider).wallet.publicKey;
  tx.recentBlockhash = latestBlockhashAndContext.value.blockhash;
  console.log("Recent blockhash is: " + tx.recentBlockhash);
  tx = await (program.client.provider as AnchorProvider).wallet.signTransaction(tx);
  
  let txsig = await program.client.provider.connection.sendRawTransaction(tx.serialize());
  console.log("Submitted transaction " + txsig + ", awaiting confirmation");
  await program.client.provider.connection.confirmTransaction(txsig);
  console.log("Transaction " + txsig + " confirmed");
  // console.log(await (program.program.provider.wallet as WebWallet).sendTransaction(
  //   tx,
  //   program.program.provider.connection
  // ));
};
