import { merge } from "merge";
import { TOMLLoader } from "./index.js";
import { ArgsLoader } from "./loaders/args.loader.js";
import { EnvLoader } from "./loaders/env.loader.js";
import { JSONLoader } from "./loaders/fs/json.loader.js";
import { YAMLLoader } from "./loaders/fs/yaml.loader.js";
import type { LoaderResolvable } from "./resolve-loaders.js";
import { resolveLoaders } from "./resolve-loaders.js";
import { createLoaderContext } from "./helpers/create-loader-context.js";

export const DEFAULT_LOADERS: LoaderResolvable[] = [JSONLoader, YAMLLoader, TOMLLoader, ArgsLoader, EnvLoader];
export const SOURCE_PATHS = Symbol("sourcePaths");

export interface LoadDataOptions {
  loaders?: LoaderResolvable[];
  pathHints?: string[];
}

export function loadConfig<T = unknown>(
  appName: string,
  options?: LoadDataOptions
): Partial<T & { [SOURCE_PATHS]: string[] }> {
  const loaders = resolveLoaders(options?.loaders ?? DEFAULT_LOADERS);
  const context = createLoaderContext(options);
  const mergedConfig = loaders.reduce((result, loader) => {
    return merge(result, loader.load(appName, context));
  }, {} as T);

  return {
    ...mergedConfig,
    [SOURCE_PATHS]: context.sourcePaths,
  };
}
