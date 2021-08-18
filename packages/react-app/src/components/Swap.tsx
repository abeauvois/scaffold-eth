// https://raw.githubusercontent.com/austintgriffith/scaffold-eth/uniswapper/packages/react-app/src/components/Swap.jsx

import React, { useState, useEffect, Key } from "react";

import { Token, Fetcher, Trade, TokenAmount, Percent, CurrencyAmount, Currency } from "@uniswap/sdk";
import { abi as IUniswapV2Router02ABI } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { parseUnits, formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { Web3Provider } from "@ethersproject/providers";
import { Contract, ethers } from "ethers";
import { useBlockNumber, usePoller } from "eth-hooks";

import {
  Space,
  Row,
  InputNumber,
  Card,
  notification,
  Select,
  Descriptions,
  Typography,
  Button,
  Divider,
  Tooltip,
  Drawer,
  Modal,
} from "antd";

import { useTokens } from "./useTokens";

type TokenWithLogo = Token & { logoURI: string };

const { Option } = Select;
const { Text } = Typography;

export const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address _spender, uint256 _value) public returns (bool success)",
  "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
];

const makeCall = async (callName: string, contract: Record<string, any>, args: unknown[], metadata: any = {}) => {
  if (contract[callName]) {
    let result;
    if (args) {
      result = await contract[callName](...args, metadata);
    } else {
      result = await contract[callName]();
    }
    return result;
  } else {
    console.log("no call of that name!");
  }
};

let defaultToken = "ETH";
let defaultTokenOut = "DAI";
let defaultSlippage = Number("0.5");
let defaultTimeLimit = 60 * 10;

function Swap({ selectedProvider, tokenListURI }: { selectedProvider: Web3Provider; tokenListURI: string }) {
  const [tokenIn, setTokenIn] = useState(defaultToken);
  const [tokenOut, setTokenOut] = useState(defaultTokenOut);
  const [exact, setExact] = useState<"in" | "out">();
  const [amountIn, setAmountIn] = useState<BigNumber>();
  const [amountInMax, setAmountInMax] = useState<BigNumber>();
  const [amountOut, setAmountOut] = useState<BigNumber>();
  const [amountOutMin, setAmountOutMin] = useState<BigNumber>();
  const [trades, setTrades] = useState<Trade[]>();
  const [routerAllowance, setRouterAllowance] = useState<BigNumber>();
  const [balanceIn, setBalanceIn] = useState<BigNumber>();
  const [balanceOut, setBalanceOut] = useState<BigNumber>();
  const [slippageTolerance, setSlippageTolerance] = useState(
    new Percent(Math.round(defaultSlippage * 100).toString(), "10000"),
  );
  const [timeLimit, setTimeLimit] = useState(defaultTimeLimit);
  const [swapping, setSwapping] = useState(false);
  const [approving, setApproving] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [swapModalVisible, setSwapModalVisible] = useState(false);

  const [tokenList, setTokenList] = useState<Token[]>([]);

  const [invertPrice, setInvertPrice] = useState(false);

  let blockNumber = useBlockNumber(selectedProvider, 3000);

  let signer = selectedProvider.getSigner();
  let routerContract = new ethers.Contract(ROUTER_ADDRESS, IUniswapV2Router02ABI, signer);

  const { tokens } = useTokens(tokenListURI);

  const getTrades = async () => {
    if (tokens && tokenList?.[0] && tokenIn && tokenOut && (amountIn || amountOut)) {
      // @ts-ignore
      let pairs = arr => arr.map((v, i) => arr.slice(i + 1).map(w => [v, w])).flat();

      let baseTokens = tokenList
        .filter(function (t) {
          if (!t.symbol) return false;
          return ["DAI", "USDC", "USDT", "COMP", "ETH", "MKR", "LINK", tokenIn, tokenOut].includes(t.symbol);
        })
        .map(el => {
          return new Token(el.chainId, el.address, el.decimals, el.symbol, el.name);
        });

      let listOfPairwiseTokens = pairs(baseTokens);

      const getPairs = async (list: Record<string, Token>[]) => {
        let listOfPromises = list.map((item: Record<string, Token>) =>
          Fetcher.fetchPairData(item[0], item[1], selectedProvider),
        );
        return Promise.all(listOfPromises.map(p => p.catch(() => null)));
      };

      let listOfPairs = await getPairs(listOfPairwiseTokens);

      let bestTrade;

      if (exact === "in") {
        setAmountInMax(BigNumber.from(0));

        const tokenInValue = tokens?.[tokenIn];

        if (tokenInValue && amountIn) {
          const tokenAmount = new TokenAmount(
            tokenInValue,
            parseUnits(amountIn.toString(), tokenInValue?.decimals).toBigInt(),
          );
          bestTrade = Trade.bestTradeExactIn(
            // @ts-ignore
            listOfPairs.filter(item => Boolean(item)),
            tokenAmount,
            tokens?.[tokenOut],
          );
          if (bestTrade[0]) {
            setAmountOut(BigNumber.from(bestTrade[0].outputAmount.toSignificant(6)));
          } else {
            setAmountOut(BigNumber.from(0));
          }
        }
      } else if (exact === "out") {
        setAmountOutMin(BigNumber.from(0));

        const tokenOutValue = tokens[tokenOut] as Token;

        if (tokenOutValue && amountOut) {
          const tokenAmountOut = new TokenAmount(
            tokenOutValue,
            parseUnits(amountOut.toString(), tokenOutValue?.decimals).toBigInt(),
          );
          bestTrade = Trade.bestTradeExactOut(
            // @ts-ignore
            listOfPairs.filter(item => item),
            tokenOutValue,
            tokenAmountOut,
          );
          if (bestTrade[0]) {
            setAmountIn(BigNumber.from(bestTrade[0].inputAmount.toSignificant(6)));
          } else {
            setAmountIn(BigNumber.from(0));
          }
        }
      }

      setTrades(bestTrade);

      console.log(bestTrade);
    }
  };

  useEffect(() => {
    getTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenIn, tokenOut, amountIn, amountOut, slippageTolerance, selectedProvider]);

  useEffect(() => {
    if (trades && trades[0]) {
      if (exact === "in") {
        setAmountOutMin(BigNumber.from(trades[0].minimumAmountOut(slippageTolerance)));
      } else if (exact === "out") {
        setAmountInMax(BigNumber.from(trades[0].maximumAmountIn(slippageTolerance)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slippageTolerance, amountIn, amountOut, trades]);

  const getBalance = async (_token: string, _account: string, _contract: Contract) => {
    let newBalance;
    if (_token === "ETH") {
      newBalance = await selectedProvider.getBalance(_account);
    } else {
      newBalance = await makeCall("balanceOf", _contract, [_account]);
    }
    return newBalance;
  };

  const getAccountInfo = async () => {
    if (tokens) {
      let accountList = await selectedProvider.listAccounts();

      if (tokenIn) {
        let tempContractIn = new ethers.Contract(tokens[tokenIn].address, erc20Abi, selectedProvider);
        let newBalanceIn = await getBalance(tokenIn, accountList[0], tempContractIn);
        setBalanceIn(newBalanceIn);

        let allowance;

        if (tokenIn === "ETH") {
          setRouterAllowance(undefined);
        } else {
          allowance = await makeCall("allowance", tempContractIn, [accountList[0], ROUTER_ADDRESS]);
          setRouterAllowance(allowance);
        }
      }

      if (tokenOut) {
        let tempContractOut = new ethers.Contract(tokens[tokenOut].address, erc20Abi, selectedProvider);
        let newBalanceOut = await getBalance(tokenOut, accountList[0], tempContractOut);
        setBalanceOut(newBalanceOut);
      }
    }
  };

  usePoller(getAccountInfo, 6000);

  let route = trades
    ? trades.length > 0
      ? trades[0].route.path.map(function (item) {
          return item["symbol"];
        })
      : []
    : [];

  const updateRouterAllowance = async (newAllowance: unknown) => {
    if (!tokens) return false;
    setApproving(true);
    try {
      let tempContract = new ethers.Contract(tokens[tokenIn].address, erc20Abi, signer);
      let result = await makeCall("approve", tempContract, [ROUTER_ADDRESS, newAllowance]);
      console.log(result);
      setApproving(false);
      return true;
    } catch (e) {
      notification.open({
        message: "Approval unsuccessful",
        description: `Error: ${e.message}`,
      });
    }
  };

  const approveRouter = async () => {
    if (!tokens || !amountIn || !amountInMax) return false;
    let approvalAmount =
      exact === "in"
        ? ethers.utils.hexlify(parseUnits(amountIn.toString(), tokens[tokenIn].decimals))
        : amountInMax.toString();
    console.log(approvalAmount);
    let approval = await updateRouterAllowance(approvalAmount);
    if (approval) {
      notification.open({
        message: "Token transfer approved",
        description: `You can now swap up to ${amountIn} ${tokenIn}`,
      });
    }
  };

  const removeRouterAllowance = async () => {
    let approvalAmount = ethers.utils.hexlify(0);
    console.log(approvalAmount);
    let removal = await updateRouterAllowance(approvalAmount);
    if (removal) {
      notification.open({
        message: "Token approval removed",
        description: `The router is no longer approved for ${tokenIn}`,
      });
    }
  };

  const executeSwap = async () => {
    if (!tokens || !trades || !amountIn || !amountOut || !amountOutMin || !amountInMax) return false;
    setSwapping(true);
    try {
      let args;
      let metadata = {} as { value: string };

      let call;
      let deadline = Math.floor(Date.now() / 1000) + timeLimit;
      let path = trades[0].route.path.map(function (item) {
        return item["address"];
      });
      console.log(path);
      let accountList = await selectedProvider.listAccounts();
      let address = accountList[0];

      if (exact === "in") {
        let _amountIn = ethers.utils.hexlify(parseUnits(amountIn.toString(), tokens[tokenIn].decimals));
        let _amountOutMin = ethers.utils.hexlify(ethers.BigNumber.from(amountOutMin.toString()));
        if (tokenIn === "ETH") {
          call = "swapExactETHForTokens";
          args = [_amountOutMin, path, address, deadline];
          metadata["value"] = _amountIn;
        } else {
          call = tokenOut === "ETH" ? "swapExactTokensForETH" : "swapExactTokensForTokens";
          args = [_amountIn, _amountOutMin, path, address, deadline];
        }
      } else if (exact === "out") {
        let _amountOut = ethers.utils.hexlify(parseUnits(amountOut.toString(), tokens[tokenOut].decimals));
        let _amountInMax = ethers.utils.hexlify(ethers.BigNumber.from(amountInMax.toString()));
        if (tokenIn === "ETH") {
          call = "swapETHForExactTokens";
          args = [_amountOut, path, address, deadline];
          metadata["value"] = _amountInMax;
        } else {
          call = tokenOut === "ETH" ? "swapTokensForExactETH" : "swapTokensForExactTokens";
          args = [_amountOut, _amountInMax, path, address, deadline];
        }
      }
      console.log(call, args, metadata);

      if (!call || !args) return false;
      let result = await makeCall(call, routerContract, args, metadata);
      console.log(result);
      notification.open({
        message: "Swap complete 🦄",
        description: (
          <>
            <Text>{`Swapped ${tokenIn} for ${tokenOut}, transaction: `}</Text>
            <Text copyable>{result.hash}</Text>
          </>
        ),
      });
      setSwapping(false);
    } catch (e) {
      console.log(e);
      setSwapping(false);
      notification.open({
        message: "Swap unsuccessful",
        description: `Error: ${e.message}`,
      });
    }
  };

  const showSwapModal = () => {
    setSwapModalVisible(true);
  };

  const handleSwapModalOk = () => {
    setSwapModalVisible(false);
    executeSwap();
  };

  const handleSwapModalCancel = () => {
    setSwapModalVisible(false);
  };

  if (!tokens || !amountIn || !amountInMax || !balanceIn || !routerAllowance) return false;

  const formattedBalance = formatUnits(balanceIn.toBigInt(), tokens[tokenIn].decimals);
  const formattedAllowance = formatUnits(routerAllowance.toBigInt(), tokens[tokenIn].decimals);

  let insufficientBalance = balanceIn ? amountIn.gte(parseFloat(formattedBalance)) : null;
  let inputIsToken = tokenIn !== "ETH";
  let insufficientAllowance = !inputIsToken
    ? false
    : routerAllowance
    ? amountIn.gte(parseFloat(formattedAllowance))
    : null;
  let formattedBalanceIn = balanceIn
    ? parseFloat(formatUnits(balanceIn, tokens[tokenIn].decimals)).toPrecision(6)
    : null;
  let formattedBalanceOut = balanceOut
    ? parseFloat(formatUnits(balanceOut, tokens[tokenOut].decimals)).toPrecision(6)
    : null;

  let metaIn: TokenWithLogo | null =
    tokens && tokenList && tokenIn
      ? (tokenList.filter(function (t) {
          return t.address === tokens[tokenIn].address;
        })[0] as TokenWithLogo)
      : null;
  let metaOut: TokenWithLogo | null =
    tokens && tokenList && tokenOut
      ? (tokenList.filter(function (t) {
          return t.address === tokens[tokenOut].address;
        })[0] as TokenWithLogo)
      : null;

  const cleanIpfsURI = (uri: string) => {
    try {
      return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    } catch (e) {
      console.log(e, uri);
      return uri;
    }
  };

  let logoIn = metaIn ? cleanIpfsURI(metaIn.logoURI) : undefined;
  let logoOut = metaOut ? cleanIpfsURI(metaOut.logoURI) : undefined;

  const amountInt = BigNumber.from(formatUnits(balanceIn.toBigInt(), tokens[tokenIn].decimals));

  let rawPrice = trades && trades[0] ? trades[0].executionPrice : null;
  let price = rawPrice ? rawPrice.toSignificant(7) : null;
  let priceDescription = rawPrice
    ? invertPrice
      ? `${rawPrice.invert().toSignificant(7)} ${tokenIn} per ${tokenOut}`
      : `${price} ${tokenOut} per ${tokenIn}`
    : null;

  let priceWidget = (
    <Space>
      <Text type="secondary">{priceDescription}</Text>
      <Button
        type="text"
        onClick={() => {
          setInvertPrice(!invertPrice);
        }}
      ></Button>
    </Space>
  );

  let swapModal = (
    <Modal title="Confirm swap" visible={swapModalVisible} onOk={handleSwapModalOk} onCancel={handleSwapModalCancel}>
      <Row>
        <Space>
          <img src={logoIn} alt={logoIn} width="30" />
          {amountIn}
          {tokenIn}
        </Space>
      </Row>
      <Row justify="center" align="middle" style={{ width: 30 }}>
        <span>↓</span>
      </Row>
      <Row>
        <Space>
          <img src={logoOut} alt={logoOut} width="30" />
          {amountOut}
          {tokenOut}
        </Space>
      </Row>
      <Divider />
      <Row>{priceWidget}</Row>
      <Row>
        {trades && (amountOutMin || amountInMax)
          ? exact === "in"
            ? `Output is estimated. You will receive at least ${amountOutMin?.toString()} ${tokenOut} or the transaction will revert.`
            : `Input is estimated. You will sell at most ${amountInMax.toString()} ${tokenIn} or the transaction will revert.`
          : null}
      </Row>
    </Modal>
  );

  return (
    <Card
      title={
        <Space>
          <img src="https://ipfs.io/ipfs/QmXttGpZrECX5qCyXbBQiqgQNytVGeZW5Anewvh2jc4psg" width="40" alt="uniswapLogo" />
          <Typography>Uniswapper</Typography>
        </Space>
      }
      extra={
        <Button
          type="text"
          onClick={() => {
            setSettingsVisible(true);
          }}
        ></Button>
      }
    >
      <Space direction="vertical">
        <Row justify="center" align="middle">
          <Card
            size="small"
            type="inner"
            title={`From${exact === "out" && tokenIn && tokenOut ? " (estimate)" : ""}`}
            extra={
              <>
                <img src={logoIn} alt={logoIn} width="30" />
                <Button
                  type="link"
                  onClick={() => {
                    setAmountOut(BigNumber.from(0));
                    setAmountIn(amountInt);
                    setAmountOutMin(BigNumber.from(0));
                    setAmountInMax(BigNumber.from(0));
                    setExact("in");
                  }}
                >
                  {formattedBalanceIn}
                </Button>
              </>
            }
            style={{ width: 400, textAlign: "left" }}
          >
            <InputNumber
              style={{ width: "160px" }}
              min={0}
              size={"large"}
              value={amountIn.toNumber()}
              onChange={(e: string | number) => {
                setAmountOut(BigNumber.from(0));
                setTrades(undefined);
                setAmountIn(BigNumber.from(e));
                setExact("in");
              }}
            />
            <Select
              showSearch
              value={tokenIn}
              style={{ width: "120px" }}
              size={"large"}
              bordered={false}
              defaultValue={defaultToken}
              onChange={(value: string) => {
                console.log(value);
                if (value === tokenOut) {
                  console.log("switch!", tokenIn);
                  setTokenOut(tokenIn);
                  setAmountOut(amountIn);
                  setBalanceOut(balanceIn);
                }
                setTokenIn(value);
                setTrades(undefined);
                setAmountIn(BigNumber.from(0));
                setExact("out");
                setBalanceIn(BigNumber.from(0));
              }}
              filterOption={(input: string, option: any) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              optionFilterProp="children"
            >
              {tokenList.map(token => (
                <Option key={token.symbol} value={token.symbol as Key}>
                  {token.symbol}
                </Option>
              ))}
            </Select>
          </Card>
        </Row>
        <Row justify="center" align="middle">
          <Tooltip title={route.join("->")}>
            <span>↓</span>
          </Tooltip>
        </Row>
        <Row justify="center" align="middle">
          <Card
            size="small"
            type="inner"
            title={`To${exact === "in" && tokenIn && tokenOut ? " (estimate)" : ""}`}
            extra={
              <>
                <img src={logoOut} width="30" alt={logoOut} />
                <Button type="text">{formattedBalanceOut}</Button>
              </>
            }
            style={{ width: 400, textAlign: "left" }}
          >
            <InputNumber
              style={{ width: "160px" }}
              size={"large"}
              min={0}
              value={amountOut.toNumber()}
              onChange={(e: string | number) => {
                setAmountOut(BigNumber.from(e));
                setAmountIn(BigNumber.from(0));
                setTrades(undefined);
                setExact("out");
              }}
            />
            <Select
              showSearch
              value={tokenOut}
              style={{ width: "120px" }}
              size={"large"}
              bordered={false}
              onChange={(value: string) => {
                console.log(value, tokenIn, tokenOut);
                if (value === tokenIn) {
                  console.log("switch!", tokenOut);
                  setTokenIn(tokenOut);
                  setAmountIn(amountOut);
                  setBalanceIn(balanceOut);
                }
                setTokenOut(value);
                setExact("in");
                setAmountOut(BigNumber.from(0));
                setTrades(undefined);
                setBalanceOut(BigNumber.from(0));
              }}
              filterOption={(input: string, option: any) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              optionFilterProp="children"
            >
              {tokenList.map(token => (
                <Option key={token.symbol} value={token.symbol as Key}>
                  {token.symbol}
                </Option>
              ))}
            </Select>
          </Card>
        </Row>
        <Row justify="center" align="middle">
          {priceDescription ? priceWidget : null}
        </Row>
        <Row justify="center" align="middle">
          <Space>
            {inputIsToken ? (
              <Button size="large" loading={approving} disabled={!insufficientAllowance} onClick={approveRouter}>
                {!insufficientAllowance && amountIn && amountOut ? "Approved" : "Approve"}
              </Button>
            ) : null}
            <Button
              size="large"
              loading={swapping}
              disabled={insufficientAllowance || insufficientBalance || !amountIn || !amountOut}
              onClick={showSwapModal}
            >
              {insufficientBalance ? "Insufficient balance" : "Swap!"}
            </Button>
            {swapModal}
          </Space>
        </Row>
      </Space>
      <Drawer
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
        }}
        width={500}
      >
        <Descriptions title="Details" column={1} style={{ textAlign: "left" }}>
          <Descriptions.Item label="blockNumber">{blockNumber}</Descriptions.Item>
          <Descriptions.Item label="routerAllowance">
            <Space>
              {routerAllowance ? formatUnits(routerAllowance, tokens[tokenIn].decimals) : null}
              {routerAllowance.gt(0) ? <Button onClick={removeRouterAllowance}>Remove Allowance</Button> : null}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="route">{route.join("->")}</Descriptions.Item>
          <Descriptions.Item label="exact">{exact}</Descriptions.Item>
          <Descriptions.Item label="bestPrice">
            {trades ? (trades.length > 0 ? trades[0].executionPrice.toSignificant(6) : null) : null}
          </Descriptions.Item>
          <Descriptions.Item label="nextMidPrice">
            {trades ? (trades.length > 0 ? trades[0].nextMidPrice.toSignificant(6) : null) : null}
          </Descriptions.Item>
          <Descriptions.Item label="priceImpact">
            {trades ? (trades.length > 0 ? trades[0].priceImpact.toSignificant(6) : null) : null}
          </Descriptions.Item>
          <Descriptions.Item label="slippageTolerance">
            {
              <InputNumber
                defaultValue={defaultSlippage}
                min={0}
                max={100}
                precision={2}
                formatter={(value: string | number) => `${value}%`}
                parser={(value: string | undefined) => (value ? value.replace("%", "") : "")}
                onChange={(value: string | number) => {
                  console.log(value);

                  let slippagePercent = new Percent(Math.round(+value * 100).toString(), "10000");
                  setSlippageTolerance(slippagePercent);
                }}
              />
            }
          </Descriptions.Item>
          <Descriptions.Item label="amountInMax">{amountInMax ? amountInMax.toString() : null}</Descriptions.Item>
          <Descriptions.Item label="amountOutMin">{amountOutMin ? amountOutMin.toString() : null}</Descriptions.Item>
          <Descriptions.Item label="timeLimitInSeconds">
            {
              <InputNumber
                min={0}
                max={3600}
                defaultValue={defaultTimeLimit}
                onChange={(value: string | number) => {
                  console.log(value);
                  setTimeLimit(Number(value));
                }}
              />
            }
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </Card>
  );
}

export default Swap;
