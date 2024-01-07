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

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("should convert constant case to camel case", () => {
    expect(constantCaseToPath("TEST_KEY")).toBe("testKey");
    expect(constantCaseToPath("TEST_KEY_HERE_2")).toBe("testKeyHere2");
    expect(constantCaseToPath("test-key")).toBe("testKey");
    expect(constantCaseToPath("stinky-test--key")).toBe("stinkyTestKey");
    expect(constantCaseToPath("stinky test key")).toBe("stinkyTestKey");
  });

  it("should handle nested keys", () => {
    expect(constantCaseToPath("TEST_PROPERTY__NESTED_KEY__NESTED_KEY_2")).toBe("testProperty.nestedKey.nestedKey2");
    expect(constantCaseToPath("test__property")).toBe("test.property");
    expect(constantCaseToPath("stinky-test.key")).toBe("stinkyTest.key");
  });

  it("should handle long underscore properly", () => {
    expect(constantCaseToPath("TEST_____PROPERTY")).toBe("test.property");
  });
}
