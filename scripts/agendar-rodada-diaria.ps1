# Cria (ou atualiza) no Agendador de Tarefas do Windows a tarefa que roda a rodada diária às 07:00.
# Rode uma vez, no PowerShell, a partir da pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File scripts\agendar-rodada-diaria.ps1
# A tarefa roda com o seu usuário, quando você estiver conectado ao Windows.
# Para remover: Unregister-ScheduledTask -TaskName 'Automacao LearningFlix - Rodada diaria' -Confirm:$false

$nome = 'Automacao LearningFlix - Rodada diaria'
$script = Join-Path $PSScriptRoot 'rodada-diaria.ps1'

$acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`"" -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
$gatilho = New-ScheduledTaskTrigger -Daily -At '07:00'
# Se o computador estiver desligado às 07:00, roda assim que possível; no máximo 4 horas de execução
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 4) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilho -Settings $config -Description 'Roda npm run test:diaria e salva o relatório em relatorios\AAAA-MM-DD' -Force | Out-Null
Write-Host "Tarefa '$nome' agendada para todos os dias às 07:00."
Write-Host "Para testar agora: Start-ScheduledTask -TaskName '$nome'"
