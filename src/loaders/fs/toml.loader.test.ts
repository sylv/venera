import dedent from "dedent";
import mock from "mock-fs";
import { afterAll, beforeAll, expect, it } from "vitest";
import { TOMLLoader } from "./toml.loader.js";

beforeAll(() => {
  mock({
    "/app/.apprc.toml": dedent`
        test = "value"
        number = 1

        [nested]
        key = "value"
    `,
  });
});

afterAll(() => {
  mock.restore();
});

it("should parse yaml files", () => {
  const loader = new TOMLLoader("/app");
  const output = loader.load("app");
  expect(output).toEqual({
    test: "value",
    number: 1,
    nested: {
      key: "value",
    },
  });
});
