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
    console.log(setting?.map);
    if (setting?.map?.code && setting?.map?.key) {
      // @ts-ignore
      window._AMapSecurityConfig = {
        securityJsCode: setting?.map?.code || "",
      };

      // @ts-ignore
      AMapLoader &&
        // @ts-ignore
        AMapLoader.load({
          key: setting?.map?.key, //申请好的Web端开发者key，调用 load 时必填
          version: "2.0", //指定要加载的 JS API 的版本，缺省时默认为 1.4.15
        })
          .then((AMap: any) => {
            //JS API 加载完成后获取AMap对象
            const map = new AMap.Map("map-container", {
              viewMode: "2D", //默认使用 2D 模式
              zoom: 5, //地图级别
              center: [118, 31], //地图中心点
              mapStyle: "amap://styles/grey",
            });

            const addLayer = (lists: any[]) => {
              for (const item of lists) {
                const exif = JSON.parse(item.exif);

                const longitude = exif?.longitude?.split(",")[0];
                const latitude = exif?.latitude?.split(",")[0];

                if (latitude && longitude && longitude !== 'undefined' && latitude !== 'undefined') {
                  AMap.convertFrom([longitude, latitude], "gps", (status: any, result: any) => {
                    if (status === "complete" && result.info === "ok") {
                      //设置圆形位置
                      var center = result.locations[0]; //圆心坐标位置对象，格式为 {lng:xxx, lat:xxx}
                      //设置圆的半径大小
                      var radius = 10; //单位:px
                      //创建圆形点标记 CircleMarker 实例
                      const circleMarker = new AMap.CircleMarker({
                        center: center, //圆心
                        radius: radius, //半径
                        strokeColor: "white", //轮廓线颜色
                        strokeWeight: 2, //轮廓线宽度
                        strokeOpacity: 0.5, //轮廓线透明度
                        fillColor: "rgba(0,0,255,1)", //圆点填充颜色
                        fillOpacity: 0.5, //圆点填充透明度
                        zIndex: 10, //圆点覆盖物的叠加顺序
                        cursor: "pointer", //鼠标悬停时的鼠标样式
                      });

                      circleMarker.on("click", () => {
                        router.push(`/gallery/${item.uid}`);
                      });

                      //圆形 circleMarker 对象添加到 Map
                      map.add(circleMarker);
                    }
                  });
                }
              }
            };

            const fetchData = (callback: any) => {
              getPhotoLists().then((res) => {
                const lists = res?.lists;

                if (lists?.length > 0) {
                  callback(lists);
                }
              });
            };

            fetchData(addLayer);
          })
          .catch((e: any) => {
            console.error(e); //加载错误提示
          });
    }
  }, [setting]);

  return (
    <div id="map-container" className="w-screen h-[calc(100vh-64px)]"></div>
  );
}
