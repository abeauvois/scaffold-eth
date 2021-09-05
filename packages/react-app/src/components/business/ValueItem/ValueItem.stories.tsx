import React from "react";

import { Story, Meta } from "@storybook/react";

import { ValueItem } from "../ValueItem";
import { NATIVE, USDC } from "../../../data/Tokens";
import * as Types from "../../../types";

const nativeToken = NATIVE(Types.ChainId.MAINNET) as Types.Token;

export default {
  component: ValueItem,
  title: "Components/ValueItem",
} as Meta;

//👇 We create a “template” of how args map to rendering
const Template = args => <ValueItem {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  amount: 230,
  currency: USDC,
};
