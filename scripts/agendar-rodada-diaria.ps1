# Cria (ou atualiza) no Agendador de Tarefas do Windows as duas rodadas da automação:
#   "Automacao LearningFlix - Rodada diaria"  — seg a qui, 09:03: suítes normais (só leitura), até 4 horas
#   "Automacao LearningFlix - Rodada semanal" — sexta, 09:03: suítes que alteram configuração, criam usuário
#                                                ou enviam e-mail, mais os testes @critico, até 8 horas
# Na sexta roda só a semanal: as duas no mesmo dia disputavam o ambiente — decisão da QA (13/11/2026)
# Rode uma vez, no PowerShell, a partir da pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File scripts\agendar-rodada-diaria.ps1
# As tarefas rodam com o seu usuário, quando você estiver conectado ao Windows, com a janela oculta
# (fechar a janela interrompia a rodada). Se o computador estiver desligado no horário, rodam assim que possível.
# Notebook suspenso ou hibernando: a tarefa o acorda, se estiver na tomada e com os temporizadores de ativação
# ligados. Rodada interrompida é tentada de novo 1 h e 2 h depois — o script não repete a rodada que já terminou.
# Para remover: Unregister-ScheduledTask -TaskName '<nome da tarefa>' -Confirm:$false

$script = Join-Path $PSScriptRoot 'rodada-diaria.ps1'
$projeto = Split-Path -Parent $PSScriptRoot

$diasDaDiaria = 'Monday', 'Tuesday', 'Wednesday', 'Thursday'
$rodadas = @(
  @{ Nome = 'Automacao LearningFlix - Rodada diaria'; Tipo = 'diaria'; Horas = 4
     Gatilhos = '09:03', '10:03', '11:03' | ForEach-Object { New-ScheduledTaskTrigger -Weekly -DaysOfWeek $diasDaDiaria -At $_ } },
  @{ Nome = 'Automacao LearningFlix - Rodada semanal'; Tipo = 'semanal'; Horas = 8
     Gatilhos = '09:03', '10:03', '11:03' | ForEach-Object { New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At $_ } }
)

foreach ($rodada in $rodadas) {
  $acao = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $projeto `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`" -Tipo $($rodada.Tipo)"
  $config = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours $rodada.Horas) `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -WakeToRun `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10)
  Register-ScheduledTask -TaskName $rodada.Nome -Action $acao -Trigger $rodada.Gatilhos -Settings $config `
    -Description "Roda npm run test:$($rodada.Tipo) e salva o relatório em relatorios" -Force | Out-Null
  Write-Host "Tarefa '$($rodada.Nome)' agendada."
}
Write-Host "Para rodar na hora: Start-ScheduledTask -TaskName '<nome da tarefa>'"
