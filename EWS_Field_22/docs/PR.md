# Protege sessões, isolamento multiempresa e evidências do EWS Field

A base aceitava sessões com privilégios antigos e relações entre empresas no banco, não validava a sequência de visitas e armazenava fotos sem validação adequada. Esta mudança acrescenta sessões revogáveis verificadas no banco, FKs compostas, transações/locks/idempotência, fotos privadas normalizadas e acesso por empresa/atribuição. Web passa a cookie HttpOnly com validação de origem; Android usa SecureStore, URL de release validada e perfis APK/AAB separados. Visual V4 e estilos do painel/app preservados.

Corrige o cadastro e o formulário comercial, atribuição posterior, paginação, histórico/fotos e perda de dados em formulários antes da hidratação. Acrescenta migrations versionadas, testes, CI PostgreSQL 16, scripts e guias de backup/restore/deploy. Não ativa pagamentos ou modifica produção.

## Validação local

- 33 testes passaram: API (28), migrations (2), utilitários de backup (3), usando PGlite para SQL. Conexões serializadas: concorrência PostgreSQL real e pg_dump/restore não comprovados.
- 4 testes E2E Chromium passaram; funil cadastro/login/cliente/técnico/OS/logout, CSRF e formulário comercial.
- npm ci, lint/formato, build Next, Expo Doctor 18/18, expo install --check e export Android passaram.
- Audit API/web produção: 0 alertas. Monorepo: 0 críticas/altas, 28 moderadas/1 baixa em tooling; mitigações e advisories em AUDITORIA.md.

## Migração e riscos

Aplicar em cópia sanitizada com backup antes de produção. Migration aborta relações entre empresas/e-mails normalizados duplicados; não corrige nem apaga dados automaticamente. JWTs antigos são recusados: exigir novo login. Novas fotos requerem volume privado persistente; rollback ao código anterior após novas escritas exige reconciliação.

Não considerar pronto para piloto: faltam CI nativa, restore real, HTTPS, backup/alertas, APK em aparelho, conta EAS/ownership e fechamento de privacidade/suporte. CHECKLIST-LANCAMENTO.md registra cada limite. Esta descrição foi preparada localmente; o PR não foi criado por falta de permissão GitHub.
