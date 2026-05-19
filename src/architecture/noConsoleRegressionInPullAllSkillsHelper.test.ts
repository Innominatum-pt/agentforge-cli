import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for pullAllSkills", () => {
  const indexSource = readIndexSource();

  it("keeps pullAllSkills on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function pullAllSkills",
      'pullCmd\n  .command("skills")'
    );

    expectNoDirectConsole(region);
  });
});
