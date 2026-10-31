# Deploy, migrações e operação

## Ambientes

| Ambiente | API / banco / fotos | Web | Mobile |
|---|---|---|---|
| Desenvolvimento | Banco local separado; `.env` privado | API_INTERNAL_URL local; WEB_PUBLIC_ORIGIN exata | IP LAN via EXPO_PUBLIC_API_URL |
| Homologação | API HTTPS, banco e volume próprios, dados sintéticos | Origens HTTPS de homologação | profile preview/environment preview |
| Produção | Recursos separados, acesso mínimo, backup cifrado | Domínio real, cookie Secure | profile production/environment production |

Não usar `localhost:4000` na Vercel. Em Vercel, configure raiz `web`, instalação com acesso ao lockfile/workspaces da raiz, comando `npm run build --workspace=web` conforme a raiz selecionada e `API_INTERNAL_URL=https://api.seudominio`, `WEB_PUBLIC_ORIGIN=https://app.seudominio`, `SITE_URL=https://app.seudominio`. Confira o log de install; não criar lockfile parcial. A API interna deve ser uma origem sem path/credenciais e não redirecionar. Usar hostname e origem exatamente iguais aos do navegador; localhost e 127.0.0.1 são diferentes.

API não é adequada a filesystem efêmero/serverless enquanto usar `MEDIA_DIR`. Execute em serviço Node persistente ou container com volume. `docker build -f backend/Dockerfile -t ews-field-api .` parte da raiz; Dockerfile não contém segredos. Docker não foi executado neste ambiente; validar build em homologação antes de usar. A API escreve no volume `/data/private-media`; não publique essa pasta como conteúdo estático. O uso de múltiplas réplicas exige armazenamento compartilhado privado com as mesmas garantias, ou implementação/teste de S3/R2 (ainda pendente).

## Ordem segura de rollout

1. Revisar PR e obter CI verde em PostgreSQL 16. Suspender escritas em janela acordada. Capturar backup de banco + fotos e testar restauração em alvo separado.
2. Ensaiar migração em cópia sanitizada/restaurada da base. Não usar exportação real em CI público.
3. Executar `npm run db:migrate` **uma vez no job de release**, com credencial DDL separada da API. O runner usa transação, advisory lock e checksum. `db:init` chama o mesmo runner.
4. Implantar API, web e app compatíveis. Todos os JWTs legados são recusados (nova sessão/issuer/audience); avisar reautenticação obrigatória. Novas fotos não são legíveis pela versão antiga da API.
5. Testar `/health` e `/ready`, cadastrar dados sintéticos de duas empresas e executar o checklist. Reabrir escritas somente após confirmar.

Se a migration encontrar e-mail duplicado após normalização ou FK entre empresas, **aborta tudo**. Não mover/delete dados automaticamente. Investigar privadamente com o responsável pelos registros, preparar correção específica com backup e aprovação. As novas colunas/tabelas são aditivas, não apagam fotos base64.

Rollback: antes de novas escritas, restaurar o snapshot completo em uma base/volume novos e redirecionar a aplicação após validar. Após novas escritas, rollback direto ao código antigo perde compatibilidade das fotos/sessões; preferir correção adiante ou planejar reconciliação. Não executar DROP em produção como reversão automática.

## Configuração e acesso

API: NODE_ENV=production, DATABASE_URL (TLS verify-full para banco remoto e CA válida), JWT_SECRET aleatório, WEB_ORIGIN explícita HTTPS, ALLOW_PUBLIC_SIGNUP=false, MEDIA_DIR absoluto persistente. Cadastros públicos só devem ser habilitados deliberadamente durante onboarding controlado; fluxo formal de convite ainda não existe.

Banco: porta não pública, usuário de runtime sem superuser/CREATEDB/DDL, tabelas pertencentes ao usuário de migração. Conceder apenas SELECT/INSERT/UPDATE/DELETE necessários e USAGE nas sequences; restringir acesso a auditoria e backups na camada operacional. Não habilitar `rejectUnauthorized:false`. Separar chaves entre ambientes.

Proxy: TLS válido e renovação automatizada, limite do corpo 14 MB, timeout compatível de pelo menos 30s, HTTPS obrigatório no host. `TRUST_PROXY` vazio por padrão; só configurar IPs/CIDRs dos proxies reais e impedir acesso direto que burle esse caminho. Nunca usar `true`/trust de qualquer origem. Rate limiting é persistido no PostgreSQL, inclusive em múltiplas réplicas. O BFF aparece como um IP compartilhado: limites de login/cadastro conservadores podem atingir vários usuários; configurar política por borda confiável antes de escalar (não confiar cegamente em X-Forwarded-For do cliente).

## Monitoramento e jobs

Logs JSON incluem request ID, rota modelo, método, status e duração; não incluem corpo/JWT/SQL/foto/coordenada/e-mail. Não ligar debug de pg/fetch em produção. Coletor deve ter retenção e acesso restritos. Erros 500 retornam apenas request ID. `/ready` verifica conexão e migration, `/health` verifica processo.

Configurar externamente: disponibilidade HTTPS a cada minuto; alertas de 5xx, latência p95, conexões de banco, storage acima de 80%, backup fora do prazo e restore falho. Esta entrega não instalou provedor de alertas nem mediu SLA/p95. Não há métricas Prometheus ou tracing distribuído ainda.

Agendar diariamente `node scripts/maintenance.mjs` com DATABASE_URL apropriada. Remove apenas buckets expirados e sessões expiradas há mais de 7 dias. Não remove registros de clientes/GPS/fotos/auditoria nem idempotência sem política aprovada.

Configurar backup automatizado conforme BACKUP-RESTORE.md e ensaio periódico de recuperação. RPO/RTO, retenção e responsáveis precisam ser definidos por Edwyn antes de venda. Não há garantia de backup só porque o script está no Git.

## Capacidade

Índices por empresa/técnico/ordem, paginação limitada e pool de 10 conexões por processo são uma base. Medir EXPLAIN ANALYZE em dados representativos e carga antes de aumentar clientes. Não foram realizados testes de carga, indisponibilidade regional ou dimensionamento de disco. O runtime processa no máximo 5 fotos por relatório; limite de corpo/concorrência/armazenamento por tenant requer ajuste ao plano comercial antes de cadastro aberto em escala.
