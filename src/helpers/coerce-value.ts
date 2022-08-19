const NUMBER_REGEX = /^[0-9\.]+$/;

export const coerceValue = (input: string) => {
  if (input === "true") return true;
  if (input === "false") return false;
  if (NUMBER_REGEX.test(input)) return +input;
  return input;
};
