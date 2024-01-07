import { readdirSync } from "fs";
import { join, resolve } from "path";

export const findUp = (fileName: string, cwd: string): string | null => {
  try {
    const inDirectory = readdirSync(cwd);
    if (inDirectory.includes(fileName)) {
      return join(cwd, fileName);
    }

    const parentDirectory = resolve(cwd, "..");
    if (parentDirectory === cwd) {
      return null;
    }

    return findUp(fileName, parentDirectory);
  } catch (error: any) {
    if (error.code === "EACCESS") return null;
    if (error.code === "ENOENT") return null;
    throw error;
  }
};
