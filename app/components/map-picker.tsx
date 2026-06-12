"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, toast, Modal as HeroModal } from "@heroui/react";
import { getAddress } from "@/app/api";
import { gcj02ToWgs84 } from "@/app/hinter/utils";
import { useMap } from "react-leaflet";
import L from "leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
);

import "leaflet/dist/leaflet.css";

const DARK_MAP_STYLE = `
  .map-picker-container .leaflet-container {
    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
    outline: none !important;
  }
  
  .map-picker-container .leaflet-popup-content-wrapper {
    background: rgba(20, 20, 30, 0.9);
    color: #fff;
    border: none;
    border-radius: 8px;
  }
  
  .map-picker-container .leaflet-popup-tip {
    background: rgba(20, 20, 30, 0.9);
  }
`;

const GAODE_IMG_URL = "https://wprd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=9&x={x}&y={y}&z={z}";

interface MapPickerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (lat: string, lng: string) => void;
  initialLat?: string;
  initialLng?: string;
}

function MapClickListener({
  onPositionChange,
}: {
  onPositionChange: (latlng: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handler = (e: { latlng: { lat: number; lng: number } }) => {
      onPositionChange(e.latlng);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onPositionChange]);

  return null;
}

function MapPickerContent({
  onPositionChange,
  selectedPosition,
  initialLat,
  initialLng,
}: {
  onPositionChange: (latlng: { lat: number; lng: number }) => void;
  selectedPosition: { lat: number; lng: number } | null;
  initialLat?: string;
  initialLng?: string;
}) {
  const defaultCenter = [31, 118] as [number, number];
  let center: [number, number] = defaultCenter;

  if (initialLat && initialLng) {
    const lat = parseFloat(initialLat);
    const lng = parseFloat(initialLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      center = [lat, lng];
    }
  }

  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `<svg viewBox="0 0 24 24" class="w-8 h-8 text-red-500 drop-shadow-lg">
      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://lbs.amap.com">高德地图</a>'
        url={GAODE_IMG_URL}
        maxZoom={18}
      />
      <MapClickListener onPositionChange={onPositionChange} />
      {selectedPosition && (
        <Marker
          position={selectedPosition}
          icon={customIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const pos = e.target.getLatLng();
              onPositionChange(pos);
            },
          }}
        >
          <Popup>
            <div className="text-sm">
              <p>{selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export function MapPicker({
  isOpen,
  onOpenChange,
  onConfirm,
  initialLat,
  initialLng,
}: MapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      // 尝试获取浏览器位置
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setSelectedPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            // 失败则使用默认初始位置
            if (initialLat && initialLng) {
              const lat = parseFloat(initialLat);
              const lng = parseFloat(initialLng);
              if (!isNaN(lat) && !isNaN(lng)) {
                setPosition({ lat, lng });
                setSelectedPosition({ lat, lng });
              }
            }
          },
          { timeout: 5000 },
        );
      } else if (initialLat && initialLng) {
        const lat = parseFloat(initialLat);
        const lng = parseFloat(initialLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition({ lat, lng });
          setSelectedPosition({ lat, lng });
        }
      }
    } else {
      setPosition(null);
      setSelectedPosition(null);
    }
  }, [isOpen, initialLat, initialLng]);

  const handleConfirm = () => {
    if (!selectedPosition) {
      toast("请先选择位置", { variant: "danger" });
      return;
    }

    const wgs84Pos = gcj02ToWgs84(selectedPosition.lng, selectedPosition.lat);
    const wgsLat = wgs84Pos[1].toFixed(6).toString();
    const wgsLng = wgs84Pos[0].toFixed(6).toString();

    // 获取地址
    getAddress(wgsLng, wgsLat)
      .then((res) => {
        const address = res.regeocode?.formatted_address;
        if (address) {
          queryClient.setQueryData(["photo", "locationAddress"], address);
        }
      })
      .catch(() => {});

    onConfirm(wgsLat, wgsLng);
    onOpenChange(false);
  };

  const gcjLat = selectedPosition?.lat.toFixed(6) || "";
  const gcjLng = selectedPosition?.lng.toFixed(6) || "";

  let wgsLat = "";
  let wgsLng = "";
  if (selectedPosition) {
    const wgs84Pos = gcj02ToWgs84(selectedPosition.lng, selectedPosition.lat);
    wgsLat = wgs84Pos[1].toFixed(6);
    wgsLng = wgs84Pos[0].toFixed(6);
  }

  return (
    <HeroModal>
      <HeroModal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur" className="bg-background/25 max-w-screen">
        <HeroModal.Container size="full" className="max-w-screen max-h-screen border border-border">
          <HeroModal.Dialog className="bg-background">
            <HeroModal.CloseTrigger />
            <HeroModal.Header>
              <HeroModal.Heading>选择拍摄地点</HeroModal.Heading>
            </HeroModal.Header>
            <HeroModal.Body className="p-0" style={{ height: "calc(100vh - 120px)" }}>
              <div className="map-picker-container relative" style={{ height: "calc(100vh - 120px)" }}>
                <style>{DARK_MAP_STYLE}</style>
                <MapPickerContent
                  onPositionChange={setSelectedPosition}
                  selectedPosition={selectedPosition}
                  initialLat={initialLat}
                  initialLng={initialLng}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
                    <p>
                      <span className="text-gray-300">GCJ02:</span> {gcjLat}, {gcjLng}
                    </p>
                    <p>
                      <span className="text-gray-300">WGS84:</span> {wgsLat}, {wgsLng}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="bg-background/90"
                      onPress={() => onOpenChange(false)}
                    >
                      取消
                    </Button>
                    <Button
                      className="bg-(--accent) rounded-full"
                      onPress={handleConfirm}
                    >
                      确认
                    </Button>
                  </div>
                </div>
              </div>
            </HeroModal.Body>
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  );
}
