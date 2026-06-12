import { NextRequest, NextResponse } from "next/server";

/**
 * WGS84 坐标转 GCJ-02 坐标（国测局坐标）
 * 高德地图使用 GCJ-02 坐标系，需要将 GPS 的 WGS84 坐标转换
 */
function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  const PI = Math.PI;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  const transformLat = (x: number, y: number): number => {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  };

  const transformLng = (x: number, y: number): number => {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  };

  const outOfChina = lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  if (outOfChina) {
    return [lng, lat];
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (A * (1 - EE) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  return [lng + dLng, lat + dLat];
}

/**
 * GET /api/geocode?longitude=xxx&latitude=xxx
 * 通过经纬度获取地址信息（代理高德逆地理编码 API）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const longitude = searchParams.get("longitude");
  const latitude = searchParams.get("latitude");

  if (!longitude || !latitude) {
    return NextResponse.json(
      { error: "缺少 longitude 或 latitude 参数" },
      { status: 400 }
    );
  }

  const apiKey = process.env.AMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置高德 API Key" },
      { status: 500 }
    );
  }

  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lng) || isNaN(lat)) {
    return NextResponse.json(
      { error: "经纬度参数格式错误" },
      { status: 400 }
    );
  }

  // WGS84 转 GCJ-02
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);

  const baseUrl = "https://restapi.amap.com/v3/geocode/regeo";
  const url = `${baseUrl}?location=${gcjLng},${gcjLat}&key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `高德 API 请求失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "高德 API 请求异常" },
      { status: 500 }
    );
  }
}
