@echo off
echo ====================================
echo    Dashboard Lomarosa - Servidor
echo ====================================
echo.
echo Iniciando servidor local...
echo.
echo IMPORTANTE: NO cierres esta ventana
echo El dashboard estara disponible en:
echo.
echo    http://localhost:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo ====================================
echo.

python -m http.server 8000

pause
