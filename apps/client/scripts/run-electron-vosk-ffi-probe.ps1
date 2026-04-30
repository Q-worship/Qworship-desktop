$roots = @(
  'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop',
  'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\apps\client'
)

$candidates = @(
  'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\node_modules\electron\dist\electron.exe',
  'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\apps\client\node_modules\electron\dist\electron.exe'
)

foreach ($root in $roots) {
  if (Test-Path $root) {
    $found = Get-ChildItem -Path $root -Recurse -Filter electron.exe -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match '\\node_modules(\\.pnpm\\[^\\]+\\node_modules)?\\electron\\dist\\electron\.exe$' } |
      Select-Object -ExpandProperty FullName -First 5
    if ($found) {
      $candidates += $found
    }
  }
}

$electron = $candidates | Where-Object { Test-Path $_ } | Select-Object -Unique -First 1
if ([string]::IsNullOrWhiteSpace($electron)) {
  throw 'electron.exe not found'
}

$scriptPath = 'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\apps\client\scripts\probe-vosk-ffi-load.cjs'
Write-Host "ELECTRON_EXE=$electron"
& $electron $scriptPath
