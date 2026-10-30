param(
  [ValidateSet("due", "prepare", "publish")]
  [string]$Stage = "due",
  [string]$IssueKey = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$logDirectory = Join-Path $repoRoot "data\wechat\logs"
$null = New-Item -ItemType Directory -Path $logDirectory -Force

$scriptName = switch ($Stage) {
  "prepare" { "wechat:prepare-due" }
  "publish" { "wechat:publish-due" }
  default { "wechat:run-due" }
}
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDirectory "$timestamp-$Stage.log"

function Protect-LogText {
  param([AllowNull()][object]$Value)

  $text = [string]$Value
  if ([string]::IsNullOrEmpty($text)) { return $text }

  $text = $text -replace '(?i)((?:access[_-]?token|app[_-]?secret|client[_-]?secret|cron[_-]?secret|callback[_-]?(?:token|aes[_-]?key)|api[_-]?key|password|passwd)\s*[:=]\s*)("[^"]*"|''[^'']*''|[^\s,;&}]+)', '$1[REDACTED]'
  $text = $text -replace '(?i)((?:app[_-]?id|media[_-]?id|publish[_-]?id|article[_-]?id)\s*[:=]\s*)("[^"]*"|''[^'']*''|[^\s,;&}]+)', '$1[REDACTED]'
  $text = $text -replace '(?i)\b(Bearer)\s+[A-Za-z0-9._~+/=-]+', '$1 [REDACTED]'
  return $text
}

$arguments = @("run", $scriptName)
if ($IssueKey) {
  $arguments += @("--", "--issue=$IssueKey")
}

Push-Location $repoRoot
try {
  "[$(Get-Date -Format o)] starting $scriptName" | Tee-Object -FilePath $logPath
  $output = & npm.cmd @arguments 2>&1
  $exitCode = $LASTEXITCODE
  $output | ForEach-Object { Protect-LogText $_ } | Tee-Object -FilePath $logPath -Append
  "[$(Get-Date -Format o)] exit code: $exitCode" | Tee-Object -FilePath $logPath -Append
  exit $exitCode
} catch {
  "[$(Get-Date -Format o)] failed: $(Protect-LogText $_.Exception.Message)" | Tee-Object -FilePath $logPath -Append
  exit 1
} finally {
  Pop-Location
}
