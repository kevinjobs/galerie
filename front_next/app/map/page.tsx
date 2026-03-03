"use client";

import { useEffect } from "react";
import { genSrc, getPhotoLists } from "../api";
import { useRouter } from "next/navigation";
import { settingAtom } from "../store";
import { useAtomValue } from "jotai";

export default function Map() {
  const router = useRouter();
  const setting = useAtomValue(settingAtom);

  useEffect(() => {
    // @ts-ignore
    window._AMapSecurityConfig = {
      securityJsCode: setting?.map?.code || "",
    };

    // @ts-ignore
    AMapLoader && AMapLoader.load({
      key: setting?.map?.key, //申请好的Web端开发者key，调用 load 时必填
      version: "2.0", //指定要加载的 JS API 的版本，缺省时默认为 1.4.15
    })
      .then((AMap: any) => {
        //JS API 加载完成后获取AMap对象
        const map = new AMap.Map("map-container", {
          viewMode: '2D', //默认使用 2D 模式
          zoom: 5, //地图级别
          center: [116.397428, 30.90923], //地图中心点
        });

        const addLayer = (lists: any[]) => {
          const canvas = document.createElement("canvas");
          const imgLayer = new AMap.CustomLayer(canvas, {
            zooms: [3, 99],
            zIndex: 120
          });

          const onRender = () => {
            var size = map.getSize();//resize

            var retina = AMap.Browser.retina;

            var width = size.width;
            var height = size.height;

            if (retina) {
              width *= 2;
              height *= 2;
            }

            canvas.style.width = width + 'px'
            canvas.style.height = height + 'px'

            canvas.width = width;
            canvas.height = height;

            for (const item of lists) {
              const ctx = canvas.getContext("2d");

              if (ctx) {
                const img = new Image();
                img.src = genSrc(item.src);
                img.style = "box-shadow: 0 0 4px rgba(0,0,0,0.5); border-radius: 4px;";
                canvas.onclick = () => router.push(`/gallery/${item.uid}`);

                img.onload = function () {
                  const exif = JSON.parse(item.exif);
                  const lat = exif.latitude?.split(",")?.[0];
                  const lng = exif.longitude?.split(",")?.[0];

                  const lngLat = new AMap.LngLat(parseFloat(lng), parseFloat(lat));

                  AMap.convertFrom(lngLat, "gps", (status: string, result: any) => {
                    if (status === "complete" && result.info === "ok") {
                      const containerPos = map.lngLatToContainer(lngLat);

                      const ratio = img.width / img.height;
                      const imgWidth = 120;
                      const imgHeight = imgWidth / ratio;

                      ctx.drawImage(img, containerPos.x, containerPos.y, imgWidth, imgHeight);
                      ctx.moveTo(containerPos.x, containerPos.y);
                    }
                  });
                };

              }
            }
          }

          imgLayer.render = onRender;
          imgLayer.setMap(map);
        }

        const fetchData = (callback: any) => {
          getPhotoLists().then((res) => {
            const lists = res?.lists;

            if (lists?.length > 0) {
              callback(lists);
            }
          })
        }

        fetchData(addLayer);
      })
      .catch((e: any) => {
        console.error(e); //加载错误提示
      });

  }, [setting]);
  
  return (
    <div id="map-container" className="w-screen h-[calc(100vh-64px)]"></div>
  )
}
