import React, { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Currency } from "@uniswap/sdk";
import classNames from "classnames";
// import { BigNumber } from "ethers";

import styles from "./DroppableContainer.module.css";

import { ValueItem } from "../ValueItem";

import { Container, Dollar, Euro, TokensById } from "../../../types";

// import { fetchPair, useUniswapPairPrice, WETH, DAI } from "./useUniswapPairPrice";
import useNomics from "./nomics";

// const getTrades = async (
//   selectedProvider: JsonRpcProvider,
//   tokensById: Record<string, Token>,
//   tokenList: Token[],
//   tokenIn = "ETH",
//   tokenOut = "DAI",
//   amountIn: BigNumber,
//   amountOut: BigNumber,
// ) => {
//   if (tokens && tokenList?.[0] && tokenIn && tokenOut && (amountIn || amountOut)) {
//     // @ts-ignore
//     let pairs = arr => arr.map((v, i) => arr.slice(i + 1).map(w => [v, w])).flat();

//     let baseTokens = tokenList
//       .filter(function (t) {
//         if (!t.symbol) return false;
//         return ["DAI", "USDC", "USDT", "COMP", "ETH", "MKR", "LINK", tokenIn, tokenOut].includes(t.symbol);
//       })
//       .map(el => {
//         return new Token(el.chainId, el.address, el.decimals, el.symbol, el.symbol);
//       });

//     let listOfPairwiseTokens = pairs(baseTokens);

//     const getPairs = async (list: Record<string, Token>[]) => {
//       let listOfPromises = list.map((item: Record<string, Token>) =>
//         Fetcher.fetchPairData(item[0], item[1], selectedProvider),
//       );
//       return Promise.all(listOfPromises.map(p => p.catch(() => null)));
//     };

//     let listOfPairs = await getPairs(listOfPairwiseTokens);

//     let bestTrade;

//     if (exact === "in") {
//       setAmountInMax(BigNumber.from(0));

//       const tokenInValue = tokens?.[tokenIn];

//       if (tokenInValue && amountIn) {
//         const tokenAmount = new TokenAmount(
//           tokenInValue,
//           parseUnits(amountIn.toString(), tokenInValue?.decimals).toBigInt(),
//         );
//         bestTrade = Trade.bestTradeExactIn(
//           // @ts-ignore
//           listOfPairs.filter(item => Boolean(item)),
//           tokenAmount,
//           tokens?.[tokenOut],
//         );
//         if (bestTrade[0]) {
//           setAmountOut(BigNumber.from(bestTrade[0].outputAmount.toSignificant(6)));
//         } else {
//           setAmountOut(BigNumber.from(0));
//         }
//       }
//     } else if (exact === "out") {
//       setAmountOutMin(BigNumber.from(0));

//       const tokenOutValue = tokens[tokenOut] as Token;

//       if (tokenOutValue && amountOut) {
//         const tokenAmountOut = new TokenAmount(
//           tokenOutValue,
//           parseUnits(amountOut.toString(), tokenOutValue?.decimals).toBigInt(),
//         );
//         bestTrade = Trade.bestTradeExactOut(
//           // @ts-ignore
//           listOfPairs.filter(item => item),
//           tokenOutValue,
//           tokenAmountOut,
//         );
//         if (bestTrade[0]) {
//           setAmountIn(BigNumber.from(bestTrade[0].inputAmount.toSignificant(6)));
//         } else {
//           setAmountIn(BigNumber.from(0));
//         }
//       }
//     }

//     setTrades(bestTrade);

//     console.log(bestTrade);
//   }
// };

const euro = new Euro();
const dollar = new Dollar();

const isFiat = (currency: Currency) => [euro.symbol, dollar.symbol].indexOf(currency.symbol) >= 0;

async function getTotalAmount(container: Container, tokensById: TokensById, pricesBySymbol: Map<string, number>) {
  console.log(
    "🚀 ~ file: DroppableContainer.tsx ~ line 112 ~ getTotalAmount ~ container.currency",
    container.currency.symbol,
    container.values.size,
  );
  if (!pricesBySymbol) return 0;

  const values = container.values;
  const containerCurrency = container.currency;

  let rateValueUnitsForOneContainerUnit = 1;
  let tokenIn, tokenOut;

  return Array.from(values).reduce((acc, curr) => {
    const [name, value] = curr;

    if (isFiat(value.currency) || isFiat(containerCurrency)) {
      if (isFiat(value.currency) && isFiat(containerCurrency)) {
        switch (value.currency.symbol) {
          case "EUR":
            rateValueUnitsForOneContainerUnit = pricesBySymbol.get("EUR");
            tokenIn = euro;
            tokenOut = dollar;
            break;
          case "USD":
            rateValueUnitsForOneContainerUnit = 1 / pricesBySymbol.get("EUR");
            tokenIn = dollar;
            tokenOut = euro;
            break;

          default:
            throw new Error(`Unkown fiat pair ${value.currency.symbol}/${containerCurrency.symbol}`);
        }
      } else {
        if (isFiat(value.currency)) {
          switch (value.currency.symbol) {
            case "EUR":
              tokenIn = euro;
              tokenOut = tokensById[containerCurrency.symbol];
              rateValueUnitsForOneContainerUnit =
                pricesBySymbol.get("EUR") / pricesBySymbol.get(containerCurrency.symbol);
              // console.log(
              //   "🚀 ~ file: DroppableContainer.tsx ~ line 148 ~ returnArray.from ~ rateValueUnitsForOneContainerUnit",
              //   pricesBySymbol.get("EUR"),
              //   pricesBySymbol.get(containerCurrency.symbol),
              //   rateValueUnitsForOneContainerUnit,
              // );
              break;
            case "USD":
              rateValueUnitsForOneContainerUnit = 1 / pricesBySymbol.get("EUR");
              tokenIn = dollar;
              tokenOut = tokensById[containerCurrency.symbol];
              break;

            default:
              throw new Error(`Unkown pair ${value.currency.symbol}/${containerCurrency.symbol}`);
          }
        } else {
          switch (containerCurrency.symbol) {
            case "EUR":
              rateValueUnitsForOneContainerUnit = pricesBySymbol.get("EUR");
              tokenIn = tokensById[value.currency.symbol];
              tokenOut = euro;
              break;
            case "USD":
              rateValueUnitsForOneContainerUnit = 1 / pricesBySymbol.get("EUR");
              tokenIn = tokensById[value.currency.symbol];
              tokenOut = dollar;
              break;

            default:
              throw new Error(`Unkown pair ${containerCurrency.symbol}/${value.currency.symbol}`);
          }
        }
      }
    } else {
      tokenIn = tokensById[value.currency.symbol];
      tokenOut = tokensById[containerCurrency.symbol];
    }
    // console.log(
    //   "🚀 ~ file: DroppableContainer.tsx ~ line 178 ~ returnArray.from ~ curr",
    //   curr,
    //   tokenIn,
    //   tokenOut,
    //   rateValueUnitsForOneContainerUnit,
    // );
    // const tokenOut = container.currency.symbol
    // const pair = fetchPair(tokenIn, tokenOut)
    const newValueAmount = value.amount * rateValueUnitsForOneContainerUnit;

    return acc + newValueAmount;
  }, 0);
}

interface Props {
  tokensById: TokensById;
  container: Container;
  dragging: boolean;
  children: React.ReactNode;
}

export function DroppableContainer({ tokensById, container, dragging, children }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: container.id });

  const { pricesBySymbolMap } = useNomics();
  const [total, setTotal] = useState<number>();
  // const { numberTokenInForOneTokenOut } = useUniswapPairPrice(DAI, container.currency.symbol);

  useEffect(() => {
    // console.log("line 213 ~ DroppableContainer ~ symbol", container.currency.symbol);
    async function getTokens() {
      const total = await getTotalAmount(container, tokensById, pricesBySymbolMap);
      setTotal(total);
    }
    getTokens();
  }, [isOver, pricesBySymbolMap, dragging]);

  return (
    <div
      ref={setNodeRef}
      className={classNames(
        styles.DroppableContainer,
        isOver && styles.over,
        dragging && styles.dragging,
        children && styles.dropped,
      )}
      aria-label="DroppableContainer region"
    >
      {children}
      <ValueItem amount={total} currency={container.currency} />
    </div>
  );
}
