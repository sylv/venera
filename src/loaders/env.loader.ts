import { constantCase } from "change-case";
import { unflatten } from "flat";
import fs from "fs";
import { constantCaseToPath } from "../helpers/constant-case-to-path.js";
import { findUp } from "../helpers/find-up.js";
import { coerceValue } from "../index.js";
import { Loader, type LoaderContext } from "./loader.js";

export interface EnvLoaderOptions {
  cwd?: string;
  /**
   * Whether to load variables from .env files into process.env
   * @default true
   */
  loadIntoEnv?: boolean;
  /**
   * Whether to throw when unprefixed environment variables are found in .env files
   * @default false
   */
  throwOnUnprefixed?: boolean;
  /**
   * Whether to throw if variables are empty.
   * @default true
   */
  throwOnEmpty?: boolean;
}

export class EnvLoader extends Loader {
  private static readonly VALID_ENVIRONMENTS = new Set(["development", "production", "staging", "test"]);
  private static readonly COMMENT_REGEX = /(?<=^| )#.*$/gm;
  constructor(private readonly options: EnvLoaderOptions = {}) {
    super();
  }

  public load(appName: string, context: LoaderContext) {
    const flattened: Record<string, any> = {};
    const nodeEnv = EnvLoader.VALID_ENVIRONMENTS.has(process.env.NODE_ENV!) && process.env.NODE_ENV;
    const prefix = `${constantCase(appName)}_`;
    const cwd = this.options.cwd ?? process.cwd();

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

    // load from .env, .env.development etc files
    const fileNames = [".env", ".env.local"];
    if (nodeEnv) fileNames.unshift(`.env.${nodeEnv.toLowerCase()}`);
    for (const fileName of fileNames) {
      const filePath = findUp(fileName, cwd);
      if (!filePath) continue;
      context.sourcePaths.push(filePath);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const parsed = this.parse(fileContent);
      for (const key in parsed) {
        if (this.options.loadIntoEnv !== false) {
          // defaults to true because its convenient, sometimes external tools
          // have env variables and its nice to set them in the same file without configuration.
          process.env[key] = parsed[key];
        }

        if (!key.startsWith(prefix)) {
          if (this.options.throwOnUnprefixed) {
            throw new Error(`Unprefixed environment variable "${key}" found in ${filePath}`);
          }

          continue;
        }

        const withoutPrefix = key.substring(prefix.length);
        const path = constantCaseToPath(withoutPrefix);
        flattened[path] = parsed[key];
      }
    }

    return unflatten<Record<string, string>, Record<string, any>>(flattened);
  }

  public parse(content: string) {
    const lines = content.trim().replace(EnvLoader.COMMENT_REGEX, "").split("\n");
    const result: Record<string, any> = {};
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx]!;
      let [key, value] = line.trim().split("=");
      if (!key) continue;
      if (!value) {
        if (this.options.throwOnEmpty !== false) {
          throw new Error(`Malformed .env content on line ${idx + 1}: "${line}"`);
        }

        continue;
      }

      result[key] = coerceValue(value);
    }

    return result;
  }
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;
  const { vol } = await import("memfs");
  const { createLoaderContext } = await import("../helpers/create-loader-context.js");

  describe("loader", () => {
    it("should load flags from process.env", () => {
      process.env.APP_CLIENT_TOKEN = "test";
      process.env.UNPREFIXED_VALUE = "never";
      const loader = new EnvLoader();
      const output = loader.load("app", createLoaderContext());
      expect(output.clientToken).toBe("test");
      expect(output.unprefixedValue).toBeUndefined();
    });

    it("should load flags from .env and .env.local files", () => {
      vol.fromJSON({
        "/app/.env": "APP_ENV_VALUE=env",
        "/app/.env.local": "APP_LOCAL_VALUE=local",
      });

      const loader = new EnvLoader({ cwd: "/app" });
      const output = loader.load("app", createLoaderContext());
      expect(output.envValue).toBe("env");
      expect(output.localValue).toBe("local");
    });

    it("should look in parent directories for .env files", () => {
      vol.fromJSON({ "/app/.env": "APP_TEST_VALUE=test_value", "/app/packages/test-app": null });
      const loader = new EnvLoader({ cwd: "/app/packages/test-app" });
      const output = loader.load("app", createLoaderContext());
      expect(output.testValue).toBe("test_value");
    });

    it("should support .env files with an environment extension", () => {
      process.env.NODE_ENV = "staging";
      process.env.APP_GLOBAL_ENV_VALUE = "global";

      vol.fromJSON({
        "/app/.env": "APP_GLOBAL_FILE_VALUE=global",
        "/app/.env.staging": "APP_STAGING_ONLY_VALUE=staging",
        "/app/.env.production": "APP_PRODUCTION_ONLY_VALUE=production",
      });

      const loader = new EnvLoader({ cwd: "/app" });
      const output = loader.load("app", createLoaderContext());
      expect(output.globalEnvValue).toBe("global");
      expect(output.globalFileValue).toBe("global");
      expect(output.stagingOnlyValue).toBe("staging");
      expect(output.productionOnlyValue).toBeUndefined();
    });

    it("should support nested keys with __", () => {
      process.env.APP_LOADED_VALUE__NESTED = "loaded";
      vol.fromJSON({ "/app/.env": "APP_FILE_VALUE__NESTED=file" });
      const loader = new EnvLoader({ cwd: "/app" });
      const output = loader.load("app", createLoaderContext());
      expect(output.fileValue.nested).toBe("file");
      expect(output.loadedValue.nested).toBe("loaded");
    });

    it("should merge values with multiple environment variables", () => {
      process.env.APP_LOADED_VALUE__NESTED = "loaded";
      vol.fromJSON({
        "/app/.env": "TEST_KEY_ONE=one\nTEST_KEY_TWO=default",
        "/app/.env.development": "TEST_KEY_TWO=two",
      });
    });

    it("should coerce boolean/number values", () => {
      process.env.APP_BOOL = "true"; // coerce bools
      process.env.APP_INT_QUOTED = '"1"'; // leave numbers in strings alone
      process.env.APP_UNSAFE_NUMBER = "111372124383428608"; // leave unsafe numbers alone
      vol.fromJSON({
        "/app/.env": "APP_INT=1", // coerce ints
      });

      const loader = new EnvLoader({ cwd: "/app" });
      const output = loader.load("app", createLoaderContext());
      expect(output.bool).toBe(true);
      expect(output.int).toBe(1);
      expect(output.intQuoted).toBe("1");
      expect(output.unsafeNumber).toBe("111372124383428608");
    });

    it("options.loadIntoEnv", () => {
      vol.fromJSON({
        "/app/.env": "APP_TEST_VALUE=test_value",
      });

      const loader = new EnvLoader({ cwd: "/app", loadIntoEnv: true });
      const output = loader.load("app", createLoaderContext());
      expect(output.testValue).toBe("test_value");
      expect(process.env.APP_TEST_VALUE).toBe("test_value");
    });

    it("options.throwUnprefixed", () => {
      vol.fromJSON({
        "/app/.env": "APP_VALUE=test\nUNPREFIXED_VALUE=unprefixed",
      });

      const enabled = new EnvLoader({ cwd: "/app", throwOnUnprefixed: true });
      expect(() => enabled.load("app", createLoaderContext())).toThrowErrorMatchingInlineSnapshot(
        `[Error: Unprefixed environment variable "UNPREFIXED_VALUE" found in /app/.env]`
      );
      const disabled = new EnvLoader({ cwd: "/app", throwOnUnprefixed: false });
      expect(() => disabled.load("app", createLoaderContext())).not.toThrow();
    });

    it("options.throwOnEmpty", () => {
      vol.fromJSON({
        "/app/.env": "APP_VALUE=test\nEMPTY_VALUE=",
      });

      const enabled = new EnvLoader({ cwd: "/app", throwOnEmpty: true });
      expect(() => enabled.load("app", createLoaderContext())).toThrowErrorMatchingInlineSnapshot(
        `[Error: Malformed .env content on line 2: "EMPTY_VALUE="]`
      );
      const disabled = new EnvLoader({ cwd: "/app", throwOnEmpty: false });
      expect(() => disabled.load("app", createLoaderContext())).not.toThrow();
    });
  });

  describe("parser", () => {
    it("should support comments in .env files", () => {
      const file = `# this is an opening comment\n\nKEY=value # this is an inline comment\n#this is a closing comment\n\n`;
      const loader = new EnvLoader();
      const output = loader.parse(file);
      expect(output.KEY).toBe("value");
    });

    it("should strip quotes", () => {
      const loader = new EnvLoader();
      const output = loader.parse('APP_KEY="value"');
      expect(output.APP_KEY).toBe("value");
    });

    it("should throw on malformed .env lines", () => {
      const loader = new EnvLoader();
      expect(() => loader.parse("not a valid line :)")).toThrow(/malformed \.env content on line/i);
    });

    it("should coerce booleans/numbers", () => {
      const loader = new EnvLoader();
      const input = `BOOLEAN=true\nNUMBER=1.1\nSTRING=test string`;
      const output = loader.parse(input);
      expect(output.BOOLEAN).toBe(true);
      expect(output.NUMBER).toBe(1.1);
      expect(output.STRING).toBe("test string");
    });
  });
}
