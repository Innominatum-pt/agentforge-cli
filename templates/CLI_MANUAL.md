# AgentForge CLI Workspace 🤖⚒️

Bem-vindo ao Workspace do AgentForge! Este repositório é gerido inteiramente pela `agentforge` CLI, a ferramenta definitiva para criar, editar, sincronizar e fazer deploy em massa de Agentes AI e Skills para a plataforma GoClaw.

## Primeiros Passos

Para iniciar um novo projeto, crie uma pasta vazia, entre nela e corra a inicialização:

```bash
mkdir my-ai-agents
cd my-ai-agents
agentforge init
```

## Estrutura do Workspace

```text
my-ai-agents/
├── agentforge.json      # Configuração e credenciais da API GoClaw
├── agents/              # Todos os seus Agentes (Configurações e Memórias)
├── documents/           # Documentação de referência
├── exports/             # Arquivos empacotados prontos para deploy
├── skills/              # As suas Skills locais
└── templates/           # Templates personalizáveis para Agentes e Skills
```

---

## 🚀 Comandos de Deploy (Upload para GoClaw)

Estes comandos enviam as suas alterações locais (Verdade Absoluta) para o servidor GoClaw, sobrescrevendo a nuvem.

### Em Massa (Bulk Deploy)
- **`agentforge deploy all`**
  Faz o deploy completo de TODOS os Agentes e TODAS as Skills. Ideal para sincronizar a equipa inteira de uma só vez.
- **`agentforge deploy agents`**
  Faz o deploy completo de TODOS os agentes na sua pasta `agents/`.
- **`agentforge deploy skills`**
  Empacota e envia TODAS as skills na sua pasta `skills/`.

### Específicos por Agente / Skill
- **`agentforge deploy agent <slug>`**
  Atualiza a configuração (`agent.json`) E sincroniza todos os ficheiros de contexto e memória para um agente específico.
- **`agentforge deploy context <slug>`**
  *Hot Reload:* Envia apenas os ficheiros de contexto (`.md`, `.txt`, pastas de memória) de um agente, ignorando a configuração. Ideal para iteração rápida.
- **`agentforge deploy skill <slug>`**
  Empacota uma skill individual em `.zip` e envia para a API do GoClaw.

---

## 📥 Comandos de Pull (Download do GoClaw)

Estes comandos **apagam o estado local** e descarregam a Verdade Absoluta que está no servidor GoClaw.

- **`agentforge pull all`**
  Sincronização nuclear: Descarrega e extrai todos os Agentes e Skills do servidor GoClaw para as pastas locais.
- **`agentforge pull agents`**
  Faz o download de todos os Agentes (Configuração + Ficheiros de Contexto e Memória).
- **`agentforge pull skills`**
  Faz o download do arquivo de exportação de Skills do servidor e extrai tudo para a pasta `skills/`.

---

## 🛠️ Criação e Gestão (Scaffolding)

- **`agentforge new agent "<Nome do Agente>"`**
  Gera a estrutura base de um novo Agente na pasta `agents/` (usando o template predefinido).
- **`agentforge new skill "<Nome da Skill>"`**
  Cria uma nova Skill na pasta `skills/` pronta a programar.
- **`agentforge build skill <slug>`**
  Empacota uma skill num ficheiro `.zip` (guardado em `exports/`) sem enviar para o servidor.

---

## 🧠 Sincronização de Memória e Contexto (Advanced)

O AgentForge CLI tem um sistema cirúrgico de gestão de memória. Qualquer ficheiro colocado na pasta raiz do agente ou na pasta `memory/` será injetado no cérebro do agente:

1. **Flattening Automático:** O CLI converte a estrutura de pastas em prefixos compatíveis com a API do GoClaw (ex: `memory/ficheiro.md` passa a `memory_ficheiro.md` na nuvem, mas mantém a pasta na sua máquina).
2. **Edição Forçada (Overwrite Protection Bypass):** Se editar um ficheiro de memória localmente, o CLI executa automaticamente uma operação cirúrgica (`PUT`) na Base de Dados Semântica do GoClaw para forçar a alteração.
3. **Exterminação de Fantasmas (Pruning):** Se apagar um ficheiro localmente, ao fazer `deploy`, o CLI não só o apaga da Base de Dados Semântica do GoClaw, como neutraliza o ficheiro físico no servidor (injetando zero-bytes), garantindo que ele não volta a aparecer (efeito fantasma) nos futuros `pulls`.

---

## ⚙️ Configuração (agentforge.json)

Garanta que tem o token correto antes de usar comandos de sincronização:

```json
{
  "goclaw": {
    "api_url": "https://<seu-servidor-goclaw>",
    "token": "YOUR_BEARER_TOKEN",
    "username": "O Seu ID de Utilizador GoClaw (Ex: 8642756972)"
  }
}
```
