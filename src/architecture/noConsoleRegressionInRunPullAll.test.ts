import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runPullAll", () => {
  const source = readSourceFile("src/commands/runPullAll.ts");

  it("keeps runPullAll on logger", () => {
    expectNoDirectConsole(source);
  });
});
