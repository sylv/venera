import { default as merge } from "merge";
import { ArgsLoader } from "./loaders/args.loader.js";
import { EnvLoader } from "./loaders/env.loader.js";
import { JSONLoader } from "./loaders/fs/json.loader.js";
import { YAMLLoader } from "./loaders/fs/yaml.loader.js";
import { resolveLoaders } from "./resolve-loaders.js";
import type { LoaderResolvable } from "./resolve-loaders.js";

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
