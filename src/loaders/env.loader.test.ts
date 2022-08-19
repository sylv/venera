import { EnvLoader } from "./env.loader.js";
import mock from "mock-fs";
import { afterAll, describe, it, expect } from "vitest";

afterAll(() => {
  mock.restore();
});

describe("loader", () => {
  it("should load flags from process.env", () => {
    mock();
    process.env.APP_CLIENT_TOKEN = "test";
    process.env.UNPREFIXED_VALUE = "never";
    const loader = new EnvLoader();
    const output = loader.load("app");
    expect(output.clientToken).toBe("test");
    expect(output.unprefixedValue).toBeUndefined();
  });

  it("should load flags from .env and .env.local files", () => {
    mock({
      "/app/.env": "APP_ENV_VALUE=env",
      "/app/.env.local": "APP_LOCAL_VALUE=local",
    });

    const loader = new EnvLoader("/app");
    const output = loader.load("app");
    expect(output.envValue).toBe("env");
    expect(output.localValue).toBe("local");
  });

  it("should look in parent directories for .env files", () => {
    mock({ "/app/.env": "APP_TEST_VALUE=test_value" });
    const loader = new EnvLoader("/app/packages/test-app");
    const output = loader.load("app");
    expect(output.testValue).toBe("test_value");
  });

  it("should support .env files with an environment extension", () => {
    process.env.NODE_ENV = "staging";
    process.env.APP_GLOBAL_ENV_VALUE = "global";

    mock({
      "/app/.env": "APP_GLOBAL_FILE_VALUE=global",
      "/app/.env.staging": "APP_STAGING_ONLY_VALUE=staging",
      "/app/.env.production": "APP_PRODUCTION_ONLY_VALUE=production",
    });

    const loader = new EnvLoader("/app");
    const output = loader.load("app");
    expect(output.globalEnvValue).toBe("global");
    expect(output.globalFileValue).toBe("global");
    expect(output.stagingOnlyValue).toBe("staging");
    expect(output.productionOnlyValue).toBeUndefined();
  });

  it("should support nested keys with __", () => {
    process.env.APP_LOADED_VALUE__NESTED = "loaded";
    mock({ "/app/.env": "APP_FILE_VALUE__NESTED=file" });
    const loader = new EnvLoader("/app");
    const output = loader.load("app");
    expect(output.fileValue.nested).toBe("file");
    expect(output.loadedValue.nested).toBe("loaded");
  });

  it("should merge values with multiple environment variables", () => {
    process.env.APP_LOADED_VALUE__NESTED = "loaded";
    mock({
      "/app/.env": "TEST_KEY_ONE=one\nTEST_KEY_TWO=default",
      "/app/.env.development": "TEST_KEY_TWO=two",
    });
  });

  it("should coerce boolean/number values", () => {
    process.env.APP_BOOL = "true";
    mock({
      "/app/.env": "APP_INT=1",
    });

    const loader = new EnvLoader("/app");
    const output = loader.load("app");
    expect(output.bool).toBe(true);
    expect(output.int).toBe(1);
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
