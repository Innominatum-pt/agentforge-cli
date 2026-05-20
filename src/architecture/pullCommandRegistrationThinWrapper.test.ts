import { describe, expect, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("pull command registration thin wrapper guard", () => {
  const source = readSourceFile("src/commands/registerPullCommands.ts");

  it("does not import fs-extra", () => {
    expect(source).not.toContain('fs-extra');
  });

  it('does not import from "path"', () => {
    expect(source).not.toContain('from "path"');
  });

  it('does not import from "../core/workspace"', () => {
    expect(source).not.toContain('from "../core/workspace"');
  });

  it("does not import pullAllSkills", () => {
    expect(source).not.toContain("pullAllSkills");
  });

  it("does not import pullAllAgents", () => {
    expect(source).not.toContain("pullAllAgents");
  });

  it("does not call fs.emptyDir", () => {
    expect(source).not.toContain("fs.emptyDir");
  });

  it("does not contain local agents cleanup message", () => {
    expect(source).not.toContain("🧹 Limpando a pasta local de agentes...");
  });

  it("does not contain pull skills success message", () => {
    expect(source).not.toContain(
      "✅ Pull de skills concluído com sucesso! As skills foram atualizadas localmente."
    );
  });

  it("does not contain pull agents success message", () => {
    expect(source).not.toContain("✅ Pull de agentes concluído com sucesso!");
  });

  it("does not contain pull all start message", () => {
    expect(source).not.toContain("🔄 Iniciando sincronização completa (pull all)...");
  });

  it("does not contain skills section header", () => {
    expect(source).not.toContain("\n--- [1/2] SKILLS ---");
  });

  it("does not contain agents section header", () => {
    expect(source).not.toContain("\n--- [2/2] AGENTS ---");
  });

  it("does not contain final sync message", () => {
    expect(source).not.toContain("\n🚀 SYNC COMPLETO! Workspace atualizado.");
  });

  it("keeps registerPullCommands on logger", () => {
    expectNoDirectConsole(source);
  });

  it("imports getRequiredGoclawConfig", () => {
    expect(source).toContain("getRequiredGoclawConfig");
  });

  it("imports confirmPullOverwrite", () => {
    expect(source).toContain("confirmPullOverwrite");
  });

  it("imports runPullSkills", () => {
    expect(source).toContain("runPullSkills");
  });

  it("imports runPullAgents", () => {
    expect(source).toContain("runPullAgents");
  });

  it("imports runPullAll", () => {
    expect(source).toContain("runPullAll");
  });

  it("calls confirmPullOverwrite with skills", () => {
    expect(source).toContain('confirmPullOverwrite("skills")');
  });

  it("calls confirmPullOverwrite with agentes", () => {
    expect(source).toContain('confirmPullOverwrite("agentes")');
  });

  it("calls confirmPullOverwrite with TUDO", () => {
    expect(source).toContain("confirmPullOverwrite('TUDO (agentes e skills)')");
  });

  it("awaits runPullSkills(config)", () => {
    expect(source).toContain("await runPullSkills(config)");
  });

  it("awaits runPullAgents(config)", () => {
    expect(source).toContain("await runPullAgents(config)");
  });

  it("awaits runPullAll(config)", () => {
    expect(source).toContain("await runPullAll(config)");
  });
});
