import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runPullAgents", () => {
  const source = readSourceFile("src/commands/runPullAgents.ts");

  it("keeps runPullAgents on logger", () => {
    expectNoDirectConsole(source);
  });
});
