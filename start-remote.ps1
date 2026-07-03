param(
  [int]$Port = 4173
)

$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $project

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
  throw 'ngrok이 설치되어 있지 않습니다.'
}

if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
  throw 'Node.js와 npx가 설치되어 있지 않습니다.'
}

& ngrok config check *> $null
if ($LASTEXITCODE -ne 0) {
  throw 'ngrok 인증 설정이 없습니다. 먼저 ngrok config add-authtoken <토큰>을 실행하세요.'
}

$server = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "npx.cmd --yes serve . -l $Port" -WorkingDirectory $project -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3

try {
  $response = Invoke-WebRequest "http://127.0.0.1:$Port" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -ne 200) { throw "로컬 서버 응답: $($response.StatusCode)" }
} catch {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  throw
}

Write-Host "로컬 서버: http://localhost:$Port"
Write-Host 'ngrok 터널을 시작합니다. 표시되는 Forwarding HTTPS 주소를 휴대폰에서 여세요.'
ngrok http $Port
