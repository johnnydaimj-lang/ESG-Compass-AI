$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$principal = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$targets = @(
  (Join-Path $repoRoot ".env.local"),
  (Join-Path $repoRoot "data\.admin-session-secret"),
  (Join-Path $repoRoot "data\wechat\state")
)

foreach ($target in $targets) {
  $resolved = [System.IO.Path]::GetFullPath($target)
  if (-not $resolved.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify a path outside the workspace."
  }
  if (-not (Test-Path -LiteralPath $resolved)) { continue }

  $item = Get-Item -LiteralPath $resolved -Force
  $permission = if ($item.PSIsContainer) { "${principal}:(OI)(CI)F" } else { "${principal}:F" }
  & icacls.exe $resolved /inheritance:r /grant:r $permission | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to restrict access to local secrets."
  }
}

Write-Output "Local secret file permissions are restricted to the current Windows user."
