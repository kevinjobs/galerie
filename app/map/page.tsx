"use client";

import React from "react";
import dynamic from "next/dynamic";
import { toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isMobile } from "react-device-detect";
import { useQuery } from "@tanstack/react-query";
import { getPhotoLists } from "../api";
import { Photo } from "../typings";
import { wgs84ToGcj02 } from "../hinter/utils";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

import "leaflet/dist/leaflet.css";

// 暗色地图样式
const darkMapStyle = `
  #map-container .leaflet-container {
    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
  }
  
  #map-container .leaflet-popup-content-wrapper {
    background: rgba(20, 20, 30, 0.9);
    color: #fff;
    border: none;
    border-radius: 8px;
  }
  
  #map-container .leaflet-popup-tip {
    background: rgba(20, 20, 30, 0.9);
  }
`;

const gaodeImgUrl = "http://wprd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=9&x={x}&y={y}&z={z}";

function MapContent() {
  const router = useRouter();

  // 应用暗色地图样式
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = darkMapStyle;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const { data } = useQuery({
    queryKey: ["data"],
    queryFn: () => getPhotoLists(),
  });

  const getPosition = (item: Photo): [number, number] | null => {
    if (!item.exif) return null;

    const exif = typeof item.exif === "string"
      ? JSON.parse(item.exif)
      : item.exif;

    const longitude = exif?.longitude;
    const latitude = exif?.latitude;

    if (!latitude || !longitude) return null;
    if (latitude === "undefined" || longitude === "undefined") return null;

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;

    const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
    return [gcjLat, gcjLng];
  };

  const markers: Photo[] = data?.lists?.filter((item: Photo) => getPosition(item) !== null) || [];

  useEffect(() => {
    if (markers.length === 0 && data?.lists && data.lists.length > 0) {
      toast.info("暂无照片位置信息");
    }
  }, [markers.length, data?.lists]);

  return (
    <>
      {isMobile ? (
        <div id="map-container" className="w-full h-screen">
          <MapContainer
            center={[31, 118]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://lbs.amap.com">高德地图</a>'
              url={gaodeImgUrl}
              maxZoom={18}
            />
            {markers.map((item: Photo) => {
              const pos = getPosition(item);
              if (!pos) return null;
              return (
                <CircleMarker
                  key={item.uid}
                  center={pos}
                  radius={8}
                  pathOptions={{
                    color: "red",
                    weight: 2,
                    opacity: 1,
                    fillColor: "#eb4034ff",
                    fillOpacity: 0.8,
                  }}
                  eventHandlers={{
                    click: () => {
                      router.push(`/gallery/${item.uid}`);
                    },
                  }}
                >

                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        <div id="map-container" className="w-full h-screen">
          <MapContainer
            center={[31, 118]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://lbs.amap.com">高德地图</a>'
              url={gaodeImgUrl}
              maxZoom={18}
            />
            {markers.map((item: Photo) => {
              const pos = getPosition(item);
              if (!pos) return null;
              return (
                <CircleMarker
                  key={item.uid}
                  center={pos}
                  radius={10}
                  pathOptions={{
                    color: "red",
                    weight: 2,
                    opacity: 1,
                    fillColor: "#f12929ff",
                    fillOpacity: 0.8,
                  }}
                  eventHandlers={{
                    click: () => {
                      router.push(`/gallery/${item.uid}`);
                    },
                  }}
                >

                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </>
  );
}

export default function Map() {
  return <MapContent />;
}