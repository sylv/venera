import fs from "fs";
import os from "os";
import path, { extname, isAbsolute } from "path";
import { findUp } from "../../helpers/find-up.js";
import { Loader, type LoaderContext } from "../loader.js";

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

  public load(appName: string, context: LoaderContext) {
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

    if (context.pathHints) {
      for (const hint of context.pathHints) {
        const hasExtension = this.extensions.some((ext) => hint.endsWith(`.${ext}`));
        if (!hasExtension) continue;
        const isRelative = !isAbsolute(hint);
        if (isRelative) {
          relativeFiles.push(hint);
        } else {
          absoluteFiles.push(hint);
        }
      }
    }

    for (const relativeFile of this.getPathsWithExtensions(relativeFiles)) {
      const absoluteFile = findUp(relativeFile, this.cwd);
      if (absoluteFile) {
        const parsed = this.tryLoadAbsoluteFile(absoluteFile);
        if (parsed) {
          context.sourcePaths.push(absoluteFile);
          return parsed;
        }
      }
    }

    for (const absoluteFile of this.getPathsWithExtensions(absoluteFiles)) {
      const parsed = this.tryLoadAbsoluteFile(absoluteFile);
      if (parsed) {
        context.sourcePaths.push(absoluteFile);
        return parsed;
      }
    }
  }

  private tryLoadAbsoluteFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const extension = this.extensions.find((ext) => filePath.endsWith(`.${ext}`));
      const parsed = this.parse(content, { extension, filePath });
      if (parsed) return parsed;
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  private getPathsWithExtensions(maybeWithoutExtensions: string[]) {
    const paths = maybeWithoutExtensions.flatMap((path) => {
      const existingExtension = extname(path);
      if (existingExtension && this.extensions.includes(existingExtension.slice(1))) {
        return [path];
      }

      const resolved: string[] = [];
      if (!this.requireExtension) resolved.push(path);
      for (const extension of this.extensions) resolved.push(path + "." + extension);
      return resolved;
    });

    return paths;
  }
}
