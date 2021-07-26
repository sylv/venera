import { loadConfig } from "./load-config";
import mock from "mock-fs";

afterAll(() => {
  mock.restore();
});

it("should load configs", () => {
  process.env.APP_ENV = "env";
  jest.spyOn(process, "cwd").mockReturnValue("/project/packages/app");
  mock({
    "/project/packages/app/.env": "APP_KEY=env file # a test comment",
    "/project/.apprc.yaml": `yaml: 'yaml file'`,
  });

  const data = loadConfig("app");
  expect(data).toEqual({
    env: "env",
    key: "env file",
    yaml: "yaml file",
  });
});

it("should allow environment variables to override file values", () => {
  process.env.APP_VALUE = "override";
  mock({ "/project/.apprc.json": JSON.stringify({ value: "never" }) });
  const data = loadConfig<any>("app");
  expect(data.value).toEqual("override");
});
