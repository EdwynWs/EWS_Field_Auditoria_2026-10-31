# EWS Field - Kit de pre-lancamento Android (31/10/2026)

Este kit nao contem APK. Gerar um APK assinado exige conta EAS/Expo vinculada e API HTTPS publica funcionando. Nao alteramos suas chaves nem suas bases de dados.

## 1. Onde copiar

Copie `check-release.ps1` para a raiz `EWS_Field_22` (ao lado do `package.json`).

Abra PowerShell nessa pasta e rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\check-release.ps1
```

Para validar uma API HTTPS publicada (troque pelo endereco verdadeiro):

```powershell
powershell -ExecutionPolicy Bypass -File .\check-release.ps1 -ApiUrl https://api.SEU-DOMINIO.COM -RunQualityChecks
```

O script e somente leitura: nao executa migrations, nao faz deploy, nao altera .env e nao envia credenciais. Checagens de qualidade podem atualizar cache local do Next durante a compilacao.

## 2. Pre-requisitos de distribuicao

1. API Express rodando permanentemente em ambiente com TLS valido, `/health` e `/ready` respondendo `{"ok":true}`.
2. PostgreSQL privado e migrado, distinto do banco de outros sistemas.
3. Fotos em volume persistente privado (MEDIA_DIR) e backup testado para banco **e** fotos.
4. `JWT_SECRET` aleatorio e novo, `NODE_ENV=production`, `WEB_ORIGIN=https://...`, `ALLOW_PUBLIC_SIGNUP=false` (onboarding controlado).
5. Conta Expo/EAS sua, MFA, ownership de `com.ewstech.ewsfield`, icone/splash finais, politica de privacidade, termos de uso e canal de suporte.

## 3. APK instalavel (preview)

No PowerShell, a partir da raiz EWS_Field_22:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run build:web
cd mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest whoami
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value https://api.SEU-DOMINIO.COM --visibility plaintext
npx.cmd eas-cli@latest env:list --environment preview
npx.cmd eas-cli@latest build --platform android --profile preview
```

Substitua a URL acima por sua API real HTTPS. O `eas init` pode exigir login e vinculacao ao projeto Expo. Confira custo/cota antes de iniciar a build. Pode ser solicitada a criacao de uma keystore Android — nao compartilhe o arquivo nem as senhas.

No fim da build, o EAS fornecera um link para baixar e instalar o APK no celular, independentemente do Expo Go. Se falhar, compartilhe o log de erro sem tokens/credenciais.

## 4. AAB para Play Store

Depois de aprovar o APK, configure tambem a variavel no ambiente production:

```powershell
npx.cmd eas-cli@latest env:set --environment production --name EXPO_PUBLIC_API_URL --value https://api.SEU-DOMINIO.COM --visibility plaintext
npx.cmd eas-cli@latest build --platform android --profile production
```

O resultado e AAB; nao e instalavel diretamente. O Expo SDK 54 usa targetSdk 36 e atende o requisito geral da Play Store de 31/08/2026, mas a aprovacao depende de conformidade com todas as politicas da loja.

## 5. Testes obrigatorios no APK real

- Instalar em pelo menos um Android real, sem Expo Go.
- Desativar Wi-Fi: autenticar e carregar dados pela rede movel.
- Gestor criar cliente e tecnico, atribuir OS e conferir permissao.
- Tecnico fazer check-in com GPS/foto, checkout e relatorio.
- Negar permissoes de localizacao e camera; validar tratamento.
- Alternar rede/offline durante operacao e testar reenvio sem duplicar evento.
- Fazer logout, reiniciar o app, testar expiracao da sessao e nova autenticacao.
- Testar isolamento entre duas empresas com contas e dados separados.
- Restaurar banco e fotos em ambiente descartavel antes de aceitar clientes reais.

A auditoria de 31/10/2026 marcou o projeto como ainda bloqueado para piloto real e lancamento comercial: publicar o APK nao substitui esses testes, nem a recuperacao de acesso ou os controles de privacidade.

Referencias oficiais: https://docs.expo.dev/build-reference/apk/ ; https://docs.expo.dev/build-reference/build-with-monorepos/ ; https://docs.expo.dev/eas/environment-variables/
