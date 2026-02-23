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

export function Album({ data, gap = 4, columns = 4, itemWidth = 200, itemHeight = 180 }: AlbumProps) {
  const width = itemWidth * columns + (columns * 2) * gap;

  return (
    <div className="leading-none m-auto" style={{ width, maxWidth: width }}>
      {data.map((item, index) => {
        return (
          <div
            key={index}
            className={`inline-block`}
            style={{ width: itemWidth, height: itemHeight, margin: gap }}
          >
            {item.element}
          </div>
        )
      })}
    </div>
  );
}