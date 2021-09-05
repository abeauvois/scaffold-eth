import React, { useEffect, useState } from "react";
import { Currency } from "@uniswap/sdk";

import { ValueItem } from "../ValueItem";

import { Container, Dollar, Euro, TokensBySymbol } from "../../../types";

const euro = new Euro();
const dollar = new Dollar();

const isFiat = (currency: Currency) => [euro.symbol, dollar.symbol].indexOf(currency.symbol) >= 0;

async function getTotalAmount(
  container: Container,
  tokensBySymbol: TokensBySymbol,
  pricesBySymbol: Map<string, number>,
) {
  if (!pricesBySymbol || !tokensBySymbol) return 0;

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
              tokenOut = tokensBySymbol[containerCurrency.symbol];
              rateValueUnitsForOneContainerUnit =
                pricesBySymbol.get("EUR") / pricesBySymbol.get(containerCurrency.symbol);
              break;
            case "USD":
              rateValueUnitsForOneContainerUnit = 1 / pricesBySymbol.get("EUR");
              tokenIn = dollar;
              tokenOut = tokensBySymbol[containerCurrency.symbol];
              break;

            default:
              throw new Error(`Unkown pair ${value.currency.symbol}/${containerCurrency.symbol}`);
          }
        } else {
          switch (containerCurrency.symbol) {
            case "EUR":
              rateValueUnitsForOneContainerUnit = pricesBySymbol.get("EUR");
              tokenIn = tokensBySymbol[value.currency.symbol];
              tokenOut = euro;
              break;
            case "USD":
              rateValueUnitsForOneContainerUnit = 1 / pricesBySymbol.get("EUR");
              tokenIn = tokensBySymbol[value.currency.symbol];
              tokenOut = dollar;
              break;

            default:
              throw new Error(`Unkown pair ${containerCurrency.symbol}/${value.currency.symbol}`);
          }
        }
      }
    } else {
      tokenIn = tokensBySymbol[value.currency.symbol];
      tokenOut = tokensBySymbol[containerCurrency.symbol];
      rateValueUnitsForOneContainerUnit =
        pricesBySymbol.get(value.currency.symbol) / pricesBySymbol.get(containerCurrency.symbol);
    }

    const newValueAmount = value.amount * rateValueUnitsForOneContainerUnit;

    return acc + newValueAmount;
  }, 0);
}

interface Props {
  tokensBySymbol: TokensBySymbol;
  pricesBySymbol: Map<string, number>;
  container: Container;
  dragging: boolean;
  children: React.ReactNode;
}

function ServiceContainer({ tokensBySymbol, pricesBySymbol, container, dragging, children }: Props) {
  const [total, setTotal] = useState<number>();

  useEffect(() => {
    async function getTokens() {
      const total = await getTotalAmount(container, tokensBySymbol, pricesBySymbol);
      setTotal(total);
    }
    getTokens();
  }, [pricesBySymbol, dragging, container.values.size]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div>{children}</div>
      <div>
        <ValueItem amount={total} currency={container.currency} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#eee",
          fontSize: "120px",
        }}
      >
        <p
          style={{
            position: "absolute",
            top: 0,
            zIndex: -1,
          }}
        >
          {container.service.id}
        </p>
      </div>
    </div>
  );
}

export { ServiceContainer };
