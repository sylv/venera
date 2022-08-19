import minimist from "minimist";
import { constantCaseToPath } from "../helpers/constant-case-to-path.js";
import flat from "flat";
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

    return flat.unflatten<Record<string, string>, Record<string, string>>(flattened);
  }
}
