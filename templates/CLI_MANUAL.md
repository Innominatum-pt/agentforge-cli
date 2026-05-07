# AgentForge Workspace 🤖⚒️

Welcome to your AgentForge Workspace! This repository is managed by the `agentforge` CLI, which allows you to scaffold, manage, build, and deploy AI Agents and Skills for the GoClaw platform.

## Getting Started

To start a new project for your agents, create an empty folder, navigate into it, and initialize the workspace:

```bash
mkdir my-ai-agents
cd my-ai-agents
agentforge init
```

This will create the necessary directory structure and the configuration file (`agentforge.json`).

---

## Workspace Structure
After running the `init` command, your workspace will look like this:

```text
my-ai-agents/
├── agentforge.json      # Your workspace configuration and GoClaw API credentials
├── agents/              # Where your local agents will live
├── documents/           # Reference documentation for your AI assistants
├── exports/             # Where built files are stored for deployment
├── skills/              # Where your local skills will live
└── templates/           # Customizable templates for your Agents and Skills
```

---

## Commands

### Workspace Sync
When you clone a repository or set up a new workspace, you can synchronize all remote assets to your local machine at once.

```bash
agentforge pull all
```
Downloads all agents and skills from the GoClaw server. It performs a **surgical extraction**, retrieving only the core `agent.json`, `context_files/`, and skill definitions to keep your workspace perfectly clean. Note: This will ask for confirmation before overwriting local files.

### Bulk Deployment
```bash
agentforge deploy agents
```
Performs a full deployment (config + context + memory) for **all agents** found in your `agents/` directory.

```bash
agentforge deploy skills
```
Packages and uploads **all skills** (including those in the `system/` directory) found in your `skills/` directory.

```bash
agentforge deploy all
```
Performs a full deployment for **all agents and skills**. This is the most efficient way to synchronize your entire team and toolset after making cross-cutting changes.

### Agent Management
```bash
agentforge new agent "<Agent Name>"
```
Creates a new agent inside the `agents/` directory. The default `agent_type` is now `predefined`, aligning with GoClaw's official standard for agents with established personalities.

```bash
agentforge pull agents
```
Downloads all agents from the GoClaw server and extracts them locally. It automatically reconstructs memory files from GoClaw's internal JSONL format back into readable Markdown files.

```bash
agentforge deploy agent <slug>
```
**Full Deployment:** Reads the local `agent.json` to create or update an agent. Then, it synchronizes all context files and memory (including `MEMORY.md` and the `memory/` folder).

```bash
agentforge deploy context <slug>
```
**Hot Reload for Context & Memory:** Fast-path deployment that uploads all local context files (`.md`, `.txt`, `.py`) and memory data directly to the server.

### Skill Management
```bash
agentforge new skill "<Skill Name>"
```
Creates a new skill inside the `skills/` directory using the template from `templates/default-skill/SKILL.md`.

```bash
agentforge pull skills
```
Downloads the latest backup archive of all skills and extracts them locally.

```bash
agentforge build skill <slug>
```
Packages the skill folder into a `.zip` file ready for GoClaw deployment. The resulting archive is saved in the `exports/` folder.

```bash
agentforge deploy skill <slug>
```
Automatically builds your skill into a `.zip` file and securely uploads it to your GoClaw server via the Upload API.

---

## Memory Support 🧠
AgentForge CLI handles agent memory as first-class citizens:
- **MEMORY.md**: Use this file at the root of your agent folder for curated, long-term memory.
- **memory/**: Any files inside this folder (e.g., chat histories, user-specific facts) are synchronized.
- **Auto-Conversion**: When pulling, the CLI converts GoClaw's `.jsonl` exports back into `.md` files for easier editing in VS Code.

---

## Configuration
Before using the deployment commands, make sure to add your GoClaw Bearer Token to the `agentforge.json` file:

```json
{
  "goclaw": {
    "api_url": "http://localhost:18790",
    "token": "YOUR_BEARER_TOKEN",
    "default_provider": "ollama cloud",
    "default_model": "deepseek-v4-pro"
  }
}
```
