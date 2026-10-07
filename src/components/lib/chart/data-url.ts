export const DATA_URL = {
  defaultUrl: "/data/zcash/shielded_supply.json",
  sproutUrl: "/data/zcash/sprout_supply.json",
  saplingUrl: "/data/zcash/sapling_supply.json",
  orchardUrl: "/data/zcash/orchard_supply.json",
  txsummaryUrl: "/data/zcash/transaction_summary.json",
  netInflowsOutflowsUrl: "/data/zcash/netinflowoutflow.json",
  nodecountUrl: "/data/zcash/nodecount.json",
  difficultyUrl: "/data/zcash/difficulty.json",
  lockboxUrl: "/data/zcash/lockbox.json",
  shieldedTxCountUrl: "/data/zcash/shieldedtxcount.json",
  issuanceUrl: "/data/zcash/issuance.json",
  shieldedUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/shielded_supply.json",
  namadaSupplyUrl: "/data/namada_supply.json",
  blockchainInfoUrl: "/api/blockchain-info",
  blockchairUrl:
    "https://api.blockchair.com/zcash/stats",
  namadaRewardUrl: "/data/namada_rewards_rate.json",
  proposalsUrl: "/data/props.json",
  propsDetailsUrl: "/data/proposals/propsDetails.json",
  zechubUrl: "/data/zechub.json",
  protocol_parametersUrl: "/data/protocol_parameters.json",
  propAddressesCounts: "/data/proposals/propAddressesCounts.json",
} as const;

export const DATE_URL = {
  namadaSupplyUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/namada_supply.json&per_page=1",
  namadaRewardUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/namada_rewards_rate.json&per_page=1",
  proposalsUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/props.json&per_page=1",
  propsDetailsUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/proposals/propsDetails.json&per_page=1",
  zechubUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/zechub.json&per_page=1",
  protocol_parametersUrl:
    "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/protocol_parameters.json&per_page=1",
} as const;
