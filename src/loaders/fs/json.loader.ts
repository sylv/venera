import { FSLoader, type FSLoaderData } from "./fs.loader.js";
import { parse } from "comment-json";

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
