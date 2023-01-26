import { PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import * as fs from 'fs';
import { PDAUtil } from "@orca-so/whirlpools-sdk";
import { METADATA_NEW_URI } from "./createix";

// JSON structure //////////////////////////////////////////////////////////////
const TASK_LIST_JSON_FILE = "accounts/target.json";

type UpdateTask = {
  mint: string,
  done?: boolean,
  txsig?: string,
}

type UpdateTaskList = {
  tasks: UpdateTask[],
}
////////////////////////////////////////////////////////////////////////////////

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // export ANCHOR_PROVIDER_URL=http://localhost:8899
  // export ANCHOR_WALLET=~/.config/solana/id.json   <PAYER>
  const provider = AnchorProvider.env();
  console.log("connection endpoint", provider.connection.rpcEndpoint);
  console.log("wallet(payer)", provider.wallet.publicKey.toBase58());

  // read target
  const taskList = JSON.parse(fs.readFileSync(TASK_LIST_JSON_FILE, "utf-8")) as UpdateTaskList;
  const doneMints = taskList.tasks.filter((t) => !!t.done).map((t) => t.mint);

  const BATCH_SIZE = 100;
  const NOT_UPDATED_THRESHOLD = 500;
  const DELAY_MS = 500;

  let updatedCount = 0;
  let notUpdatedCount = 0;
  for (let i=0; i<doneMints.length; i+= BATCH_SIZE) {
    // get accounts
    const mints = doneMints.slice(i, i+BATCH_SIZE);
    const metadatas = mints.map((m) => {
      return PDAUtil.getPositionMetadata(new PublicKey(m)).publicKey;
    });

    const accounts = await provider.connection.getMultipleAccountsInfo(metadatas);

    // check
    accounts.forEach((a, idx) => {
      const updated = isUpdatedMetadata(a.data, METADATA_NEW_URI);

      if (updated) {
        updatedCount++;
      }
      else {
        notUpdatedCount++;
        console.log(mints[idx], "not updated");  
      }
    })

    console.log(`${i}: updated : notUpdated = ${updatedCount} : ${notUpdatedCount}`);

    if (notUpdatedCount >= NOT_UPDATED_THRESHOLD) {
      console.log("too many not updated accounts found, stopping...");
      break;
    }

    await sleep(DELAY_MS);
  }

  console.log(`final: updated : notUpdated = ${updatedCount} : ${notUpdatedCount}`);
}

function isUpdatedMetadata(data: Buffer, expected: string): boolean {
  const offset = 16*7 + 7;
  const size = expected.length;
  const parsed = data.slice(offset, offset+size).toString();
  return parsed === expected;
}

main();

