import React, { useEffect, useState } from "react";
import { ChainId, Token, WETH } from "@uniswap/sdk";

const defaultUri = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";

export const tokenListToObject = (array: Token[]): Record<string, Token> =>
  array.reduce((obj, item) => {
    if (!item?.symbol) return obj;
    obj[item.symbol] = new Token(item.chainId, item.address, item.decimals, item.symbol, item.name);
    return obj;
  }, {} as Record<string, Token>);

export function fetchTokensList(_tokenListUri: string = defaultUri, chainId: ChainId = ChainId.MAINNET) {
  return async () => {
    let _tokenList = await fetch(_tokenListUri);
    let tokenListJson = await _tokenList.json();
    let filteredTokens = tokenListJson.tokens.filter((t: Token) => t.chainId === chainId);

    let ethToken = { ...WETH[chainId], logoURI: "" };
    ethToken.name = "Ethereum";
    ethToken.symbol = "ETH";
    ethToken.logoURI =
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png";

    let tokensList = [ethToken, ...filteredTokens] as never[];
    let tokens = tokenListToObject(tokensList);

    return tokens;
  };
}

export function useTokens(tokenListURI: string, chainId: ChainId = ChainId.MAINNET) {
  const [tokens, setTokens] = useState<Record<string, Token>>();

  let _tokenListUri = tokenListURI ? tokenListURI : defaultUri;

  useEffect(() => {
    const getTokens = fetchTokensList(_tokenListUri, chainId);
    getTokens().then(setTokens);
  }, [tokenListURI]);

  return tokens;
}
