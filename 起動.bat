@echo off
rem コアラ・ラボを手元で開く。この窓を閉じると止まります。
echo コアラ・ラボを起動しています... この黒い窓は開いたままにしてください（閉じると止まります）
start "" "http://localhost:8766/index.html"
python -m http.server 8766 -d "%~dp0."
pause
