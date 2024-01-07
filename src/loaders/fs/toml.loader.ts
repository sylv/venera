import toml from "toml";
import { FSLoader, type FSLoaderData } from "./fs.loader.js";

export class TOMLLoader extends FSLoader {
  readonly extensions = ["toml"];
  readonly requireExtension = true;
  public parse(text: string, { extension }: FSLoaderData) {
    try {
      return toml.parse(text);
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
  const { default: dedent } = await import("dedent");

  beforeEach(() => {
    vol.fromJSON({
      "/app/.apprc.toml": dedent`
          test = "value"
          number = 1
  
          [nested]
          key = "value"
      `,
    });
  });

  it("should parse yaml files", () => {
    const loader = new TOMLLoader("/app");
    const output = loader.load("app", createLoaderContext());
    expect(output).toMatchInlineSnapshot(`
      {
        "nested": {
          "key": "value",
        },
        "number": 1,
        "test": "value",
      }
    `);
  });
}
