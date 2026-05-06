> **IMPORTANTE:** Se o seu agente não for usar funcionalidades autônomas de Heartbeat, **deixe este arquivo completamente VAZIO**. Não adicione nenhum texto, caso contrário o sistema tentará iniciar um ciclo de repetição.

# Heartbeat

O Heartbeat define as ações que o agente deve executar de forma autônoma e periódica, sem precisar de um comando direto do usuário. É o "pulso" do agente para tarefas em segundo plano (background tasks).

## Frequência
- *(Ex: A cada 30 minutos, A cada 2 horas, Diariamente às 09:00)*

## Ações de Rotina
Liste as ações que o agente deve executar durante cada "batida" do coração:
- [ ] Verificar novas mensagens na fila ou e-mails?
- [ ] Atualizar ou processar dados pendentes?
- [ ] Revisar a própria memória e consolidar aprendizados?
- [ ] Fazer scraping de alguma página específica e gerar um relatório?

## Condições de Despertar (Triggers Externos)
Além do tempo, existem eventos que devem forçar um Heartbeat imediato?
- *(Ex: Recebimento de um Webhook, um novo item adicionado no banco de dados, etc)*
