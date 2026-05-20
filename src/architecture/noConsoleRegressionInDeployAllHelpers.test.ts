import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for deploy batch helpers", () => {
  const deployAllAgentsSource = readSourceFile("src/commands/deployAllAgents.ts");
  const deployAllSkillsSource = readSourceFile("src/commands/deployAllSkills.ts");

  it("keeps deployAllAgents on logger", () => {
    expectNoDirectConsole(deployAllAgentsSource);
  });

  it("keeps deployAllSkills on logger", () => {
    expectNoDirectConsole(deployAllSkillsSource);
  });
});
