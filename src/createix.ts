import { PublicKey } from "@solana/web3.js";
import { Instruction } from "@orca-so/common-sdk";
import { createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { PDAUtil } from "@orca-so/whirlpools-sdk";

// METADATA (only URI is updated) //////////////////////////////////////////////
// https://solscan.io/token/B2DZwMZaXeC32YnsW1UmzuNs26KVuGGn2PycvyfPCmU7#metadata
export const METADATA_NEW_URI = "https://arweave.net/E19ZNY2sqMqddm1Wx7mrXPUZ0ZZ5ISizhebb0UsVEws";

const METADATA_NAME = "Orca Whirlpool Position";
const METADATA_SYMBOL = "OWP";
const METADATA_CREATORS = null;
const METADATA_SELLERS_FEE_BASIS_POINTS = 0;
const METADATA_USES = null;
const METADATA_COLLECTION = null;
const METADATA_IS_MUTABLE = true;
const METADATA_PRIMARY_SALE_HAPPENED = false;
////////////////////////////////////////////////////////////////////////////////

export function createUpdateMetadataURIIx(
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
