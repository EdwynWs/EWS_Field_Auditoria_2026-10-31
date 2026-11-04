EWS Field — Roadmap do SaaS
EWS Tech | Gestão de assistência técnica e equipes externas

O EWS Field é um SaaS para empresas gerenciarem técnicos, clientes, ordens de serviço e visitas em campo, com painel Next.js, API Node.js/Express + PostgreSQL e aplicativo Expo/React Native.
Revisão do código: 04/11/2026. O produto possui uma base funcional e evidências de testes locais, mas ainda não foi homologado para clientes reais nem aprovado para lançamento comercial.

Legenda: [x] = implementação identificada no repositório ou evidência registrada (não significa aprovação em produção). [ ] = pendente, incompleto ou ainda sem validação adequada. P0 = crítico; P1 = necessário para piloto; P2 = evolução futura.

Código: [EWS_Field_22](EWS_Field_22/) · Documentação técnica: [README do monorepo](EWS_Field_22/README.md) · [Auditoria](EWS_Field_22/AUDITORIA.md) · [Checklist de lançamento](EWS_Field_22/CHECKLIST-LANCAMENTO.md)
1. Arquitetura e banco de dados — P0
Responsável: A definir
- [x] Organizar monorepo com backend/, web/ e mobile/.
- [x] Configurar API Express, pool PostgreSQL e transações.
- [x] Modelar empresas, usuários, clientes, ordens, visitas e relatórios.
- [x] Criar migrações SQL com checksum, transação e lock.
- [x] Criar tabelas de sessões, auditoria, mídia privada e idempotência.
- [x] Adicionar chaves estrangeiras compostas para isolamento entre empresas.
- [ ] Criar exemplos de configuração .env.example para cada serviço (não identificados neste pacote), sem credenciais reais.
- [ ] Testar migrações e integridade em PostgreSQL 16 nativo.
- [ ] Testar migrações em cópia sanitizada e procedimento de rollback.
2. Autenticação, segurança e multiempresa — P0
Responsável: A definir
- [x] Criar cadastro de empresa/gestor com ativação controlada por configuração.
- [x] Implementar login com bcrypt, JWT e sessões revogáveis.
- [x] Aplicar permissões de gestor e técnico.
- [x] Vincular a empresa à sessão, sem confiar em company_id enviado pelo cliente.
- [x] Restringir técnicos às ordens atribuídas e clientes correspondentes.
- [x] Implementar validação com Zod, SQL parametrizado, limites e rate limiting.
- [x] Criar testes de isolamento A/B, IDOR, permissões e expiração de sessão.
- [ ] Validar esses controles com PostgreSQL real e infraestrutura HTTPS.
- [ ] Validar CSRF, CORS, cookies Secure, proxy e limites de requisição em homologação.
- [ ] Criar fluxo seguro de recuperação de acesso e suporte à conta.
- [ ] Revisar riscos de segurança residuais antes do primeiro cliente.
3. Backend — Operação de campo — P0/P1
Responsável: A definir
- [x] Criar e listar clientes, usuários e ordens de serviço.
- [x] Criar dashboard/resumo de ordens por status.
- [x] Atribuir técnicos e controlar transições de status das OS.
- [x] Registrar check-in/check-out com GPS e foto.
- [x] Salvar relatórios técnicos, checklists e fotos vinculados às ordens.
- [x] Armazenar fotos novas de forma privada e exigir autorização para leitura.
- [x] Implementar reenvio idempotente de visitas e relatórios.
- [x] Paginar listagens da API.
- [ ] Testar o ciclo completo de atendimento com múltiplas empresas e dados realistas.
- [ ] Melhorar pesquisa global, filtros e consultas com muitos registros.
- [ ] Validar concorrência e transações no PostgreSQL nativo.
4. Frontend — Landing e painel web — P1
Responsável: A definir
- [x] Criar landing premium responsiva com seções comerciais.
- [x] Criar cadastro de empresa e formulário de captação de leads.
- [x] Criar página de privacidade, sitemap e SEO básico.
- [x] Criar painel Next.js com login, dashboard, clientes, equipe e ordens.
- [x] Integrar painel à API via BFF e cookie HttpOnly.
- [x] Exibir detalhes, visitas e relatórios das ordens.
- [x] Registrar build web e testes E2E locais.
- [ ] Validar usabilidade, acessibilidade e navegadores/dispositivos reais.
- [ ] Medir Lighthouse/Core Web Vitals e corrigir gargalos.
- [ ] Adicionar prova social apenas com empresas, depoimentos e números verificados/autorizados.
- [ ] Publicar web e configurar domínio/ambiente de homologação.
- [ ] Implementar PWA instalável (manifest e service worker), se mantido no escopo comercial.
5. Mobile — Expo, GPS e Android — P1
Responsável: A definir
- [x] Criar aplicativo Expo/React Native com fluxos de gestor e técnico.
- [x] Exibir ordens, detalhes, clientes, equipe e resumo.
- [x] Implementar câmera e localização para check-in/check-out.
- [x] Enviar relatórios, fotos e checklists pelo app.
- [x] Usar SecureStore para sessão nativa e descartar token legado em AsyncStorage.
- [x] Configurar projeto EAS com perfil preview APK e production AAB.
- [x] Registrar Expo Doctor e exportação do bundle Android em ambiente local.
- [ ] Criar ícone, splash e identidade visual definitiva da distribuição.
- [ ] Configurar EXPO_PUBLIC_API_URL HTTPS nos ambientes EAS.
- [ ] Gerar APK real e instalar em Android sem Expo Go.
- [ ] Testar GPS, câmera, permissões negadas, rede móvel, logout e expiração de sessão em aparelho físico.
- [ ] Criar fila offline durável e sincronização segura após reiniciar o app.
- [ ] Gerar AAB e preparar assinatura e submissão à Google Play.
6. Testes e CI — P0/P1
Responsável: A definir
- [x] Criar testes automatizados para backend e isolamento multiempresa.
- [x] Registrar 33 testes locais aprovados com PGlite (evidência anterior).
- [x] Registrar 4 testes E2E locais aprovados com Playwright (evidência anterior).
- [x] Registrar build Next.js e exportação Expo Android (bundle, não APK).
- [x] Criar scripts de formatação, revisão e checagem limitada de segredos.
- [x] Escrever configuração de GitHub Actions com PostgreSQL 16.
- [ ] Ativar a CI neste repositório: o workflow está em EWS_Field_22/.github/workflows/ci.yml, mas o GitHub exige .github/workflows/ na raiz do repositório.
- [ ] Executar workflow remoto e configurar checks obrigatórios na branch principal.
- [ ] Executar testes com PostgreSQL 16, concorrência, restauração e dados representativos.
- [ ] Testar desempenho, acessibilidade e o APK em aparelho real.
- [ ] Refazer auditoria de dependências e corrigir alertas relevantes.
7. Infraestrutura, deploy e backup — P1
Responsável: A definir
- [x] Criar Dockerfile da API e Compose para PostgreSQL.
- [x] Criar endpoints /health e /ready.
- [x] Criar scripts e documentação de backup, restore e deploy.
- [x] Implementar logs estruturados de requisições.
- [ ] Publicar API em servidor persistente com HTTPS válido.
- [ ] Separar banco, segredos e fotos entre dev, homologação e produção.
- [ ] Validar Docker e volumes privados em servidor real.
- [ ] Automatizar backup cifrado externo de banco e fotos.
- [ ] Testar pg_dump/`pg_restore` e documentar RPO/RTO.
- [ ] Configurar observabilidade, alertas, monitoramento de disco e incidentes.
- [ ] Validar procedimento de deploy, rollback e migração segura.
8. SaaS, LGPD e comercial — P1/P2
Responsável: A definir
- [x] Implementar formulário de leads na landing/API.
- [ ] Definir planos, preços, limites, contrato e processo de contratação.
- [ ] Implementar cobrança recorrente, assinaturas e testes gratuitos se incluídos no MVP.
- [ ] Definir LGPD operacional: finalidade, bases legais, retenção e operadores.
- [ ] Implementar exportação/exclusão segura de dados de cada empresa.
- [ ] Definir canal de suporte, recuperação de acesso e onboarding.
- [ ] Implementar PDF/assinatura de atendimento se incluídos no escopo.
- [ ] Validar o fluxo com duas empresas de teste e permissões separadas.
- [ ] Formalizar piloto, métricas de sucesso e autorização para primeiro cliente.
9. Checklist para liberar piloto real — P0/P1
Responsável: EWS Tech
- [ ] CI ativa e verde no repositório/branch de lançamento.
- [ ] PostgreSQL nativo e restauração real aprovados.
- [ ] API HTTPS, banco isolado, arquivos privados e backups operacionais.
- [ ] APK instalado e testado em Android físico com rede externa.
- [ ] Permissões e isolamento multiempresa revalidados em homologação.
- [ ] Privacidade, suporte e recuperação de conta definidos.
- [ ] Aceite do piloto documentado antes de cadastrar clientes reais.
Evidências disponíveis
Evidência versionada	Resultado registrado
[Testes de integração](EWS_Field_22/docs/evidencias/integration.txt)	33/33 em PGlite
[Testes E2E](EWS_Field_22/docs/evidencias/e2e.txt)	4/4 locais
[Expo Doctor](EWS_Field_22/docs/evidencias/expo-doctor.txt)	18/18 verificações
[Build/export em 01/11/2026](EWS_Field_22/EVIDENCIAS/v5-build-export-confirmado.txt)	Next compilado + bundle Android; sem APK


Os resultados acima são registros já existentes no repositório. Esta atualização do README não executou testes novos, deploy, migrações ou build de APK. Veja também o [relatório de auditoria](EWS_Field_22/AUDITORIA.md).

Desenvolvimento local
Dentro de EWS_Field_22/, configure primeiro as variáveis privadas de ambiente conforme o [README técnico](EWS_Field_22/README.md) e o [guia de deploy](EWS_Field_22/docs/DEPLOY.md). Não publique senhas, tokens nem banco de produção.
cd EWS_Field_22
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run dev:api
# Em outro terminal: npm.cmd run dev:web
# Em outro terminal: npm.cmd run dev:mobile
Documentos úteis: [Backup e restore](EWS_Field_22/docs/BACKUP-RESTORE.md) · [Segurança e privacidade](EWS_Field_22/docs/SEGURANCA-PRIVACIDADE.md) · [APK/AAB Android](EWS_Field_22/APK-ANDROID.md)
Regra de acompanhamento
Cada tarefa concluída deve ter responsável, alteração rastreável em branch/PR e evidência. Tela criada não significa recurso pronto: testar integração, regras de negócio, acesso entre empresas, erros de rede e comportamento em ambiente real antes de marcar validações.

EWS Tech — EWS Field | After Sales Edition
