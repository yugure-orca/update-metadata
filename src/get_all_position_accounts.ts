import { PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import { ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import { TransactionBuilder } from "@orca-so/common-sdk";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // export ANCHOR_PROVIDER_URL=http://localhost:8899
  // export ANCHOR_WALLET=~/.config/solana/id.json   <PAYER>
  const provider = AnchorProvider.env();

  // find positions
  const gPA = await provider.connection.getProgramAccounts(ORCA_WHIRLPOOL_PROGRAM_ID, {
    commitment: "confirmed",
    // account LAYOUT: https://github.com/orca-so/whirlpools/blob/main/programs/whirlpool/src/state/position.rs#L20
    dataSlice: {
      // position_mint
      offset: 8+32,
      length: 32,
    },
    filters: [
      {dataSize: 216},
    ]
  });

  type PositionAccounts = {
    position: PublicKey,
    positionMint: PublicKey,
    positionMetadata: PublicKey,
  }
  const positionAccounts: PositionAccounts[] = [];

  gPA.map((account) => {
    const positionMint = new PublicKey(account.account.data);
    const positionMetadata = PDAUtil.getPositionMetadata(positionMint).publicKey;
    positionAccounts.push({
      position: account.pubkey,
      positionMint,
      positionMetadata,
    });
  });

  // check metadata existance
  const metadataAccounts = [];
  for (let i=0; i<positionAccounts.length; i+=100) {
    const pubkeys = positionAccounts.slice(i, i+100).map((p) => p.positionMetadata);

    const accounts = await provider.connection.getMultipleAccountsInfo(
      pubkeys,
      {dataSlice: {offset: 0, length: 0}},
    );

    metadataAccounts.push(...accounts);
    await sleep(500);
  }

  positionAccounts.forEach((p, i) => {
    const exists = metadataAccounts[i] !== null;
    console.log(`${p.position.toBase58()},${p.positionMint.toBase58()},${p.positionMetadata.toBase58()},${exists}`);
  });
}

main();