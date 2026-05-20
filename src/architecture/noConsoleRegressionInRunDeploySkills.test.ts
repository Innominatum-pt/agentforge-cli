import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runDeploySkills", () => {
  const source = readSourceFile("src/commands/runDeploySkills.ts");

  it("keeps runDeploySkills on logger", () => {
    expectNoDirectConsole(source);
  });
});
