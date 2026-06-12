"use client";

import { useState, useEffect } from "react";
import { getPhotoByUid } from "../api";
import { Photo } from "../typings";

export function usePhoto(uid: string | undefined) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || uid === "new") {
      setPhoto(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getPhotoByUid(uid)
      .then((data) => setPhoto(data))
      .catch((err) => setError(err.message || "加载照片失败"))
      .finally(() => setLoading(false));
  }, [uid]);

  return { photo, loading, error };
}
