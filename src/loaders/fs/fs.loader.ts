import findUp from "find-up";
import fs from "fs";
import os from "os";
import path from "path";
import { Loader } from "../loader";

export interface FSLoaderData {
  extension?: string;
  filePath: string;
}

export abstract class FSLoader extends Loader {
  abstract readonly extensions: string[];
  abstract readonly requireExtension: boolean;
  constructor(protected readonly cwd: string = process.cwd()) {
    super();
  }

  abstract parse(text: string, data: FSLoaderData): Record<string, any> | undefined;

  public load(appName: string) {
    const relativeFiles = [`.${appName}rc`, `${appName}.config`];
    const absoluteFiles = [
      // /home/user/.config/app/config
      path.join(os.homedir(), ".config", appName, "config"),
      // /home/user/.config/apprc
      path.join(os.homedir(), ".config", `${appName}rc`),
      // /home/user/.apprc
      path.join(os.homedir(), `${appName}rc`),
    ];

    if (process.platform !== "win32") {
      // /etc/apprc
      absoluteFiles.push(path.join("/etc", `${appName}rc`));
      // /etc/app/config
      absoluteFiles.push(path.join("/etc", appName, "config"));
    }

    for (const relativeFile of this.getPathsWithExtensions(relativeFiles)) {
      const absoluteFile = findUp.sync(relativeFile, { cwd: this.cwd });
      if (absoluteFile) {
        const parsed = this.tryLoadAbsoluteFile(absoluteFile);
        if (parsed) {
          return parsed;
        }
      }
    }

    for (const absoluteFile of this.getPathsWithExtensions(absoluteFiles)) {
      const parsed = this.tryLoadAbsoluteFile(absoluteFile);
      if (parsed) return parsed;
    }
  }

  private tryLoadAbsoluteFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath);
      const extension = this.extensions.find((ext) => filePath.endsWith(`.${ext}`));
      const parsed = this.parse(content.toString(), { extension, filePath });
      if (parsed) return parsed;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  private getPathsWithExtensions(withoutExtensions: string[]) {
    const paths = withoutExtensions.reduce((acc, path) => {
      const resolved: string[] = [];
      if (!this.requireExtension) resolved.push(path);
      for (const extension of this.extensions) resolved.push(path + "." + extension);
      return acc.concat(resolved);
    }, [] as string[]);

    return paths;
  }
}
