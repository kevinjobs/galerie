"use client";
import { useEffect, useState } from "react";

export interface AlbumProps {
  data: AlbumItemProps[];
  gap?: number;
  columns?: number;
  itemWidth?: number;
  itemHeight?: number;
}

export interface AlbumItemProps {
  createTime: Date;
  element: React.ReactNode;
}

export function Album({
  data,
  gap = 4,
  columns = 4,
  itemWidth = 200,
  itemHeight = 180,
}: AlbumProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const width = isMobile ? "100%" : itemWidth * columns + (columns - 1) * gap;

  const iW = isMobile ? "calc(50% - 2px)" : itemWidth;

  return (
    <div
      className="leading-none m-auto flex flex-wrap"
      style={{ width, maxWidth: width, gap }}
    >
      {data.map((item, index) => {
        return (
          <div
            key={`${new Date(item.createTime).getTime()}-${index}`}
            className={`inline-block`}
            style={{ width: iW, height: itemHeight }}
          >
            {item.element}
          </div>
        );
      })}
    </div>
  );
}
