import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for pull all command", () => {
  const indexSource = readIndexSource();

  it("keeps pull all command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      "pullCmd\n  .command('all')",
      "program.parse();"
    );

    expectNoDirectConsole(region);
  });
});
