# venera

A config loader for services that does the Right Thing™️ by default.

For libraries, consider something like [cosmiconfig](https://github.com/davidtheclark/cosmiconfig). This is mostly for my own use because I can't find a single library that does what I want, but it's free for anyone to use, as long as you're fine with subpar documentation.

- [venera](#venera)
  - [sources](#sources)
  - [usage](#usage)
  - [custom loaders](#custom-loaders)
  - [todo](#todo)

## sources

> [!NOTE]
> If multiple sources are found, they will be merged with loaders last in `options.loaders` taking priority.

- `--arg="values"` from process.argv
- Environment variables, prefixed with the app name.
  - Prefixed keys are **required** - if your app name was "Atlas", you should define keys as `ATLAS_API_KEY` and `ATLAS_API_SECRET`.
  - For nested values, use double underscores. `ATLAS_CLIENT__KEY` will be accessible as `client.key`
- .env files in the current directory or up.
  - `.env` and `.env.local` in any environment
  - `.env.staging`, `.env.development`, `.env.production`, `.env.test` in their respective environments based on `process.env.NODE_ENV`
  - Prefixes are **required** in .env files to prevent ambiguity with `process.env` variables that also require a prefix. Keys without a prefix are ignored.
  - Double underscores are supported for nested keys. `CLIENT__KEY` would be loaded as `client.key`
  - If there are multiple environment files found such as `.env` and `.env.staging`, their values will be merged preferring values from `.env.staging`.
- Config files in the [locations you would expect](https://github.com/sylv/venera/blob/main/src/loaders/fs/fs.loader.ts#L23).
  - JSON files are supported with or without paths, such as `.apprc`. Comments are supported.
  - For other formats, an extension is required to remove ambiguity. For YAML, you would use `.apprc.yaml`, etc.

## usage

```ts
import { loadConfig } from "@ryanke/venera";

mockFS({
  // prefixed environment variables
  "./.env": "MYAPP_REDIS__PASSWORD=youshallnotpass",
  // numbers/booleans in env variables will be parsed as numbers/booleans
  "./.env": "MYAPP_REDIS__PORT=6379",
  // config files in standard locations or in any current/parent directory
  "./.myapprc.json": JSON.stringify({
    message: "Very cool",
    redis: {
      // override default values
      host: "127.0.0.1",
    },
  }),
});

const data = loadConfig("myapp", {
  // if you want to add another file path, you can do so here.
  // this only works if a loader implements `pathHints`.
  // fs loaders do (yaml, json, toml currently). anything else is silently ignored.
  pathHints: ["config.yaml"],
});
// data now looks like:
// {
//   message: "Very cool",
//   redis: {
//     host: "127.0.0.1",
//     password: "youshallnotpass",
//     port: 6379,
//   },
//   Symbol(sourcePaths): ['/wherever/.myapprc.json', '/wherever/.env']
// }

// "zod" is a great option to parse the resulting schema.
// this is of course optional, by this point its just an object.
const config = validateConfig(data);
export { config };
```

## custom loaders

```ts
import { loadConfig, constantCaseToPath, DEFAULT_LOADERS, Loader, LoaderContext } from "@ryanke/venera";

export class MyLoader extends Loader {
  load(appName: string, context: LoaderContext): Record<string, any> {
    context.sourcePaths.push("/some/path/this/loader/loaded");
    context.pathHints; // present if passed to loadConfig()

    return {
      // its up to the loader to handle converting keys to camel case, unflattening the result, etc.
      // you can look at the included loaders for more info, specifically the .env or arg loader.
      // constantCaseToPath and the "flat" npm package is useful.
      someKey: "someValue",
      anotherKey: "anotherValue",
    };
  }
}

const data = loadConfig<Partial<AppConfig>>("app-name", {
  // the order of loaders is respected, loaders towards the end are preferred when merging
  // values from multiple sources. You can also instantiate the loader yourself if you have
  // to pass constructor parameters.
  loaders: [...DEFAULT_LOADERS, MyLoader],
});
```

## todo

- [ ] Output per-property sources so you could do something like `The key CLIENT_TOKEN in config /home/user/.env is invalid`.
