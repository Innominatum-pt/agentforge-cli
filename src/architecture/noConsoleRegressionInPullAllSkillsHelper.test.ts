import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for pullAllSkills", () => {
  const pullAllSkillsSource = readSourceFile("src/commands/pullAllSkills.ts");

  it("keeps pullAllSkills on logger", () => {
    expectNoDirectConsole(pullAllSkillsSource);
  });
});
