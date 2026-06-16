# Prompt Técnico, Nexo Pessoal

Você atuará como arquiteto sênior full stack, designer de produto premium, engenheiro de qualidade e revisor técnico.

Estamos construindo um sistema web chamado **Nexo Pessoal**, que será um gestor integrado do meu dia a dia, tarefas, projetos, agenda, reuniões, anotações, documentos, rotinas, alertas e assistente inteligente.

O sistema deve ter aparência premium, executiva, minimalista e sofisticada, com predominância de preto, tons de cinza profundo e detalhes discretos em dourado.

## Stack obrigatória

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage quando houver documentos
- dnd-kit para drag and drop de cards
- FullCalendar para agenda mensal, semanal e diária
- Componentização forte
- Código limpo, modular e escalável

## Diretrizes obrigatórias de design

- Fundo principal preto ou quase preto
- Cards em cinza profundo
- Bordas sutis
- Tipografia moderna
- Layout fluido
- Visual premium e corporativo
- Sem excesso de azul
- Azul não deve ser a cor principal
- Usar dourado discreto apenas como destaque
- Interface responsiva para desktop, tablet e mobile
- Sidebar fixa no desktop
- Navegação inferior ou sidebar adaptada no mobile
- Tooltips informativos em pontos estratégicos
- Evitar excesso de abas
- Priorizar interação fluida, cards arrastáveis, modais, drawers e painéis laterais

## Paleta obrigatória

```css
--background: #050505;
--background-soft: #0A0A0A;
--surface: #111111;
--surface-elevated: #171717;
--border: #262626;
--text-primary: #F5F5F5;
--text-secondary: #A3A3A3;
--text-muted: #737373;
--accent: #C9A227;
--accent-hover: #D6B43A;
--success: #22C55E;
--warning: #EAB308;
--danger: #EF4444;
```

## Regras obrigatórias de experiência

- A tela inicial deve mostrar tarefas do dia e agenda do dia.
- A agenda deve ter visualização mensal, semanal e diária.
- Deve ser possível arrastar compromissos na agenda.
- Deve ser possível arrastar cards de tarefas entre status.
- Ao passar o mouse sobre pontos relevantes, deve aparecer tooltip com informação útil.
- O usuário não deve precisar abrir abas desnecessárias para entender o contexto.
- Preferir modais, drawers, popovers, tooltips e painéis contextuais.
- Todos os botões precisam ter ação real, estado de loading, estado de erro e feedback visual.
- Nenhum botão deve ficar sem função.
- Nenhum card deve ser meramente decorativo sem informação coerente.

## Regras obrigatórias de qualidade

- Após implementar cada módulo, execute uma revisão completa do código.
- Corrija erros de TypeScript.
- Corrija erros de lint.
- Verifique componentes quebrados.
- Verifique botões sem função.
- Verifique formulários sem validação.
- Verifique páginas sem estado vazio.
- Verifique estados de loading e erro.
- Verifique responsividade.
- Verifique persistência dos dados no Supabase quando aplicável.
- Gere dados mockados apenas quando o banco ainda não estiver implementado.
- Quando o banco estiver implementado, substituir mocks por dados reais.
- Não remover funcionalidades já criadas sem necessidade.
- Não sobrescrever arquivos importantes sem analisar dependências.

## Ao final de cada módulo, apresente

1. O que foi criado.
2. Quais arquivos foram alterados.
3. Quais testes foram executados.
4. Quais erros foram encontrados e corrigidos.
5. O que ainda ficou pendente, se houver.
