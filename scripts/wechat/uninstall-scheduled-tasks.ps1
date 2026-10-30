param(
  [string]$TaskName = "ESG Compass - WeChat Weekly Publishing"
)

$ErrorActionPreference = "Stop"
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Output "Scheduled task not found: $TaskName"
  exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Output "Scheduled task removed: $TaskName"
