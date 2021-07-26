import "reflect-metadata";
import { IsString, IsNumber, ValidateNested, IsDefined } from "class-validator";
import { Type } from "class-transformer";
import { validateConfig } from "./validate-config";

it("should validate configs", () => {
  class TestSchema {
    @IsString()
    public string!: string;

    @IsNumber()
    public number!: number;
  }

  const config = validateConfig(TestSchema, {
    string: "test",
    number: 1,
  });

  expect(config).toBeInstanceOf(TestSchema);
  expect(config.string).toBe("test");
  expect(config.number).toBe(1);
  expect(() => validateConfig(TestSchema, { string: 1, number: "test" })).toThrow();
  expect(() => validateConfig(TestSchema, { string: NaN })).toThrow();
});

it("should validate configs with nested schemas", () => {
  class ChildSchema {
    @IsString()
    test!: string;
  }

  class ParentSchema {
    @ValidateNested()
    @IsDefined()
    @Type(() => ChildSchema)
    child!: ChildSchema;
  }

  const config = validateConfig(ParentSchema, { child: { test: "test" } });
  expect(config.child.test).toBe("test");
  expect(() => validateConfig(ParentSchema, { child: { test: 1 } })).toThrow();
  expect(() => validateConfig(ParentSchema, { child: null })).toThrow();
  expect(() => validateConfig(ParentSchema, { child: {} })).toThrow();
  expect(() => validateConfig(ParentSchema, {})).toThrow();
});

it("should support default schema values", () => {
  class TestSchema {
    @IsString()
    public message = "Hello";
  }

  expect(validateConfig(TestSchema, {}).message).toBe("Hello");
  expect(validateConfig(TestSchema, { message: "World" }).message).toBe("World");
});
