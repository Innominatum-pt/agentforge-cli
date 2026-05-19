import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for deployContextFiles", () => {
  const indexSource = readIndexSource();

  it("keeps deployContextFiles on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function deployContextFiles",
      "async function deployAgent"
    );

    expectNoDirectConsole(region);
  });
});
