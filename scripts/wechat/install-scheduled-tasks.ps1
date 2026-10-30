param(
  [string]$TaskName = "ESG Compass - WeChat Weekly Publishing"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $PSScriptRoot "run-scheduled.ps1"
$windowsPowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "npm.cmd is not available on PATH. Install Node.js before creating the task."
}
if (-not (Test-Path -LiteralPath $windowsPowerShell)) {
  throw "Windows PowerShell was not found at $windowsPowerShell"
}

$actionArguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`" -Stage due"
$action = New-ScheduledTaskAction -Execute $windowsPowerShell -Argument $actionArguments

# Re-check throughout the publication window. Every operation is idempotent:
# prepareDue creates at most one draft and publishDue never repeats a publish_id.
$times = @("07:45", "08:00", "08:10", "08:20", "08:30")
$triggers = foreach ($time in $times) {
  $parts = $time.Split(":")
  $at = [datetime]::Today.AddHours([int]$parts[0]).AddMinutes([int]$parts[1])
  New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At $at
}

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $triggers `
  -Settings $settings `
  -Principal $principal `
  -Description "Prepare and publish ESG Compass weekly WeChat articles during the Monday 07:45-08:30 publication window." `
  -Force | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName
[pscustomobject]@{
  taskName = $task.TaskName
  state = [string]$task.State
  nextRunTime = $info.NextRunTime
  runAs = $identity
  runner = $runner
  schedule = ($times -join ", ") + " every Monday"
} | ConvertTo-Json
