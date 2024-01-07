export interface LoaderContext {
  pathHints?: string[];
  sourcePaths: string[];
}

export abstract class Loader {
  abstract load(appName: string, context: LoaderContext): Record<string, any> | undefined;
}
