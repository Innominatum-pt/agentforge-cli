import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runDeploySkill", () => {
  const source = readSourceFile("src/commands/runDeploySkill.ts");

  it("keeps runDeploySkill on logger", () => {
    expectNoDirectConsole(source);
  });
});
