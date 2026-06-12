"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { genSrc } from "../api";

export interface MasonryPhoto {
  uid: string;
  src: string;
  title: string;
  aspectRatio?: number;
}

export interface AlbumProps {
  photos: MasonryPhoto[];
  gap?: number;
  columns?: number;
  mobileColumns?: number;
}

function distribute<T>(
  items: T[],
  colCount: number,
  getWeight: (item: T, index: number) => number,
): T[][] {
  const cols: T[][] = Array.from({ length: colCount }, () => []);
  const heights = Array(colCount).fill(0);
  items.forEach((item, i) => {
    const idx = heights.indexOf(Math.min(...heights));
    cols[idx].push(item);
    heights[idx] += getWeight(item, i);
  });
  return cols;
}

export function Album({
  photos,
  gap = 4,
  columns = 4,
  mobileColumns = 2,
}: AlbumProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const colCount = isMobile ? mobileColumns : columns;
  const effectiveGap = isMobile ? 4 : 8;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLoad = (uid: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const natRatio = img.naturalWidth / img.naturalHeight;
    setRatios((prev) => (prev[uid] !== natRatio ? { ...prev, [uid]: natRatio } : prev));
    setLoaded((prev) => {
      if (prev.has(uid)) return prev;
      const next = new Set(prev);
      next.add(uid);
      return next;
    });
  };

  const getRatio = (photo: MasonryPhoto) =>
    ratios[photo.uid] || photo.aspectRatio || (isMobile ? 1.2 : 1.5);

  const cols = useMemo(
    () => distribute(photos, colCount, (p) => 1 / getRatio(p)),
    [photos, colCount, ratios, isMobile],
  );

  return (
    <div className="flex md:max-w-[70%] mx-auto" style={{ gap: effectiveGap }}>
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-col flex-1" style={{ gap: effectiveGap }}>
          {col.map((photo) => {
            const r = getRatio(photo);
            return (
              <div key={photo.uid} className="overflow-hidden rounded-sm">
                <Link href={`/gallery/${photo.uid}`}>
                  <div className="relative" style={{ aspectRatio: String(r), width: "100%" }}>
                    {!loaded.has(photo.uid) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                      </div>
                    )}
                    <img
                      src={genSrc(photo.src)}
                      alt={photo.title}
                      loading="lazy"
                      onLoad={(e) => handleLoad(photo.uid, e)}
                      className={`object-cover w-full h-full transition-opacity duration-300 ${loaded.has(photo.uid) ? "opacity-100" : "opacity-0"}`}
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}