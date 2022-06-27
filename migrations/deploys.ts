// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import  anchor, { web3 } from "@project-serum/anchor";
import { Redemption, Wallet } from "../app/lib";

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  const redemptionProgram = await Redemption.getProgramWithProvider(
    provider,
  ) as Redemption;

  await redemptionProgram.initialize({
    updateAuthority: Wallet.Utils.loadWalletKey("../keypairs/tfruuiZ2ZV3KaF6ujY6kFMJnpVfgCerJDy53XrW8nb5.json"),
    redemptionMultiplier: 0, // Use the default in contract
  }, {
    rainMint: new web3.PublicKey("rainH85N1vCoerCi4cQ3w6mCf7oYUdrsTFtFzpaRwjL")
  });
};
