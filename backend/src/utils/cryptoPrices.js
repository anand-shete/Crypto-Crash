import axios from "axios";
import redis from "../config/redis.js";
import "dotenv/config";

const fetchLivePrices = async () => {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      {
        headers: { "x-cg-demo-api-key": process.env.COINGECKO_API },
      }
    );
    const BTC = res.data.bitcoin?.usd;
    const ETH = res.data.ethereum?.usd;

    if (BTC) await redis.set("crypto:BTC", BTC, "EX", 30); // expires in 30 sec
    if (ETH) await redis.set("crypto:ETH", ETH, "EX", 30);

    return {
      BTC: parseFloat(BTC),
      ETH: parseFloat(ETH),
    };
  } catch (error) {
    console.error("Error fetching live crypto prices:", error);
  }
};
setInterval(fetchLivePrices, 10000); // FIXME: change this

export const getPriceFromCache = async () => {
  let BTC = await redis.get("crypto:BTC");
  let ETH = await redis.get("crypto:ETH");

  if (!BTC || !ETH) {
    let livePrices = await fetchLivePrices();
    BTC = livePrices.BTC;
    ETH = livePrices.ETH;
  }

  return {
    BTC: parseFloat(BTC),
    ETH: parseFloat(ETH),
  };
};
