import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("logger migration regression guard for deployContextFiles", () => {
  const deployContextFilesSource = readSourceFile("src/commands/deployContextFiles.ts");

  it("keeps deployContextFiles on logger", () => {
    expectNoDirectConsole(deployContextFilesSource);
  });
});
