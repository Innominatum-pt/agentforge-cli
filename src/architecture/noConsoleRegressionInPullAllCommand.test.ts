import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for pull all command", () => {
  const source = readSourceFile("src/commands/registerPullCommands.ts");

  it("keeps pull all command wrapper on logger", () => {
    expectNoDirectConsole(source);
  });
});
