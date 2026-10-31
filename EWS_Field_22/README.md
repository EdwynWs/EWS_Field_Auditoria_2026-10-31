# EWS Field — segurança e preparação comercial

Monorepo npm: Express/PostgreSQL, Next.js e Expo/React Native. Visual **After Sales Edition V4** preservado. Esta branch prepara a validação de lançamento; **não certifica produção**. Veja [AUDITORIA.md](AUDITORIA.md) e [CHECKLIST-LANCAMENTO.md](CHECKLIST-LANCAMENTO.md).

**Publicação remota pendente:** esta branch ainda não foi enviada por falta de permissão GitHub. Para usar a entrega agora, importe o bundle conforme [docs/ENTREGA-GIT.md](docs/ENTREGA-GIT.md). Os comandos de clone remoto abaixo pressupõem que a branch já tenha sido publicada.

## Instalação — Windows PowerShell

Requisitos: Git, Node **22 LTS (22.13+)**, npm, PostgreSQL 16+ e seus utilitários `pg_dump`/`pg_restore`. Node 24 foi usado na validação local. Use o lockfile; não execute `npm audit fix --force`.

```powershell
git clone https://github.com/EdwynWs/EWS_Field_22.git
cd EWS_Field_22
git switch security/commercial-readiness
npm.cmd ci
Copy-Item backend/.env.example backend/.env
Copy-Item web/.env.example web/.env.local
Copy-Item mobile/.env.example mobile/.env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Coloque a chave gerada em `JWT_SECRET` no arquivo **local**, sem enviá-la ao Git. Crie um banco vazio `ews_field`, com usuário próprio e senha, e ajuste `DATABASE_URL`. A senha da URL precisa de percent-encoding caso contenha `@`, `#` ou `:`. Não reutilize o banco da JCortiça ou outro sistema.

```powershell
npm.cmd run db:migrate
npm.cmd run dev:api
# Em outro terminal, na raiz:
npm.cmd run dev:web
# Em outro terminal, na raiz:
npm.cmd run dev:mobile
```

Abra `http://localhost:3000/comecar`. O cadastro depende de `ALLOW_PUBLIC_SIGNUP=true`; produção deve iniciar com `false`. Novas senhas: 12 caracteres mínimos, até 72 bytes UTF-8 (limite do bcrypt); senhas antigas continuam aceitas no login. Não há contas/senhas padrão.

No celular, `localhost` é o aparelho. Em `mobile/.env`, use o IPv4 atual do computador (`ipconfig`) para Expo Go na mesma rede. `npm.cmd run dev:mobile` também funciona dentro de `mobile`. Distribuição exige HTTPS público: [APK-ANDROID.md](APK-ANDROID.md).

## Funcionalidade e contratos

- Empresa vem da sessão validada no banco, nunca do corpo da requisição. Técnico consulta apenas OS atribuídas e clientes dessas OS. Gestor administra sua empresa.
- JWT HS256 de 1 hora, issuer/audience fixos, sessão persistida e revogável. Logout e alteração de senha revogam acesso; alteração de senha revoga todas as sessões. Reativar usuário não revive tokens. Sem refresh automático nesta versão.
- Web usa BFF same-origin e cookie HttpOnly/SameSite Strict (Secure em produção), proteção de origem nos POST/PATCH e nenhuma cópia de JWT no JS. Mobile usa SecureStore; o token antigo em AsyncStorage é descartado. Expo Web usa memória apenas.
- OS nasce aberta ou atribuída. Atribuição só antes de iniciar. Check-in inicia; visitas alternam chegada/saída. Conclusão exige ordem em andamento, saída e relatório. Estado encerrado não reabre. Cancelamento administrativo com visita aberta exige justificativa e mantém o histórico sem inventar GPS/saída.
- Novas fotos: JPEG/PNG/WebP, até 2 MB cada, normalizadas em JPEG sem metadados, até 1920 px, máximo 20 megapixels de entrada. Até 5 por relatório. Diretório privado com arquivos aleatórios, acesso por endpoint autenticado e `no-store`. Não expor `MEDIA_DIR` no Nginx/CDN.
- Fotos antigas em base64 permanecem no banco, com leitura autenticada limitada a 4 milhões de caracteres. Arquivos antigos inválidos exigem análise privada, sem excluir automaticamente.
- Listagens retornam arrays (compatibilidade), `limit` 1–200, `offset` e `X-Next-Offset`. Painel/app têm carregamento progressivo. Filtros visuais abrangem os registros carregados; pesquisa global e grandes cadastros ainda precisam evolução.
- `Idempotency-Key: UUID` em visitas/relatórios permite confirmar reenvio sem duplicação. A mesma chave com outro corpo retorna 409. App retém tentativa em memória enquanto aberto; não há fila offline durável.
- Formulário comercial registra solicitação no banco. Não envia e-mail/WhatsApp automaticamente.

## Testes

Os testes nativos exigem **banco descartável cujo nome termine em `_test`**. Criam schemas próprios; não apontar para produção. O teste de restore cria e remove apenas bancos próprios de teste, exigindo permissão CREATEDB.

```powershell
$env:TEST_DATABASE_URL = "postgres://usuario:senha@127.0.0.1:5432/ews_field_test"
npm.cmd run check
npm.cmd test
npm.cmd run build:web
npx.cmd playwright install chromium
npm.cmd run test:e2e
node scripts/test-restore.mjs
npx.cmd expo-doctor mobile
npm.cmd exec --workspace=mobile -- expo install --check
```

Em ambiente sem servidor PostgreSQL, ` $env:TEST_PGLITE = "true"; npm.cmd test ` executa SQL real em WebAssembly, com conexões serializadas. **Não substitui** ensaio de concorrência PostgreSQL 16, pg_dump/restore ou produção. Remova a variável antes da suíte nativa: `Remove-Item Env:TEST_PGLITE`.

CI em `.github/workflows/ci.yml`: lint/formato, varredura limitada de segredos no histórico, audit com bloqueio de altas/críticas, PostgreSQL 16, Next, Expo, navegador e restore. Configure o check `Commercial readiness / validate` como obrigatório nas regras de proteção da main; workflow sozinho não bloqueia merge de administradores.

## Documentação

- [Auditoria e riscos](AUDITORIA.md)
- [Checklist de lançamento](CHECKLIST-LANCAMENTO.md)
- [Deploy e migrações](docs/DEPLOY.md)
- [Segurança e privacidade](docs/SEGURANCA-PRIVACIDADE.md)
- [Backup e restauração](docs/BACKUP-RESTORE.md)
- [APK/AAB Android](APK-ANDROID.md)

Faturamento recorrente, cobrança real, e-mail de recuperação, exportação PDF, assinatura do cliente e sincronização offline não estão implementados. Não anunciar esses recursos como disponíveis.
