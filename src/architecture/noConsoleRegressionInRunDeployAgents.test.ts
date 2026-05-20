import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runDeployAgents", () => {
  const source = readSourceFile("src/commands/runDeployAgents.ts");

  it("keeps runDeployAgents on logger", () => {
    expectNoDirectConsole(source);
  });
});
