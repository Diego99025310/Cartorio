@echo off
SETLOCAL

REM Garante que os comandos sejam executados na pasta do projeto
cd /d "%~dp0"

IF NOT EXIST node_modules (
  echo Instalando dependencias...
  npm install
  IF ERRORLEVEL 1 (
    echo.
    echo [ERRO] Nao foi possivel instalar as dependencias. Verifique as mensagens acima.
    exit /b 1
  )
)

echo Iniciando servidor na porta 5000...
node app.js
ENDLOCAL
