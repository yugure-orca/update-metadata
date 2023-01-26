import { PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import { TransactionBuilder, Instruction } from "@orca-so/common-sdk";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js"
import { createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { PDAUtil } from "@orca-so/whirlpools-sdk";

// load update authority key ///////////////////////////////////////////////////
import UPDATE_AUTHORITY_KEY from "../keyfile/update_authority.json";
const updateAuthorityKeypair = Keypair.fromSecretKey(new Uint8Array(UPDATE_AUTHORITY_KEY));
////////////////////////////////////////////////////////////////////////////////


// METADATA (only URI is updated) //////////////////////////////////////////////
// https://solscan.io/token/B2DZwMZaXeC32YnsW1UmzuNs26KVuGGn2PycvyfPCmU7#metadata
const METADATA_NEW_URI = "https://arweave.net/E19ZNY2sqMqddm1Wx7mrXPUZ0ZZ5ISizhebb0UsVEws";

const METADATA_NAME = "Orca Whirlpool Position";
const METADATA_SYMBOL = "OWP";
const METADATA_CREATORS = null;
const METADATA_SELLERS_FEE_BASIS_POINTS = 0;
const METADATA_USES = null;
const METADATA_COLLECTION = null;
const METADATA_IS_MUTABLE = true;
const METADATA_PRIMARY_SALE_HAPPENED = false;
////////////////////////////////////////////////////////////////////////////////


async function main() {
  // export ANCHOR_PROVIDER_URL=http://localhost:8899
  // export ANCHOR_WALLET=~/.config/solana/id.json   <PAYER>
  const provider = AnchorProvider.env();
  console.log("connection endpoint", provider.connection.rpcEndpoint);
  console.log("wallet(payer)", provider.wallet.publicKey.toBase58());
  
  const metaplex = new Metaplex(provider.connection);
  metaplex.use(keypairIdentity(Keypair.generate())); // with dummy key

  const testPositionNftMint = new PublicKey("FjmawoXYajVgAo1LNiJjYui3g43Yxsd7SV9FBiLLrVer");

  const preNft = await metaplex.nfts().findByMint(testPositionNftMint);
  console.log("uri", preNft.uri);

  const builder = new TransactionBuilder(provider.connection, provider.wallet)
    .addSigner(updateAuthorityKeypair)
    .addInstruction(createUpdateMetadataURIIx(
      testPositionNftMint,
      updateAuthorityKeypair.publicKey
    ));

  const size = await builder.txnSize();
  console.log("tx size:", size);

  const sig = await builder.buildAndExecute();
  console.log("tx signature:", sig);

  const postNft = await metaplex.nfts().findByMint(testPositionNftMint);
  console.log("uri", postNft.uri);
}

function createUpdateMetadataURIIx(
  positionMint: PublicKey,
  updateAuthority: PublicKey,
): Instruction {
  const metadataPubkey = PDAUtil.getPositionMetadata(positionMint).publicKey;

  // https://docs.metaplex.com/programs/token-metadata/instructions#update-a-metadata-account
  const ix = createUpdateMetadataAccountV2Instruction({
    metadata: metadataPubkey,
    updateAuthority,
  }, {
    updateMetadataAccountArgsV2: {
      data: {
        uri: METADATA_NEW_URI,
        // NO CHANGE
        name: METADATA_NAME,
        symbol: METADATA_SYMBOL,
        creators: METADATA_CREATORS,
        sellerFeeBasisPoints: METADATA_SELLERS_FEE_BASIS_POINTS,
        uses: METADATA_USES,
        collection: METADATA_COLLECTION,
      },
      // NO CHANGE
      isMutable: METADATA_IS_MUTABLE,
      primarySaleHappened: METADATA_PRIMARY_SALE_HAPPENED,
      updateAuthority,
    }
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}

main();


/*

$ ts-node update_metadata_test.ts 

connection endpoint http://localhost:8899
wallet(payer) 2v112XbwQXFrdqX438HUrfZF91qCZb7QRP4bwUiN7JF5
uri https://arweave.net/KZlsubXZyzeSYi2wJhyL7SY-DAot_OXhfWSYQGLmmOc
tx size: 445
tx signature: 5NFLS3SbSLNPQLLREva8wiXigevSK4R6kdAyfN1cK83ogdBPtrK4bF6Uy4jcwp9qTSxvj4gtw5zfsirqydSmgHnS
uri https://arweave.net/SGhGXIUotyoCBqGOS_LqQSEZ2yC5QQO76NZewGGEo1o

$ diff -y -W 180 predump postdump 

Public Key: E1bivVnLHf744QmhnYBSJiFHv8iJ1avc9BVwvVTmx8z9                                Public Key: E1bivVnLHf744QmhnYBSJiFHv8iJ1avc9BVwvVTmx8z9
Balance: 0.00561672 SOL                                                                 Balance: 0.00561672 SOL
Owner: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s                                      Owner: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
Executable: false                                                                       Executable: false
Rent Epoch: 0                                                                           Rent Epoch: 0
Length: 679 (0x2a7) bytes                                                               Length: 679 (0x2a7) bytes
0000:   04 0c 8e 98  78 4f 83 30  4f 46 14 80  d7 86 b4 7b   ....xO.0OF.....{           0000:   04 0c 8e 98  78 4f 83 30  4f 46 14 80  d7 86 b4 7b   ....xO.0OF.....{
0010:   da 04 59 14  d2 21 b4 ac  77 74 02 97  af b6 71 53   ..Y..!..wt....qS           0010:   da 04 59 14  d2 21 b4 ac  77 74 02 97  af b6 71 53   ..Y..!..wt....qS
0020:   35 da f8 6c  74 fc fb 44  bc 33 34 5b  5e 86 e3 0d   5..lt..D.34[^...           0020:   35 da f8 6c  74 fc fb 44  bc 33 34 5b  5e 86 e3 0d   5..lt..D.34[^...
0030:   84 f2 9a 41  b0 59 4c ac  dc ce 06 c6  14 e2 d7 4c   ...A.YL........L           0030:   84 f2 9a 41  b0 59 4c ac  dc ce 06 c6  14 e2 d7 4c   ...A.YL........L
0040:   7b 20 00 00  00 4f 72 63  61 20 57 68  69 72 6c 70   { ...Orca Whirlp           0040:   7b 20 00 00  00 4f 72 63  61 20 57 68  69 72 6c 70   { ...Orca Whirlp
0050:   6f 6f 6c 20  50 6f 73 69  74 69 6f 6e  00 00 00 00   ool Position....           0050:   6f 6f 6c 20  50 6f 73 69  74 69 6f 6e  00 00 00 00   ool Position....
0060:   00 00 00 00  00 0a 00 00  00 4f 57 50  00 00 00 00   .........OWP....           0060:   00 00 00 00  00 0a 00 00  00 4f 57 50  00 00 00 00   .........OWP....
0070:   00 00 00 c8  00 00 00 68  74 74 70 73  3a 2f 2f 61   .......https://a           0070:   00 00 00 c8  00 00 00 68  74 74 70 73  3a 2f 2f 61   .......https://a
0080:   72 77 65 61  76 65 2e 6e  65 74 2f 4b  5a 6c 73 75   rweave.net/KZlsu         | 0080:   72 77 65 61  76 65 2e 6e  65 74 2f 53  47 68 47 58   rweave.net/SGhGX
0090:   62 58 5a 79  7a 65 53 59  69 32 77 4a  68 79 4c 37   bXZyzeSYi2wJhyL7         | 0090:   49 55 6f 74  79 6f 43 42  71 47 4f 53  5f 4c 71 51   IUotyoCBqGOS_LqQ
00a0:   53 59 2d 44  41 6f 74 5f  4f 58 68 66  57 53 59 51   SY-DAot_OXhfWSYQ         | 00a0:   53 45 5a 32  79 43 35 51  51 4f 37 36  4e 5a 65 77   SEZ2yC5QQO76NZew
00b0:   47 4c 6d 6d  4f 63 00 00  00 00 00 00  00 00 00 00   GLmmOc..........         | 00b0:   47 47 45 6f  31 6f 00 00  00 00 00 00  00 00 00 00   GGEo1o..........
00c0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           00c0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
00d0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           00d0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
00e0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           00e0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
00f0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           00f0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0100:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0100:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0110:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0110:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0120:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0120:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0130:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0130:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0140:   00 00 00 01  01 ff 01 01  00 00 00 00  00 00 00 00   ................           0140:   00 00 00 01  01 ff 01 01  00 00 00 00  00 00 00 00   ................
0150:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0150:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0160:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0160:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0170:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0170:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0180:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0180:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0190:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0190:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
01a0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           01a0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
01b0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           01b0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
01c0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           01c0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
01d0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           01d0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
01e0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           01e0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
01f0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           01f0:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0200:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0200:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0210:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0210:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0220:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0220:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0230:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0230:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0240:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0240:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0250:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0250:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0260:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0260:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0270:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0270:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0280:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0280:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
0290:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................           0290:   00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00   ................
02a0:   00 00 00 00  00 00 00                                .......                    02a0:   00 00 00 00  00 00 00                                .......

*/