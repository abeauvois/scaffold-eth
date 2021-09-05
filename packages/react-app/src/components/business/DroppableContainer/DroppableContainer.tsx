import React from "react";
import { useDroppable } from "@dnd-kit/core";
import classNames from "classnames";

import styles from "./DroppableContainer.module.css";

import { Container } from "../../../types";

// import { fetchPair, useUniswapPairPrice, WETH, DAI } from "./useUniswapPairPrice";
// const getTrades = async (
//   selectedProvider: JsonRpcProvider,
//   tokensBySymbol: Record<string, Token>,
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

interface Props {
  container: Container;
  dragging: boolean;
  children: React.ReactNode;
}

function DroppableContainer({ container, dragging, children }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: container.id });

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
    </div>
  );
}

export { DroppableContainer };
