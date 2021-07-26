import merge from "merge";
import { LoaderResolvable } from "../dist";
import { ArgsLoader } from "./loaders/args.loader";
import { EnvLoader } from "./loaders/env.loader";
import { JSONLoader } from "./loaders/fs/json.loader";
import { YAMLLoader } from "./loaders/fs/yaml.loader";
import { resolveLoaders } from "./resolve-loaders";

export const DEFAULT_LOADERS: LoaderResolvable[] = [JSONLoader, YAMLLoader, ArgsLoader, EnvLoader];

export interface LoadDataOptions {
  loaders?: LoaderResolvable[];
}

export function loadConfig<T = unknown>(appName: string, options?: LoadDataOptions): Partial<T> {
  const loaders = resolveLoaders(options?.loaders ?? DEFAULT_LOADERS);
  return loaders.reduce((result, loader) => {
    return merge(result, loader.load(appName));
  }, {} as T);
}
