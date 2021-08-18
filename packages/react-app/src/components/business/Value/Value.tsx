import React, { forwardRef } from "react";
import classNames from "classnames";
import type { DraggableSyntheticListeners, Translate } from "@dnd-kit/core";

import styles from "./Value.module.css";

export enum Axis {
  All,
  Vertical,
  Horizontal,
}

interface Props {
  children?: React.ReactNode;
  axis?: Axis;
  dragOverlay?: boolean;
  dragging?: boolean;
  handle?: boolean;
  label?: string;
  listeners?: DraggableSyntheticListeners;
  style?: React.CSSProperties;
  translate?: Translate;
}

export const Value = forwardRef<HTMLButtonElement, Props>(function Value(
  { axis, dragOverlay, dragging, handle, label, listeners, translate, ...props },
  ref,
) {
  return (
    <div
      className={classNames(
        styles.Value,
        dragOverlay && styles.dragOverlay,
        dragging && styles.dragging,
        handle && styles.handle,
      )}
      style={
        {
          "--translate-x": `${translate?.x ?? 0}px`,
          "--translate-y": `${translate?.y ?? 0}px`,
        } as React.CSSProperties
      }
    >
      <button
        ref={ref}
        {...props}
        aria-label="Value"
        data-cypress="draggable-item"
        {...(handle ? {} : listeners)}
        tabIndex={handle ? -1 : undefined}
      >
        {props.children}
        {/* {handle ? <Handle {...(handle ? listeners : {})} /> : null} */}
      </button>
      {label ? <label>{label}</label> : null}
    </div>
  );
});
