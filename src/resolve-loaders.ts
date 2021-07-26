import { Loader } from "./loaders/loader";

export type LoaderResolvable = new () => Loader | Loader;

export function resolveLoaders(loaders: LoaderResolvable[]): Loader[] {
  const resolved: Loader[] = [];
  for (const loader of loaders) {
    if ("load" in loader) {
      // its already an instance of Loader
      resolved.push(loader as unknown as Loader);
      continue;
    }

    // get instance of loader
    const LoaderClass = loader as unknown as new () => Loader;
    resolved.push(new LoaderClass());
  }

  return resolved;
}
