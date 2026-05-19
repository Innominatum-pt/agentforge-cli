import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for pullAgent", () => {
  const indexSource = readIndexSource();

  it("keeps pullAgent on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function pullAgent",
      'pullCmd\n  .command("agents")'
    );

    expectNoDirectConsole(region);
  });
});
