import fs from "fs";

export const ensureDirs = async (dirs: string) => {
  if (!(await fs.promises.exists(dirs))) {
    await fs.promises.mkdir(dirs, { recursive: true });
  }
};
