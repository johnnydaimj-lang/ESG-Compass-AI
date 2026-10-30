param(
  [switch]$SkipAdmin
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$envPath = Join-Path $repoRoot ".env.local"

function Read-RequiredSecret {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Prompt
  )

  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Read-ConfirmedSecret {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Prompt,
    [Parameter(Mandatory = $true)]
    [string]$ConfirmationPrompt
  )

  $first = Read-RequiredSecret -Prompt $Prompt
  $second = Read-RequiredSecret -Prompt $ConfirmationPrompt
  if (-not [string]::Equals($first, $second, [StringComparison]::Ordinal)) {
    throw "The two inputs do not match."
  }

  $second = $null
  return $first
}

function Assert-SafeEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "$Name cannot be empty."
  }
  if ($Value -match "[\r\n`"']") {
    throw "$Name contains unsupported quote or newline characters."
  }
}

Write-Output "This prompt is local-only. Inputs are masked and will not be written to logs."

$rawLines = if (Test-Path -LiteralPath $envPath -PathType Leaf) {
  @(Get-Content -LiteralPath $envPath)
}
else {
  @()
}

$existingValues = @{}
$legacyAppId = $null
$legacyAppSecret = $null
foreach ($line in $rawLines) {
  if ($line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$") {
    $existingValues[$matches[1]] = $matches[2].Trim('"', "'")
    continue
  }
  if ($line -match "^\s*[^:=]+?\s*(?::|\uFF1A)\s*(.+?)\s*$") {
    $legacyValue = $matches[1].Trim()
    if ($legacyValue -match "^wx[A-Za-z0-9]{16}$") {
      $legacyAppId = $legacyValue
    }
    elseif (
      $legacyValue -match "^[A-Za-z0-9]{16,128}$" -and
      $line -match "(?i)app\s*secret|secret|\u5f00\u53d1\u8005\u5bc6\u7801|\u5bc6\u94a5"
    ) {
      $legacyAppSecret = $legacyValue
    }
  }
}

$reusedLegacyAppId = $false
$appId = if ($existingValues.ContainsKey("WECHAT_APP_ID") -and $existingValues["WECHAT_APP_ID"]) {
  $existingValues["WECHAT_APP_ID"]
}
elseif ($legacyAppId) {
  $reusedLegacyAppId = $true
  $legacyAppId
}
else {
  Read-ConfirmedSecret "Enter the WeChat AppID" "Enter the WeChat AppID again"
}
if ($reusedLegacyAppId) {
  Write-Output "Reusing the locally saved AppID from the malformed line."
}
if ($appId -notmatch "^wx[A-Za-z0-9]{16}$") {
  throw "The WeChat AppID format is invalid."
}

$reusedLegacyAppSecret = $false
$appSecret = if ($existingValues.ContainsKey("WECHAT_APP_SECRET") -and $existingValues["WECHAT_APP_SECRET"]) {
  $existingValues["WECHAT_APP_SECRET"]
}
elseif ($legacyAppSecret) {
  $reusedLegacyAppSecret = $true
  $legacyAppSecret
}
else {
  Read-ConfirmedSecret "Enter the NEW WeChat AppSecret" "Enter the NEW WeChat AppSecret again"
}
if ($reusedLegacyAppSecret) {
  Write-Output "Reusing the locally saved AppSecret from the malformed line."
}
if ($appSecret -notmatch "^[A-Za-z0-9]{16,128}$") {
  throw "The WeChat AppSecret format is invalid."
}

$updates = [ordered]@{
  WECHAT_APP_ID = $appId
  WECHAT_APP_SECRET = $appSecret
  WECHAT_PUBLISH_MODE = "dry_run"
}

$adminPassword = $null
if (-not $SkipAdmin) {
  $adminPassword = Read-ConfirmedSecret "Enter a new admin password (at least 16 characters)" "Enter the admin password again"
  if ($adminPassword.Length -lt 16) {
    throw "The admin password must contain at least 16 characters."
  }
  Assert-SafeEnvValue -Name "Admin password" -Value $adminPassword
  $updates["ADMIN_PASSWORD"] = $adminPassword
}

$lines = [System.Collections.Generic.List[string]]::new()
$removedMalformedLines = 0
foreach ($line in $rawLines) {
  if (
    [string]::IsNullOrWhiteSpace($line) -or
    $line -match "^\s*#" -or
    $line -match "^\s*[A-Za-z_][A-Za-z0-9_]*\s*="
  ) {
    $lines.Add($line)
  }
  else {
    $removedMalformedLines++
  }
}

$pending = [System.Collections.Generic.HashSet[string]]::new(
  [string[]]$updates.Keys,
  [System.StringComparer]::Ordinal
)

for ($index = 0; $index -lt $lines.Count; $index++) {
  if ($lines[$index] -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=") {
    $key = $matches[1]
    if ($updates.Contains($key)) {
      $lines[$index] = "$key=$($updates[$key])"
      $null = $pending.Remove($key)
    }
  }
}

foreach ($key in $updates.Keys) {
  if ($pending.Contains($key)) {
    if ($lines.Count -gt 0 -and $lines[-1] -ne "") {
      $lines.Add("")
    }
    $lines.Add("$key=$($updates[$key])")
  }
}

$tempPath = Join-Path $repoRoot ".env.local.tmp-$([Guid]::NewGuid().ToString('N'))"
try {
  [System.IO.File]::WriteAllLines($tempPath, $lines, [System.Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $tempPath -Destination $envPath -Force
}
finally {
  if (Test-Path -LiteralPath $tempPath) {
    Remove-Item -LiteralPath $tempPath -Force
  }
}

& (Join-Path $PSScriptRoot "protect-local-secrets.ps1")

$adminPassword = $null
$appSecret = $null
$appId = $null

if ($removedMalformedLines -gt 0) {
  Write-Output "Removed $removedMalformedLines malformed line(s) that the application cannot load."
}
if ($adminPassword) {
  Write-Output "WeChat credentials, admin password, and dry-run mode were saved locally."
}
else {
  Write-Output "WeChat credentials and dry-run mode were saved locally. Admin password was skipped."
}
