param(
  [ValidateSet("start", "install", "status")]
  [string]$Action = "start"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$taskName = "ESG-Compass-Local"
$daemon = (Resolve-Path (Join-Path $PSScriptRoot "local-server-daemon.ps1")).Path
$port = 3001
$url = "http://localhost:$port"

function Test-Server {
  try {
    $response = Invoke-WebRequest -Uri "$url/login" -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Test-AuthenticatedHome {
  try {
    $passwordLine = Get-Content (Join-Path $PSScriptRoot "..\.env.local") |
      Where-Object { $_ -match "^ADMIN_PASSWORD=" } |
      Select-Object -First 1
    if (-not $passwordLine) { return $false }
    $password = $passwordLine.Substring($passwordLine.IndexOf("=") + 1).Trim()
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $login = Invoke-WebRequest `
      -Uri "$url/api/login" `
      -Method Post `
      -ContentType "application/json" `
      -Body (@{ password = $password } | ConvertTo-Json) `
      -WebSession $session `
      -UseBasicParsing `
      -TimeoutSec 10
    if ($login.StatusCode -ne 200) { return $false }
    $dashboard = Invoke-WebRequest -Uri "$url/" -WebSession $session -UseBasicParsing -TimeoutSec 15
    return $dashboard.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Install-Task {
  $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  $taskAction = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$daemon`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1)
  Register-ScheduledTask `
    -TaskName $taskName `
    -Action $taskAction `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Force | Out-Null
}

if ($Action -eq "install") {
  Install-Task
  Write-Output "Installed scheduled task: $taskName"
  exit 0
}

if ($Action -eq "status") {
  [pscustomobject]@{
    url = $url
    healthy = (Test-Server)
    authenticated = (Test-AuthenticatedHome)
  } | ConvertTo-Json
  exit 0
}

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $task) { Install-Task }

if (-not (Test-Server)) {
  Start-ScheduledTask -TaskName $taskName
}

for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
  if (Test-Server) {
    if (Test-AuthenticatedHome) {
      Write-Output "ESG Compass is running: $url"
      exit 0
    }
  }
  Start-Sleep -Seconds 1
}

$stderr = Join-Path $PSScriptRoot "..\local-server.stderr.log"
if (Test-Path $stderr) { Get-Content $stderr -Tail 40 }
throw "ESG Compass failed to become healthy at $url"
