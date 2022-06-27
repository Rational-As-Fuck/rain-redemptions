import { 
  createMint,
} from "@solana/spl-token";

export async function newMint(wallet, mintAuthority, freezeAuthority, connection, decimals = 9) {
  return await createMint(
    connection,
    wallet,
    mintAuthority,
    freezeAuthority,
    decimals
  );
};