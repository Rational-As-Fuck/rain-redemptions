# cli

The client CLI is located in the [app/cli](../../app/cli) directory. To run the CLI you need to first cd into `app/cli` and run `yarn` to fetch it's depenencies.

The CLI is broken up into multiple commands, similar to git. The following commands are available:

* [mint-cli](./cli.md#mint-cli)
* [redemption-cli](./cli.md#redemption-cli)

These commands can be triggered using yarn to run their underlying scripts.

```bash
yarn mint-cli
yarn redemption-cli
```

All of the commands accept the following commonly used flags:

```bash
-e or --env <string>        To specify the cluster environment to use. (localnet, testnet, devnet, mainnet-beta)

-k or --keypair <path>      To specify the keypair to use for signing.
```

They do accept others that can be found by running `yarn <command> help <subcommand>` .

## mint-cli

Often when working with the trash-with-frens contracts you will need to specify a SPL token mint to use with various instructions. This command will create a new mint and return the mint's address. You are then able to use the PublicKey of the mint when calling the contracts.

Example:

```bash
yarn mint-cli new -e "localnet" -k ../../.anchor/test-ledger/validator-keypair.json
```

## redemption-cli

The redemption cli is used to interact with the redemption contract. It supports the following subcommands:

* [initialize](./cli.md#redemption-cli-initialize)
* [show_treasury](./cli.md#redemption-cli-show_treasury)

### redemption-cli initialize

Initialize is used to setup the treasury (created and owned by the contract) to be used by the redemption contract. The treasury is what holds information regarding the rain mint, the rain vault for distributing rain tokens to players for their nft ownership, and the redemption multiplier, which is used to determine how many rain tokens a player can redeem for each type of NFT(panda, rugs, sets of rugs, etc). The treasury is required to be initialized before any other redemption commands can be run.

An example config with the parameters to specify to the command is available [here](../../app/cli/example-configs/redemption/initialize.json).

Example call:

```bash
yarn redemption-cli initialize -e "localnet" -k ../../.anchor/test-ledger/validator-keypair.json -cp ./example-configs/redemption/initialize.json
```

Once this command is run successfully, you will not be able to call it again. The treasury cannot be destroyed or reinitialized. But it will be update-able in the future by it's update authority.

### redemption-cli show_treasury

show_treasury can be used to fetch and display the current treasury allocated to the redemption contract. The treasury is created with a global PDA and therefore only one can be created for use by the redemption contract.

```bash
yarn redemption-cli show_treasury -e "localnet" -k ../../.anchor/test-ledger/validator-keypair.json
```
