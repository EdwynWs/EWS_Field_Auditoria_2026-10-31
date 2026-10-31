# Backup e restore

O script é uma ferramenta; **backup de produção não está configurado nem comprovado nesta entrega**. PostgreSQL nativo/pg_dump não está disponível no ambiente local de auditoria. O teste automatizado está preparado para CI/PostgreSQL 16.

## Snapshot consistente

Parar novas escritas na API em janela curta, aguardar requisições/transações terminarem e garantir nenhum job concorrente escreve fotos/banco. Não basta colocar uma variável: o operador deve efetivamente pausar o serviço de escrita. Com cliente PostgreSQL compatível no PATH, fornecer variáveis por mecanismo de segredos (sem ecoar senha):

```powershell
$env:MEDIA_DIR = "C:\ews\private-media"
$env:BACKUP_DIR = "D:\backups\ews-2026-10-30-01"
$env:BACKUP_WRITES_PAUSED = "true"
# DATABASE_URL deve estar definida no ambiente privado.
node scripts/backup.mjs
```

O diretório de destino deve ser novo. Produz dump custom sem owners/ACL, cópia do volume e manifesto SHA-256. Falha mantém pasta parcial para inspeção; nunca trata pasta sem manifesto validado como backup completo. Reabrir API após confirmar resultado e monitorar health. Em Linux, um timer systemd/cron pode chamar um wrapper que pause o serviço, execute backup e sempre religue em `trap/finally`; **configurar esse wrapper exige os nomes reais dos serviços e a janela aceita**. Não existe job instalado no seu servidor nesta auditoria.

Armazenar cópia cifrada fora do host, com chave separada e acesso mínimo. Definir retenção e testar expiração. O dump contém PII e eventualmente fotos base64 antigas; não publicar no Git, Actions artifacts, chat ou bucket público. Nunca colocar senha na linha de comando ou logs; scripts usam variáveis PG no processo filho.

## Ensaio automatizado, sem tocar produção

```powershell
$env:TEST_DATABASE_URL = "postgres://usuario:senha@127.0.0.1:5432/ews_field_test"
node scripts/test-restore.mjs
```

Esse usuário de teste precisa CREATEDB. O teste cria bancos com nomes UUID terminados em `_test`, aplica migrations, cria fixture sintética, executa pg_dump/pg_restore, verifica registros, migrations e checksum do arquivo, depois remove apenas seus bancos temporários. Não é um ensaio de RTO de base grande. A imagem sintética do teste é um arquivo de bytes; o teste de processamento de imagem real pertence à suíte da API.

## Recuperação real

Restaurar em **banco e volume novos**, com aplicativo parado. Validar manifesto e checksums antes de importar; usar `pg_restore --exit-on-error --single-transaction --no-owner --no-acl` conectado ao alvo novo por variáveis PG. Restaurar fotos no MEDIA_DIR com usuário/permissões corretos. Reaplicar grants do usuário de runtime, pois o dump omite ACL/owner. Rodar migrations/verificação de versão conforme release, `/ready` e fluxo de duas empresas; testar fotos/relatórios. Invalidar sessões restauradas antes de reabrir (sessions são parte do dump e podem conter sessões antigas): em janela privada, revogar todas as sessões na base restaurada. Não restaurar credenciais antigas sem rotação de risco avaliada.

Só trocar a URL da aplicação após aceite. Manter o ambiente anterior isolado para reconciliação, sem apagar dados. Registrar tempo de restauração, idade do snapshot, hash, responsável e perdas dentro do RPO acordado. Completar a periodicidade de ensaio e alertas no checklist antes de piloto.
