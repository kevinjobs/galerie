"use client";
import { useState } from "react";

export interface ToolbarProps {
  items: {
    name: string;
    label: string;
    onPress: (name: string) => void;
    default?: boolean;
  }[];
}

export default function Toolbar({ items }: ToolbarProps) {
  const idx = items.findIndex((item) => item.default);

  const [offset, setOffset] = useState(idx);

  const hanldeClick = (i: number) => {
    setOffset(i);
  };

  return (
    <div className="inline-block border border-border rounded-full relative p-1">
      {items.map((item, i) => {
        return (
          <span
            className="inline-block w-20 text-center py-2 cursor-pointer"
            data-name={item.name}
            key={item.name}
            onClick={() => {
              hanldeClick(i);
              item.onPress(item.name);
            }}
          >
            {item.label}
          </span>
        );
      })}
      <span
        className="absolute toolbar-thumb block w-20 h-10 top-1 text-center py-2 bg-foreground rounded-full transition-all transition-duration-300 backdrop-sm opacity-10"
        style={{ translate: `${offset * 80}px` }}
      ></span>
    </div>
  );
}
