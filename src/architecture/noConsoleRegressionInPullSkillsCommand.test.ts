import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for pull skills command", () => {
  const source = readSourceFile("src/commands/registerPullCommands.ts");

  it("keeps pull skills command wrapper on logger", () => {
    expectNoDirectConsole(source);
  });
});
