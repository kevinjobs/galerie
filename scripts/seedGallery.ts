import "dotenv/config";
import { db } from "../prisma/lib/db";
import type { Prisma } from "@prisma/client";
import crypto from "crypto";

const LOCATIONS = [
  "Beijing, China", "Shanghai, China", "Guangzhou, China", "Shenzhen, China",
  "Chengdu, China", "Hangzhou, China", "Nanjing, China", "Wuhan, China",
  "Xi'an, China", "Chongqing, China", "Kunming, China", "Suzhou, China",
  "Lhasa, Tibet", "Guilin, Guangxi", "Huangshan, Anhui", "Dali, Yunnan",
  "Qingdao, Shandong", "Xiamen, Fujian", "Harbin, Heilongjiang", "Zhangjiajie, Hunan",
];

const AUTHORS = [
  "Alice Chen", "Bob Wang", "Carol Li", "David Zhang", "Eva Liu",
  "Frank Yang", "Grace Wu", "Henry Xu", "Iris Huang", "Jack Zhou",
];

const CAMERA_MODELS = [
  "Sony A7R IV", "Canon EOS R5", "Nikon Z8", "Fujifilm X-T5",
  "Leica M11", "Phase One IQ4", "Hasselblad X1D II", "Sony A1",
];

const LENSES = [
  "24-70mm f/2.8", "70-200mm f/2.8", "35mm f/1.4", "85mm f/1.4",
  "50mm f/1.2", "16-35mm f/2.8", "100-400mm f/4.5-5.6", "14-24mm f/2.8",
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shortUid(): string {
  return crypto.randomBytes(4).toString("hex");
}

function randomShootTime(): Date {
  const now = Date.now();
  const past = now - 365 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function randomExif() {
  const w = pick([2000, 4000, 6000, 8000]);
  const h = pick([1333, 2667, 4000, 5333]);
  return {
    createTime: randomShootTime().toISOString(),
    model: pick(CAMERA_MODELS),
    lens: pick(LENSES),
    focalLength: `${pick([24, 35, 50, 70, 85, 135, 200])} mm`,
    fNumber: `f/${pick([1.4, 1.8, 2.0, 2.8, 4.0, 5.6]).toFixed(1)}`,
    exposureTime: `1/${pick([60, 100, 125, 200, 250, 500, 1000, 2000])}`,
    iso: pick([100, 200, 400, 800, 1600, 3200]),
    width: String(w),
    height: String(h),
    latitude: (30 + Math.random() * 15 - 7.5).toFixed(6),
    longitude: (110 + Math.random() * 20 - 10).toFixed(6),
    altitude: `${randInt(0, 4000)} m`,
    src: "",
  };
}

async function seedGallery() {
  const count = Number(process.argv[2]) || 32;
  console.log(`Will generate ${count} seed photos.\n`);
  console.log("Fetching existing non-avatar photos for src pool...");
  const existing = await db.photo.findMany({
    where: { type: { not: "avatar" } },
    select: { src: true },
  });

  if (existing.length === 0) {
    console.error("No existing gallery photos found. Upload at least one photo first.");
    process.exit(1);
  }

  const srcPool = existing.map((p) => p.src);
  console.log(`Found ${srcPool.length} photo src(s) to reuse.\n`);

  const records: ({
    title: string;
    src: string;
    description: string;
    location: string;
    shootTime: Date;
    author: string;
    isPublic: boolean;
    isSelected: boolean;
    type: string;
    exif: unknown;
  })[] = [];

  for (let i = 0; i < count; i++) {
    const uid = shortUid();
    const shootTime = randomShootTime();
    records.push({
      title: `Seed Photo ${uid}`,
      src: pick(srcPool),
      description: `Auto-generated test photo #${i + 1}`,
      location: pick(LOCATIONS),
      shootTime,
      author: pick(AUTHORS),
      isPublic: Math.random() < 0.8,
      isSelected: Math.random() < 0.3,
      type: "photo",
      exif: randomExif() as any,
    });
  }

  console.log(`Inserting ${records.length} seed photos...`);
  const result = await (db.photo.createMany as any)({ data: records });
  console.log(`\nDone! Created ${result.count} photo(s).`);

  await db.$disconnect();
}

seedGallery().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
