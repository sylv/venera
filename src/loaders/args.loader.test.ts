import { ArgsLoader } from "./args.loader";

it("should load flags from process.argv", () => {
  process.argv.push("--test", "value");
  const loader = new ArgsLoader();
  const output = loader.load("app");
  expect(output.test).toBe("value");
});
