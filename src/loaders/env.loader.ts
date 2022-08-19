import { constantCase } from "constant-case";
import { findUpSync } from "find-up";
import flat from "flat";
import fs from "fs";
import { constantCaseToPath } from "../helpers/constant-case-to-path.js";
import { coerceValue } from "../index.js";
import { Loader } from "./loader.js";

export interface EnvLoaderOptions {
  cwd?: string;
}

export class EnvLoader extends Loader {
  private static readonly VALID_ENVIRONMENTS = new Set(["development", "production", "staging", "test"]);
  private static readonly COMMENT_REGEX = /(?<=^| )#.*$/gm;
  constructor(private readonly cwd: string = process.cwd()) {
    super();
  }

  public load(appName: string) {
    const flattened: Record<string, any> = {};
    const nodeEnv = EnvLoader.VALID_ENVIRONMENTS.has(process.env.NODE_ENV!) && process.env.NODE_ENV;
    const prefix = `${constantCase(appName)}_`;

    // load from .env, .env.development etc files
    const fileNames = [".env", ".env.local"];
    if (nodeEnv) fileNames.unshift(`.env.${nodeEnv.toLowerCase()}`);
    for (const fileName of fileNames) {
      const filePath = findUpSync(fileName, { cwd: this.cwd });
      if (!filePath) continue;
      const fileContent = fs.readFileSync(filePath);
      const parsed = this.parse(fileContent.toString());
      for (const key in parsed) {
        // todo: silently moving on here might be bad. we could have a configurable option for
        // whether to throw if missing prefixes, because some projects like nextjs will have
        // unrelated .env files that throwing would break.
        if (!key.startsWith(prefix)) continue;
        const withoutPrefix = key.substring(prefix.length);
        const path = constantCaseToPath(withoutPrefix);
        flattened[path] = parsed[key];
      }
    }

    // load from process.env
    for (const key in process.env) {
      if (!key.startsWith(prefix)) continue;
      // prefixes are required for process.env variables
      const withoutPrefix = key.substring(prefix.length);
      const path = constantCaseToPath(withoutPrefix);
      const value = process.env[key];
      if (value !== undefined) {
        flattened[path] = coerceValue(value);
      }
    }

    return flat.unflatten<Record<string, string>, Record<string, any>>(flattened);
  }

  public parse(content: string) {
    const lines = content.toString().trim().replace(EnvLoader.COMMENT_REGEX, "").split("\n");
    const result: Record<string, any> = {};
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx]!;
      let [key, value] = line.trim().split("=");
      if (!key) continue;
      if (!value) throw new Error(`Malformed .env content on line ${idx + 1}: "${line}"`);
      result[key] = coerceValue(value);
    }

    return result;
  }
}
