import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for pullAllAgents", () => {
  const pullAllAgentsSource = readSourceFile("src/commands/pullAllAgents.ts");

  it("keeps pullAllAgents on logger", () => {
    expectNoDirectConsole(pullAllAgentsSource);
  });
});
