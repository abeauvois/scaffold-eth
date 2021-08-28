/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useState } from "react";
import { DndContext, DragOverlay, useDraggable } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import shortUUID from "short-uuid";

import { Row, Col, Button } from "antd";

// import { utils } from "ethers";
// import { Address, Balance } from "../components";

import { capitalize } from "../helpers";

import { ValueItem, DroppableContainer, Value, EtherInput } from "../components";
import { DAI, USDC, OtherChainId, NATIVE } from "../data/Tokens";
import * as Types from "../types";

import { fetchTokensList } from "../components/useTokens";
import { Currency } from "@uniswap/sdk";
import useNomics from "../components/business/DroppableContainer/nomics";

const nativeToken = NATIVE(Types.ChainId.MAINNET) as Types.Token;

const bankContainer: Types.Container = {
  id: nativeToken.address,
  service: { id: "BANK" },
  displayName: capitalize(nativeToken.symbol as string),
  currency: nativeToken,
  values: new Map<string, Types.Value>(),
};

const swapDaiContainer: Types.Container = {
  id: DAI.address,
  service: { id: "SWAP" },
  displayName: capitalize(DAI.symbol as string),
  currency: DAI,
  values: new Map<string, Types.Value>(),
};

const swapUsdcContainer: Types.Container = {
  id: USDC.address,
  service: { id: "SWAP" },
  displayName: capitalize(USDC.symbol as string),
  currency: USDC,
  values: new Map<string, Types.Value>(),
};

const value1 = {
  id: "item1",
  amount: 200,
  currency: new Types.Euro(),
};

function createValue({ amount, currency }: { amount: number; currency?: Currency }): Types.Value {
  return {
    id: shortUUID.generate(),
    amount,
    currency: currency || nativeToken,
  };
}

function useHomeState() {
  const [containers, setContainers] = useState<Types.Containers>();
  const [values, setValues] = useState<Types.Values>();
  const [draggingValueId, setDraggingValueId] = useState<Types.Value["id"]>();
  const [dropContainerId, setDropContainerId] = useState<Types.Container["id"]>();
  const [tokensBySymbol, setTokensBySymbol] = useState<Types.TokensBySymbol>();

  const { pricesBySymbol } = useNomics();

  // Update state
  function move(valueId: Types.Value["id"], toContainerId: Types.Container["id"]) {
    if (!valueId || !toContainerId)
      throw Error(`Missing parameters : valueId(${valueId}) or toContainerId(${toContainerId})`);

    // Get current state
    const value = values?.get(valueId);
    // Get "fromContainer" from current value parent container
    const fromContainer = value?.parentId && containers?.get(value.parentId);
    const toContainer = containers?.get(toContainerId);

    // Remove valueId from current parent "fromContainer"
    fromContainer && fromContainer.values.delete(valueId);

    // Transfer valueId to new parent "toContainer"
    if (value && toContainer) {
      value.parentId = toContainerId;
      toContainer.values.set(valueId, value);
    }

    // Reset values and containers with new state
    if (values && containers) {
      setContainers(new Map(containers));
      setValues(new Map(values));
    }
  }

  // Values state initalization
  useEffect(() => {
    const initialValues = new Map<string, Types.Value>([[value1.id, value1]]);
    setValues(initialValues);
  }, []);

  // Containers state initalization
  useEffect(() => {
    const initialContainers = new Map<string, Types.Container>([
      [bankContainer.id, bankContainer],
      [swapDaiContainer.id, swapDaiContainer],
      [swapUsdcContainer.id, swapUsdcContainer],
    ]);
    setContainers(initialContainers);
  }, []);
  useEffect(() => {
    setDraggingValueId(value1.id);
  }, []);
  useEffect(() => {
    setDropContainerId(swapDaiContainer.id);
  }, []);
  useEffect(() => {
    async function getTokens() {
      const getTokens = fetchTokensList();
      const _tokens = await getTokens();
      setTokensBySymbol(_tokens);
    }
    getTokens();
  }, []);

  // Update state when draggingValueId or dropContainerId change
  useEffect(() => {
    if (draggingValueId && dropContainerId) {
      move(draggingValueId, dropContainerId);
    }
  }, [draggingValueId, dropContainerId]);

  const updateValues = () => {
    setValues(new Map(values));
  };
  const handleDragStart = (dragStartEvent: DragStartEvent) => {
    const { active } = dragStartEvent;
    setDraggingValueId(active.id);
  };

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    const { over } = dragEvent;
    over && setDropContainerId(over.id);
    setDraggingValueId(undefined);
  };

  return {
    tokensBySymbol,
    pricesBySymbol,
    containers,
    values,
    draggingValueId,
    dropContainerId,
    handleDragStart,
    handleDragEnd,
    updateValues,
  };
}

interface DraggableValueProps {
  children: React.ReactNode;
  dragging: boolean;
  handle?: boolean;
  id: string;
}

function DraggableValue({ id, handle, children }: DraggableValueProps) {
  const { isDragging, setNodeRef, listeners } = useDraggable({ id });

  return (
    <Value
      dragging={isDragging}
      ref={setNodeRef}
      handle={handle}
      listeners={listeners}
      style={{
        opacity: isDragging ? 0 : undefined,
      }}
    >
      {children}
    </Value>
  );
}

function InputBank({ nativePrice, onClick }) {
  const [amount, setAmount] = useState();

  return (
    <Row justify="space-around">
      <EtherInput
        autofocus
        price={nativePrice}
        value={amount ?? 0}
        placeholder="Enter amount"
        onChange={value => {
          setAmount(value);
        }}
      />
      <Button onClick={onClick(Number(amount))}>Add to bank</Button>
    </Row>
  );
}

function Drag() {
  const {
    tokensBySymbol,
    pricesBySymbol,
    containers,
    values,
    draggingValueId,
    dropContainerId,
    handleDragStart,
    handleDragEnd,
    updateValues,
  } = useHomeState();

  if (!pricesBySymbol || !tokensBySymbol) return null;
  if (!containers) return null;

  const draggingValue = draggingValueId && values?.get(draggingValueId);

  const moveToBank = (amount: number) => (event: MouseEvent) => {
    const newValue = createValue({ amount, currency: nativeToken });
    console.log("🚀 ~ file: Drag.tsx ~ line 226 ~ moveToBank ~ newValue", newValue);
    const bank = containers.get(bankContainer.id);
    bank.values.set(newValue.id, newValue);
    values.set(newValue.id, newValue);
    updateValues();
  };

  return (
    <>
      <InputBank nativePrice={pricesBySymbol.get(nativeToken.symbol)} onClick={moveToBank} />
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Row align="middle" justify="space-around" style={{ height: "calc(100vh - 160px)" }}>
          {Array.from(containers).map(([containerId, container]) => (
            <Col key={containerId}>
              <DroppableContainer
                tokensBySymbol={tokensBySymbol}
                pricesBySymbol={pricesBySymbol}
                container={container}
                dragging={Boolean(draggingValueId)}
              >
                {Array.from(container.values).map(([valueId, value]) => {
                  return (
                    <DraggableValue key={valueId} id={valueId} dragging>
                      <ValueItem amount={value.amount} currency={value.currency} />
                    </DraggableValue>
                  );
                })}
              </DroppableContainer>
            </Col>
          ))}
          <DragOverlay>
            {draggingValueId && draggingValue ? (
              <Value dragging dragOverlay label="Move me!">
                <ValueItem amount={draggingValue.amount} currency={draggingValue.currency} />
              </Value>
            ) : null}
          </DragOverlay>
        </Row>
      </DndContext>
    </>
  );
}

export default Drag;
