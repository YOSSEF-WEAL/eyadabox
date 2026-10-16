[CmdletBinding()]
param(
  [switch]$StopRunningApp
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$executablePath = Join-Path $projectRoot "src-tauri\target\release\clinic_desk.exe"
$installerDirectory = Join-Path $projectRoot "src-tauri\target\release\bundle\nsis"

$runningApp = Get-CimInstance Win32_Process -Filter "Name = 'clinic_desk.exe'" |
  Where-Object { $_.ExecutablePath -eq $executablePath }

if ($runningApp) {
  if (-not $StopRunningApp) {
    Write-Error "Clinic Desk is open. Close it, or rerun: .\scripts\build-local.ps1 -StopRunningApp"
    exit 1
  }

  $runningApp | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  Start-Sleep -Milliseconds 500
}

Push-Location $projectRoot
try {
  # Local installers do not need an updater signature. Release builds use the normal command with TAURI_SIGNING_PRIVATE_KEY.
  $localBuildConfig = Join-Path $PSScriptRoot "tauri.local.conf.json"
  & npm.cmd run tauri -- build --config $localBuildConfig
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}

$installer = Get-ChildItem -LiteralPath $installerDirectory -Filter "*_x64-setup.exe" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $installer) {
  Write-Error "The build completed but no NSIS installer was found in $installerDirectory"
  exit 1
}

Write-Host "Local installer ready: $($installer.FullName)" -ForegroundColor Green
