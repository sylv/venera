import { FSLoader, FSLoaderData } from "./fs.loader";
import { parse } from "comment-json";

export class JSONLoader extends FSLoader {
  readonly extensions = ["json"];
  readonly requireExtension = false;
  public parse(text: string, { extension }: FSLoaderData) {
    try {
      return parse(text);
    } catch (err) {
      if (extension) throw err;
      return;
    }
  }
}
