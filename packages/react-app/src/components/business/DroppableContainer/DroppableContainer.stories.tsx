import React from "react";

import { Meta } from "@storybook/react";

import { DroppableContainer } from "./DroppableContainer";

import { NATIVE, USDC } from "../../../data/Tokens";
import * as Types from "../../../types";
import { ValueItem } from "../ValueItem";
import { DraggableValue } from "../DraggableValue";

const nativeToken = NATIVE(Types.ChainId.MAINNET) as Types.Token;

export default {
  component: DroppableContainer,
  title: "Components/DroppableContainer",
} as Meta;

const Template = args => <DroppableContainer {...args} />;

export const Primary = Template.bind({});

const container: Types.Container = {
  id: USDC.address,
  service: { id: "SWAP" },
  displayName: USDC.symbol,
  currency: USDC,
  values: new Map<string, Types.Value>(),
};

container.values.set("v1", {
  id: "v1",
  amount: 240,
  currency: nativeToken,
  parentId: USDC.address,
});

Primary.args = {
  container,
  tokensBySymbol: {
    [nativeToken.symbol]: {
      ...nativeToken,
    },
    USDC: {
      symbol: "USDC",
    },
  },
  pricesBySymbol: new Map<string, number>([
    [nativeToken.symbol, 90],
    ["USDC", 90],
  ]),
  dragging: false,
  children: Array.from(container.values).map(([valueId, value]) => {
    return (
      <DraggableValue key={valueId} id={valueId} dragging={false}>
        <ValueItem amount={value.amount} currency={value.currency} />
      </DraggableValue>
    );
  }),
  label: "Value",
};
