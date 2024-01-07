import { type LoaderContext } from "../index.js";
import { type LoadDataOptions } from "../load-config.js";

export const createLoaderContext = (options?: LoadDataOptions): LoaderContext => {
  return {
    pathHints: options?.pathHints,
    sourcePaths: [],
  };
};
