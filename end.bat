@echo off
echo Stopping Iris v3 Telemedicine System...

echo Stopping Next.js Frontend...
taskkill /FI "WindowTitle eq Iris Next.js*" /T /F > NUL 2>&1
call npx -y kill-port 3000 > NUL 2>&1

echo Stopping Python STT Agent...
taskkill /FI "WindowTitle eq Iris Python Agent*" /T /F > NUL 2>&1
taskkill /IM python.exe /F > NUL 2>&1

echo All Iris services stopped!
