import { PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import { TransactionBuilder } from "@orca-so/common-sdk";
import { createUpdateMetadataURIIx } from "./createix";
import * as fs from 'fs';

// load update authority key ///////////////////////////////////////////////////
import UPDATE_AUTHORITY_KEY from "../keyfile/update_authority.json";
const updateAuthorityKeypair = Keypair.fromSecretKey(new Uint8Array(UPDATE_AUTHORITY_KEY));
////////////////////////////////////////////////////////////////////////////////

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

async function main() {
  // export ANCHOR_PROVIDER_URL=http://localhost:8899
  // export ANCHOR_WALLET=~/.config/solana/id.json   <PAYER>
  const provider = AnchorProvider.env();
  console.log("connection endpoint", provider.connection.rpcEndpoint);
  console.log("wallet(payer)", provider.wallet.publicKey.toBase58());

  // read target
  const taskList = JSON.parse(fs.readFileSync(TASK_LIST_JSON_FILE, "utf-8")) as UpdateTaskList;
  const notDone = taskList.tasks.filter((t) => !t.done);

  // pre stats
  const notDoneCount = notDone.length;
  console.log(`there are ${notDoneCount} tasks...`);

  // pre-process (split tasks into packs, tasks in a pack will be updated in 1 Tx)
  const UPDATE_TASK_PER_TX = 5;
  const taskPacks: UpdateTask[][] = []
  for (let i=0; i<notDoneCount; i+=UPDATE_TASK_PER_TX) {
    const pack = notDone.slice(i, i+UPDATE_TASK_PER_TX);
    taskPacks.push(pack);
  }

  // process
  const TX_PER_ITERATION = 10;    // 10 Txs parallel exec per iteration
  const STOP_ERROR_THRESHOLD = 5; // Stops after 5 consecutive partial transaction failures

  let errorCount = 0;
  for (let i=0; i<taskPacks.length; i+=TX_PER_ITERATION) {
    const packs = taskPacks.slice(i, i+TX_PER_ITERATION);

    const txPromises = packs.map((p) => update(provider, p));
    const result = await Promise.allSettled(txPromises);
    const errorDetected = result.filter((r) => r.status === "rejected").length >= 1;

    console.log(`${i}/${taskPacks.length}:`, errorDetected ? "some tx FAILED" : "all ok");

    errorCount = errorDetected ? (errorCount + 1) : 0;
    if (errorCount >= STOP_ERROR_THRESHOLD) {
      console.log("too many errors, stopping...");
      break;
    }

    // write to disk / 10 iteration
    if (i > 0 && i % (10*TX_PER_ITERATION) == 0) {
      console.log("disk write...");
      fs.writeFileSync(TASK_LIST_JSON_FILE, JSON.stringify(taskList));
    }
  }

  // stats
  const allCount = taskList.tasks.length;
  const doneCount = taskList.tasks.filter((t) => !!t.done).length;
  const percent = Math.round(doneCount / allCount * 100);
  console.log(`stats: ${doneCount} done / ${allCount} all (${percent} %)`);

  fs.writeFileSync(TASK_LIST_JSON_FILE, JSON.stringify(taskList));
}

async function update(provider: AnchorProvider, packs: UpdateTask[]) {
  const mints = packs.map((p) => new PublicKey(p.mint))

  // construct
  const builder = new TransactionBuilder(provider.connection, provider.wallet)
    .addSigner(updateAuthorityKeypair);

  mints.forEach((mint) => {
    builder.addInstruction(createUpdateMetadataURIIx(
      mint,
      updateAuthorityKeypair.publicKey
    ));
  });

  // send & confirm
  const txsig = await builder.buildAndExecute();
  const result = await provider.connection.confirmTransaction(txsig);
  if (result.value.err) {
    throw Error(result.value.err.toString());
  }

  // update state
  packs.forEach((p) => {
    p.done = true;
    p.txsig = txsig;
  });
}

main();
