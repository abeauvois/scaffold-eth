import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Value } from ".";

export interface DraggableValueProps {
  children: React.ReactNode;
  dragging: boolean;
  handle?: boolean;
  id: string;
}

export function DraggableValue({ id, handle, children }: DraggableValueProps) {
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
