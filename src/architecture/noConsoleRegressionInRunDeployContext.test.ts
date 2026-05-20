import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for runDeployContext", () => {
  const source = readSourceFile("src/commands/runDeployContext.ts");

  it("keeps runDeployContext on logger", () => {
    expectNoDirectConsole(source);
  });
});
