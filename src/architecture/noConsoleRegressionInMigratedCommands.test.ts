import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard", () => {
  const coreSource = readSourceFile("src/commands/registerCoreCommands.ts");

  it("keeps core command registration on logger", () => {
    expectNoDirectConsole(coreSource);
  });
});
