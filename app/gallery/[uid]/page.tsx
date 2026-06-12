"use client";
import { use, useState, useEffect, useCallback, useRef } from "react";
import { genSrc } from "../../api";
import { usePhoto } from "../../hooks/usePhoto";
import { usePhotoNavigation } from "../../hooks/usePhotoNavigation";
import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { Photo } from "../../typings";

export default function GalleryPreview({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid: routeUid } = use(params);

  // ── 本地轮播状态（不触发路由变化） ──
  const [activeUid, setActiveUid] = useState(routeUid);

  // 照片缓存
  const photoCache = useRef(new Map<string, Photo>());

  // 初始照片（来自路由 uid）
  const { photo: initialPhoto, loading, error } = usePhoto(routeUid);
  useEffect(() => {
    if (initialPhoto) photoCache.current.set(routeUid, initialPhoto);
  }, [initialPhoto, routeUid]);

  // 导航位置信息
  const { hasPrev, hasNext, currentIndex, total, prevUid, nextUid } =
    usePhotoNavigation(activeUid);

  // 预加载相邻照片
  const { photo: prevPhoto } = usePhoto(prevUid ?? undefined);
  const { photo: nextPhoto } = usePhoto(nextUid ?? undefined);
  useEffect(() => {
    if (prevPhoto && prevUid) photoCache.current.set(prevUid, prevPhoto);
  }, [prevPhoto, prevUid]);
  useEffect(() => {
    if (nextPhoto && nextUid) photoCache.current.set(nextUid, nextPhoto);
  }, [nextPhoto, nextUid]);

  // 当前照片：缓存 > 初始照片
  const activePhoto = photoCache.current.get(activeUid) ?? initialPhoto ?? null;

  // ── 过渡动画状态 ──
  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 图片加载状态
  const [loadedImgs, setLoadedImgs] = useState<Record<string, boolean>>({});

  const markLoaded = useCallback((uid: string) => {
    setLoadedImgs((prev) => (prev[uid] ? prev : { ...prev, [uid]: true }));
  }, []);

  const Spinner = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="size-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </div>
  );

  const animateTo = useCallback(
    (direction: "prev" | "next") => {
      const targetUid = direction === "next" ? nextUid : prevUid;
      if (!targetUid) return;

      setIsAnimating(true);
      setOffsetX(
        direction === "next" ? -window.innerWidth : window.innerWidth,
      );

      setTimeout(() => {
        setActiveUid(targetUid);
        window.history.replaceState(null, '', `/gallery/${targetUid}`);
        setOffsetX(0);
        setIsAnimating(false);
      }, 300);
    },
    [nextUid, prevUid],
  );

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev && !isAnimating) animateTo("prev");
      if (e.key === "ArrowRight" && hasNext && !isAnimating) animateTo("next");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, isAnimating, animateTo]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen py-2 relative animate-[fade-in_0.3s_ease-out]">
      <div className="relative h-full overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "300vw",
            transform: `translateX(calc(-100vw + ${offsetX}px))`,
            transition: isAnimating ? "transform 0.3s ease-out" : "none",
          }}
        >
          {/* 上一张 */}
          <div className="w-screen h-full flex-shrink-0 relative">
            {prevPhoto?.src && (
              <>
                {!loadedImgs[prevUid ?? ""] && <Spinner />}
                <img
                  className={`h-full w-full object-contain transition-opacity duration-300 ${loadedImgs[prevUid ?? ""] ? "opacity-100" : "opacity-0"}`}
                  src={genSrc(prevPhoto.src)}
                  alt=""
                  onLoad={() => prevUid && markLoaded(prevUid)}
                  draggable={false}
                />
              </>
            )}
          </div>
          {/* 当前 */}
          <div className="w-screen h-full flex-shrink-0 relative">
            {activePhoto && (
              <>
                {!loadedImgs[activeUid] && <Spinner />}
                <img
                  src={genSrc(activePhoto.src)}
                  alt={activePhoto.title || "Gallery Preview"}
                  loading="eager"
                  onLoad={() => markLoaded(activeUid)}
                  className={`object-contain w-full h-full transition-opacity duration-300 ${loadedImgs[activeUid] ? "opacity-100" : "opacity-0"}`}
                  draggable={false}
                />
              </>
            )}
          </div>
          {/* 下一张 */}
          <div className="w-screen h-full flex-shrink-0 relative">
            {nextPhoto?.src && (
              <>
                {!loadedImgs[nextUid ?? ""] && <Spinner />}
                <img
                  className={`h-full w-full object-contain transition-opacity duration-300 ${loadedImgs[nextUid ?? ""] ? "opacity-100" : "opacity-0"}`}
                  src={genSrc(nextPhoto.src)}
                  alt=""
                  onLoad={() => nextUid && markLoaded(nextUid)}
                  draggable={false}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      {total > 0 && hasPrev && (
        <Button
          isIconOnly
          onClick={() => animateTo("prev")}
          variant="ghost"
          className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity z-20"
        >
          <ChevronLeft width={24} height={24} />
        </Button>
      )}
      {total > 0 && hasNext && (
        <Button
          isIconOnly
          onClick={() => animateTo("next")}
          variant="ghost"
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity z-20"
        >
          <ChevronRight width={24} height={24} />
        </Button>
      )}

      {/* 位置指示器 */}
      {total > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted opacity-70 z-20">
          {currentIndex + 1} / {total}
        </div>
      )}
    </div>
  );
}
