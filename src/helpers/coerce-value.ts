const NUMBER_REGEX = /^[0-9\.]{1,16}$/;
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
