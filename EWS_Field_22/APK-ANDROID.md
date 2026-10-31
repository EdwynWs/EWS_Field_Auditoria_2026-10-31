# APK Android — EWS Field

**APK instalável ≠ AAB da Play Store.** `mobile/eas.json` define `preview` como APK de distribuição interna e `production` como app-bundle/AAB. Bundle JavaScript exportado não é APK. Nenhum APK assinado foi gerado ou instalado nesta auditoria.

## Bloqueios antes da build

API real publicada com HTTPS, certificado válido, banco migrado, volume privado e backups. Conta Expo/EAS com acesso ao projeto e eventual autorização de custo. Confirmar propriedade do identificador `com.ewstech.ewsfield` antes da primeira distribuição; ele foi preservado, mas ownership não foi comprovado. Não trocar o package após publicação sem avaliar migração. É necessário definir ícones/splash finais e testar em aparelho.

## PowerShell, a partir da raiz do monorepo

```powershell
npm.cmd ci
cd mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest whoami
npx.cmd eas-cli@latest init
```

No `init`, vincule o **seu** projeto EAS existente ou crie um após conferir a conta. Não aceite vincular a projeto de terceiros. O `projectId` gerado é identificação pública; tokens/keystore não entram no Git. `app.config.js` mantém a configuração de `app.json`.

Cadastre a URL real no environment correspondente (o exemplo abaixo deve ser substituído; não é um servidor fornecido):

```powershell
npx.cmd eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value "https://SEU-DOMINIO-DA-API" --visibility plaintext
npx.cmd eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_URL --value "https://SEU-DOMINIO-DA-API" --visibility plaintext
```

`EXPO_PUBLIC_API_URL` é pública, vai no bundle e **não pode conter senhas/tokens**. Não usar localhost, IP da rede local ou HTTP em preview/production. O config falha antes de build nesses casos. Verifique a configuração sem publicar:

```powershell
$env:EXPO_PUBLIC_API_URL = "https://SEU-DOMINIO-DA-API"
npx.cmd expo-doctor
npx.cmd expo install --check
npx.cmd expo export --platform android
```

Gerar APK interno (inicia trabalho externo no EAS; confira quota/custo antes):

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

EAS deve detectar o workspace pelo lockfile da raiz. Execute dentro de `mobile`, mantenha raiz/backend/web/mobile e `package-lock.json` no envio, e confira no log que `npm ci` e o `postinstall` de compatibilidade do Metro foram executados. Não envie `.env`, backups, fotos ou chaves. Não rode `npm install` isoladamente criando um segundo lockfile mobile.

Após concluir, abra o link da build do EAS no Android, baixe o `.apk` e autorize instalação da origem usada. Alternativamente, com Android Platform Tools e depuração USB:

```powershell
adb devices
adb install -r "C:\caminho\ews-field-preview.apk"
```

O app deve abrir sem Expo Go e conectar usando dados móveis, não apenas Wi-Fi local. Testar gestor/técnico A/B, login/logout, retorno de sessão, permissões negadas, GPS desligado/lento, câmera cancelada, rede interrompida, repetição de envio, chegada, saída, relatório com cinco fotos e conclusão. Registrar aparelho, Android, hash/ID do build e resultado. Ao negar permissão, orientar a abrir configurações do Android; não solicitar localização em segundo plano.

## AAB / Play Store

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
```

Produz AAB para distribuição pela loja, não instalação direta. `appVersionSource=remote` e `production.autoIncrement=true` controlam versionCode no EAS. Não há submit automático configurado. Política de privacidade, Data Safety, suporte, ícones e testes de distribuição são bloqueios separados.

Guarde a keystore e o acesso à conta Expo em local restrito com cópia de recuperação e MFA. Faça backup das credenciais por procedimento privado do EAS; nunca anexe keystore, senha, token ou credenciais em PR. Updates de um APK instalado exigem mesma assinatura e versionCode adequado.

Referências oficiais para conferir ao executar: https://docs.expo.dev/build-reference/apk/ e https://docs.expo.dev/build-reference/build-with-monorepos/. Acesso ao serviço EAS e assinatura ainda não validados nesta entrega.
