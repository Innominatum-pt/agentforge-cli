import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for pull skills command", () => {
  const indexSource = readIndexSource();

  it("keeps pull skills command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'pullCmd\n  .command("skills")',
      'pullCmd\n  .command("agents")'
    );

    expectNoDirectConsole(region);
  });
});
