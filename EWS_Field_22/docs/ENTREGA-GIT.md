# Aplicar a entrega sem sobrescrever a main

O pacote contém `EWS_Field_22/` (fonte e relatórios) e `ews-field.bundle` (histórico Git completo da branch de auditoria). Não contém node_modules, credenciais, fotos, bancos ou APK. O ZIP é uma entrega de código para revisão, não instalador Android.

A integração retornou HTTP 403 ao tentar criar a branch e o terminal não tem credencial para push. Portanto **não existe PR remoto desta entrega**. Os commits estão preservados no bundle; não é necessário copiar arquivos sobre um checkout existente.

Com Git instalado, extraia o ZIP e abra PowerShell na pasta que contém o bundle. Escolha uma pasta nova:

```powershell
git clone -b security/commercial-readiness .\ews-field.bundle EWS_Field_Auditado
cd EWS_Field_Auditado
git status
git log -5 --oneline
git remote set-url origin https://github.com/EdwynWs/EWS_Field_22.git
git push -u origin security/commercial-readiness
```

Autentique pelo Git Credential Manager/GitHub; não cole tokens no terminal, no chat ou em URLs. Se a branch já existir remotamente, não force push: faça fetch, compare e reconcilie o histórico em uma branch nova. Se a main mudou desde a base auditada, resolver conflitos e repetir a CI antes de merge.

Após push, crie um Pull Request pelo GitHub da branch `security/commercial-readiness` para `main`, usando `docs/PR.md` como descrição. Se tiver GitHub CLI instalado e autenticado:

```powershell
gh pr create --base main --head security/commercial-readiness --title "Protege sessões, isolamento multiempresa e evidências do EWS Field" --body-file docs/PR.md
```

O comando cria PR; não faz merge. Aguarde o workflow, confira os testes com PostgreSQL 16 e restore, e configure proteção da main. Instalação/desenvolvimento estão no README; release depende do checklist. Não execute a migration no banco real só para conferir a instalação.
