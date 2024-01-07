import { beforeEach } from "vitest";
import { afterEach, vi } from "vitest";
import { vol } from "memfs";

beforeEach(() => {
  vi.mock("fs", () => {
    const { fs } = require("memfs");
    return {
      ...fs,
      default: fs,
    };
  });

  vi.spyOn(process, "cwd").mockReturnValue("/app");
  vol.fromJSON({ "/app": null });
});

afterEach(() => {
  vi.resetAllMocks();
});
