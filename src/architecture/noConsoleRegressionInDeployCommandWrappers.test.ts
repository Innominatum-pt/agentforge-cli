import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard for deploy command wrappers", () => {
  const indexSource = readIndexSource();

  it("keeps deploy skill command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("skill <slug>")',
      'deployCmd\n  .command("context <slug>")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy context command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("context <slug>")',
      'deployCmd\n  .command("agent <slug>")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy agent command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("agent <slug>")',
      'deployCmd\n  .command("agents")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy agents command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("agents")',
      'deployCmd\n  .command("skills")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy skills command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("skills")',
      'deployCmd\n  .command("all")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy all command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("all")',
      "const pullCmd = program"
    );
    expectNoDirectConsole(region);
  });
});
