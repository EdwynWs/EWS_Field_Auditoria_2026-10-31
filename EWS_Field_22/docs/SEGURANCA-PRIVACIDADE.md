# Segurança e privacidade — decisões e pendências

Esta é uma revisão de engenharia, não certificação OWASP nem parecer jurídico de conformidade LGPD.

Proteções implementadas: RBAC pelo estado atual do banco, sessões revogáveis, FKs compostas multiempresa, SQL parametrizado, validação Zod estrita, erros sem detalhes internos, limitação distribuída em PostgreSQL, BFF com cookie HttpOnly e origem obrigatória em mutações, SecureStore mobile, limite de imagem e normalização sem EXIF, download privado e trilha de eventos de mutação. Fotos/GPS não vão para analytics. Nenhuma integração de pagamento foi ativada.

JWT não contém nome/e-mail/company/role; identifica sujeito e sessão. Expira em 1 hora; logout revoga, alteração de senha revoga todas as sessões. Não há refresh, recuperação por e-mail, MFA, convite verificado nem confirmação de e-mail. Recuperação segura do gestor é requisito de suporte pendente: não enviar senha por WhatsApp e não criar endpoint público de redefinição sem prova de posse. A recuperação fora do sistema requer validação da identidade e procedimento restrito, ainda a definir.

CSP do web bloqueia objetos/iframes e limita origens, mas mantém `script-src 'unsafe-inline'` por compatibilidade com renderização Next; não é uma CSP com nonce. React renderiza textos de clientes/relatos escapados, sem innerHTML. Fortalecer nonce em versão futura e validar com o build. Fonts Google e imagem Pexels existentes na V4 foram preservadas; são terceiros que recebem requisições do navegador. Inventariar operadores/licenças e considerar hospedar assets localmente antes de publicação definitiva.

## Antes de usar dados reais

Definir controlador/operador, identificação jurídica e canal de privacidade, finalidade/base legal com revisão jurídica, acesso de gestores aos dados de colaboradores, localização de hospedagem, suboperadores, transferências e prazos. Permissão Android/câmera não substitui definição de base legal. Localização só é coletada ao registrar visita; precisão declarada/ausência de mock não prova presença física contra aparelho adulterado.

Para fotos, orientar a evitar terceiros, documentos e informações desnecessárias. Novo processamento remove metadados, mas conteúdo da imagem continua sensível. Aplicar criptografia do disco/banco/backups no provedor; esta entrega não implantou KMS nem cifrou volumes externos.

Retenção/exclusão/exportação de dados operacionais por tenant não possuem automação/API administrativa. Há FKs para evitar exclusão acidental e nenhum script de limpeza de dados do cliente foi executado. Elaborar fluxo de solicitação autenticada, exportação com prazo/URL privada, revisão de vínculos, anonimização/exclusão e expiração em backups com jurídico. Definir se audit_events/idempotency_keys devem ser minimizados após prazo; hoje permanecem.

Não há superadmin público nem bypass global. Suporte deve ter acesso temporário, auditado e mínimo. Falta console operacional para suspensão/reativação de empresa; `companies.active` é checado em todas as sessões, mas alterações operacionais devem ocorrer somente por runbook restrito e verificação da empresa-alvo.

## Dependências e segredos

`npm audit` é evidência pontual, não prova de ausência de vulnerabilidades. Revisar resultado no checklist. Overrides PostCSS/image-size e patch explícito no import do Metro corrigem versões vulneráveis mantendo o SDK Expo 54. O postinstall falha se o import upstream mudar: revisar, não desabilitar silenciosamente. Sharp atualizado para versão corrigida; repetir upload/build após upgrades.

A varredura de histórico `scripts/scan-secrets.mjs` detecta alguns formatos de chaves, tokens e URLs sensíveis e não imprime seus valores. Resultado sem achados não substitui scanner completo/proteção de push. `.env`/keystore/credenciais ignorados. Se aparecer vazamento, revogar no provedor, girar JWT_SECRET (encerra todas sessões), trocar credenciais, revisar acessos e só depois planejar saneamento do histórico — nunca force-push automático.

## Limitações para SaaS comercial

Planos/quotas, billing, webhooks assinados, trials e inadimplência não foram implementados porque não há escopo/preços aprovados. Desenho recomendado para etapa seguinte: plano/versionamento em company, entitlement verificado no servidor, evento do provedor com assinatura e ID único persistido, processamento transacional e políticas explícitas para downgrade. Não há cobrança real nesta entrega.

Storage privado atual requer volume persistente e backups. Para escala horizontal, implementar driver S3/R2 com chave aleatória, bucket privado, ACL por empresa no servidor e URLs curtas ou proxy autenticado; migrar arquivos por lotes verificando checksum, conservar origem até validação e rollback. Não foi simulado um serviço S3 nem criada credencial real.


Consulta final em 31/10/2026: monorepo com 28 alertas moderados e 1 baixo (causas diretas glob, minimatch e deepmerge, propagadas pela toolchain); API/web de produção com zero alertas. Não houve downgrade incompatível ou override global de minimatch: consumidores legados têm API diferente. Executar apenas configurações/globs confiáveis, manter Metro privado, CI sem credenciais de produção e com timeout. São mitigações do uso observado, não correções dos advisories; acompanhar atualização suportada do SDK e registrar aceite de risco. Detalhes e referências em AUDITORIA.md.
