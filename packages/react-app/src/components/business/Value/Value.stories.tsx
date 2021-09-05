import React from "react";

import { Meta } from "@storybook/react";

import { Value } from "./Value";
import { ValueItem } from "../ValueItem";
import { NATIVE, USDC } from "../../../data/Tokens";
import * as Types from "../../../types";

const nativeToken = NATIVE(Types.ChainId.MAINNET) as Types.Token;

export default {
  component: Value,
  title: "Components/Value",
} as Meta;

const Template = args => <Value {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  children: <ValueItem amount={230} currency={USDC} />,
  label: "Value",
};
