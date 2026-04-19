"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPhotoLists, genSrc } from "./api";
import { Photo } from "./typings";
import { LocationArrowFill } from "@gravity-ui/icons";

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["cover-photos"],
    queryFn: () => getPhotoLists({ isSelected: true, isPublic: true, limit: 100 }),
  });

  const coverPhoto = React.useMemo(() => {
    if (!data?.lists) return null;

    const landscapePhotos = data.lists.filter((photo: Photo) => {
      if (!photo.exif) return false;

      try {
        const exif = JSON.parse(photo.exif);
        if (!exif.width || !exif.height) return false;

        // 提取数字部分
        const getNumber = (value: any) => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const match = value.match(/\d+(\.\d+)?/);
            return match ? parseFloat(match[0]) : 0;
          }
          return 0;
        };

        const width = getNumber(exif.width);
        const height = getNumber(exif.height);

        return width > height;
      } catch (error) {
        return false;
      }
    });

    if (landscapePhotos.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * landscapePhotos.length);
    return landscapePhotos[randomIndex];
  }, [data]);

  const getImageUrl = (photo: Photo) => {
    if (!photo.src) return "";
    const src = genSrc(photo.src, false);
    return src;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-pulse text-white/60">加载中...</div>
        </div>
      ) : coverPhoto ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${getImageUrl(coverPhoto)})`,
              filter: "brightness(0.8)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
      )}

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <Link
          href="/gallery"
          className="group relative inline-flex items-center justify-center px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white font-medium transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-2xl hover:shadow-white/10"
        >
          <span className="relative z-10">进入图库</span>
          <span className="overflow-hidden w-0 transition-all duration-300 group-hover:w-7">
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </span>
        </Link>
      </div>

      {
        coverPhoto?.location && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center opacity-50">
            <LocationArrowFill className="w-3 h-3 text-white/80" />
            <span className="text-white/80 text-sm font-light tracking-wide text-center ml-2">
              {coverPhoto.location}
            </span>
          </div>
        )
      }
    </div>
  );
}
