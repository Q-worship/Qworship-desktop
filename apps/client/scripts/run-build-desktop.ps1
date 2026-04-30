Set-Location 'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\apps\client'
$corepack = 'C:\Users\viann\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.15.0-win-x64\corepack.cmd'
if (-not (Test-Path $corepack)) {
  throw "corepack.cmd not found at $corepack"
}
& $corepack pnpm build:desktop
