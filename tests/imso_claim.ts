import assert from 'assert';
import * as anchor from "@project-serum/anchor";
import { Program } from '@raindrop-studios/sol-kit';

import { Redemption, PDA } from "../app/lib/src/index";
import { NFTSetRedemptionStateStatus } from '../app/lib/src/state/redemption';
import { newMint } from '../app/cli/src/cli/utils';

import { airdrop, createNFT, loadWalletKey, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from './utils';
const idl = JSON.parse(
  require("fs").readFileSync("./target/idl/imso_claim.json", "utf8")
);

const REDEMPTION_MULTIPLIER = 96.166791;

describe("imso_claim", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const config: Program.ProgramConfig = {
    asyncSigning: false,
    provider: anchor.getProvider() as anchor.AnchorProvider,
    idl
  };

  let redemptionProgram: Redemption;
  let wallet, connection;

  const redemptionUpdateAuthority = anchor.web3.Keypair.generate();
  const rainMintKeypair = anchor.web3.Keypair.generate();
  const pandasMintKeypair = loadWalletKey("./keypairs/pandas.json");
  const redeemer = anchor.web3.Keypair.generate();
  let rainMintPubkey;
  let redeemerRainTokenAccount;

  before(async () => {
    redemptionProgram = await Redemption.getProgramWithConfig(
      Redemption,
      config,
    );
    ({ wallet, connection } = (redemptionProgram.client.provider as anchor.AnchorProvider));

    await airdrop(connection, rainMintKeypair.publicKey);
    await airdrop(connection, redeemer.publicKey);
    await airdrop(connection, pandasMintKeypair.publicKey);
    rainMintPubkey = await newMint(
      rainMintKeypair,
      rainMintKeypair.publicKey,
      rainMintKeypair.publicKey,
      connection
    );

    redeemerRainTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      rainMintKeypair,
      rainMintPubkey,
      wallet.publicKey,
    );

    await redemptionProgram.initialize({
      updateAuthority: redemptionUpdateAuthority.publicKey,
      redemptionMultiplier: 0, // Use the default in contract
    }, {
      rainMint: rainMintPubkey
    }, { commitment: "finalized", timeout:30_000 });
    const treasury = await redemptionProgram.fetchTreasury();
  });

  it("initialize", async () => {
    const treasury = await redemptionProgram.fetchTreasury();
    const [treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
    const [rainVaultPDA, _rainVaultbump] = await PDA.Redemption.getRainVaultPDA();

    assert.ok(treasury.key.equals(treasuryPDA));
    assert.ok(treasury.updateAuthority.equals(redemptionUpdateAuthority.publicKey));
    assert.equal(treasury.redemptionMultiplier, REDEMPTION_MULTIPLIER);
    assert.ok(treasury.rainVault.equals(rainVaultPDA));
    assert.ok(treasury.rainMint.equals(rainMintPubkey));
    assert.equal(treasury.bump, treasuryBump);
    assert.equal(treasury.enabled, false);
  });

  describe("rain redemption", async () => {
    before(async () => {
      await redemptionProgram.enableTreasury({
        updateAuthority: redemptionUpdateAuthority,
      });

      const [rainVaultPDA, _rainVaultbump] = await PDA.Redemption.getRainVaultPDA();

      await mintTo(
        connection,
        redeemer,
        rainMintPubkey,
        rainVaultPDA,
        rainMintKeypair,
        100_000_000_000,
      );
    });

    it("disableTreasury stops redemption", async () => {
      await redemptionProgram.disableTreasury({
        updateAuthority: redemptionUpdateAuthority,
      });
      const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
      const [nftMint, nftTokenAccount] = await createNFT(connection, pandasMintKeypair, wallet.publicKey);

      await assert.rejects(() => {
        return redemptionProgram.redeemPandaOwnershipRainTokens({
          treasuryBump: treasuryBump,
        }, {
          nftMint,
          nftTokenAccount: nftTokenAccount,
          destRainTokenAccount: redeemerRainTokenAccount.address,
        });
      }, "Was able to redeem with treasury disabled");

      await redemptionProgram.enableTreasury({
        updateAuthority: redemptionUpdateAuthority,
      });
    });

    it("is nft redeemed", async () => {
      const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
      const [nftMint, nftTokenAccount] = await createNFT(connection, pandasMintKeypair, wallet.publicKey);

      assert.ok(!(await redemptionProgram.isNFTRedeemed(nftMint)));

      const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
      await redemptionProgram.redeemPandaOwnershipRainTokens({
        treasuryBump: treasuryBump,
      }, {
        nftMint,
        nftTokenAccount: nftTokenAccount,
        destRainTokenAccount: redeemerRainTokenAccount.address,
      }, { commitment:"finalized", timeout:30_000 });

      assert.ok(await redemptionProgram.isNFTRedeemed(nftMint));
    });

    describe("redeem_panda", () => {
      it("redeemPandaOwnershipRainTokens twice errors", async () => {
        const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
        const [nftMint, nftTokenAccount] = await createNFT(connection, pandasMintKeypair, wallet.publicKey);
  
        await redemptionProgram.redeemPandaOwnershipRainTokens({
          treasuryBump: treasuryBump,
        }, {
          nftMint,
          nftTokenAccount: nftTokenAccount,
          destRainTokenAccount: redeemerRainTokenAccount.address,
        });
  
        await assert.rejects(() => {
          return redemptionProgram.redeemPandaOwnershipRainTokens({
            treasuryBump: treasuryBump,
          }, {
            nftMint,
            nftTokenAccount: nftTokenAccount,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          });
        }, "Was able to redeem twice");
      });

      describe("panda", () => {
        it("redeemPandaOwnershipRainTokens noXALT", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(connection, pandasMintKeypair, wallet.publicKey);
    
          const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          await redemptionProgram.redeemPandaOwnershipRainTokens({
            treasuryBump: treasuryBump,
          }, {
            nftMint,
            nftTokenAccount: nftTokenAccount,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          });
    
          const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 2885003);
        });
      });
    });
  });
});
