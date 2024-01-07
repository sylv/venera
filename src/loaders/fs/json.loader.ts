import { parse } from "comment-json";
import { FSLoader, type FSLoaderData } from "./fs.loader.js";

export class JSONLoader extends FSLoader {
  readonly extensions = ["json"];
  readonly requireExtension = false;
  public parse(text: string, { extension }: FSLoaderData) {
    try {
      const result = parse(text);
      if (typeof result === "object" && result !== null) {
        return result;
      } else {
        // todo: no path to where the json file is?
        throw new Error(`Could not read JSON config file`);
      }
    } catch (err) {
      if (extension) throw err;
      return;
    }
  }
}

if (import.meta.vitest) {
  const { it, expect, beforeEach } = import.meta.vitest;
  const { vol } = await import("memfs");
  const { createLoaderContext } = await import("../../helpers/create-loader-context.js");

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
}
