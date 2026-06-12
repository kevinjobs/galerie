"use client";

import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { photoListAtom } from "../store";

/**
 * 照片导航 hook —— 仅提供列表位置信息，不调用路由。
 * 页面组件负责管理 activeUid 本地状态来实现无闪烁轮播。
 */
export function usePhotoNavigation(currentUid: string) {
  const photoList = useAtomValue(photoListAtom);

  const currentIndex = useMemo(
    () => photoList.findIndex((uid) => uid === currentUid),
    [photoList, currentUid]
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photoList.length - 1 && currentIndex !== -1;

  const prevUid = hasPrev ? photoList[currentIndex - 1] : null;
  const nextUid = hasNext ? photoList[currentIndex + 1] : null;

  return {
    hasPrev,
    hasNext,
    currentIndex,
    total: photoList.length,
    prevUid,
    nextUid,
  };
}
