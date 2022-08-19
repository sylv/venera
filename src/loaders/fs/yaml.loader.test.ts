import mock from "mock-fs";
import { afterAll, beforeAll, expect, it } from "vitest";
import yaml from "yaml";
import { YAMLLoader } from "./yaml.loader.js";

const FILE_CONTENT = {
  clientToken: "value",
  number: 1,
  nested: {
    key: "value",
  },
};

beforeAll(() => {
  mock({
    // todo: stringifying this with the same module we use to parse it
    // without extras like comments that would actually make it a human
    // created config isn't the best test.
    "/app/.apprc.yaml": yaml.stringify(FILE_CONTENT),
  });
});

afterAll(() => {
  mock.restore();
});

it("should parse yaml files", () => {
  const loader = new YAMLLoader("/app");
  const output = loader.load("app");
  expect(output).toEqual(FILE_CONTENT);
});
