import { describe, expect, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("deploy command registration thin wrapper guard", () => {
  const source = readSourceFile("src/commands/registerDeployCommands.ts");

  it('does not import from "../core/logger"', () => {
    expect(source).not.toContain('from "../core/logger"');
  });

  it('does not import from "../core/workspace"', () => {
    expect(source).not.toContain('from "../core/workspace"');
  });

  it("does not import deploySkill directly", () => {
    expect(source).not.toContain('from "./deploySkill"');
  });

  it("does not import deployAllAgents directly", () => {
    expect(source).not.toContain('from "./deployAllAgents"');
  });

  it("does not import deployAllSkills directly", () => {
    expect(source).not.toContain('from "./deployAllSkills"');
  });

  it("does not contain workspace root resolution", () => {
    expect(source).not.toContain("const basePath = getWorkspaceRoot()");
  });

  it("does not contain direct deploySkill call", () => {
    expect(source).not.toContain("deploySkill(slug, config, basePath)");
  });

  it("does not contain direct deployAllAgents call", () => {
    expect(source).not.toContain("deployAllAgents(config, basePath)");
  });

  it("does not contain direct deployAllSkills call", () => {
    expect(source).not.toContain("deployAllSkills(config, basePath)");
  });

  it("does not contain deploy agents success message", () => {
    expect(source).not.toContain("🏁 Deploy de agentes concluído!");
  });

  it("does not contain deploy skills success message", () => {
    expect(source).not.toContain("🏁 Deploy de skills concluído!");
  });

  it("does not contain deploy all success message", () => {
    expect(source).not.toContain(
      "🏁 Deploy completo (agentes e skills) concluído!"
    );
  });

  it("does not contain deploy context success message", () => {
    expect(source).not.toContain("✅ Deploy de contexto concluído!");
  });

  it("does not contain context sync start message", () => {
    expect(source).not.toContain("🚀 Sincronizando arquivos de contexto");
  });

  it("does not contain context error message", () => {
    expect(source).not.toContain("❌ Erro ao enviar contexto:");
  });

  it("keeps registerDeployCommands on logger", () => {
    expectNoDirectConsole(source);
  });

  it("imports getRequiredGoclawConfig", () => {
    expect(source).toContain("getRequiredGoclawConfig");
  });

  it("imports GoclawAuthMessages", () => {
    expect(source).toContain("GoclawAuthMessages");
  });

  it("imports runDeploySkill", () => {
    expect(source).toContain("runDeploySkill");
  });

  it("imports runDeployContext", () => {
    expect(source).toContain("runDeployContext");
  });

  it("imports deployAgent", () => {
    expect(source).toContain("deployAgent");
  });

  it("imports runDeployAgents", () => {
    expect(source).toContain("runDeployAgents");
  });

  it("imports runDeploySkills", () => {
    expect(source).toContain("runDeploySkills");
  });

  it("imports runDeployAll", () => {
    expect(source).toContain("runDeployAll");
  });

  it("awaits runDeploySkill(slug, config)", () => {
    expect(source).toContain("await runDeploySkill(slug, config)");
  });

  it("awaits runDeployContext(slug, config)", () => {
    expect(source).toContain("await runDeployContext(slug, config)");
  });

  it("awaits deployAgent(slug, config)", () => {
    expect(source).toContain("await deployAgent(slug, config)");
  });

  it("awaits runDeployAgents(config)", () => {
    expect(source).toContain("await runDeployAgents(config)");
  });

  it("awaits runDeploySkills(config)", () => {
    expect(source).toContain("await runDeploySkills(config)");
  });

  it("awaits runDeployAll(config)", () => {
    expect(source).toContain("await runDeployAll(config)");
  });

  it("uses missingDeployTokenBeforeDeploy for skill", () => {
    expect(source).toContain(
      "GoclawAuthMessages.missingDeployTokenBeforeDeploy"
    );
  });

  it("uses missingDeployToken for other wrappers", () => {
    expect(source).toContain("GoclawAuthMessages.missingDeployToken");
  });
});
