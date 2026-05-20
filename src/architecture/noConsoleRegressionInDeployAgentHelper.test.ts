import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for deployAgent", () => {
  const deployAgentSource = readSourceFile("src/commands/deployAgent.ts");

  it("keeps deployAgent on logger", () => {
    expectNoDirectConsole(deployAgentSource);
  });
});
