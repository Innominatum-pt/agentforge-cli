import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for deploy command wrappers", () => {
  const deployCommandsSource = readSourceFile("src/commands/registerDeployCommands.ts");

  it("keeps deploy command wrappers on logger", () => {
    expectNoDirectConsole(deployCommandsSource);
  });
});
