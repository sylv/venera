import minimist from "minimist";
import { constantCaseToPath } from "../helpers/constant-case-to-path.js";
import { unflatten } from "flat";
import { Loader } from "./loader.js";

export class ArgsLoader extends Loader {
  public load(appName: string) {
    const args = minimist(process.argv.slice(2));
    const flattened: Record<string, any> = {};
    for (const key in args) {
      if (key === "_") continue;
      const path = constantCaseToPath(key);
      flattened[path] = args[key];
    }

    return unflatten<Record<string, string>, Record<string, string>>(flattened);
  }
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("should load flags from process.argv", () => {
    process.argv.push("--test", "value");
    const loader = new ArgsLoader();
    const output = loader.load("app");
    expect(output.test).toBe("value");
  });
}
