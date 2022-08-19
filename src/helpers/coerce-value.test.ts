import { expect, it } from "vitest";
import { coerceValue } from "./coerce-value.js";

it("should coerce booleans", () => {
  expect(coerceValue("true")).toBe(true);
  expect(coerceValue("false")).toBe(false);
  expect(coerceValue("1")).toBe(1);
  expect(coerceValue("1.0")).toBe(1);
  expect(coerceValue("1.1")).toBe(1.1);
  expect(coerceValue("test")).toBe("test");
});
