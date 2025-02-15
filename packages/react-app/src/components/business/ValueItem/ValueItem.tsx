import React from "react";
import { Currency } from "@uniswap/sdk";
import { Typography } from "antd";

import { CurrencyLogo } from "../CurrencyLogo";

import styles from "./ValueItem.module.css";

type Props = { amount: number; currency: Currency };

export function ValueItem({ amount, currency }: Props) {
  return (
    <div className={styles.ValueItem}>
      <CurrencyLogo currency={currency} />
      <p style={{ fontSize: "x-large", margin: "0 0 0 5px" }}>{amount?.toFixed(2)}</p>
    </div>
  );
}
