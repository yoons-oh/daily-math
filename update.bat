@echo off
chcp 65001 >nul
echo.
echo  =============================================
echo   매일수학 앱 - 자동 업데이트
echo  =============================================
echo.

set TARGET=C:\AI kg\daily-math
set ZIP=%~dp0daily-math.zip
set TEMP_DIR=%~dp0_update_temp

echo  [1/4] 임시 폴더 생성 중...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo  [2/4] ZIP 압축 해제 중...
powershell -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%TEMP_DIR%' -Force"
if %errorlevel% neq 0 (
  echo  [오류] ZIP 파일을 찾을 수 없어요. daily-math.zip 을 이 파일과 같은 폴더에 넣어주세요.
  pause
  exit /b 1
)

echo  [3/4] 파일 복사 중... (node_modules 제외)
robocopy "%TEMP_DIR%\daily-math" "%TARGET%" /E /XD node_modules /XD .git /NFL /NDL /NJH /NJS

echo  [4/4] 임시 폴더 정리 중...
rmdir /s /q "%TEMP_DIR%"

echo.
echo  =============================================
echo   업데이트 완료!
echo   브라우저에서 저장하면 자동 반영돼요.
echo   (npm run dev 가 실행 중인 경우)
echo  =============================================
echo.
pause
