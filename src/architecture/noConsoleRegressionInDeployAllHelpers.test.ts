import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for deploy batch helpers", () => {
  const indexSource = readIndexSource();

  it("keeps deployAllAgents on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function deployAllAgents",
      "async function deployAllSkills"
    );
    expectNoDirectConsole(region);
  });

  it("keeps deployAllSkills on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function deployAllSkills",
      'deployCmd\n  .command("agents")'
    );
    expectNoDirectConsole(region);
  });
});
