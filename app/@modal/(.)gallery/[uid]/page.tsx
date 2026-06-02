"use client";
import { genSrc } from "@/app/api";
import { Xmark, CircleInfo, ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState, useEffect, useCallback, useRef } from "react";
import { BrowserView, isMobile, MobileView } from "react-device-detect";
import { useSwipeable } from "react-swipeable";
import { usePhoto } from "@/app/hooks/usePhoto";
import { usePhotoNavigation } from "@/app/hooks/usePhotoNavigation";
import { Photo } from "@/app/typings";
import PhotoInfo from "./info";

export default function GalleryModal({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid: routeUid } = use(params);
  const router = useRouter();

  // ── 本地轮播状态（不触发路由变化） ──
  const [activeUid, setActiveUid] = useState(routeUid);

  // 照片缓存：避免切换时重新渲染导致闪烁
  const photoCache = useRef(new Map<string, Photo>());

  // 初始照片（来自路由 uid）
  const { photo: initialPhoto } = usePhoto(routeUid);
  useEffect(() => {
    if (initialPhoto) photoCache.current.set(routeUid, initialPhoto);
  }, [initialPhoto, routeUid]);

  // 导航位置信息（基于本地 activeUid）
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

  // 容器宽度（桌面端为 75% 视口，移动端为 100%）
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── 过渡动画状态 ──
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 执行本地导航（带过渡动画，无路由变化）
  const animateTo = useCallback(
    (direction: "prev" | "next") => {
      const targetUid = direction === "next" ? nextUid : prevUid;
      if (!targetUid) return;

      setIsAnimating(true);
      setOffsetX(direction === "next" ? -containerWidth : containerWidth);

      setTimeout(() => {
        setActiveUid(targetUid);
        window.history.replaceState(null, '', `/gallery/${targetUid}`);
        setOffsetX(0);
        setIsAnimating(false);
      }, 300);
    },
    [nextUid, prevUid, containerWidth],
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

  // 滑动手势
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (!isAnimating) {
        setOffsetX(eventData.deltaX);
      }
    },
    onSwipedLeft: () => {
      if (hasNext && Math.abs(offsetX) > containerWidth * 0.3) {
        animateTo("next");
      } else {
        setIsAnimating(true);
        setOffsetX(0);
        setTimeout(() => setIsAnimating(false), 300);
      }
    },
    onSwipedRight: () => {
      if (hasPrev && Math.abs(offsetX) > containerWidth * 0.3) {
        animateTo("prev");
      } else {
        setIsAnimating(true);
        setOffsetX(0);
        setTimeout(() => setIsAnimating(false), 300);
      }
    },
    trackMouse: false,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // 推片式轮播：三张照片并排，滑动时整体平移
  const renderPhotoViewer = (compressed: boolean = true) => {
    // 移动端图片稍微上移，避开底部状态栏
    const imgPosition = compressed ? 'center 42%' : 'center';
    return (
    <div className="relative h-full overflow-hidden">
      <div
        className="flex h-full"
        style={{
          width: containerWidth * 3,
          transform: `translateX(${-containerWidth + offsetX}px)`,
          transition: isAnimating ? "transform 0.3s ease-out" : "none",
        }}
      >
        {/* 上一张 */}
        <div className="h-full flex-shrink-0" style={{ width: containerWidth }}>
          {prevPhoto?.src && (
            <img
              className="h-full w-full object-contain bg-background"
              src={genSrc(prevPhoto.src, compressed)}
              style={{ objectPosition: imgPosition }}
              alt=""
              draggable={false}
            />
          )}
        </div>
        {/* 当前 */}
        <div className="h-full flex-shrink-0" style={{ width: containerWidth }}>
          {activePhoto?.src && (
            <img
              className="h-full w-full object-contain bg-background"
              src={genSrc(activePhoto.src, compressed)}
              style={{ objectPosition: imgPosition }}
              alt={activePhoto.title || ""}
              draggable={false}
            />
          )}
        </div>
        {/* 下一张 */}
        <div className="h-full flex-shrink-0" style={{ width: containerWidth }}>
          {nextPhoto?.src && (
            <img
              className="h-full w-full object-contain bg-background"
              src={genSrc(nextPhoto.src, compressed)}
              style={{ objectPosition: imgPosition }}
              alt=""
              draggable={false}
            />
          )}
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-background overflow-hidden z-50">
      <main className="h-full w-full flex">
        <section
          className="photo-preview-left relative"
          ref={containerRef}
          style={{ width: isMobile ? "100%" : "75%" }}
        >
          <header className="w-full absolute top-2 left-0 text-right z-20">
            {isMobile && (
              <Button
                isIconOnly
                onClick={() => setIsPanelOpen((prev) => !prev)}
                variant="ghost"
              >
                <CircleInfo />
              </Button>
            )}
            <Button isIconOnly onClick={() => router.back()} variant="ghost">
              <Xmark />
            </Button>
          </header>
          <MobileView>
            <div {...swipeHandlers} className="h-screen">
              {renderPhotoViewer(true)}
            </div>
          </MobileView>
          <BrowserView>
            <div className="h-screen">{renderPhotoViewer(false)}</div>
          </BrowserView>
          {!isMobile && hasPrev && (
            <Button
              isIconOnly
              onClick={() => animateTo("prev")}
              variant="ghost"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-50 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft width={24} height={24} />
            </Button>
          )}
          {!isMobile && hasNext && (
            <Button
              isIconOnly
              onClick={() => animateTo("next")}
              variant="ghost"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-50 hover:opacity-100 transition-opacity"
            >
              <ChevronRight width={24} height={24} />
            </Button>
          )}
          {total > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted opacity-70 z-20">
              {currentIndex + 1} / {total}
            </div>
          )}
        </section>
        <BrowserView className="w-[25%]">
          <section className="photo-preview-right h-full p-1">
            <div className="border border-border h-full rounded-2xl overflow-hidden">
              {activePhoto && <PhotoInfo photo={activePhoto} />}
            </div>
          </section>
        </BrowserView>
        {isPanelOpen && (
          <MobileView>
            <section className="opacity-70 fixed bottom-8 left-1/2 -translate-x-1/2 w-full px-4 z-20">
              <div className="border border-border rounded-2xl overflow-auto bg-background">
                {activePhoto && <PhotoInfo photo={activePhoto} />}
              </div>
            </section>
          </MobileView>
        )}
      </main>
      <footer></footer>
    </div>
  );
}
