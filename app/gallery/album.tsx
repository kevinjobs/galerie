import { isMobile } from "react-device-detect";

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
  const width = isMobile ? "100%" : itemWidth * columns + columns * 2 * gap;

  const iW = isMobile ? `calc(50% - ${gap * 2}px)` : itemWidth;

  return (
    <div
      className="leading-none m-auto flex flex-wrap"
      style={{ width, maxWidth: width }}
    >
      {data.map((item, index) => {
        return (
          <div
            key={index}
            className={`inline-block`}
            style={{ width: iW, height: itemHeight, margin: gap }}
          >
            {item.element}
          </div>
        );
      })}
    </div>
  );
}
