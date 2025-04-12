@echo off
setlocal enabledelayedexpansion

REM --- Настройки ---
REM Имя выходного файла
set OUTPUT_FILE=combined_js_code.txt
REM Имя файла библиотеки, который нужно ИСКЛЮЧИТЬ
set FILE_TO_EXCLUDE=phaser.esm.js
REM Директория, где лежит этот батник (корневая папка игры)
set ROOT_DIR=%~dp0
REM --- Конец настроек ---

REM Создаем/перезаписываем выходной файл с ТВОИМ первым заголовком
echo Это не код игр, а список всех файлов и их код. > "%ROOT_DIR%%OUTPUT_FILE%"
REM Добавляем остальную информацию заголовка с помощью >> (добавление в конец)
echo --- Combined JavaScript Code (excluding %FILE_TO_EXCLUDE%) --- >> "%ROOT_DIR%%OUTPUT_FILE%"
echo Generated on: %date% %time% >> "%ROOT_DIR%%OUTPUT_FILE%"
echo. >> "%ROOT_DIR%%OUTPUT_FILE%"

echo Starting code collection (excluding %FILE_TO_EXCLUDE%)...

REM Ищем все .js файлы рекурсивно с помощью 'dir /s /b' (выдает полные пути)
REM Фильтруем вывод с помощью 'findstr /V /I /L /C:"..."', чтобы ИСКЛЮЧИТЬ (/V) строку (/L),
REM содержащую (/C) имя файла библиотеки, без учета регистра (/I)
REM Обрабатываем каждую отфильтрованную строку (путь к файлу) с помощью 'for /F'
for /F "delims=" %%F in ('dir /s /b "%ROOT_DIR%*.js" ^| findstr /V /I /L /C:"%FILE_TO_EXCLUDE%"') do (
    echo Processing file: "%%F"

    REM Добавляем разделитель и имя файла в выходной файл
    echo; >> "%ROOT_DIR%%OUTPUT_FILE%"
    echo =============================================================================== >> "%ROOT_DIR%%OUTPUT_FILE%"
    echo === File: %%~nxF >> "%ROOT_DIR%%OUTPUT_FILE%"
    echo === Path: %%F >> "%ROOT_DIR%%OUTPUT_FILE%"
    echo =============================================================================== >> "%ROOT_DIR%%OUTPUT_FILE%"
    echo. >> "%ROOT_DIR%%OUTPUT_FILE%"

    REM Добавляем содержимое файла %%F в выходной файл
    type "%%F" >> "%ROOT_DIR%%OUTPUT_FILE%"

    REM Добавляем пустую строку после содержимого файла для лучшей читаемости
    echo. >> "%ROOT_DIR%%OUTPUT_FILE%"
    echo. >> "%ROOT_DIR%%OUTPUT_FILE%"
)

echo.
echo Code collection finished.
echo Result saved to: "%ROOT_DIR%%OUTPUT_FILE%"

endlocal
echo.
pause REM Уберите 'REM', если не хотите, чтобы окно закрывалось автоматически