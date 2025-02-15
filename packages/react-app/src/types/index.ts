import { Token, ChainId, Currency } from "@uniswap/sdk";

export enum FiatCode {
  USD = "USD",
  EUR = "EUR",
}

export class Euro extends Currency {
  constructor() {
    super(2, "EUR", FiatCode.EUR);
  }
}

export class Dollar extends Currency {
  constructor() {
    super(2, "USD", FiatCode.USD);
  }
}

export { Token, ChainId };

export type Service = {
  id: "BANK" | "SWAP" | "STAKE" | "POOL";
};

export type Value = {
  id: string;
  amount: number;
  currency: Currency;
  parentId?: string;
};

export type Container = {
  id: string;
  service: Service;
  displayName: string;
  currency: Currency;
  values: Map<string, Value>;
};

export type Containers = Map<string, Container>;
export type Values = Map<string, Value>;

export type TokensBySymbol = Record<string, Token>;
