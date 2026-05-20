import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runPullSkills", () => {
  const source = readSourceFile("src/commands/runPullSkills.ts");

  it("keeps runPullSkills on logger", () => {
    expectNoDirectConsole(source);
  });
});
