import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for deploySkill", () => {
  const indexSource = readIndexSource();

  it("keeps deploySkill on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function deploySkill",
      'deployCmd\n  .command("skill <slug>")'
    );

    expectNoDirectConsole(region);
  });
});
