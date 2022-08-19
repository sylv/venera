# venera

- [venera](#venera)
  - [sources](#sources)
  - [usage](#usage)
  - [custom loaders](#custom-loaders)
  - [todo](#todo)

Another config loader, intended for loading configuration files for services. For libraries, consider something like [cosmiconfig](https://github.com/davidtheclark/cosmiconfig). This is mostly for my own use because I can't find a single library that does what I want, but it's free for anyone to use, as long as you're fine with subpar documentation.

## sources

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
import mock from "mock-fs";

// create some fake files on disk, totally unnecessary for
// real world use but to keep this example simple
mock({
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

// "venera" should be the name of your app
const data = loadConfig("myapp");
// data now looks like:
// {
//   message: "Very cool",
//   redis: {
//     host: "127.0.0.1",
//     password: "youshallnotpass",
//     port: 6379,
//   }
// }

// "zod" is a great option to parse the resulting schema.
// "class-validator" might also be convenient if you already use it.
// this is of course optional, by this point its just an object.
const config = validateConfig(data);
export { config };
```

## custom loaders

```ts
import { loadConfig, constantCaseToPath, DEFAULT_LOADERS } from "@ryanke/venera";

export class MyLoader extends Loader {
  load(appName: string): Record<string, any> {
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

- [ ] Option to turn off merging and instead just return the first config found. This would have to be implemented per-loader to make sense, because I think it would be nice if you could turn off merging and still override .rc values with environment variables, sometimes its just convenient.
- [ ] Output sources for each config value, maybe even per-property with symbols declaring which properties are from where so you could do something like `The key CLIENT_TOKEN in config /home/user/.env is invalid` or something.
- [ ] TOML/INI support? The more file system loaders are added the more startup slows down checking for all of them, realistically I think YAML is as human-readable as you need anyway, but it would be nice to throw in.
