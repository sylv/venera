import { vol } from "memfs";
import { describe, expect, it } from "vitest";
import { EnvLoader } from "./env.loader.js";
import { createLoaderContext } from "../helpers/create-loader-context.js";

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
