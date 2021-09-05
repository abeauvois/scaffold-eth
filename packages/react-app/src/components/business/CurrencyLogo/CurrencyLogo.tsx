import React, { useState } from "react";
import { Currency } from "@uniswap/sdk";
import { Icon, InlineIcon } from "@iconify/react";

// npm install --save-dev @iconify/react @iconify-icons/ic
import baselineEuroSymbol from "@iconify-icons/oi/euro";

import styled from "styled-components";

import { FiatCode, Token } from "../../../types";

// import EthereumLogo from "../../../../public/";
// import EthereumLogo from "../public/eth-diamond-purple.png";

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;

const getTokenLogoURL1inch = (address: string) => `https://tokens.1inch.exchange/${address.toLowerCase()}.png`;

const BAD_URIS: { [tokenAddress: string]: true } = {};
const FALLBACK_URIS: { [tokenAddress: string]: string } = {};

const Image = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 24px;
  border: 4px solid #fff;
  box-sizing: content-box;
`;

const Emoji = styled.span<{ size?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  margin-bottom: -4px;
`;

const StyledEthereumLogo = styled.span<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 24px;
  border: 4px solid #fff;
  box-sizing: content-box;
  background: #b0d2f3;
`;

const StyledEuroLogo = styled.div<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  font-size: 0.7rem;
  background: #30a0a0;
  color: #fff;
  border-radius: 24px;
  border: 4px solid #fff;
  box-sizing: content-box;
`;

function CurrencyLogo({
  currency,
  size = "24px",
  ...rest
}: {
  currency: Currency;
  size?: string;
  style?: React.CSSProperties;
}) {
  const [, refresh] = useState<number>(0);

  if (currency.symbol === "ETH") {
    return (
      <StyledEthereumLogo children={<div style={{ transform: "translateY(17%)" }}>Ξ</div>} size={size} {...rest} />
    );
  }

  if (currency instanceof Currency) {
    if (currency.name === FiatCode.EUR)
      return (
        <StyledEuroLogo size="24px">
          <Icon icon={baselineEuroSymbol} style={{ transform: "translate3d(0,40%, 0)" }} />
        </StyledEuroLogo>
      );
  }

  if (currency instanceof Token) {
    let uri: string | undefined;

    if (!uri) {
      const defaultUri = getTokenLogoURL(currency.address);
      if (!BAD_URIS[defaultUri]) {
        uri = defaultUri;
      }
      if (FALLBACK_URIS[currency.address]) {
        uri = FALLBACK_URIS[currency.address];
      }
    }

    if (uri) {
      return (
        <Image
          {...rest}
          alt={`${currency.name} Logo`}
          src={uri}
          size={size}
          onError={() => {
            if (currency instanceof Token) {
              uri && (BAD_URIS[uri] = true);
              FALLBACK_URIS[currency.address] = getTokenLogoURL1inch(currency.address);
            }
            refresh(i => i + 1);
          }}
        />
      );
    }
  }

  return (
    <Emoji {...rest} size={size}>
      <span role="img" aria-label="Thinking">
        🤔
      </span>
    </Emoji>
  );
}

export { CurrencyLogo };
