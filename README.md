# AgentForge CLI 🤖⚒️

A powerful command-line interface to scaffold, manage, build, and deploy AI Agents and Skills for the GoClaw platform. AgentForge helps you maintain a structured local workspace for your autonomous agents and syncs your local development environment directly with your GoClaw servers.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Workspace Structure](#workspace-structure)
- [Commands Reference](#commands-reference)
  - [Init](#init)
  - [Agents](#agents)
  - [Skills](#skills)
  - [API & Deployment](#api--deployment)
- [NPM Publishing (Maintainers)](#npm-publishing-maintainers)

---

## Features
- **Scaffolding:** Instantly generate boilerplate code and Markdown templates for Agents and Skills.
- **Packaging:** Automatically zip and build Skills according to the GoClaw deployment specifications.
- **API Integration:** Seamlessly push (deploy) and pull your skills to/from your GoClaw server directly from the terminal.

---

## Installation

### Local Development (Recommended for now)
Since the package is still under development, you can install and use it globally on your local machine using NPM's symlink feature:

1. Clone this repository and navigate to its folder.
2. Install the dependencies and compile the TypeScript code:
   ```bash
   npm install
   npm run build
   ```
3. Create a global symlink:
   ```bash
   npm link
   ```
Now you can use the `agentforge` command anywhere on your computer!

### Global Installation (Future)
Once the CLI is published to the NPM registry, you will be able to install it using:
```bash
npm install -g agentforge-cli
```

---

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
├── exports/             # Where built .zip files are stored for deployment
├── skills/              # Where your local skills will live
├── teams/               # Where your AI teams will live
└── templates/           # Customizable templates for your Agents and Skills
```

---

## Commands Reference

### Init
```bash
agentforge init
```
Initializes the current directory as an AgentForge workspace. It creates the base folders, copies default templates, and generates an `agentforge.json` config file.

### Agents
```bash
agentforge new agent "<Agent Name>"
```
Creates a new agent inside the `agents/` directory using the files found in `templates/default-agent/`. If the name contains spaces, remember to wrap it in quotes. The CLI will automatically slugify the folder name (e.g., `agents/my-super-agent/`).

### Skills
```bash
agentforge new skill "<Skill Name>"
```
Creates a new skill inside the `skills/` directory using the template from `templates/default-skill/SKILL.md`.

```bash
agentforge build skill <slug>
```
Packages the skill folder into a `.zip` file ready for GoClaw deployment. The resulting archive is saved in the `exports/` folder.

### API & Deployment
Before using the deployment commands, make sure to add your GoClaw Bearer Token to the `agentforge.json` file located at the root of your workspace:

```json
{
  "goclaw": {
    "api_url": "http://localhost:18790",
    "token": "YOUR_BEARER_TOKEN",
    "default_provider": "ollama cloud",
    "default_model": "deepseek-v4-pro",
    "skills_import_endpoint": "/v1/skills/import",
    "skills_export_endpoint": "/v1/skills/export"
  }
}
```

#### Deploying Skills
```bash
agentforge deploy skill <slug>
```
Automatically builds your skill into a `.zip` file and securely uploads it to your GoClaw server via the Import API.

#### Deploying Agents
```bash
agentforge deploy context <slug>
```
**Hot Reload for Context:** Fast-path deployment that reads all local `.md`, `.txt`, and `.py` files in your agent folder and uploads them directly to the agent's mind on the server. Perfect for iterating on prompts.

```bash
agentforge deploy agent <slug>
```
**Full Deployment:** Reads the local `agent.json` to create a new agent or update an existing one (e.g., updating the LLM model). Then, it automatically synchronizes all context files.

#### Sincronization (Pull)
```bash
agentforge pull skills
```
Downloads the latest backup archive of all skills and extracts them locally.

```bash
agentforge pull agents
```
Downloads all agents from the GoClaw server. It performs a **surgical extraction**, ignoring logs, user sessions, and memory, retrieving only the core `agent.json` and `context_files/` to keep your workspace perfectly clean.

---

## NPM Publishing (Maintainers)
When this CLI is ready for public release, ensure the following steps are taken:
1. Update the `version` in `package.json` (e.g., `"version": "1.0.0"`).
2. Ensure the `name` is correctly set to `"agentforge-cli"`.
3. Verify that the `"bin"` property is pointing to `"./dist/index.js"`.
4. Run `npm run build` to ensure the `dist/` directory is fully updated.
5. Login to your npm account using `npm login`.
6. Publish the package using `npm publish`.