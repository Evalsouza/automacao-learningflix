# Rodada diária da automação — roda fora do Claude, pelo Agendador de Tarefas do Windows (07:00).
# Executa todos os testes (npm run test:diaria) e guarda o resultado em relatorios\AAAA-MM-DD\:
#   resumo.txt          — resultado da rodada (o mesmo do terminal)
#   resultado.json      — resultado completo, para análise
#   playwright-report\  — relatório HTML com prints e vídeos (abra o index.html)
#   execucao.log        — saída completa do comando
#   status.json         — início, fim, código de saída e se a rodada terminou
# A tarefa "Rodada diária — envio do relatório" do Claude lê essa pasta e publica no Confluence e por e-mail.

$ErrorActionPreference = 'Continue'
$projeto = Split-Path -Parent $PSScriptRoot
$data = Get-Date -Format 'yyyy-MM-dd'
$pasta = Join-Path $projeto "relatorios\$data"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null

$status = [ordered]@{ data = $data; inicio = (Get-Date).ToString('s'); fim = $null; codigoSaida = $null; concluida = $false }
$status | ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $pasta 'status.json')

Set-Location $projeto
# Remove o resultado da rodada anterior para não publicar dados antigos
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $projeto 'test-results'), (Join-Path $projeto 'playwright-report')

cmd /c "npm run test:diaria > `"$pasta\execucao.log`" 2>&1"
$codigo = $LASTEXITCODE

foreach ($arquivo in 'resumo.txt', 'resultado.json') {
  $origem = Join-Path $projeto "test-results\$arquivo"
  if (Test-Path $origem) { Copy-Item $origem $pasta -Force }
}
$relatorio = Join-Path $projeto 'playwright-report'
if (Test-Path $relatorio) { Copy-Item $relatorio (Join-Path $pasta 'playwright-report') -Recurse -Force }

$status.fim = (Get-Date).ToString('s')
$status.codigoSaida = $codigo
$status.concluida = Test-Path (Join-Path $pasta 'resumo.txt')
$status | ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $pasta 'status.json')

# Mantém só os últimos 30 dias de relatórios
Get-ChildItem (Join-Path $projeto 'relatorios') -Directory |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' } |
  Sort-Object Name -Descending | Select-Object -Skip 30 |
  Remove-Item -Recurse -Force
