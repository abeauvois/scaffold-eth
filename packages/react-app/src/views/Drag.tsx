/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useState } from "react";
import { DndContext, DragOverlay, useDraggable } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

import { Row, Col } from "antd";

// import { utils } from "ethers";
// import { Address, Balance } from "../components";

import { capitalize } from "../helpers";

import { ValueItem, DroppableContainer, Value } from "../components";
import { DAI, USDC } from "../data/Tokens";
import * as Types from "../types";

import { fetchTokensList } from "../components/useTokens";

const daiContainer = {
  id: DAI.address,
  displayName: capitalize(DAI.symbol as string),
  currency: DAI,
  values: new Map<string, Types.Value>(),
};

const usdcContainer = {
  id: USDC.address,
  displayName: capitalize(USDC.symbol as string),
  currency: USDC,
  values: new Map<string, Types.Value>(),
};

const value1 = {
  id: "item1",
  amount: 200,
  currency: new Types.Euro(),
};

function useHomeState() {
  const [containers, setContainers] = useState<Types.Containers>();
  const [values, setValues] = useState<Types.Values>();
  const [draggingValueId, setDraggingValueId] = useState<Types.Value["id"]>();
  const [dropContainerId, setDropContainerId] = useState<Types.Container["id"]>();
  const [tokensById, setTokensById] = useState<Types.TokensById>();

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
      console.log("🚀 ~ file: Drag.tsx ~ line 68 ~ move ~ values && containers", values, containers);

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
      [daiContainer.id, daiContainer],
      [usdcContainer.id, usdcContainer],
    ]);
    setContainers(initialContainers);
  }, []);
  useEffect(() => {
    setDraggingValueId(value1.id);
  }, []);
  useEffect(() => {
    setDropContainerId(daiContainer.id);
  }, []);
  useEffect(() => {
    async function getTokens() {
      const getTokens = fetchTokensList();
      const _tokens = await getTokens();
      setTokensById(_tokens);
    }
    getTokens();
  }, []);

  // Update state when draggingValueId or dropContainerId change
  useEffect(() => {
    // console.log(
    //   "🚀 ~ file: Drag.tsx ~ line 104 ~ useEffect ~ draggingValueId, dropContainerId",
    //   draggingValueId,
    //   dropContainerId,
    // );

    if (draggingValueId && dropContainerId) {
      move(draggingValueId, dropContainerId);
    }
  }, [draggingValueId, dropContainerId]);

  const handleDragStart = (dragStartEvent: DragStartEvent) => {
    const { active } = dragStartEvent;
    setDraggingValueId(active.id);
  };

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;
    over && setDropContainerId(over.id);
    // remove active value from its parent Container
    // const value = values?.get(active.id);
    // const fromContainer = value?.parentId && containers?.get(value.parentId);
    // fromContainer && fromContainer.values.delete(active.id);
    setDraggingValueId(undefined);
  };

  return { tokensById, containers, values, draggingValueId, dropContainerId, handleDragStart, handleDragEnd };
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

function Drag() {
  const {
    tokensById,
    containers,
    values,
    draggingValueId,
    dropContainerId,
    handleDragStart,
    handleDragEnd,
  } = useHomeState();

  if (!containers) return null;

  const draggingValue = draggingValueId && values?.get(draggingValueId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Row align="middle" justify="space-around" style={{ height: "calc(100vh - 160px)" }}>
        {Array.from(containers).map(([containerId, container]) => (
          <Col key={containerId}>
            <DroppableContainer tokensById={tokensById} container={container} dragging={Boolean(draggingValueId)}>
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
  );
}

export default Drag;
