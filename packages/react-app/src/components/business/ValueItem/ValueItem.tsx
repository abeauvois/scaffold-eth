import React from "react";
import { Currency } from "@uniswap/sdk";
import classNames from "classnames";
import { Typography } from "antd";

import { CurrencyLogo } from "../CurrencyLogo";

import styles from "./ValueItem.module.css";

const { Paragraph } = Typography;

type Props = { amount: number; currency: Currency; isTotal?: boolean };

export function ValueItem({ amount, currency, isTotal }: Props) {
  return (
    <div className={classNames(isTotal ? styles.Total : styles.ValueItem)}>
      <CurrencyLogo currency={currency} />
      <p style={{ fontSize: "x-large", margin: 0 }}>{amount?.toFixed(2)}</p>
    </div>
  );
}
