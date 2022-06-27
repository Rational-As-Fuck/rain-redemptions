#!/usr/bin/env ts-node
import { web3 } from "@project-serum/anchor";
import { 
  createMint,
  createInitializeMintInstruction,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";

import { newMint } from './utils';

import { CONSTANTS } from "trash-with-frens";
import { Connection } from "@raindrops-protocol/sol-kit";
import { Wallet, CLI } from "@raindrops-protocol/sol-command";

CLI.programCommand("new")
  .action(async (_args: string[], cmd) => {
    const { keypair, env, rpcUrl } =
      cmd.opts();

    const wallet = await Wallet.loadWalletKey(keypair);
    const connection = new web3.Connection(rpcUrl || Connection.getCluster(env));
    const mint = await newMint(wallet, wallet.publicKey, wallet.publicKey, connection);
    console.log(mint.toBase58());
  });

const createMintAccountArgs = [
  new CLI.Argument("<pubkey>", "The pubkey to use for the new mint").argParser((arg) => new web3.PublicKey(arg)),
];
CLI.programCommandWithArgs("new_mint_from_pubkey", createMintAccountArgs, async (pubkey, options, _cmd) => {
  const { keypair, env, rpcUrl } = options

  const wallet = await Wallet.loadWalletKey(keypair);
  const connection = new web3.Connection(rpcUrl || Connection.getCluster(env));

  let tx = new web3.Transaction().add(
    // create mint account
    web3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: pubkey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    // init mint account
    createInitializeMintInstruction(
      pubkey, // mint pubkey
      9, // decimals
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
    )
  );
  console.log(`txhash: ${await connection.sendTransaction(tx, [wallet])}`);
});


CLI.programCommand("new_nft_mint")
  .action(async (_args: string[], cmd) => {
    const { keypair, env, rpcUrl } =
      cmd.opts();

    const wallet = await Wallet.loadWalletKey(keypair);
    const connection = new web3.Connection(rpcUrl || Connection.getCluster(env));

    const mintKeyPair = web3.Keypair.generate();
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      0,
      mintKeyPair,
      null,
      CONSTANTS.PROGRAM_IDS.TOKEN_PROGRAM_ID,
    );
    console.log(mint.toBase58());
  });

const createTokenAccountArgs = [
  new CLI.Argument("<mint>", "The token mint to be associated with the token account.").argParser((arg) => new web3.PublicKey(arg)),
  new CLI.Argument("<tokenAccountOwner>", "The account to own the token account.").argParser((arg) => new web3.PublicKey(arg)),
  new CLI.Argument("[isTokenOwnerPDA]", "Bool to specify if token account owner is a PDA").default(false),
];
CLI.programCommandWithArgs("create_token_account", createTokenAccountArgs, async (mint, tokenAccountOwner, isTokenOwnerPDA, options, _cmd) => {
    const { keypair, env, rpcUrl } = options;
      
    const wallet = await Wallet.loadWalletKey(keypair);
    const connection = new web3.Connection(rpcUrl || Connection.getCluster(env));

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      tokenAccountOwner,
      isTokenOwnerPDA,
    );

    console.log(`Created ${isTokenOwnerPDA ? "PDA owned" : ""} token account ${tokenAccount.address.toBase58()} for mint ${mint.toBase58()} with owner ${tokenAccountOwner.toBase58()}`);
});

const mintTokensArgs = [
  new CLI.Argument("<mint>", "The token mint to mint from.").argParser((arg) => new web3.PublicKey(arg)),
  new CLI.Argument("<tokenAmount>", "The amount of tokens to mint.").default(1).argParser(parseFloat),
  new CLI.Argument("<tokenAccountOwner>", "The owner of the account to mint the tokens to.").argParser((arg) => new web3.PublicKey(arg)),
  new CLI.Argument("[isTokenOwnerPDA]", "Bool to specify if token account owner is a PDA").default(false),
];
CLI.programCommandWithArgs("mint_tokens", mintTokensArgs, async (mint, tokenAmount, tokenAccountOwner, isTokenOwnerPDA, options, _cmd) => {
    const { keypair, env, rpcUrl } = options;
      
    const wallet = await Wallet.loadWalletKey(keypair);
    const connection = new web3.Connection(rpcUrl || Connection.getCluster(env));

    const mintToTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      tokenAccountOwner,
      isTokenOwnerPDA,
    );

    const transactionSignature = await mintTo(
      connection,
      wallet,
      mint,
      mintToTokenAccount.address,
      wallet,
      tokenAmount,
      undefined,
      undefined,
      CONSTANTS.PROGRAM_IDS.TOKEN_PROGRAM_ID,
    );

    console.log(`Minted ${tokenAmount} tokens from ${mint.toBase58()} to ${isTokenOwnerPDA ? "PDA owned" : "" } token account ${mintToTokenAccount.address.toBase58()}`);
    console.log(`TXID: ${transactionSignature}`);
});

const tokenBalanceArgs = [
  new CLI.Argument("<tokenAccount>", "The token account to check balance.").argParser((arg) => new web3.PublicKey(arg)),
];
CLI.programCommandWithArgs("token_balance", tokenBalanceArgs, async (tokenAccount, options, _cmd) => {
    const { env, rpcUrl } = options;
      
    const connection = new web3.Connection(rpcUrl || Connection.getCluster(env));

    const tokenAccountInfo = await getAccount(
      connection,
      tokenAccount
    )

    console.log(`Token account ${tokenAccountInfo.address.toBase58()} has ${tokenAccountInfo.amount} tokens`);
}, false);


CLI.Program.parse(process.argv);