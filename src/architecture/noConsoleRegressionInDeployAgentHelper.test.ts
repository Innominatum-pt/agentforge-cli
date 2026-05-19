import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for deployAgent", () => {
  const indexSource = readIndexSource();

  it("keeps deployAgent on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function deployAgent",
      'deployCmd\n  .command("context <slug>")'
    );

    expectNoDirectConsole(region);
  });
});
