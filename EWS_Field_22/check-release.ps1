# EWS Field - preflight somente leitura para lancamento.
# Execute na pasta EWS_Field_22: powershell -ExecutionPolicy Bypass -File .\check-release.ps1 -ApiUrl https://api.seudominio.com
param(
    [string]$ApiUrl = "",
    [switch]$RunQualityChecks
)

$ErrorActionPreference = 'Stop'
$root = Get-Location
$blocks = 0
$warnings = 0
function Result([string]$kind, [string]$message) {
    if ($kind -eq 'BLOQUEIO') { $script:blocks++ }
    if ($kind -eq 'ATENCAO') { $script:warnings++ }
    Write-Host "[$kind] $message"
}
function Test-PathRequired([string]$p) {
    if (-not (Test-Path $p)) { Result 'BLOQUEIO' "Arquivo/pasta ausente: $p"; return $false }
    return $true
}
function CommandExists([string]$cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function LooksPublicHttps([string]$raw) {
    try {
        $uri = [uri]$raw
        if ($uri.Scheme -ne 'https' -or -not $uri.Host -or $uri.UserInfo -or $uri.Query -or $uri.Fragment -or $uri.AbsolutePath -ne '/') { return $false }
        if ($uri.Host -match '^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[01])\.|.*\.(local|test|invalid|example))') { return $false }
        return $true
    } catch { return $false }
}

Write-Host 'EWS Field - diagnostico de pre-lancamento (nao modifica arquivos ou banco)'
if (-not (Test-PathRequired './package.json')) { exit 2 }
if (-not (Test-PathRequired './mobile/eas.json')) { exit 2 }
if (-not (Test-PathRequired './mobile/app.json')) { exit 2 }
if (-not (Test-PathRequired './package-lock.json')) { exit 2 }
if (-not (Test-PathRequired './backend/sql/schema.sql')) { exit 2 }

if (-not (CommandExists 'node')) { Result 'BLOQUEIO' 'Node nao encontrado no PATH.' }
else {
    $nodeVersion = (& node --version).Trim()
    Write-Host "Node: $nodeVersion"
    if ($nodeVersion -match '^v(\d+)\.(\d+)\.') {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        if ($major -lt 22 -or ($major -eq 22 -and $minor -lt 13) -or $major -ge 25) { Result 'BLOQUEIO' 'Use Node >=22.13 e <25, conforme package.json.' }
    }
}
if (-not (CommandExists 'npm.cmd')) { Result 'BLOQUEIO' 'npm.cmd nao encontrado.' }

try {
    $pkg = Get-Content './mobile/app.json' -Raw | ConvertFrom-Json
    $eas = Get-Content './mobile/eas.json' -Raw | ConvertFrom-Json
    if (-not $eas.build.preview -or $eas.build.preview.android.buildType -ne 'apk') { Result 'BLOQUEIO' 'Perfil preview nao esta configurado para APK.' }
    else { Result 'OK' 'Perfil EAS preview -> APK configurado.' }
    if (-not $eas.build.production -or $eas.build.production.android.buildType -ne 'app-bundle') { Result 'BLOQUEIO' 'Perfil production -> AAB nao configurado.' }
    else { Result 'OK' 'Perfil EAS production -> AAB configurado.' }
    if (-not $pkg.expo.android.package) { Result 'BLOQUEIO' 'Identificador Android nao definido.' }
    else { Result 'OK' 'Identificador Android definido. Confirmar titularidade antes de publicar.' }
    if (-not $pkg.expo.icon) { Result 'ATENCAO' 'Icone final nao configurado em mobile/app.json (expo.icon).' }
    if (-not $pkg.expo.android.adaptiveIcon) { Result 'ATENCAO' 'Icone adaptativo Android nao configurado.' }
    if (-not ($pkg.expo.plugins | Where-Object { ($_ -is [string] -and $_ -eq 'expo-splash-screen') -or ($_ -is [array] -and $_[0] -eq 'expo-splash-screen') })) {
        Result 'ATENCAO' 'Splash personalizado nao configurado.'
    }
    if (-not $pkg.expo.extra.eas.projectId) { Result 'ATENCAO' 'Nao encontrei EAS projectId em app.json; eas init pode ainda ser necessario.' }
} catch {
    Result 'BLOQUEIO' 'Falha lendo mobile/app.json ou mobile/eas.json.'
}

if (Test-Path './backend/.env') {
    $lines = Get-Content './backend/.env'
    if ($lines -match '^ALLOW_PUBLIC_SIGNUP\s*=\s*true\s*$') { Result 'ATENCAO' 'ALLOW_PUBLIC_SIGNUP=true no .env LOCAL: desative em producao.' }
    if ($lines -match '^NODE_ENV\s*=\s*development\s*$') { Result 'OK' 'Config local de desenvolvimento encontrada (nao reutilizar em producao).' }
} else { Result 'ATENCAO' 'backend/.env local ausente; em producao usar secrets no host.' }

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
    Result 'BLOQUEIO' 'Falta informar a URL publica HTTPS da API para o APK de distribuicao. Passe -ApiUrl.'
} elseif (-not (LooksPublicHttps $ApiUrl)) {
    Result 'BLOQUEIO' 'ApiUrl invalida: deve ser HTTPS publico, sem caminho, token ou IP privado.'
} else {
    $origin = ([uri]$ApiUrl).GetLeftPart([System.UriPartial]::Authority)
    foreach ($endpoint in @('/health', '/ready')) {
        try {
            $resp = Invoke-RestMethod -Uri ($origin + $endpoint) -Method Get -TimeoutSec 12
            if ($resp.ok -eq $true) { Result 'OK' "API $endpoint respondeu ok=true." }
            else { Result 'BLOQUEIO' "API $endpoint nao retornou ok=true." }
        } catch { Result 'BLOQUEIO' "Nao foi possivel validar a API $endpoint por HTTPS publico." }
    }
}

if ($RunQualityChecks -and (CommandExists 'npm.cmd')) {
    foreach ($task in @(@('npm.cmd','run','check'), @('npm.cmd','run','build:web'))) {
        $label = $task -join ' '
        Write-Host "Executando $label"
        & $task[0] $task[1] $task[2]
        if ($LASTEXITCODE -ne 0) { Result 'BLOQUEIO' "Falhou: $label" } else { Result 'OK' "Passou: $label" }
    }
} else {
    Result 'ATENCAO' 'Checks de qualidade ainda nao executados aqui: rode com -RunQualityChecks.'
}
Write-Host "`nResumo: bloqueios=$blocks; atencoes=$warnings"
if ($blocks -gt 0) { Write-Host 'NAO PUBLICAR ainda: feche os bloqueios e teste um APK real.'; exit 1 }
Write-Host 'Preflight tecnico concluido; validacao funcional, backup, privacidade e assinatura ainda sao obrigatorios.'
