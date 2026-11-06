$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$ProgressPreference = "SilentlyContinue"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$port = 3001
$stdoutLog = Join-Path $repoRoot "local-server.stdout.log"
$stderrLog = Join-Path $repoRoot "local-server.stderr.log"
$buildLog = Join-Path $repoRoot "local-server.build.log"
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

Set-Location $repoRoot
$env:NEXT_TELEMETRY_DISABLED = "1"
$sessionSecretFile = Join-Path $repoRoot "data\.admin-session-secret"
if (-not $env:ADMIN_SESSION_SECRET -and (Test-Path -LiteralPath $sessionSecretFile)) {
  $savedSecret = (Get-Content -LiteralPath $sessionSecretFile -Raw).Trim()
  if ($savedSecret) { $env:ADMIN_SESSION_SECRET = $savedSecret }
}

function Test-LocalPort {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $result = $client.BeginConnect("127.0.0.1", $port, $null, $null)
    if (-not $result.AsyncWaitHandle.WaitOne(1000)) { return $false }
    $client.EndConnect($result)
    return $true
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

if (-not (Test-Path (Join-Path $repoRoot ".next\BUILD_ID"))) {
  & $npm run build *>> $buildLog
  if ($LASTEXITCODE -ne 0) { throw "Production build failed. See $buildLog" }
}

while ($true) {
  if (-not (Test-LocalPort)) {
    $process = Start-Process -FilePath $npm `
      -ArgumentList @("run", "start", "--", "--port", "$port") `
      -WorkingDirectory $repoRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog `
      -PassThru

    for ($attempt = 0; $attempt -lt 45; $attempt += 1) {
      if (Test-LocalPort) { break }
      Start-Sleep -Seconds 1
    }

    if (-not (Test-LocalPort)) {
      if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
      Start-Sleep -Seconds 5
    }
  }
  Start-Sleep -Seconds 15
}
