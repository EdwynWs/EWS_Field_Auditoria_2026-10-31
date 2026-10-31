# Checklist de lançamento — 31/10/2026

**Estado: BLOQUEADO para piloto real e lançamento comercial.** “Passou” vale apenas para o ambiente/evidência indicados. Não é autorização de produção. Responsáveis são funções a serem assumidas por Edwyn/EWS Tech, não pessoas fictícias.

| Item | Estado | Evidência / ação de fechamento | Responsável |
|---|---|---|---|
| Briefing e base auditados antes de editar | Passou | Diagnóstico commit `5a2da80`, AUDITORIA.md | Engenharia |
| Branch dedicada e commits | Passou | `security/commercial-readiness` local; main preservada | Engenharia |
| Branch/PR remoto | Bloqueado | GitHub 403; Git sem credencial. Importar bundle e publicar conforme docs/ENTREGA-GIT.md | Edwyn / administrador GitHub |
| Instalação reproduzível | Passou | npm ci Linux, lockfile mantido | Engenharia |
| Lint/formato | Passou | npm run check | Engenharia |
| API, isolamento A/B, RBAC, JWT e uploads | Passou | 28 testes de integração em PGlite | QA / segurança |
| Preservação e abort seguro de migration | Passou | 2 testes de migrations em PGlite | DBA |
| Utilitários de backup | Passou | 3 testes de hash/limites/CLI, sem dump real | DevOps |
| Concorrência e constraints no PostgreSQL 16 | Bloqueado | Rodar npm test com TEST_DATABASE_URL; PGlite serializa | DBA / QA |
| Funil comercial, cookie, CSRF, páginas e leads | Passou | 4 E2E Chromium, API local real, PGlite | QA |
| Build Next.js de produção | Passou | build completo; não deploy | Engenharia web |
| Expo Doctor / dependências SDK | Passou | 18/18 e expo install --check | Engenharia mobile |
| Bundle Android | Passou | expo export, Hermes; não APK | Engenharia mobile |
| URL release e APK/AAB separados | Passou | Validações locais + eas.json | Engenharia mobile |
| Dependências API/web produção | Passou | npm audit omit=dev, workspaces backend/web: 0 alertas | Segurança |
| Dependências monorepo completo | Falhou | 28 moderadas/1 baixa em tooling; mitigação e advisories no relatório. 0 altas/críticas | Segurança / engenharia |
| Segredos no histórico | Passou | Scanner limitado sem achados; habilitar proteção adicional no GitHub | Segurança |
| CI executada e merge protegido | Bloqueado | Workflow preparado; depende de publicação/acesso GitHub | DevOps / Edwyn |
| HTTPS/API/banco/volume de homologação | Bloqueado | Domínios, credenciais e infraestrutura não fornecidos | Edwyn / DevOps |
| Cookies Secure, TLS, CORS e borda real | Não testado | Exercitar homologação HTTPS; validar cabeçalhos, certificado e rate limit | Segurança / QA |
| Backup automático, cifrado e fora do host | Bloqueado | Definir serviços, destino, chave, janela e retenção; instalar job | DevOps / Edwyn |
| pg_dump/restore e RPO/RTO comprovados | Bloqueado | Rodar scripts/test-restore.mjs + ensaio representativo e registrar tempos | DBA / DevOps |
| Ensaio de migration em cópia sanitizada | Não testado | Backup, ensaio, validação e rollback conforme DEPLOY.md | DBA |
| Dockerfile/Compose | Não testado | Build e volume sob usuário não-root em homologação | DevOps |
| Propriedade package e projeto EAS | Bloqueado | Confirmar conta, `com.ewstech.ewsfield`, projectId e assinatura | Edwyn |
| APK gerado e instalado sem Expo Go | Bloqueado | API pública HTTPS, EAS e aparelho; ver APK-ANDROID.md | Mobile / QA |
| GPS/câmera/SecureStore/rede real | Não testado | Permissões negadas, timeout, 5 fotos, retry, logout e sessão no Android | QA mobile |
| WCAG, teclado completo e leitor de tela | Não testado | Modais melhorados; validar fluxos completos com teclado/TalkBack | QA / UX |
| Responsividade básica | Passou | Sem overflow em 390/1440 px nas quatro páginas testadas | QA web |
| Lighthouse/Core Web Vitals/EXPLAIN/carga | Não testado | Medir em homologação com dados representativos | Engenharia / QA |
| Alertas, SLA, erros e capacidade do disco | Bloqueado | Configurar coletor/retenção/alertas e dono de incidentes | DevOps |
| LGPD operacional e contratos | Bloqueado | Identificação, finalidade/base legal, retenção, operadores, canal, revisão jurídica | Edwyn / jurídico |
| Exportação/exclusão por empresa | Bloqueado | Projetar e testar processo autenticado com backups/retensão | Engenharia / privacidade |
| Recuperação de acesso e suporte | Bloqueado | Sem recuperação por e-mail; definir processo seguro antes do piloto | Edwyn / segurança |
| Billing/trials/quotas/PDF/assinatura/offline | Não testado | Não implementados; aprovar escopo antes de anúncio comercial | Produto |
| Aceite do piloto | Bloqueado | Fechar P1 e registrar aceite com evidências reais | Edwyn |

Nenhum dado real foi alterado. Importação dos commits não executa migrations nem inicia cobrança. O checklist deve ser atualizado com data, build/commit, ambiente e evidência ao fechar cada bloqueio.
