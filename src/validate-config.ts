import { ClassConstructor, ClassTransformOptions, plainToClass } from "class-transformer";
import { validateSync } from "class-validator";

const DEFAULT_OPTIONS: ClassTransformOptions = {
  enableImplicitConversion: true,
  exposeDefaultValues: true,
};

export function validateConfig<T extends object>(
  schema: ClassConstructor<T>,
  data: unknown,
  options?: ClassTransformOptions
): T {
  const mergedOptions = Object.assign(DEFAULT_OPTIONS, options);
  const instance = plainToClass(schema, data, mergedOptions);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw errors;
  }

  return instance;
}
