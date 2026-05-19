import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for pull agents command", () => {
  const indexSource = readIndexSource();

  it("keeps pull agents command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'pullCmd\n  .command("agents")',
      "pullCmd\n  .command('all')"
    );

    expectNoDirectConsole(region);
  });
});
