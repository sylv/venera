import { merge } from "merge";
import { createLoaderContext } from "./helpers/create-loader-context.js";
import { TOMLLoader } from "./index.js";
import { ArgsLoader } from "./loaders/args.loader.js";
import { EnvLoader } from "./loaders/env.loader.js";
import { JSONLoader } from "./loaders/fs/json.loader.js";
import { YAMLLoader } from "./loaders/fs/yaml.loader.js";
import type { LoaderResolvable } from "./resolve-loaders.js";
import { resolveLoaders } from "./resolve-loaders.js";

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

if (import.meta.vitest) {
  const { it, expect, vi } = import.meta.vitest;
  const { vol } = await import("memfs");

  it("should load configs", () => {
    process.env.APP_ENV = "env";
    vi.spyOn(process, "cwd").mockReturnValue("/project/packages/app");
    vol.fromJSON({
      "/project/packages/app/.env": "APP_KEY=env file # a test comment",
      "/project/.apprc.yaml": `yaml: 'yaml file'`,
    });

    const data = loadConfig("app");
    expect(data).toEqual({
      env: "env",
      key: "env file",
      yaml: "yaml file",
      [SOURCE_PATHS]: ["/project/.apprc.yaml", "/project/packages/app/.env"],
    });
  });

  it("should allow environment variables to override file values", () => {
    process.env.APP_VALUE = "override";
    vol.fromJSON({ "/project/.apprc.json": JSON.stringify({ value: "never" }) });
    const data = loadConfig<any>("app");
    expect(data.value).toEqual("override");
  });
}
