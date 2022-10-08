### Rain Redemption Validator Front-End

1. Set up development environment

   - Front end is a React app using Next.js for the Framework `and` Tailwind CSS for the styles.
     - https://nextjs.org/
     - https://tailwindcss.com/

   - `git clone git@github.com:Rational-As-Fuck/rain-redemptions.git`

   - Checkout new development branch

     - `cd rain-redemptions`
     - `git checkout -b frontEnd`

   - All of the front-end work will be done in a Next.js app located in app/redemption-web

     - `cd app/redemption-web`

   - Install Node dependencies

     - `yarn`

   - Edit app/redemption-wev/lib/constants.ts

     - Set the validator to use Solana devnet

       - ~~let environment: string = Environment.Localnet;~~ 
       - `let environment: string = Environment.Devnet;`

     - Change the devnet RPC from genesysgo to private Alchemy RPC node

       - ~~case Environment.Devnet:~~

         ​    ~~endpoint = "https://ssc-dao.genesysgo.net/";~~

       - case Environment.Devnet:

         ​    endpoint = "https://solana-devnet.g.alchemy.com/v2/t0-XFKw5rFAafXfyWRmjzgm_ygXilUk4";

     - Add devnet collection creator to PANDA_CREATORS array

       - ````javascript
         export const PANDA_CREATORS = [
           "CLErvyrMpi66RAxNV2wveSi25NxHb8G383MSVuGDgZzp",
           "HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx",
           "4k21XuJGiDSgdb9w7zMEcobJgnnPkiMpH3nM4uiQzao9",  <------- ADD THIS ADDRESS ---------------<
         ];
         ````

   - Start development server

     - `yarn dev`

     - ready - started server on 0.0.0.0:3000, url: http://localhost:3000

2. Wallet Terminology

   - Front end is a React app using Next.js for the Framework `and` Tailwind CSS for the styles.
     - https://nextjs.org/
     - https://tailwindcss.com/
   - Important Wallet Addresses and terminology (using sample NFTs)
     - Rain Redemption Program
       - Program ID
     - Degen Trash Panda #15513 (DTP)
       - DEVNET (https://solscan.io/token/BN7wyc3AW1bKqaX1wZHuncE8rbw3kxX6NprjvVHUXsfC?cluster=devnet)
         - Token Address: `BN7wyc3AW1bKqaX1wZHuncE8rbw3kxX6NprjvVHUXsfC`
         - Mint Authority: `4ndLXy6rZA8dUvfBGfyQVrstyApLYo47BabQMUrSpBZ9`
         - Update Authority: `FkPDc49EWoUViwzxbxnXEF2rzaE3wqnUGVnNDerawQfn`
         - Owner Program: Token Program - `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
         - Mint: `BN7wyc3AW1bKqaX1wZHuncE8rbw3kxX6NprjvVHUXsfC`
         - Symbol: "DTP"
         - Creators
           - 0: `4k21XuJGiDSgdb9w7zMEcobJgnnPkiMpH3nM4uiQzao9` (0%)
           - 1: `trshC9cTgL3BPXoAbp5w9UfnUMWEJx5G61vUijXPMLH` (59%)
           - 2: `3B86L4BrRjm9V7sd3AjjJq5XFtyqMgCYMCTwqMMvAxgr` (10%)
           - 3: `8BoJdKKz3j4bUGJdAdGhaiSpv1EM9HhSm1cjy1iPrfhk` (5%)
           - 4: `ENACtpCWKJAomGtWVH2UqdNKmkR1Ft4V81gC4oUbi5W1` (26%)
       - MAINNET (https://solscan.io/token/2MtivfoJbBDmWskd6HfSRzdtqminV7pUwxs8ipkuv3sf)
         - Token Address: `2MtivfoJbBDmWskd6HfSRzdtqminV7pUwxs8ipkuv3sf`
         - Mint Authority: `7NG9eVP37unUSRamkLevyRbNZRBGVZuA9JVvNSsq672Z`
         - Update Authority: `trshC9cTgL3BPXoAbp5w9UfnUMWEJx5G61vUijXPMLH`
         - Owner Program: Token Program - `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
         - Mint: `2MtivfoJbBDmWskd6HfSRzdtqminV7pUwxs8ipkuv3sf`
         - Symbol: "DTP"
         - Creators
           - 0: `HHGsTSzwPpYMYDGgUqssgAsMZMsYbshgrhMge8Ypgsjx` (0%)
           - 1: `trshC9cTgL3BPXoAbp5w9UfnUMWEJx5G61vUijXPMLH` (68%)
           - 2: `ENACtpCWKJAomGtWVH2UqdNKmkR1Ft4V81gC4oUbi5W1` (26%)
           - 3: `8BoJdKKz3j4bUGJdAdGhaiSpv1EM9HhSm1cjy1iPrfhk` (5%)
           - 4: `3B86L4BrRjm9V7sd3AjjJq5XFtyqMgCYMCTwqMMvAxgr` (1%)
     - The 0 Creator address is the key to identifying valid NFTs in a wallet. This address must be added to the PANDA_CREATORS array as described above.

3. Design and Development

   - Buttons
     - Wallet Connect (upper right hand corner)
     - Select Wallet (Redeem $RAIN) (Landing Page)
     - Check a Trash Panda NFT (Landing Page)
     - Create rain Toke Account (After valid NFT detected)
   - Images
     - Loading... Animation
   - Application Flow
     1. Connect wallet
     2. Check wallet for valid NFT(s)
        - No NFT component
        - Create RAIN token account