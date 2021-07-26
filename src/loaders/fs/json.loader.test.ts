import mock from "mock-fs";
import { JSONLoader } from "./json.loader";

const JSON_CONTENT = {
  clientToken: "value",
  number: 1,
  nested: {
    key: "value",
  },
};

beforeAll(() => {
  mock({
    "/app/.apprc.json": JSON.stringify(JSON_CONTENT),
  });
});

afterAll(() => {
  mock.restore();
});

it("should parse json files", () => {
  const loader = new JSONLoader("/app");
  const output = loader.load("app");
  expect(output).toEqual(JSON_CONTENT);
});
