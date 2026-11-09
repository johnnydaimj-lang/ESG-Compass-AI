$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (Get-Command py -ErrorAction SilentlyContinue) {
  py run_workflow.py
} else {
  python run_workflow.py
}
exit $LASTEXITCODE
