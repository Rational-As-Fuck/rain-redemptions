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

import { Redemption, PDA } from '@raindrops-protocol/rain-redemptions';
import { Connection as SolKitConnection } from "@raindrops-protocol/sol-kit";

const { Clusters } = SolKitConnection;
const { Connection, Transaction, SystemProgram } = web3;

const amman = Amman.instance()
const connection = new Connection(LOCALHOST)

async function createMint([mintPubKey, mintPrivateKey], [payerPubKey, payerPrivateKey]: [any, web3.Keypair], decimals, label) {
  if (await connection.getBalance(mintPubKey) > 0) {
    console.log(`Mint ${mintPubKey.toString()} is already created, skipping...`);
    return mintPubKey;
  }
  
  // console.log(`fromPubkey: ${payerPubKey.toString()}`)
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
    mintPubKey,
    mintPrivateKey: web3.Keypair,
    mintToOwnerPubKey,
    mintToOwnerPrivateKey,
    amount,
    label
  ) {
  // console.log("Getting token account for mint", mintPubKey.toString(), mintToOwnerPubKey.toString())
  const mintToAta = await getOrCreateAssociatedTokenAccount(
    connection,
    mintToOwnerPrivateKey,
    mintPubKey,
    mintToOwnerPubKey
  );

  await amman.addr.addLabel(label, mintToAta.address);

  // console.log(`Minting tokens to ata ${mintToAta.address.toString()}`);
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

function buildDeployRedemption() {
  console.log("👷‍♂️ Building Redemption program");
  execSync('anchor build');
  console.log("👷‍♂️ Uploading Redemption program");
  execSync('anchor deploy');
  // I have no idea why, but I have issues when the very first deploy of an idl is done, it doesn't actually upload properly, so, run it again.
  console.log("👷‍♂️ Uploading Redemption contract IDLs");
  execSync('anchor idl init --provider.cluster localnet -f target/idl/redemption_v0.json tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP');
  execSync('anchor idl init --provider.cluster localnet -f target/idl/redemption_v0.json tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP');
  execSync('anchor idl upgrade --provider.cluster localnet -f target/idl/redemption_v0.json tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP');
  execSync('anchor idl upgrade --provider.cluster localnet -f target/idl/redemption_v0.json tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP');
}

async function initializeRedemption(redemptionAuthorityPublicKey, redemptionAuthorityKeyPair, rainTokenMintPubKey) {
  console.log("👷‍♂️ Initializing Redemption Program");
  const redemptionProgram = await Redemption.getProgramWithWalletKeyPair(
    Redemption,
    redemptionAuthorityKeyPair,
    Clusters.Localnet,
  );
  try {
    await redemptionProgram.initialize({
      updateAuthority: redemptionAuthorityPublicKey,
      rainMint: rainTokenMintPubKey,
      redemptionMultiplier: 0,
    }, {
      rainMint: rainTokenMintPubKey,
    });
  } catch (error) {
    console.log("⚠️ There was an exception initializing the redemption program. Maybe it was already initialized. Continuing, if you have errors later, this might have been the problem");
    console.log(`⚠️ ${error}`);
  }
  
  return redemptionProgram;
}

async function main() {
  const rainAmount = 1_200_000e5;
  const rainMintAmount = rainAmount;//1_200_000;
  const redemptionAuthority = await amman.loadOrGenKeypair('redemption-authority');
  const [redemptionAuthorityPublicKey, redemptionAuthorityKeyPair] = redemptionAuthority;
  console.log("🪂 redemptionAuthority:", redemptionAuthorityPublicKey.toString());
  await amman.airdrop(connection, redemptionAuthorityPublicKey, 2);

  const [rainPubKey, rainPrivateKey] = await amman.loadOrGenKeypair('rain');
  console.log("🪂 rain:", rainPubKey.toString());
  await amman.airdrop(connection, rainPubKey, 2);

  const [rainMintPubKey, rainMintPrivateKey] = await amman.loadOrGenKeypair('rain-mint');
  // console.log("🪂 rain mint:", rainMintPubKey.toString());
  // await amman.airdrop(connection, rainMintPubKey, 2);

  console.log("🏦 create rain mint:", rainMintPubKey.toString());
  await createMint(
    [rainMintPubKey, rainMintPrivateKey],
    [rainPubKey, rainPrivateKey],
    5,
    'create-rain-mint'
  );
  // const rainTokenMintPubKey = new web3.PublicKey(amman.addr.resolveLabel("rain-token-mint")[0]);
  // console.log("rain-token-mint", rainTokenMintPubKey.toString());

  console.log("🖨  mint rain tokens to owner:", rainPubKey.toString());
  const rainSupplyAtaPubKey = await mintTokens(
    rainMintPubKey,
    rainPrivateKey,
    // rainMintPrivateKey,
    rainPubKey,
    rainPrivateKey,
    rainMintAmount,
    'ata-rain-supply'
  );
  // const rainSupplyAtaPubKey = new web3.PublicKey(amman.addr.resolveLabel('ata-rain-supply').pop());
  // console.log("ata-rain-supply", amman.addr.resolveLabel("ata-rain-supply"))

  buildDeployRedemption();
  const redemptionProgram = await initializeRedemption(redemptionAuthorityPublicKey, redemptionAuthorityKeyPair, rainMintPubKey);
  // const redemptionProgram = await Redemption.getProgramWithWalletKeyPair(
  //   Redemption,
  //   redemptionAuthorityKeyPair,
  //   Clusters.Localnet,
  // );

  console.log("Sleeping to ensure redemption configured");
  await new Promise(resolve => setTimeout(resolve, 30_000));

  const rainRedemptionTreasury = (await PDA.Redemption.getRainVaultPDA())[0];
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

  console.log("🟢 Enabling Redemption Program Rain Treasury")
  await redemptionProgram.enableTreasury({
    updateAuthority: redemptionAuthorityKeyPair
  });
};

main();