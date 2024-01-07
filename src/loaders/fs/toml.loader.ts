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
