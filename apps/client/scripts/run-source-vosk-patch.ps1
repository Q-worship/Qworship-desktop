Set-Location 'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\apps\client'
$node = 'C:\Users\viann\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.15.0-win-x64\node.exe'
& $node 'scripts\patch-vosk-electron-runtime.cjs'
exit $LASTEXITCODE
