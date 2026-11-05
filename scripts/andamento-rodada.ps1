# Mostra o andamento da rodada automática mais recente, sem interferir nela:
# estado das tarefas do Windows, porcentagem executada, passou/falhou/pulado e as falhas até agora.
#   npm run rodada:andamento
#   powershell -ExecutionPolicy Bypass -File scripts\andamento-rodada.ps1 [-Pasta relatorios\AAAA-MM-DD]

param([string]$Pasta)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projeto = Split-Path -Parent $PSScriptRoot
if (-not $Pasta) {
  $Pasta = Get-ChildItem (Join-Path $projeto 'relatorios') -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}(-semanal)?$' } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $Pasta -or -not (Test-Path $Pasta)) { Write-Host 'Nenhuma rodada encontrada em relatorios\.'; exit }

Write-Host "`n=== Tarefas do Windows ===" -ForegroundColor Cyan
foreach ($nome in 'Automacao LearningFlix - Rodada diaria', 'Automacao LearningFlix - Rodada semanal') {
  $tarefa = Get-ScheduledTask -TaskName $nome -ErrorAction SilentlyContinue
  if (-not $tarefa) { Write-Host "$nome : não agendada"; continue }
  $info = Get-ScheduledTaskInfo $tarefa
  $estado = if ($tarefa.State -eq 'Running') { 'RODANDO' } else { 'parada' }
  $ultima = if ($info.LastRunTime.Year -lt 2000) { 'nunca rodou' } else { $info.LastRunTime.ToString('dd/MM HH:mm') }
  Write-Host ("{0} : {1} — última: {2} — próxima: {3:dd/MM HH:mm}" -f $nome, $estado, $ultima, $info.NextRunTime)
}

Write-Host "`n=== Rodada $(Split-Path $Pasta -Leaf) ===" -ForegroundColor Cyan
$statusArquivo = Join-Path $Pasta 'status.json'
if (Test-Path $statusArquivo) {
  $status = Get-Content $statusArquivo -Raw | ConvertFrom-Json
  $fim = if ($status.fim) { ([datetime]$status.fim).ToString('HH:mm') } else { 'ainda rodando' }
  Write-Host ("Início: {0:HH:mm} — fim: {1}" -f [datetime]$status.inicio, $fim)
  if ($status.interrompida) { Write-Host "Interrompida: $($status.interrompida)" -ForegroundColor Yellow }
}

$log = Join-Path $Pasta 'execucao.log'
if (-not (Test-Path $log)) { Write-Host 'O log ainda não foi criado.'; exit }
$total = (Select-String -Path $log -Pattern 'Running (\d+) tests' | Select-Object -First 1).Matches.Groups[1].Value
$linhas = Select-String -Path $log -Pattern '^\s+(ok|x|-)\s+\d+ '
$passou = @($linhas | Where-Object { $_.Line -match '^\s+ok\s' }).Count
$falhou = @($linhas | Where-Object { $_.Line -match '^\s+x\s' })
$pulado = @($linhas | Where-Object { $_.Line -match '^\s+-\s' }).Count
$feitos = $linhas.Count
if ($total) {
  $pct = [math]::Round(100 * $feitos / [int]$total)
  Write-Host "Andamento: $feitos de $total testes ($pct%)" -ForegroundColor Green
} else { Write-Host "Andamento: $feitos testes (total ainda não informado)" }
Write-Host "Passou: $passou   Falhou: $($falhou.Count)   Pulado: $pulado"
$atualizado = (Get-Item $log).LastWriteTime
Write-Host ("Log atualizado às {0:HH:mm:ss} — último teste: {1}" -f $atualizado, (($linhas | Select-Object -Last 1).Line -replace '^.*› ', '' -replace '\s+@.*$', ''))
if ($falhou.Count) {
  Write-Host "`nFalhas até agora:" -ForegroundColor Red
  $falhou | ForEach-Object { '  - ' + ($_.Line -replace '^.*› ', '' -replace '\s+@.*$', '') }
}
if ($status -and $status.concluida) { Write-Host "`nRodada concluída: resumo em $(Join-Path $Pasta 'resumo.txt')" }
