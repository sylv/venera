import dedent from "dedent";
import { vol } from "memfs";
import { beforeEach } from "vitest";
import { expect, it } from "vitest";
import { createLoaderContext } from "../../helpers/create-loader-context.js";
import { TOMLLoader } from "./toml.loader.js";

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
