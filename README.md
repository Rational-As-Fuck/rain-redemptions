# $RAIN redemptions

## Bootstrapping environment

### Prerequisites

* [Install rust, anchor, and solana cli](https://book.anchor-lang.com/chapter_2/installation.html)
* Fetch vendor dependencies (`git submodule init && git submodule update`)

### Build vendor dependences

#### Metaplex token-metadata

```bash
cd vendor/metaplex-program-library/token-metadata/program
cargo build-bpf
```

### Contract Deployment

`cd` to the root of the project. Run `yarn` to fetch project dependencies.

After `yarn` completes, you can run `anchor build` to build the contracts.

To run the contracts locally, you need to have a running solana cluster.

First we will create a directory for the cluster:

`mkdir -p .anchor/test-ledger`

Create a new keypair:

`solana-keygen new --outfile .anchor/test-ledger/validator-keypair.json`

Start the test validator and deploy the contracts:

```bash
cd .anchor
solana-test-validator --no-bpf-jit -r --mint (solana address -k test-ledger/validator-keypair.json) --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s ../vendor/metaplex-program-library/token-metadata/target/deploy/mpl_token_metadata.so --bpf-program tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP ../target/deploy/redemption.so
```

This will start the local validator with a clean state because of the `-r` flag. The `--mint` flag will mint the genesis SOLs to the specified address, avoiding the need to airdrop to your signing wallet. The remaining `--bpf-program` arguments will deploy a contract to the passed in address.

#### IDL uploading

Now we need to create and update the IDL files for the contract on the validator. From the root of the project run.

```bash
anchor idl init --provider.cluster localnet -f target/idl/redemption.json tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP
anchor idl upgrade -f target/idl/redemption.json tfre5zcihbycEcr1xo67saNvovdmXhQFXPM2obQqRjP 
```

Upon success of those commands you will now have the contract and their interfaces fully deployed. You are now ready to interact with them using the client CLI/lib.

### Client CLI

The client CLI is located in the [app/cli](./app/cli) directory. To run the CLI you need to first cd into `app/cli` and run `yarn` to fetch it's depenencies.

Now you can run the CLI commands outlined in the [docs](./docs/app/cli.md).

### Client lib

The client lib can be used from any other typescript/javascript project. To use the lib you will want to add it to your `package.json` file as a local dependency (perhaps it will be added to npm eventually), updating `<PATH-TO-LIB>` to where you have this repo located plus `app/lib`. EX: "`/Users/banana/trash-with-frens/app/lib`"

```json
{
  "name": "trash-with-frens-cli",
  ...
  "dependencies": {
    "trash-with-frens": "file:<PATH-TO-LIB>"
  },
}
```

Documentation for the client lib can be found in the [docs](./docs/app/lib.md).
