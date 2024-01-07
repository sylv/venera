import yaml from "yaml";
import { FSLoader, type FSLoaderData } from "./fs.loader.js";

export class YAMLLoader extends FSLoader {
  readonly extensions = ["yaml", "yml"];
  readonly requireExtension = true;
  public parse(text: string, { extension }: FSLoaderData) {
    try {
      return yaml.parse(text);
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
}
