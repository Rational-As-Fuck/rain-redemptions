import { execSync } from 'child_process';
import { LOCALHOST } from '@metaplex-foundation/amman';
import { Amman } from '@metaplex-foundation/amman-client';
import {
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  transferChecked,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
} from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import {
  CLI,
} from '@raindrop-studios/sol-command';

import {PDA, IMSOClaim } from '../app/lib/src';

//import { IMSOClient, PDA } from '../app/lib/src';
import { Connection as SolKitConnection } from "@raindrop-studios/sol-kit";

const { Clusters } = SolKitConnection;
const { Connection, Transaction, SystemProgram } = web3;

const rainAmount = 1_200_000e5;

async function createMint(
    connection,
    amman,
    [mintPubKey, mintPrivateKey]: [web3.PublicKey, web3.Keypair],
    [payerPubKey, payerPrivateKey]: [web3.PublicKey, web3.Keypair],
    decimals,
    label
  ) {
  if (await connection.getBalance(mintPubKey) > 0) {
    console.log(`Mint ${mintPubKey.toString()} is already created, skipping...`);
    return mintPubKey;
  }
  
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
      payerPubKey, // mint authority
      null, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
    )
  );

  const txAddr = await connection.sendTransaction(tx, [payerPrivateKey, mintPrivateKey]);
  await connection.confirmTransaction(
    txAddr
  );
  await amman.addr.addLabel(`tx-${label}`, txAddr);
  
  return mintPubKey;
};

async function mintTokens(
    connection,
    amman,
    mintPubKey,
    mintPrivateKey: web3.Keypair,
    mintToOwnerPubKey,
    mintToOwnerPrivateKey,
    amount,
    label
  ) {
  const mintToAta = await getOrCreateAssociatedTokenAccount(
    connection,
    mintToOwnerPrivateKey,
    mintPubKey,
    mintToOwnerPubKey
  );

  await amman.addr.addLabel(label, mintToAta.address);

  await mintToChecked(
    connection,
    mintPrivateKey,
    mintPubKey,
    mintToAta.address,
    mintPrivateKey,
    amount,
    5
  );
  return mintToAta.address;
}

CLI.programCommandWithArgs("deploy", [], async () => {
  console.log("👷‍♂️ Building the IMSOClient program");
  execSync('anchor build');
  console.log("👷‍♂️ Uploading the IMSOClient program");
  execSync('anchor deploy --provider.wallet ../keypairs/imsoClaim/imRDfkDNhnaT5nbVZKLD5jjQQ5WZzedqxZtB2X6hUFW.json');
  console.log("🎉 You can now call `idl`");
}, false);

CLI.programCommandWithArgs("idl", [], async () => {
  console.log("👷‍♂️ Uploading Redemption contract IDLs");
  execSync('anchor idl init --provider.cluster localnet -f target/idl/imso_claim.json CgWrLM8UqxNvaHUKVfVFjW7XSiQNYP4qyk9SoCbfcXPP', { stdio: "ignore" });
  execSync('anchor idl upgrade --provider.cluster localnet -f target/idl/imso_claim.json CgWrLM8UqxNvaHUKVfVFjW7XSiQNYP4qyk9SoCbfcXPP', { stdio: "ignore" });
  console.log("🎉 You can now call `initialize`");
}, false);

CLI.programCommandWithArgs("initialize", [], async () => {
  const connection = new Connection(LOCALHOST);
  const amman = Amman.instance();
  const redemptionAuthority = await amman.loadOrGenKeypair('redemption-authority');
  const [redemptionAuthorityPublicKey, redemptionAuthorityKeyPair] = redemptionAuthority;
  console.log("🪂 redemptionAuthority:", redemptionAuthorityPublicKey.toString());
  await amman.airdrop(connection, redemptionAuthorityPublicKey, 2);

  const [rainPubKey, rainPrivateKey] = await amman.loadOrGenKeypair('rain');
  console.log("🪂 rain:", rainPubKey.toString());
  await amman.airdrop(connection, rainPubKey, 2);

  const [rainMintPubKey, rainMintPrivateKey] = await amman.loadOrGenKeypair('rain-mint');
  console.log("🏦 create rain mint:", rainMintPubKey.toString());
  await createMint(
    connection,
    amman,
    [rainMintPubKey, rainMintPrivateKey],
    [rainPubKey, rainPrivateKey],
    5,
    'create-rain-mint'
  );

  try {
    console.log("👷‍♂️ Initializing Redemption Program");
    const redemptionProgram = await IMSOClaim.getProgramWithWalletKeyPair(
      IMSOClaim,
      redemptionAuthorityKeyPair,
      Clusters.Localnet,
    );
    await redemptionProgram.initialize({
      updateAuthority: redemptionAuthorityPublicKey,
      rainMint: rainMintPubKey,
      redemptionMultiplier: 0,
    }, {
      rainMint: rainMintPubKey,
    });
  } catch (error) {
    console.log("⚠️ There was an exception initializing the redemption program. Maybe it was already initialized.");
    console.log(`⚠️ ${error}`);
  }
  console.log("🎉 You can now call `fill`")
}, false);

CLI.programCommandWithArgs("fill", [], async () => {
  const connection = new Connection(LOCALHOST);
  const amman = Amman.instance();
  const redemptionAuthority = await amman.loadKeypair('redemption-authority');
  const [rainPubKey, rainPrivateKey] = await amman.loadKeypair('rain');
  const [rainMintPubKey, _] = await amman.loadKeypair('rain-mint');

  console.log("🖨  mint rain tokens to owner:", rainPubKey.toString());
  const rainSupplyAtaPubKey = await mintTokens(
    connection,
    amman,
    rainMintPubKey,
    rainPrivateKey,
    rainPubKey,
    rainPrivateKey,
    rainAmount,
    'ata-rain-supply'
  );
  const rainRedemptionTreasury = (await PDA.IMSOClaim.getRainVaultPDA())[0];
  console.log(`💸 Transferring ${rainAmount} $RAIN to redemption treasury ${rainRedemptionTreasury.toString()} from rain supply ${rainSupplyAtaPubKey.toString()}`);
  await transferChecked(
    connection,
    rainPrivateKey,
    rainSupplyAtaPubKey,
    rainMintPubKey,
    rainRedemptionTreasury,
    rainPrivateKey,
    rainAmount,
    5
  );
  console.log("🎉 You can now call `enable`")
}, false);

CLI.programCommandWithArgs("enable", [], async () => {
  const connection = new Connection(LOCALHOST);
  const amman = Amman.instance();
  const redemptionAuthority = await amman.loadKeypair('redemption-authority');
  const [_, redemptionAuthorityKeyPair] = redemptionAuthority;
  const redemptionProgram = await IMSOClaim.getProgramWithWalletKeyPair(
    IMSOClaim,
    redemptionAuthorityKeyPair,
    Clusters.Localnet,
  );
  console.log("🟢 Enabling Redemption Program Rain Treasury")
  await redemptionProgram.enableTreasury({
    updateAuthority: redemptionAuthorityKeyPair
  });
  console.log("🎉 You can now start redeeming")
}, false);

CLI.Program.parseAsync(process.argv);
