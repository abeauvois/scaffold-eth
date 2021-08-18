import { useState, useEffect } from "react";
import { Fetcher, Route, TokenAmount, Trade, TradeType } from "@uniswap/sdk";

import { ChainId, Token } from "../../../types";

const DAI = new Token(ChainId.MAINNET, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18, "DAI");
const WETH = new Token(ChainId.MAINNET, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18, "WETH");

async function fetchPair(tokenIn: Token, tokenOut: Token) {
  const tokensPair = await Fetcher.fetchPairData(tokenIn, tokenOut);

  const routeTokenInForTokenOut = new Route([tokensPair], tokenOut);
  const tradeTokenOutToTokenIn = new Trade(
    routeTokenInForTokenOut,
    new TokenAmount(tokenOut, BigInt(1e18)),
    TradeType.EXACT_INPUT,
  );

  const routeTokenOutForTokenIn = new Route([tokensPair], tokenIn);
  const tradeTokenInToTokenOut = new Trade(
    routeTokenOutForTokenIn,
    new TokenAmount(tokenIn, BigInt(1e18)),
    TradeType.EXACT_INPUT,
  );

  console.log(`${tradeTokenOutToTokenIn.executionPrice.toSignificant(6)} ${tokenIn.symbol} for 1 ${tokenOut.symbol}`);

  return {
    tokensPair,
    numberTokenInForOneTokenOut: tradeTokenOutToTokenIn.executionPrice.toSignificant(6),
    numberTokenOutForOneTokenIn: tradeTokenInToTokenOut.executionPrice.toSignificant(6),
  };
}

const useUniswapPairPrice = (tokenIn: Token = DAI, tokenOut: Token = WETH) => {
  const [tokensPair, setTokensPair] = useState();
  const [numberTokenInForOneTokenOut, setNumberTokenInForOneTokenOut] = useState("");
  const [numberTokenOutForOneTokenIn, setNumberTokenOutForOneTokenIn] = useState("");

  useEffect(() => {
    async function getPairPrices() {
      const { numberTokenInForOneTokenOut, numberTokenOutForOneTokenIn } = await fetchPair(tokenIn, tokenOut);
      setNumberTokenInForOneTokenOut(numberTokenInForOneTokenOut);
      setNumberTokenOutForOneTokenIn(numberTokenOutForOneTokenIn);
      setTokensPair(tokensPair);
    }

    if (!numberTokenInForOneTokenOut && !numberTokenOutForOneTokenIn) {
      getPairPrices();
    }
  }, []);

  return {
    tokensPair,
    numberTokenInForOneTokenOut,
    numberTokenOutForOneTokenIn,
  };
};

export { fetchPair, useUniswapPairPrice, DAI, WETH };
