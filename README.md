# update-metadata

## test
this test-run will update only metadata for [FjmawoXYajVgAo1LNiJjYui3g43Yxsd7SV9FBiLLrVer](https://solscan.io/token/FjmawoXYajVgAo1LNiJjYui3g43Yxsd7SV9FBiLLrVer#metadata)

1. clone repo
1. yarn install
1. put update authority keyfile as keyfile/update_authority.json (symbolic link is OK)
1. set ANCHOR_PROVIDER_URL and ANCHOR_WALLET (ANCHOR_WALLET will be payer)
1. ts-node src/update_metadata_test.ts
