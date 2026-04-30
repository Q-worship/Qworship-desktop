$repoRoot = "C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop"
$clientRoot = Join-Path $repoRoot "apps\client"
$electronExe = Join-Path $repoRoot "node_modules\.pnpm\electron@28.3.3\node_modules\electron\dist\electron.exe"
$scriptPath = Join-Path $clientRoot "scripts\check-vosk-electron-runtime.cjs"

if (!(Test-Path $electronExe)) {
  throw "Electron executable not found at $electronExe"
}
if (!(Test-Path $scriptPath)) {
  throw "Diagnostic script not found at $scriptPath"
}

Set-Location $clientRoot
& $electronExe $scriptPath
exit $LASTEXITCODE
