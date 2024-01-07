import { vol } from "memfs";
import { beforeEach } from "vitest";
import { expect, it } from "vitest";
import { createLoaderContext } from "../../helpers/create-loader-context.js";
import { JSONLoader } from "./json.loader.js";

beforeEach(() => {
  vol.fromJSON({
    "/app/.apprc.json": JSON.stringify({ hello: "world" }),
    "/app/config.json": JSON.stringify({ hello: "world" }),
  });
});

it("should parse json files", () => {
  const loader = new JSONLoader("/app");
  const output = loader.load("app", createLoaderContext());
  expect(output).toMatchInlineSnapshot(`
    {
      "hello": "world",
    }
  `);
});

it("should parse json files with hints", () => {
  const loader = new JSONLoader("/app");
  const output = loader.load("app", {
    sourcePaths: [],
    pathHints: ["config.json"],
  });

  expect(output).toMatchInlineSnapshot(`
    {
      "hello": "world",
    }
  `);
});
