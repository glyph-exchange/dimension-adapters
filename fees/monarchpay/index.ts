import { Adapter, FetchResultFees } from "../adapters/types";
import { CHAIN } from "../helpers/chains";
import { getTimestampAtStartOfDayUTC, getTimestampAtStartOfNextDayUTC } from "../utils/date";
import * as sdk from "@defillama/sdk";
import { getBlock } from "../helpers/getBlock";

const address = '0xE36333147B20D887c2b3E0a3abe9Be34A101B07E';

interface ITx {
  data: string;
  transactionHash: string;
}

const fetch = async (timestamp: number): Promise<FetchResultFees> => {
  const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp)
  const yesterdaysTimestamp = getTimestampAtStartOfNextDayUTC(timestamp)

  const fromBlock = (await getBlock(todaysTimestamp, CHAIN.KAVA, {}));
  const toBlock = (await getBlock(yesterdaysTimestamp, CHAIN.KAVA, {}));
  const logs: ITx[] = (await sdk.api.util.getLogs({
    target: address,
    topic: '',
    fromBlock: fromBlock,
    toBlock: toBlock,
    topics: [],
    keys: [],
    chain: CHAIN.KAVA
  })).output.map((e: any) => { return { data: e.data.replace('0x', ''), transactionHash: e.transactionHash } as ITx});
  const dailyFees = logs.map((tx: ITx) => {
    const amount = Number('0x' + tx.data.slice(192, 256)) / 10 **  18;
    return amount;
  }).reduce((a: number, b: number) => a+b,0);
  return {
    timestamp: timestamp,
    dailyFees: dailyFees ? `${dailyFees}` : undefined,
  };
}

const adapter: Adapter = {
  adapter: {
    [CHAIN.KAVA]: {
      fetch: fetch,
      start: async () => 1653134400
    },
  }
}

export default adapter;
