import assert from 'assert';
import * as anchor from "@project-serum/anchor";
import { Program } from '@raindrop-studios/sol-kit';

import { Redemption, PDA } from "../app/lib/src/index";
import { NFTSetRedemptionStateStatus } from '../app/lib/src/state/redemption';
import { newMint } from '../app/cli/src/cli/utils';

import { airdrop, createNFT, loadWalletKey, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from './utils';
const idl = JSON.parse(
  require("fs").readFileSync("./target/idl/redemption_v0.json", "utf8")
);

const REDEMPTION_MULTIPLIER = 96.166791;

describe("redemptionV0", () => {
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
  const pandasXALTMintKeypair = loadWalletKey("./keypairs/pandasXALT.json");
  const pandasXALT2MintKeypair = loadWalletKey("./keypairs/pandasXALT2.json");
  const rugsMintKeypair = loadWalletKey("./keypairs/rugs.json");
  const rugsMintKeypairInvalid = anchor.web3.Keypair.generate();
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
    await airdrop(connection, rugsMintKeypair.publicKey);
    await airdrop(connection, rugsMintKeypairInvalid.publicKey);
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

      describe("panda_xalt", () => {
        it("redeemPandaOwnershipRainTokens XALT1", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(connection, pandasMintKeypair, wallet.publicKey, "", pandasXALTMintKeypair);
    
          const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          await redemptionProgram.redeemPandaOwnershipRainTokens({
            treasuryBump: treasuryBump,
          }, {
            nftMint,
            nftTokenAccount: nftTokenAccount,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          });
    
          const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 3846671);
        });
    
        it("redeemPandaOwnershipRainTokens XALT2", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(connection, pandasMintKeypair, wallet.publicKey, "", pandasXALT2MintKeypair);
    
          const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          await redemptionProgram.redeemPandaOwnershipRainTokens({
            treasuryBump: treasuryBump,
          }, {
            nftMint,
            nftTokenAccount: nftTokenAccount,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          });
    
          const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 5770007);
        });
      });
    })

    describe("redeem_rug", () => {
      describe("single_rug", () => {
        it("redeemRugOwnershipRainTokens lv1", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
          );

          const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          await redemptionProgram.redeemRugOwnershipRainTokens({
            treasuryBump: treasuryBump,
          }, {
            nftMint,
            nftTokenAccount: nftTokenAccount,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          });
          const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 4808339);
        });

        it("redeemRugOwnershipRainTokens lv2", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ"
          );

          const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          await redemptionProgram.redeemRugOwnershipRainTokens({
            treasuryBump: treasuryBump,
          }, {
            nftMint,
            nftTokenAccount: nftTokenAccount,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          });
          const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
          assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 14425018);
        });

        it("redeemRugOwnershipRainTokens invalid uri", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/"
          );

          await assert.rejects(redemptionProgram.redeemRugOwnershipRainTokens({
              treasuryBump: treasuryBump,
            }, {
              nftMint,
              nftTokenAccount: nftTokenAccount,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            })
          );
        });

        it("redeemRugOwnershipRainTokens invalid creator", async () => {
          const [_treasuryPDA, treasuryBump] = await PDA.Redemption.getTreasuryPDA();
          const [nftMint, nftTokenAccount] = await createNFT(
            connection,
            rugsMintKeypairInvalid,
            wallet.publicKey,
            "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
          );

          await assert.rejects(redemptionProgram.redeemRugOwnershipRainTokens({
              treasuryBump: treasuryBump,
            }, {
              nftMint,
              nftTokenAccount: nftTokenAccount,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            })
          );
        });
      });

      describe("rug_set", () => {
        it("is rug set nft redeemed", async () => {
          const [nftMint1, nftTokenAccount1] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
          );
          const [nftMint2, nftTokenAccount2] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ"
          );
          const [nftMint3, nftTokenAccount3] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys"
          );
          const [nftMint4, nftTokenAccount4] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0"
          );
          const [nftMint5, nftTokenAccount5] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM"
          );
          const [nftMint6, nftTokenAccount6] = await createNFT(
            connection,
            rugsMintKeypair,
            wallet.publicKey,
            "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4"
          );
    
          assert.ok(!(await redemptionProgram.isRugSetNFTRedeemed(nftMint1)));
    
          await redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
            nftMint1,
            nftTokenAccount1,
            nftMint2,
            nftTokenAccount2,
            nftMint3,
            nftTokenAccount3,
            nftMint4,
            nftTokenAccount4,
            nftMint5,
            nftTokenAccount5,
            nftMint6,
            nftTokenAccount6,
            destRainTokenAccount: redeemerRainTokenAccount.address,
          }, { commitment:"finalized", timeout:30_000 });
    
          assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint1));
        });

        describe("rug_set_single_transaction", () => {
          it("redeemRugSetOwnershipRainTokens", async function () {
            const [nftMint1, nftTokenAccount1] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
            );
            const [nftMint2, nftTokenAccount2] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ"
            );
            const [nftMint3, nftTokenAccount3] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys"
            );
            const [nftMint4, nftTokenAccount4] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0"
            );
            const [nftMint5, nftTokenAccount5] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM"
            );
            const [nftMint6, nftTokenAccount6] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4"
            );

            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            await redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            });
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 240416977);
          });

          it("redeemRugSetOwnershipRainTokens duplicate", async function () {
            this.timeout(60000);

            const [nftMint1, nftTokenAccount1] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
            );
            const [nftMint2, nftTokenAccount2] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
            );
            const [nftMint3, nftTokenAccount3] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys"
            );
            const [nftMint4, nftTokenAccount4] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0"
            );
            const [nftMint5, nftTokenAccount5] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM"
            );
            const [nftMint6, nftTokenAccount6] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4"
            );

            await assert.rejects(redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
                nftMint1,
                nftTokenAccount1,
                nftMint2,
                nftTokenAccount2,
                nftMint3,
                nftTokenAccount3,
                nftMint4,
                nftTokenAccount4,
                nftMint5,
                nftTokenAccount5,
                nftMint6,
                nftTokenAccount6,
                destRainTokenAccount: redeemerRainTokenAccount.address,
              })
            );
          });

          it("redeemRugSetOwnershipRainTokens rug already redeemed with another set", async function () {
            this.timeout(60000);

            let [nftMint1, nftTokenAccount1] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
            );
            const [nftMint2, nftTokenAccount2] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ"
            );
            const [nftMint3, nftTokenAccount3] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys"
            );
            const [nftMint4, nftTokenAccount4] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0"
            );
            const [nftMint5, nftTokenAccount5] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM"
            );
            const [nftMint6, nftTokenAccount6] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4"
            );

            await redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            });

            [nftMint1, nftTokenAccount1] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
            );

            await assert.rejects(redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
                nftMint1,
                nftTokenAccount1,
                nftMint2,
                nftTokenAccount2,
                nftMint3,
                nftTokenAccount3,
                nftMint4,
                nftTokenAccount4,
                nftMint5,
                nftTokenAccount5,
                nftMint6,
                nftTokenAccount6,
                destRainTokenAccount: redeemerRainTokenAccount.address,
              })
            );
          });
        });

        describe("rug_set_multiple_transaction", () => {
          let nftMint1: anchor.web3.PublicKey,
            nftTokenAccount1: anchor.web3.PublicKey,
            nftMint2: anchor.web3.PublicKey,
            nftTokenAccount2: anchor.web3.PublicKey,
            nftMint3: anchor.web3.PublicKey,
            nftTokenAccount3: anchor.web3.PublicKey,
            nftMint4: anchor.web3.PublicKey,
            nftTokenAccount4: anchor.web3.PublicKey,
            nftMint5: anchor.web3.PublicKey,
            nftTokenAccount5: anchor.web3.PublicKey,
            nftMint6: anchor.web3.PublicKey,
            nftTokenAccount6: anchor.web3.PublicKey;
          before(async () => {
            [nftMint1, nftTokenAccount1] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
            );
            [nftMint2, nftTokenAccount2] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ"
            );
            [nftMint3, nftTokenAccount3] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys"
            );
            [nftMint4, nftTokenAccount4] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0"
            );
            [nftMint5, nftTokenAccount5] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM"
            );
            [nftMint6, nftTokenAccount6] = await createNFT(
              connection,
              rugsMintKeypair,
              wallet.publicKey,
              "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4"
            );
          });

          it("redeemMultiTransactionRugSetOwnershipRainTokensFirst", async () => {
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

            await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensFirst({
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
            });
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);
            const nftSetRedeemedState = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedState.status, NFTSetRedemptionStateStatus.VERIFYING);
            // Ensure the first half is verified
            assert.ok(nftSetRedeemedState.nft1.isVerified)
            assert.ok(nftSetRedeemedState.nft1.key.equals(nftMint1))
            assert.ok(nftSetRedeemedState.nft1.tokenKey.equals(nftTokenAccount1))
            assert.ok(nftSetRedeemedState.nft2.isVerified)
            assert.ok(nftSetRedeemedState.nft2.key.equals(nftMint2))
            assert.ok(nftSetRedeemedState.nft2.tokenKey.equals(nftTokenAccount2))
            assert.ok(nftSetRedeemedState.nft3.isVerified)
            assert.ok(nftSetRedeemedState.nft3.key.equals(nftMint3))
            assert.ok(nftSetRedeemedState.nft3.tokenKey.equals(nftTokenAccount3))

            // Ensure the second half is not verified
            assert.ok(!nftSetRedeemedState.nft4.isVerified)
            assert.ok(nftSetRedeemedState.nft4.key.equals(nftMint4))
            assert.ok(nftSetRedeemedState.nft4.tokenKey.equals(nftTokenAccount4))
            assert.ok(!nftSetRedeemedState.nft5.isVerified)
            assert.ok(nftSetRedeemedState.nft5.key.equals(nftMint5))
            assert.ok(nftSetRedeemedState.nft5.tokenKey.equals(nftTokenAccount5))
            assert.ok(!nftSetRedeemedState.nft6.isVerified)
            assert.ok(nftSetRedeemedState.nft6.key.equals(nftMint6))
            assert.ok(nftSetRedeemedState.nft6.tokenKey.equals(nftTokenAccount6))
          });

          it("redeemMultiTransactionRugSetOwnershipRainTokensSecond", async () => {
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

            await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensSecond({
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
            });
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);
            const nftSetRedeemedState = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedState.status, NFTSetRedemptionStateStatus.VERIFIED);
            // Ensure the first half is still verified
            assert.ok(nftSetRedeemedState.nft1.isVerified)
            assert.ok(nftSetRedeemedState.nft1.key.equals(nftMint1))
            assert.ok(nftSetRedeemedState.nft1.tokenKey.equals(nftTokenAccount1))
            assert.ok(nftSetRedeemedState.nft2.isVerified)
            assert.ok(nftSetRedeemedState.nft2.key.equals(nftMint2))
            assert.ok(nftSetRedeemedState.nft2.tokenKey.equals(nftTokenAccount2))
            assert.ok(nftSetRedeemedState.nft3.isVerified)
            assert.ok(nftSetRedeemedState.nft3.key.equals(nftMint3))
            assert.ok(nftSetRedeemedState.nft3.tokenKey.equals(nftTokenAccount3))

            // Ensure the second half is now verified
            assert.ok(nftSetRedeemedState.nft4.isVerified)
            assert.ok(nftSetRedeemedState.nft4.key.equals(nftMint4))
            assert.ok(nftSetRedeemedState.nft4.tokenKey.equals(nftTokenAccount4))
            assert.ok(nftSetRedeemedState.nft5.isVerified)
            assert.ok(nftSetRedeemedState.nft5.key.equals(nftMint5))
            assert.ok(nftSetRedeemedState.nft5.tokenKey.equals(nftTokenAccount5))
            assert.ok(nftSetRedeemedState.nft6.isVerified)
            assert.ok(nftSetRedeemedState.nft6.key.equals(nftMint6))
            assert.ok(nftSetRedeemedState.nft6.tokenKey.equals(nftTokenAccount6))
          });

          it("redeemMultiTransactionRugSetOwnershipRainTokensFinal", async () => {
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

            await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensFinal({
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            });
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount - reedemerRainTokenAccountAmount, 240416977);
            const nftSetRedeemedState = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1, { commitment: "confirmed" });
            assert.equal(nftSetRedeemedState.status, NFTSetRedemptionStateStatus.REDEEMED);

            // Ensure the rugs are now marked as being redeemed in a set
            assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint1, { commitment: "confirmed" }));
            assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint2, { commitment: "confirmed" }));
            assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint3, { commitment: "confirmed" }));
            assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint4, { commitment: "confirmed" }));
            assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint5, { commitment: "confirmed" }));
            assert.ok(await redemptionProgram.isRugSetNFTRedeemed(nftMint6, { commitment: "confirmed" }));
          });

          it("redeemMultiTransactionRugSetOwnershipRainTokensFinal fails after redeemed", async () => {
            const nftSetRedeemedStateBefore = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedStateBefore.status, NFTSetRedemptionStateStatus.REDEEMED);
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

            assert.rejects(async () => await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensFinal({
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            }));

            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);
            const nftSetRedeemedStateAfter = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedStateAfter.status, NFTSetRedemptionStateStatus.REDEEMED);
          });

          it("redeemMultiTransactionRugSetOwnershipRainTokensFirst fails after redeemed", async () => {
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

            const nftSetRedeemedStateBefore = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedStateBefore.status, NFTSetRedemptionStateStatus.REDEEMED);

            assert.rejects(async () => await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensFirst({
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
            }));
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);

            const nftSetRedeemedStateAfter = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedStateAfter.status, NFTSetRedemptionStateStatus.REDEEMED);
          });

          it("redeemMultiTransactionRugSetOwnershipRainTokensSecond fails after redeemed", async () => {
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

            const nftSetRedeemedStateBefore = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedStateBefore.status, NFTSetRedemptionStateStatus.REDEEMED);

            assert.rejects(async () => await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensSecond({
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
            }));
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);

            const nftSetRedeemedStateAfter = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
            assert.equal(nftSetRedeemedStateAfter.status, NFTSetRedemptionStateStatus.REDEEMED);
          });

          it("single transaction rug set redemption fails after multi-transaction redeem", async () => {
            const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.rejects(async () => await redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
              nftMint1,
              nftTokenAccount1,
              nftMint2,
              nftTokenAccount2,
              nftMint3,
              nftTokenAccount3,
              nftMint4,
              nftTokenAccount4,
              nftMint5,
              nftTokenAccount5,
              nftMint6,
              nftTokenAccount6,
              destRainTokenAccount: redeemerRainTokenAccount.address,
            }));
            const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
            assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);
          });

          describe("mid_multi_transaction_switch_fails", () => {
            let nftMint1: anchor.web3.PublicKey,
              nftTokenAccount1: anchor.web3.PublicKey,
              nftMint2: anchor.web3.PublicKey,
              nftTokenAccount2: anchor.web3.PublicKey,
              nftMint3: anchor.web3.PublicKey,
              nftTokenAccount3: anchor.web3.PublicKey,
              nftMint4: anchor.web3.PublicKey,
              nftTokenAccount4: anchor.web3.PublicKey,
              nftMint5: anchor.web3.PublicKey,
              nftTokenAccount5: anchor.web3.PublicKey,
              nftMint6: anchor.web3.PublicKey,
              nftTokenAccount6: anchor.web3.PublicKey;
            before(async () => {
              [nftMint1, nftTokenAccount1] = await createNFT(
                connection,
                rugsMintKeypair,
                wallet.publicKey,
                "https://www.arweave.net/V9r7mWhLaLxDFh0nAAlZ5Vm_TTKNW9AVLGTtKKez-VM/"
              );
              [nftMint2, nftTokenAccount2] = await createNFT(
                connection,
                rugsMintKeypair,
                wallet.publicKey,
                "https://arweave.net/3iifbniGU50dQBTh-hg8hgKlaXDLYmOmp553DBNnVVQ"
              );
              [nftMint3, nftTokenAccount3] = await createNFT(
                connection,
                rugsMintKeypair,
                wallet.publicKey,
                "https://arweave.net/Aq8BIBtKN1gLvlqwoi-xM1EyrNUCxOhYbhY05Z_rwys"
              );
              [nftMint4, nftTokenAccount4] = await createNFT(
                connection,
                rugsMintKeypair,
                wallet.publicKey,
                "https://arweave.net/gjjF6VquwpQeMpHQ0w0NuaVlOvuOx6sDNLMqiSQ-qT0"
              );
              [nftMint5, nftTokenAccount5] = await createNFT(
                connection,
                rugsMintKeypair,
                wallet.publicKey,
                "https://arweave.net/khqPV34uTWnrIHH95RVemBX-71rb8JXunlYqLbRWEOM"
              );
              [nftMint6, nftTokenAccount6] = await createNFT(
                connection,
                rugsMintKeypair,
                wallet.publicKey,
                "https://arweave.net/vg4TYQDkB8hAOM79yk9si4J8JC1iv7B_JiMItzvSKm4"
              );
            });

            it("only redeems once when switching from multi-transaction to single, mid verification", async () => {
              const reedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;

              await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensFirst({
                nftMint1,
                nftTokenAccount1,
                nftMint2,
                nftTokenAccount2,
                nftMint3,
                nftTokenAccount3,
                nftMint4,
                nftTokenAccount4,
                nftMint5,
                nftTokenAccount5,
                nftMint6,
                nftTokenAccount6,
              });
              const updatedReedemerRainTokenAccountAmount = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              assert.equal(updatedReedemerRainTokenAccountAmount, reedemerRainTokenAccountAmount);
              const nftSetRedeemedState = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
              assert.equal(nftSetRedeemedState.status, NFTSetRedemptionStateStatus.VERIFYING);

              const reedemerRainTokenAccountAmount2 = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensSecond({
                nftMint1,
                nftTokenAccount1,
                nftMint2,
                nftTokenAccount2,
                nftMint3,
                nftTokenAccount3,
                nftMint4,
                nftTokenAccount4,
                nftMint5,
                nftTokenAccount5,
                nftMint6,
                nftTokenAccount6,
              });
              const updatedReedemerRainTokenAccountAmount2 = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              assert.equal(updatedReedemerRainTokenAccountAmount2, reedemerRainTokenAccountAmount2);
              const nftSetRedeemedState2 = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
              assert.equal(nftSetRedeemedState2.status, NFTSetRedemptionStateStatus.VERIFIED);

              // SWITCH Mid multi transaction to single transaction
              const reedemerRainTokenAccountAmount3 = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              await redemptionProgram.redeemRugSetOwnershipRainTokens({}, {
                nftMint1,
                nftTokenAccount1,
                nftMint2,
                nftTokenAccount2,
                nftMint3,
                nftTokenAccount3,
                nftMint4,
                nftTokenAccount4,
                nftMint5,
                nftTokenAccount5,
                nftMint6,
                nftTokenAccount6,
                destRainTokenAccount: redeemerRainTokenAccount.address,
              });
              const updatedReedemerRainTokenAccountAmount3 = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              assert.equal(updatedReedemerRainTokenAccountAmount3 - reedemerRainTokenAccountAmount3, 240416977);
              //////////////////////////////////////////////////////////////////////////////////////////


              // SWITCHING back to mult-transaction after single transaction success should no longer redeem
              const nftSetRedeemedStateBefore = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
              assert.equal(nftSetRedeemedStateBefore.status, NFTSetRedemptionStateStatus.VERIFIED);
              const reedemerRainTokenAccountAmount4 = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              assert.rejects(async () => await redemptionProgram.redeemMultiTransactionRugSetOwnershipRainTokensFinal({
                nftMint1,
                nftTokenAccount1,
                nftMint2,
                nftTokenAccount2,
                nftMint3,
                nftTokenAccount3,
                nftMint4,
                nftTokenAccount4,
                nftMint5,
                nftTokenAccount5,
                nftMint6,
                nftTokenAccount6,
                destRainTokenAccount: redeemerRainTokenAccount.address,
              }));

              const updatedReedemerRainTokenAccountAmount4 = (await getAccount(connection, redeemerRainTokenAccount.address)).amount;
              assert.equal(updatedReedemerRainTokenAccountAmount4, reedemerRainTokenAccountAmount4);
              const nftSetRedeemedStateAfter = await redemptionProgram.fetchNFTSetRedeemedState(nftMint1);
              assert.equal(nftSetRedeemedStateAfter.status, NFTSetRedemptionStateStatus.VERIFIED);
              //////////////////////////////////////////////////////////////////////////////////////////
            });
          })
        });
      });
    });
  });
});
