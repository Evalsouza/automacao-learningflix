# Rodadas da automação — rodam fora do Claude, pelo Agendador de Tarefas do Windows.
#   -Tipo diaria  (seg a sex, 09:03): npm run test:diaria  — suítes normais, só leitura → relatorios\AAAA-MM-DD\
#   -Tipo semanal (sexta, 12:00):    npm run test:semanal — suítes que alteram configuração, criam usuário
#                                     ou enviam e-mail → relatorios\AAAA-MM-DD-semanal\
# Em cada pasta:
#   resumo.txt          — resultado da rodada (o mesmo do terminal)
#   resultado.json      — resultado completo, para análise
#   metricas.json       — métricas por módulo: executados, aprovação, instáveis e tempo
#   playwright-report\  — relatório HTML com prints e vídeos (abra o index.html)
#   execucao.log        — saída completa do comando
#   status.json         — início, fim, código de saída, se a rodada terminou e se foi interrompida pelo limite
# A tarefa "Rodada diária — envio do relatório" do Claude lê essa pasta e publica no Confluence e por e-mail.

param([ValidateSet('diaria', 'semanal')][string]$Tipo = 'diaria', [switch]$Forcar)

$ErrorActionPreference = 'Continue'
$projeto = Split-Path -Parent $PSScriptRoot
$data = Get-Date -Format 'yyyy-MM-dd'
$pasta = Join-Path $projeto ("relatorios\$data" + $(if ($Tipo -eq 'semanal') { '-semanal' } else { '' }))

# A tarefa tem novas tentativas ao longo do dia: se a rodada de hoje já terminou, não roda de novo.
# Rodada interrompida (notebook suspenso, desligado) não tem "fim" e roda de novo. -Forcar roda sempre
$statusAnterior = Join-Path $pasta 'status.json'
if (-not $Forcar -and (Test-Path $statusAnterior)) {
  $anterior = Get-Content $statusAnterior -Raw | ConvertFrom-Json
  if ($anterior.fim) { Write-Host "Rodada $Tipo de $data já terminou às $($anterior.fim)."; exit 0 }
}
New-Item -ItemType Directory -Force -Path $pasta | Out-Null

# Avisa o Windows que há trabalho em andamento: o notebook não suspende sozinho durante a rodada.
# Fechar a tampa ainda suspende
Add-Type -Namespace Win32 -Name Energia -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint estado);'
$manterAcordado = [uint32]'0x80000001'  # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
[Win32.Energia]::SetThreadExecutionState($manterAcordado) | Out-Null

$status = [ordered]@{ tipo = $Tipo; data = $data; inicio = (Get-Date).ToString('s'); fim = $null; codigoSaida = $null; concluida = $false; interrompida = $null }
$status | ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $pasta 'status.json')

Set-Location $projeto
# Remove o resultado da rodada anterior para não publicar dados antigos
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $projeto 'test-results'), (Join-Path $projeto 'playwright-report')

# Limite próprio, 10 minutos antes do limite da tarefa do Windows (4 h diária, 8 h semanal): o limite da tarefa
# encerra só este PowerShell e deixa o Playwright rodando solto; aqui a rodada inteira (npm, Playwright e
# navegadores) é encerrada e o que já existe é salvo.
$limiteMinutos = if ($Tipo -eq 'semanal') { 470 } else { 230 }
$rodada = Start-Process cmd.exe -ArgumentList "/c npm run test:$Tipo > `"$pasta\execucao.log`" 2>&1" `
  -WorkingDirectory $projeto -WindowStyle Hidden -PassThru
$null = $rodada.Handle  # necessário para ler o ExitCode depois
if ($rodada.WaitForExit($limiteMinutos * 60 * 1000)) {
  $codigo = $rodada.ExitCode
} else {
  taskkill /PID $rodada.Id /T /F | Out-Null
  $codigo = $null
  $status.interrompida = "Passou do limite de $limiteMinutos minutos"
  Add-Content -Encoding utf8 "$pasta\execucao.log" "`r`n*** Rodada encerrada: passou do limite de $limiteMinutos minutos ***"
}

foreach ($arquivo in 'resumo.txt', 'resultado.json', 'metricas.json') {
  $origem = Join-Path $projeto "test-results\$arquivo"
  if (Test-Path $origem) { Copy-Item $origem $pasta -Force }
}
$relatorio = Join-Path $projeto 'playwright-report'
if (Test-Path $relatorio) { Copy-Item $relatorio (Join-Path $pasta 'playwright-report') -Recurse -Force }

[Win32.Energia]::SetThreadExecutionState([uint32]'0x80000000') | Out-Null  # libera a suspensão
$status.fim = (Get-Date).ToString('s')
$status.codigoSaida = $codigo
$status.concluida = Test-Path (Join-Path $pasta 'resumo.txt')
$status | ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $pasta 'status.json')

# Mantém só os últimos 30 dias de relatórios
Get-ChildItem (Join-Path $projeto 'relatorios') -Directory |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}(-semanal)?$' } |
  Sort-Object Name -Descending | Select-Object -Skip 30 |
  Remove-Item -Recurse -Force
