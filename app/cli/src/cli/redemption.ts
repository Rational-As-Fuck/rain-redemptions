#!/usr/bin/env ts-node
import log from "loglevel";
import { web3 } from "@project-serum/anchor";

import { Redemption } from "@raindrops-protocol/rain-redemptions";
import { Wallet, CLI } from "@raindrops-protocol/sol-command";

CLI.programCommandWithConfig("initialize", async (config, options, _files) => {
  const { keypair, env, rpcUrl } = options;

  const redemptionProgram = await Redemption.getProgram(
    Redemption,
    await Wallet.loadWalletKey(keypair),
    env,
    rpcUrl,
  );

  const rainMintPubKey = new web3.PublicKey(config.rainMint);
  await redemptionProgram.initialize(
    {
      updateAuthority: new web3.PublicKey(config.updateAuthority),
      rainMint: rainMintPubKey,
      redemptionMultiplier: config.redemptionMultiplier,
    },
    {
      rainMint: rainMintPubKey,
    }
  );
});

CLI.programCommand("show_treasury")
  .action(async (_args: string[], cmd) => {
    const { keypair, env, rpcUrl } =
      cmd.opts();

    const redemptionProgram = await Redemption.getProgram(
      Redemption,
      await Wallet.loadWalletKey(keypair),
      env,
      rpcUrl,
    );

    const treasury = await redemptionProgram.fetchTreasury();
    log.setLevel("info");
    log.info("Treasury:", treasury.key.toBase58());
    log.info("  Update Authority:", treasury.updateAuthority.toBase58());
    log.info("  Rain Mint:", treasury.rainMint.toBase58());
    log.info("  Rain Vault:", treasury.rainVault.toBase58());
    log.info("  Redemption Multiplier:", treasury.redemptionMultiplier ? treasury.redemptionMultiplier.toString() : "Not cached on object");
    log.info("  Enabled:", treasury.enabled);
    log.info("  Bump:", treasury.bump ? treasury.bump.toString() : "Not cached on object");
  });

const treasuryUpdateKeyPairArgument = new CLI.Argument("<treasuryUpdateSignerKeyPairPath>", "The filepath to the treasury update authority signer keypair")
  .argParser((arg) => Wallet.loadWalletKey(arg));

const enableDisableTreasury = [
  treasuryUpdateKeyPairArgument
];
CLI.programCommandWithArgs("enable_treasury", enableDisableTreasury, async (updateAuthority, options, _cmd) => {
  const { keypair, env, rpcUrl } = options;
    
    const redemptionProgram = await Redemption.getProgram(
      Redemption,
      await Wallet.loadWalletKey(keypair),
      env,
      rpcUrl,
    );

    await redemptionProgram.enableTreasury({
      updateAuthority: updateAuthority,
    });
    console.log("Enabled treasury");
  });

CLI.programCommandWithArgs("disable_treasury", enableDisableTreasury, async (updateAuthority, options, _cmd) => {
  const { keypair, env, rpcUrl } = options;
    
    const redemptionProgram = await Redemption.getProgram(
      Redemption,
      await Wallet.loadWalletKey(keypair),
      env,
      rpcUrl,
    );

    await redemptionProgram.disableTreasury({
      updateAuthority: updateAuthority,
    });
    console.log("Disabled treasury");
  });

CLI.Program.parseAsync(process.argv);