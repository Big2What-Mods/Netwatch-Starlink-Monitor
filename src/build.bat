@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 goto :failed

title NetWatch Windows Build
cls
echo NetWatch Windows Build
echo ======================
echo.
echo [1/4] Checking files and tools...
if not exist "package.json" (echo ERROR: package.json not found.& goto :failed)
if not exist "electron-builder.yml" (echo ERROR: electron-builder.yml not found.& goto :failed)
where npm.cmd >nul 2>&1
if errorlevel 1 (echo ERROR: npm.cmd not found. Install Node.js and retry.& goto :failed)
if not exist "node_modules\electron\package.json" (
  echo [INFO] npm dependencies are missing. Installing automatically...
  if exist "package-lock.json" (
    call npm.cmd ci
  ) else (
    call npm.cmd install
  )
  if errorlevel 1 (echo ERROR: npm dependency installation failed.& goto :failed)
  if not exist "node_modules\electron\package.json" (echo ERROR: Electron dependency still missing after installation.& goto :failed)
  echo [OK] npm dependencies installed.
)
for %%F in (icon.png icon.ico icon.svg) do (
  if not exist "build\%%F" (echo ERROR: Missing build\%%F& goto :failed)
)
echo [OK] Prerequisites present.
echo.
echo Close any running NetWatch app from the system tray before proceeding.
choice /C YC /N /M "Press Y to build, or C to cancel: "
if errorlevel 2 goto :cancel
echo.
echo [2/4] Building and packaging...
REM electron-builder may include build.bat from the project root.
REM Ensure that file exists even when this script is named build_fixed.bat.
if not exist "build.bat" (
  echo [INFO] Restoring expected build.bat in project root...
  copy /Y "%~f0" "build.bat" >nul
  if errorlevel 1 (echo ERROR: Unable to create build.bat.& goto :failed)
)
echo Build output will appear below as it happens.
echo This may take several minutes; pauses between output lines are normal.
echo --------------------------------------------------
call npm.cmd run pack:win
if errorlevel 1 goto :failed
echo --------------------------------------------------
echo [OK] Build command finished successfully.
echo.
echo [3/4] Checking packaged icon files...
if not exist "release\win-unpacked\resources\app.asar" (echo ERROR: Packaged app.asar missing.& goto :failed)
for %%F in (icon.png icon.ico icon.svg) do (
  if not exist "release\win-unpacked\resources\build\%%F" (echo ERROR: Missing packaged icon %%F& goto :failed)
)
echo [OK] All three icons are present.
echo.
echo [4/4] Finding installer...
set "INSTALLER_FOUND="
for %%F in ("release\*Setup*.exe") do (
  if exist "%%~fF" (
    echo [OK] %%~nxF
    set "INSTALLER_FOUND=YES"
  )
)
if not defined INSTALLER_FOUND (echo ERROR: Setup installer not found.& goto :failed)
echo.
echo BUILD SUCCESSFUL
echo Installer folder: %CD%\release
echo Please visually check the installed tray icon.
echo.
pause
exit /b 0

:cancel
echo.
echo Build canceled.
pause
exit /b 2

:failed
echo.
echo BUILD FAILED. See the error above.
pause
exit /b 1
