import { vol } from "memfs";
import { beforeEach } from "vitest";
import { expect, it } from "vitest";
import { createLoaderContext } from "../../helpers/create-loader-context.js";
import { YAMLLoader } from "./yaml.loader.js";

beforeEach(() => {
  vol.fromJSON({
    "/app/.apprc.yaml": JSON.stringify({ hello: "world" }),
  });
});

it("should parse yaml files", () => {
  const loader = new YAMLLoader("/app");
  const output = loader.load("app", createLoaderContext());
  expect(output).toMatchInlineSnapshot(`
    {
      "hello": "world",
    }
  `);
});
