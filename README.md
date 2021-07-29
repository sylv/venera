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
import "reflect-metadata";
import { Type } from "class-transformer";
import { IsDefined, IsNumber, IsString, ValidateNested } from "class-validator";
import { loadConfig, validateConfig } from "@ryanke/venera";
import mock from "mock-fs"; // unnecessary in real world use, this is just for the example

export class RedisConfig {
  @IsString()
  host = "localhost";

  // @Type(...) is necessary for class-transformer to convert a string to an int
  // which is required when using something like env variables where its all strings.
  @Type(() => Number)
  @IsNumber()
  port = 6379;

  @IsString()
  password: string;

  public get url() {
    return `redis://${this.password}@${this.host}:${this.port}`;
  }
}

// you might have to set "strictPropertyInitialization" to false in your tsconfig.json,
// or do "message!: ..." to get typescript to let it slide
export class AppConfig {
  @IsString()
  message: string;

  // class-validator handles nested validation poorly, so IsDefined is necessary
  // or else `redis: undefined` will pass validation
  @ValidateNested()
  @IsDefined()
  @Type(() => RedisConfig)
  redis: RedisConfig;
}

// this mocks file system files for tests and since im lazy and dont want to make this a multi-file example,
// im using it here. in practice this step is unnecessary
mock({
  // set nested properties with environment variables
  "./.env": "VENERA_REDIS__PASSWORD=youshallnotpass",
  "./.venerarc.json": JSON.stringify({
    message: "Very cool",
    redis: {
      // override default values
      host: "127.0.0.1",
    },
  }),
});

// "venera" should be replaced with the name of your app. if this were "app-name", venera would
// look for ".my-apprc.yaml" files, "MY_APP_VARIABLE" environment variables, etc
// if you wanted, you could skip validation and use "data" directly, but defaults wont
// be applied and transforms (eg converting strings from env variables to numbers) wont be applied.
const data = loadConfig("venera");
// validate the config, throwing an error if the config doesn't match our schema.
const config = validateConfig(AppConfig, data);
// "config" is now an instance of AppConfig
console.log(config);
console.log(config.redis.url); // redis://youShallNotPass@127.0.0.1:6379

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
