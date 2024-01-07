const NUMBER_REGEX = /^-?[0-9\.]{1,16}$/;
const STRING_REGEX = /^"(.*)"$/;
const NEWLINE_REGEX = /\\n/g;

export const coerceValue = (input: string) => {
  const stringMatch = STRING_REGEX.exec(input);
  if (stringMatch) {
    return stringMatch[1]?.replace(NEWLINE_REGEX, "\n");
  }

  if (input === "true") return true;
  if (input === "false") return false;
  if (NUMBER_REGEX.test(input)) {
    const parsed = +input;
    if (parsed < Number.MAX_SAFE_INTEGER) {
      return parsed;
    }
  }

  return input;
};

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

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
}
