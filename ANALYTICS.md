# Analytics do portfólio

Rota: `https://thallyssonmax.com/analytics`. Interface com os estilos, SF Pro, logotipo,
botões e tokens do portfólio. O Brains é referência apenas de organização.

## Ativação (configuração nova)

1. No Google Cloud, criar um cliente OAuth do tipo **Aplicativo da Web**, com branding
   e público configurados. Adicionar `https://thallyssonmax.com` às origens JavaScript
   autorizadas (e `http://localhost:4173` se for testar login local). Este fluxo usa
   Google Identity Services em popup: não precisa de client secret nem redirect URI.
   Se o aplicativo estiver em teste, cadastrar `thallyssondesigner@gmail.com` como testador.
2. Criar um banco Neon Postgres e obter a URL de conexão. Escolher o plano diretamente
   no provedor antes de assumir qualquer cobrança. Usar um banco dedicado ao portfólio.
3. Copiar `.env.example` para `.env.local` e preencher `GOOGLE_CLIENT_ID`, `DATABASE_URL`
   e `ANALYTICS_ORIGIN=https://thallyssonmax.com`. Não adicionar prefixo `VITE_` às chaves.
4. Com Node 22 ou superior, executar `npm run analytics:setup` para criar tabela e índices.
5. Cadastrar as mesmas variáveis nas configurações do projeto **site** na Vercel.
   O projeto existente utiliza Node 24. Publicar a versão após configurar as variáveis.
6. Abrir `/analytics`, entrar com a conta autorizada, visitar o portfólio público e
   atualizar o painel. Testar também uma conta diferente: a API deve responder 403.
   O shell de login é público; todos os dados dependem de validação Google no servidor.
7. Agendar no banco a limpeza diária descrita em `database/analytics.sql` para retenção
   de 90 dias. Não há rotina de limpeza automática habilitada por este código.

Fontes: [Configurar o Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid),
[validação no servidor](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token),
[driver Neon](https://neon.com/docs/serverless/serverless-driver).

## Desenvolvimento e validação

`npm run dev` abre a interface Vite. A demonstração é exclusiva do modo de desenvolvimento,
explicitamente identificada, e não é incluída no build de produção. Vite simples não executa
as funções da pasta `api`; use `vercel dev` com as variáveis para testar o fluxo completo.
`npm test` verifica deduplicação, ordem do funil, atribuição, saídas e rejeição de acessos.
`npm run build` gera o portfólio e `/analytics`.

## Métricas e limites

- Identificador aleatório no localStorage expira em 90 dias; não coleta nome, e-mail ou IP.
  Navegadores/dispositivos distintos e limpeza do armazenamento contam separadamente.
- Origem: utm_source sanitizado, domínio referenciador ou Direto. Primeira origem dentro
  do período atribui cada visitante a uma única origem. Nunca persiste URL de referência completa.
- Cada etapa do funil deduplica visitantes. A sequência deve ocorrer na mesma sessão de
  aba (renovada após 30 minutos sem atividade). Um case acessado diretamente satisfaz
  as etapas de entrada, exploração e projeto. Contatos diretos são um indicador separado.
- Seção conta quando visível; cliques em projetos externos contam acesso ao projeto,
  mas não permitem observar navegação no domínio externo.
- Saída é a última interação da última visita observada do usuário no período, após
  30 minutos sem eventos. Heartbeat de aba visível mantém leitores ativos.
- Horário de Brasília, períodos de 7/30/90 dias incluindo hoje; sem dados retroativos.
- Do Not Track e `localStorage['portfolio-analytics-opt-out']='1'` desativam coleta.
- O Google ID token é validado no servidor no momento da entrada (assinatura,
  audiência, emissor, expiração e e-mail verificado exato). O navegador recebe um cookie
  `Secure`, `HttpOnly`, `SameSite=Strict` com ID aleatório, válido por até 30 dias.
  O banco guarda apenas o hash desse ID; recarregar a página restaura a sessão e
  clicar em “Sair” a revoga. O token Google não é salvo no navegador.
- Endpoints de coleta são públicos por necessidade. Validação, origem, filtro de bots,
  limite por visitante e idempotência reduzem ruído, mas não impedem eventos forjados
  por scripts externos. Aplicar rate limiting na Vercel para tráfego abusivo.
- Relatórios recusam mais de 100.000 eventos por período em vez de truncar contagens.

## Estado da entrega

Neon Free provisionado (neon-apricot-river) e conectado ao projeto site. Tabela e índices
criados em 15/10/2026. DATABASE_URL e ANALYTICS_ORIGIN estão configuradas na Vercel.
O cliente Google Web foi criado no projeto Audio generate, e GOOGLE_CLIENT_ID foi configurado
em produção. O portfólio e o painel estão publicados no domínio thallyssonmax.com.
thallyssondesigner@gmail.com é o único usuário de teste na Google Auth Platform.
Em 16/10/2026 foram validados a coleta real no Neon, o bloqueio do relatório sem login
e o funil autenticado em produção.

