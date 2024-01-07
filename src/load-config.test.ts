import { vol } from "memfs";
import { expect, it, vi } from "vitest";
import { SOURCE_PATHS, loadConfig } from "./load-config.js";

it("should load configs", () => {
  process.env.APP_ENV = "env";
  vi.spyOn(process, "cwd").mockReturnValue("/project/packages/app");
  vol.fromJSON({
    "/project/packages/app/.env": "APP_KEY=env file # a test comment",
    "/project/.apprc.yaml": `yaml: 'yaml file'`,
  });

  const data = loadConfig("app");
  expect(data).toEqual({
    env: "env",
    key: "env file",
    yaml: "yaml file",
    [SOURCE_PATHS]: ["/project/.apprc.yaml", "/project/packages/app/.env"],
  });
});

it("should allow environment variables to override file values", () => {
  process.env.APP_VALUE = "override";
  vol.fromJSON({ "/project/.apprc.json": JSON.stringify({ value: "never" }) });
  const data = loadConfig<any>("app");
  expect(data.value).toEqual("override");
});
