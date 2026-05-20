import { describe, expect, it } from "vitest";
import { readSourceFile } from "./architectureTestUtils";

describe("runPullAll composes pull runners guard", () => {
  const source = readSourceFile("src/commands/runPullAll.ts");

  it("imports runPullSkills", () => {
    expect(source).toContain('from "./runPullSkills"');
  });

  it("imports runPullAgents", () => {
    expect(source).toContain('from "./runPullAgents"');
  });

  it("does not import pullAllSkills", () => {
    expect(source).not.toContain('from "./pullAllSkills"');
  });

  it("does not import pullAllAgents", () => {
    expect(source).not.toContain('from "./pullAllAgents"');
  });

  it("awaits runPullSkills(config)", () => {
    expect(source).toContain("await runPullSkills(config)");
  });

  it("awaits runPullAgents(config)", () => {
    expect(source).toContain("await runPullAgents(config)");
  });
});
