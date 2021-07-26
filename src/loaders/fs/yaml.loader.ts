import yaml from "yaml";
import { FSLoader, FSLoaderData } from "./fs.loader";

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
