"use client";
import { genSrc } from "@/app/api";
import { Xmark, CircleInfo, ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState, useEffect, useCallback, useRef, useMemo } from "react";
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

  // ── 缩放状态 ──
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isZoomed = scale > 1;

  // 缩放时的平移边界计算
  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const maxX = (containerWidth * (s - 1)) / 2;
      const maxY = (containerWidth * (s - 1)) / 2; // 用 width 近似高度
      return {
        x: Math.max(-maxX, Math.min(maxX, tx)),
        y: Math.max(-maxY, Math.min(maxY, ty)),
      };
    },
    [containerWidth],
  );

  // 重置缩放
  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // 切换缩放（双击用）
  const toggleZoom = useCallback(
    (clientX?: number, clientY?: number) => {
      if (isZoomed) {
        resetZoom();
      } else {
        const newScale = 2.5;
        // 以点击位置为中心缩放
        if (clientX !== undefined && clientY !== undefined) {
          const el = containerRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const cx = clientX - rect.left - rect.width / 2;
            const cy = clientY - rect.top - rect.height / 2;
            const t = clampTranslate(-cx * (newScale - 1), -cy * (newScale - 1), newScale);
            setTranslate(t);
          }
        }
        setScale(newScale);
      }
    },
    [isZoomed, resetZoom, clampTranslate],
  );

  // 照片切换时重置缩放
  useEffect(() => {
    resetZoom();
  }, [activeUid, resetZoom]);

  // 执行本地导航（带过渡动画，无路由变化）
  const animateTo = useCallback(
    (direction: "prev" | "next") => {
      if (isZoomed) return; // 缩放时禁止导航
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
    [nextUid, prevUid, containerWidth, isZoomed],
  );

  // 锁定 body 滚动 + 拦截 touchmove，防止移动端触摸穿透到底层页面
  useEffect(() => {
    // 1. 锁定 body
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // 2. 非 passive touchmove 拦截：移动端的 touchmove 默认 passive，
    //    必须用 { passive: false } 注册才能让 preventDefault() 生效
    const block = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener("touchmove", block, { passive: false });

    return () => {
      document.removeEventListener("touchmove", block);
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev && !isAnimating) animateTo("prev");
      if (e.key === "ArrowRight" && hasNext && !isAnimating) animateTo("next");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, isAnimating, animateTo]);

  // 滑动手势（缩放时禁用）
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (!isAnimating && !isZoomed) {
        setOffsetX(eventData.deltaX);
      }
    },
    onSwipedLeft: () => {
      if (isZoomed) return;
      if (hasNext && Math.abs(offsetX) > containerWidth * 0.3) {
        animateTo("next");
      } else {
        setIsAnimating(true);
        setOffsetX(0);
        setTimeout(() => setIsAnimating(false), 300);
      }
    },
    onSwipedRight: () => {
      if (isZoomed) return;
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

  // ── 桌面端缩放：鼠标滚轮 ──
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta * prev));
        // 缩放回 1 时重置平移
        if (next <= 1) {
          setTranslate({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    },
    [],
  );

  // ── 桌面端：双击切换缩放 ──
  const lastClickRef = useRef(0);
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastClickRef.current < 300) {
        toggleZoom(e.clientX, e.clientY);
      }
      lastClickRef.current = now;
    },
    [toggleZoom],
  );

  // ── 桌面端：缩放时鼠标拖拽平移 ──
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isZoomed) return;
      e.preventDefault();
      dragState.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startTx: translate.x,
        startTy: translate.y,
      };
    },
    [isZoomed, translate],
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      const t = clampTranslate(
        dragState.current.startTx + dx,
        dragState.current.startTy + dy,
        scale,
      );
      setTranslate(t);
    },
    [scale, clampTranslate],
  );
  const handleMouseUp = useCallback(() => {
    dragState.current.dragging = false;
  }, []);

  // ── 移动端：双指缩放 + 单指平移 + 双击切换 ──
  const touchState = useRef({
    lastTap: 0,
    pinching: false,
    initialDist: 0,
    initialScale: 1,
    panning: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const ts = touchState.current;
      if (e.touches.length === 2) {
        // 双指：开始捏合
        ts.pinching = true;
        ts.panning = false;
        ts.initialDist = getTouchDist(e.touches);
        ts.initialScale = scale;
      } else if (e.touches.length === 1) {
        // 单指：双击检测
        const now = Date.now();
        if (now - ts.lastTap < 300) {
          toggleZoom(e.touches[0].clientX, e.touches[0].clientY);
          ts.lastTap = 0;
          return;
        }
        ts.lastTap = now;

        // 单指：缩放时平移
        if (isZoomed) {
          ts.panning = true;
          ts.pinching = false;
          ts.startX = e.touches[0].clientX;
          ts.startY = e.touches[0].clientY;
          ts.startTx = translate.x;
          ts.startTy = translate.y;
        }
      }
    },
    [scale, isZoomed, translate, toggleZoom],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const ts = touchState.current;
      if (ts.pinching && e.touches.length === 2) {
        const dist = getTouchDist(e.touches);
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, ts.initialScale * (dist / ts.initialDist)),
        );
        setScale(newScale);
        if (newScale <= 1) setTranslate({ x: 0, y: 0 });
      } else if (ts.panning && e.touches.length === 1 && isZoomed) {
        const dx = e.touches[0].clientX - ts.startX;
        const dy = e.touches[0].clientY - ts.startY;
        const t = clampTranslate(ts.startTx + dx, ts.startTy + dy, scale);
        setTranslate(t);
      }
    },
    [isZoomed, scale, clampTranslate],
  );

  const handleTouchEnd = useCallback(() => {
    const ts = touchState.current;
    ts.pinching = false;
    ts.panning = false;
    // 缩放结束后如果接近 1 则吸附回去
    setScale((prev) => {
      if (prev < 1.1) {
        setTranslate({ x: 0, y: 0 });
        return 1;
      }
      return prev;
    });
  }, []);

  // 缩放变换样式
  const zoomTransform = useMemo(
    () => ({
      transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
      transition: isAnimating ? "none" : "transform 0.15s ease-out",
      cursor: isZoomed ? (dragState.current.dragging ? "grabbing" : "grab") : "zoom-in",
    }),
    [scale, translate, isZoomed, isAnimating],
  );

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
        {/* 当前（可缩放） */}
        <div className="h-full flex-shrink-0 overflow-hidden" style={{ width: containerWidth }}>
          {activePhoto?.src && (
            <img
              className="h-full w-full object-contain bg-background"
              src={genSrc(activePhoto.src, compressed)}
              style={{ objectPosition: imgPosition, ...zoomTransform }}
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
    <div className="fixed top-0 left-0 w-screen h-screen bg-background overflow-hidden z-50" style={{ overscrollBehavior: "none" }}>
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
            <div
              {...swipeHandlers}
              className="h-screen"
              style={{ touchAction: "none" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {renderPhotoViewer(true)}
            </div>
          </MobileView>
          <BrowserView>
            <div
              className="h-screen"
              onWheel={handleWheel}
              onClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {renderPhotoViewer(false)}
            </div>
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
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted z-20 transition-opacity duration-200 ${isZoomed ? "opacity-0" : "opacity-70"}`}>
              {currentIndex + 1} / {total}
            </div>
          )}
          {isZoomed && (
            <div className="absolute top-14 right-2 text-xs text-muted opacity-50 z-20">
              {Math.round(scale * 100)}%
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
        {/* 移动端信息栏：点击背景关闭 + 滑入/滑出动画 */}
        <MobileView>
          <div
            className={`fixed inset-0 z-10 transition-opacity duration-300 ${
              isPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsPanelOpen(false)}
          />
          <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-full px-4 z-20 transition-all duration-300 ease-out ${
              isPanelOpen
                ? "opacity-70 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border border-border rounded-2xl overflow-auto bg-background">
              {activePhoto && <PhotoInfo photo={activePhoto} />}
            </div>
          </div>
        </MobileView>
      </main>
      <footer></footer>
    </div>
  );
}
