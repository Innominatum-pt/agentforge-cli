import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for pullAgent", () => {
  const pullAgentSource = readSourceFile("src/commands/pullAgent.ts");

  it("keeps pullAgent on logger", () => {
    expectNoDirectConsole(pullAgentSource);
  });
});
