import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runDeployAll", () => {
  const source = readSourceFile("src/commands/runDeployAll.ts");

  it("keeps runDeployAll on logger", () => {
    expectNoDirectConsole(source);
  });
});
