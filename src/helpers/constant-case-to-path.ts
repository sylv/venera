export function constantCaseToPath(key: string) {
  return key
    .replace(/_{2,}/g, ".")
    .split(/[-_ ]+/g)
    .map((part, index) => {
      if (index === 0) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}
