# update-metadata

## test
this test-run will update only metadata for [FjmawoXYajVgAo1LNiJjYui3g43Yxsd7SV9FBiLLrVer](https://solscan.io/token/FjmawoXYajVgAo1LNiJjYui3g43Yxsd7SV9FBiLLrVer#metadata)

1. clone repo
1. yarn install
1. put update authority keyfile as keyfile/update_authority.json (symbolic link is OK)
1. set ANCHOR_PROVIDER_URL and ANCHOR_WALLET (ANCHOR_WALLET will be payer)
1. ts-node src/update_metadata_test.ts

## phase1
update_metadata.ts update 13700 metadata accounts.

target accounts are listed in accounts/whirlpool.173663999.position_mint_and_metadata.csv

these accounts were extracted from the snapshot of slot 173663999.

1. clone repo
1. yarn install
1. put update authority keyfile as keyfile/update_authority.json (symbolic link is OK)
1. set ANCHOR_PROVIDER_URL and ANCHOR_WALLET (ANCHOR_WALLET will be payer)
1. ts-node src/update_metadata.ts
1. ts-node src/check_metadata.ts

### implementation & execution suppliment

- 1 update transaction contains 5 update instructions.
- 10 transactions will be sent and confirmed in parallel.
- update target and its update status is saved as accounts/target.json
- stops after 5 consecutive partial transaction failures
- verified using solana-test-validator
