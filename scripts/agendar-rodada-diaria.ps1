# Cria (ou atualiza) no Agendador de Tarefas do Windows as duas rodadas da automação:
#   "Automacao LearningFlix - Rodada diaria"  — seg a sex, 09:03: suítes normais (só leitura), até 4 horas
#   "Automacao LearningFlix - Rodada semanal" — sexta, 12:00: suítes que alteram configuração, criam usuário
#                                                ou enviam e-mail, até 8 horas
# Rode uma vez, no PowerShell, a partir da pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File scripts\agendar-rodada-diaria.ps1
# As tarefas rodam com o seu usuário, quando você estiver conectado ao Windows, com a janela oculta
# (fechar a janela interrompia a rodada). Se o computador estiver desligado no horário, rodam assim que possível.
# Para remover: Unregister-ScheduledTask -TaskName '<nome da tarefa>' -Confirm:$false

$script = Join-Path $PSScriptRoot 'rodada-diaria.ps1'
$projeto = Split-Path -Parent $PSScriptRoot

$rodadas = @(
  @{ Nome = 'Automacao LearningFlix - Rodada diaria'; Tipo = 'diaria'; Horas = 4
     Gatilho = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday -At '09:03' },
  @{ Nome = 'Automacao LearningFlix - Rodada semanal'; Tipo = 'semanal'; Horas = 8
     Gatilho = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At '12:00' }
)

foreach ($rodada in $rodadas) {
  $acao = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $projeto `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`" -Tipo $($rodada.Tipo)"
  $config = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours $rodada.Horas) `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
  Register-ScheduledTask -TaskName $rodada.Nome -Action $acao -Trigger $rodada.Gatilho -Settings $config `
    -Description "Roda npm run test:$($rodada.Tipo) e salva o relatório em relatorios" -Force | Out-Null
  Write-Host "Tarefa '$($rodada.Nome)' agendada."
}
Write-Host "Para rodar na hora: Start-ScheduledTask -TaskName '<nome da tarefa>'"
