import { expect, it } from "vitest";
import { coerceValue } from "./coerce-value.js";

it("should coerce booleans", () => {
  expect(coerceValue("true")).toBe(true);
  expect(coerceValue("false")).toBe(false);
});

it("should coerce numbers", () => {
  expect(coerceValue("1")).toBe(1);
  expect(coerceValue("1.0")).toBe(1);
  expect(coerceValue("1.1")).toBe(1.1);
  expect(coerceValue("1.123456789")).toBe(1.123456789);
  expect(coerceValue("0")).toBe(0);
  expect(coerceValue("-10.1")).toBe(-10.1);

  // should not parse numbers larger than MAX_SAFE_INTEGER, leave them as strings because
  // they might be twitter snowflakes or other large numbers that are unsafe to parse
  const maxNumber = (Number.MAX_SAFE_INTEGER + 1).toString();
  expect(coerceValue(maxNumber)).toBe(maxNumber);
});

it("should coerce strings", () => {
  expect(coerceValue("test")).toBe("test");
  expect(coerceValue('"test"')).toBe("test");
});
