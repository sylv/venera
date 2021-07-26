export abstract class Loader {
  abstract load(appName: string): Record<string, any> | undefined;
}
