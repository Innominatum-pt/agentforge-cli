import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for deploySkill", () => {
  const deploySkillSource = readSourceFile("src/commands/deploySkill.ts");

  it("keeps deploySkill on logger", () => {
    expectNoDirectConsole(deploySkillSource);
  });
});
