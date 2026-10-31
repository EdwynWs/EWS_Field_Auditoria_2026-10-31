# EWS Field — auditoria e correções para preparação comercial

**Decisão em 31/10/2026: ainda não apto para piloto com dados reais nem para lançamento comercial.** Há correções implementadas e evidência local positiva, mas faltam validação PostgreSQL nativa/restore, homologação HTTPS, backups operacionais, instalação Android e decisões de privacidade/suporte. Não se trata de certificação ou garantia de ausência de vulnerabilidades.

Base examinada: `43469b69d41cf1d815456edd0b4a6ecb625dcc5d`, branch original `main`. Trabalho na branch **`security/commercial-readiness`**. Briefing anexado lido antes da implementação; diagnóstico inicial preservado no commit `5a2da80`. Nenhum banco, usuário, foto ou servidor de produção foi acessado. Nenhuma migração foi aplicada em dados reais. A integração GitHub recusou criação de branch com HTTP 403 (`Resource not accessible by integration`); push Git também não dispõe de credenciais. **Branch e commits existem localmente; não há PR remoto criado.** Procedimento de importação em `docs/ENTREGA-GIT.md` e descrição pronta em `docs/PR.md`.

## Escopo e método

Mapeamento de todos os arquivos rastreados de código, SQL, configurações, assets e documentação da base; revisão dos quatro commits preexistentes; inspeção de rotas, queries, contratos entre clientes/API, armazenamento e dependências. CSS/SVG foram inspecionados sem reformulação de marca. As folhas de estilo aprovadas permanecem intactas. Foram acrescentados testes adversariais, migrations, checks, CI e runbooks. A revisão não inclui pentest externo, certificação ASVS/WCAG, Lighthouse, carga, EXPLAIN com dados representativos, aparelho Android nem infraestrutura real.

Stack resolvida: Express 4, PostgreSQL (CI alvo 16), Next 15.5.28, React/ReactDOM 19.1.0, Expo 54.0.38, React Native 0.81.5. Node local 24.22.1; CI/Docker alvo Node 22. São versões efetivamente registradas no lockfile, não uma alegação de que toda a stack esteja na última major.

## Achados e tratamento

P0 = segurança/integridade essencial; P1 = condição para piloto/venda; P2 = evolução ou risco residual controlado. A gravidade representa o impacto encontrado, enquanto a prioridade define a ordem de tratamento. Linhas indicam o início do trecho na versão entregue (ou a base, quando explicitado).

| ID / prioridade / gravidade | Evidência | Problema e risco | Correção / situação |
|---|---|---|---|
| AUTH-01 / P0 / Alta | Base `backend/src/index.js:14`; atual `backend/src/security.js:61`, `app.js:191` | JWT longo com privilégios antigos; logout/desativação sem revogação efetiva | Sessão persistida de 1h, HS256/issuer/audience, usuário/empresa/role atuais em toda autenticação; revogação no logout/senha/desativação. Testes passaram. |
| TENANT-01 / P0 / Alta | `backend/sql/migrations/002_security.sql:2`, `backend/src/orders.js:1` | FKs simples aceitavam relações entre empresas; proteção dependia só das queries | FKs compostas, acesso por empresa/atribuição e payload estrito. Testes A/B, técnico colega, IDOR de mídia e gravação direta no banco passaram em PGlite; PostgreSQL 16 ainda bloqueado. |
| FLOW-01 / P0 / Alta | Base `backend/src/index.js:29`; atual `backend/src/orders.js:171` | Status arbitrário, checkout sem chegada e duplicidade de visitas | Transações, lock da OS, máquina de estados, idempotência por usuário/empresa; conclusão após saída+relatório. Cancelamento com visita ativa exige motivo e preserva evidências. Concorrência real depende da CI nativa. |
| SESSION-01 / P1 / Alta | `web/lib/server-api.js:63`, `mobile/session.js:1`, `mobile/App.js:133` | Tokens legíveis no armazenamento persistente web/mobile | Cookie HttpOnly/Strict e Secure em produção; SecureStore nativo; legado descartado. Respostas antigas não devem restaurar listas após mudança de sessão. Cookie validado em navegador; SecureStore físico não testado. |
| WEB-01 / P1 / Alta | `web/lib/server-api.js:29`, `web/app/api/panel/[...path]/route.js:1` | BFF e mutações sem modelo explícito de CSRF/limites | Origem obrigatória, rotas/métodos permitidos, corpos limitados, timeout, sem aceitar Bearer fornecido pelo navegador. CSRF/bypass/corpo grande negados nos testes. |
| MEDIA-01 / P1 / Alta | `backend/src/media.js:6`, `backend/src/orders.js:401` | Base64 sem decodificação/limites apropriados e sem consulta privada completa | Decodificação Sharp, formato/bytes/pixels, EXIF removido, arquivo privado aleatório e autorização de leitura por empresa/OS. Legado mantido com leitura limitada. Testes de imagens maliciosas e IDOR passaram; storage escalável S3/R2 e quotas pendentes. |
| INPUT-01 / P1 / Média | `backend/src/security.js:8`, `backend/src/app.js:1` | UUIDs/payloads inválidos, senhas longas truncadas, erros internos e pouca proteção de abuso | Zod estrito, senha 12+ até 72 bytes, SQL parametrizado, status HTTP, rate limit PostgreSQL, IDs de requisição e logs sem corpos/PII. Testes negativos passaram. |
| DEPS-01 / P1 / Alta | `package-lock.json`, `scripts/patch-metro.mjs:1` | Auditoria inicial: 3 altas, 4 moderadas e 5 baixas | Atualizados PostCSS, image-size, Zod e Sharp; React alinhado para build Next; expo-font compatível. Resultado final: 0 críticas/altas; 28 moderadas/1 baixa no monorepo de desenvolvimento, analisadas abaixo. API+web de produção: zero alertas. |
| ENV-01 / P1 / Alta | `mobile/config.js:1`, `mobile/app.config.js:1`, `web/lib/server-api.js:4` | IP LAN fixo e fallback local poderiam ir para produção | Exemplos separados, HTTPS obrigatório em release, rejeição de URL privada/fictícia no EAS preview/prod, credenciais e paths recusados. Configuração verificada; falta URL real. |
| FUNNEL-01 / P1 / Média | `backend/src/app.js:153`, `web/components/FieldLanding.jsx:166`, `FieldSignup.jsx:7` | Leads sem rota/tabela utilizável; envio antes da hidratação podia perder dados | Migration+router, consentimento/honeypot/rate limit, controles habilitados após hidratação, âncoras corrigidas. Cadastro e demonstração passaram com API real local. Não envia e-mail ao comercial. |
| UX-01 / P1 / Média | `web/app/painel/page.jsx`, `mobile/App.js` | Atribuição posterior ausente, histórico/fotos incompletos, listas ilimitadas | Atribuição segura, fotos privadas, histórico, paginação progressiva, métricas totais, modais por teclado, reset de estado. Funil web passou; fluxos nativos não comprovados. |
| DATA-01 / P1 / Alta | `backend/src/migrate.js:5`, `backend/test/migrations.test.js:1` | Init sem controle de versão e sem estratégia de migração segura | Migration transacional/checksum/advisory lock; aborta corrupção entre empresas sem mover/apagar registros. Preservação de legado e rollback da migration testados em PGlite. Ensaio em cópia real bloqueado. |
| OPS-01 / P1 / Alta | `.github/workflows/ci.yml:1`, `scripts/backup.mjs:1`, `scripts/test-restore.mjs:1` | Ausência de testes/CI/backup verificável e critérios de operação | CI e scripts/runbooks entregues; checksum em streaming, recusa symlink e backup dentro das fotos, CLI compatível com paths. Três testes utilitários passaram. pg_dump/restore, Docker, alertas e agendamento real não executados. |
| PRIV-01 / P1 / Alta | `web/app/privacidade/page.jsx`, `docs/SEGURANCA-PRIVACIDADE.md` | Política operacional incompleta e ciclo de vida de dados indefinido | Aviso de foto/GPS, minimização, acesso restrito e pendências documentadas. Identificação jurídica, base legal, retenção, exportação/exclusão e contratos dependem de definição; não foi declarada conformidade LGPD. |
| ANDROID-01 / P1 / Média | `mobile/eas.json:1`, `mobile/app.json:1` | Sem perfis APK/AAB e sem requisitos de distribuição | Preview APK interno separado de produção AAB; permissões mínimas e guia PowerShell. Doctor 18/18 e bundle Android passaram. Nenhum APK assinado gerado/instalado; conta EAS/URL/ownership pendentes. |

Não foi encontrada concatenação de entrada de usuário em SQL na base; as queries parametrizadas foram preservadas. A proteção multiempresa é feita por aplicação + constraints. **Não há RLS no banco**; novas rotas devem manter filtros e testes, e acesso SQL operacional requer controles próprios. Senhas antigas continuam utilizáveis no login; a política mais forte vale para criação/alteração.

## Evidência executada

| Verificação | Resultado observado | Limite da evidência |
|---|---|---|
| `npm ci` com lockfile | Passou | Linux/Node 24.22.1; Windows não executado |
| `npm run check` | Passou | ESLint + Prettier dos caminhos configurados; não é auditoria completa de acessibilidade |
| `TEST_PGLITE=true npm test` | **33 testes, 33 passaram, 0 falhas** | 28 integração API, 2 migrations, 3 utilitários de backup. PGlite executa PostgreSQL em WASM com conexões serializadas |
| `npm run test:e2e` | **4 testes passaram** | Chromium headless, Next dev e Express reais locais; banco PGlite; não HTTPS de homologação |
| `npm run build:web` | Passou; rotas renderizadas e build finalizado | Não houve deploy Vercel; bundle inicial compartilhado ~102 kB |
| `npx expo-doctor` | **18/18 verificações passaram** | Não valida GPS/câmera/Keystore/AndroidManifest final da build nativa |
| `expo install --check` | Dependencies are up to date | Dentro do SDK 54 selecionado |
| `expo export --platform android` | Passou; bundle Hermes ~2,27 MB | Bundle não é APK; URL fictícia usada somente para compilação, sem conexão |
| Configuração de URL e perfis | Passou | Ausente/HTTP/LAN/fictícia/credenciais/path recusados; APK/AAB distintos; sem contato com serviço externo |
| `npm audit` monorepo | 0 críticas, 0 altas, **28 moderadas, 1 baixa** | Resultado pontual em 31/10/2026; detalhamento abaixo |
| `npm audit --omit=dev --workspace=backend --workspace=web` | **0 vulnerabilidades reportadas** | Não inclui toolchain mobile; não prova ausência de vulnerabilidade |
| Histórico e diff | Scanner limitado e `git diff --check` sem achados | Regex não substitui secret scanning completo |

E2E cobriu cadastro → cookie de sessão → cliente com texto XSS literal → técnico → OS → restauração da sessão → logout; negação CSRF/Bearer/corpo grande; quatro páginas em 390 e 1440 px sem overflow horizontal; envio de demonstração até persistência da API. Isso não certifica todos os tamanhos, leitores de tela ou Core Web Vitals. O teste de login comprovou cookie HttpOnly/Strict em HTTP local; Secure/`__Host-` em TLS real ainda precisa homologação.

Logs sanitizados e inventário estão em `docs/evidencias/` e `docs/ARQUIVOS-MODIFICADOS.md`. A suíte nativa foi preparada para banco terminado em `_test`, com schemas próprios; nenhuma execução contra banco do usuário foi feita.

## Dependências residuais

A consulta final difere da anterior porque os advisories de glob/minimatch foram atualizados em 30/10. **28 pacotes afetados transitivamente não significam 28 CVEs diferentes.** As três causas diretas restantes são:

| Advisory | Exposição observada | Tratamento residual |
|---|---|---|
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), glob, moderada | Ferramentas Expo/Metro; traversal após cancelamento | Padrões/builds apenas de código revisado, CI com timeout e sem credenciais de produção. Atualização major para glob 14.0.2 exige validar consumidores. Não expor Metro ao público. |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), minimatch, moderada | ESLint e toolchain Expo/RN; amplificação de padrões | Não alimentar configuração/globs com entrada de clientes. Correção publicada em major 11.0.1; override cego quebra consumidores antigos com API diferente. Migração suportada da toolchain pendente. |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), deepmerge, baixa | Configuração Expo | Sem versão corrigida indicada no advisory consultado; configuração somente confiável, sem objetos controlados por cliente. Monitorar correção. |

A sugestão automática de downgrade do Expo para 51 ou ESLint para 4 foi recusada por incompatibilidade. Não foi usado `audit fix --force`. Essas mitigações reduzem a exposição identificada, não encerram os alertas. Responsável: engenharia; acompanhar em cada atualização e antes de liberar qualquer build. A API de produção pode ser instalada apenas com workspace backend, como no Dockerfile.

## Bloqueios restantes e funcionalidades incompletas

1. **P1 — PostgreSQL nativo, concorrência e restore:** rodar CI em PostgreSQL 16, testar dois writers de verdade, pg_dump/restore com clientes compatíveis, ensaiar migration em cópia sanitizada. O ambiente disponível não tinha serviço/cliente PostgreSQL utilizável nem Docker. PGlite não resolve esta lacuna.
2. **P1 — HTTPS e operação:** publicar homologação isolada, validar cookies/CORS/proxy/rate limit, volume persistente cifrado, backup fora do host, alertas, RPO/RTO e responsável. Nada disso foi provisionado nesta entrega.
3. **P1 — Android:** vincular conta/projeto EAS correto, verificar propriedade de `com.ewstech.ewsfield`, gerar APK, instalar em aparelho e testar permissões, GPS/foto, rede lenta, retries e retorno de sessão usando dados móveis. Não há APK entregue.
4. **P1 — Privacidade e suporte:** definir política operacional real, retenção/exportação/exclusão por empresa, canal de atendimento e recuperação segura de gestor. Há endpoint autenticado para troca de senha, mas não UI dedicada nem fluxo de recuperação por e-mail/convite/verificação/MFA. Não anunciar recuperação automatizada.
5. **P1 — Governança de release:** publicar branch/PR, CI verde, revisão humana e regras de proteção da main. Credenciais/permissões atuais bloqueiam publicação; pacote Git permite continuação sem perder alterações.
6. **P2 — Capacidade e proteção adicional:** CSP mantém `unsafe-inline` para compatibilidade Next; implementar nonce e validar. Sem quotas por plano, S3/R2, EXPLAIN/carga, reconciliação automática de arquivos órfãos após crash, rastreamento de leitura de mídia, pesquisa global ou fila offline persistente. Rate limit do BFF compartilha IP e pode limitar usuários legítimos; tratar borda confiável antes de escala.
7. **P2 — Produto comercial:** billing, planos/trials, webhooks, assinatura do cliente, PDF/exportação, editor de checklist, notificações/e-mail ao comercial e painel de superadmin não estão concluídos. Checklist de relatório atual é básico/fixo. Decidir escopo/prioridades antes de prometer esses recursos; pagamentos não foram ativados.
8. **P2 — UX/SEO:** layout V4 preservado, modais/estados e responsividade básica corrigidos; auditoria manual WCAG/leitor de tela, Lighthouse, metas OG/domínio, licença de assets e terceiros (Google Fonts/Pexels) permanecem pendentes.

Critério para mudar para **apto para piloto**: todos os testes principais passarem em ambiente real, HTTPS e backup/restore configurados/comprovados, APK validado, isolamento comprovado no PostgreSQL usado e riscos de privacidade/suporte tratados. Produção comercial exige ainda capacidade, monitoramento, recuperação de desastre e aceite de escopo comercial. Consulte o checklist antes de vender ou distribuir.
