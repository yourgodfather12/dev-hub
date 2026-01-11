@echo off
REM DevHub Docker Helper Script for Windows

setlocal enabledelayedexpansion

set COMPOSE_FILE=docker-compose.yml
set PROD_COMPOSE_FILE=docker-compose.prod.yml

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="--help" goto help
if "%1"=="-h" goto help

if "%1"=="dev" goto dev
if "%1"=="prod" goto prod
if "%1"=="build" goto build
if "%1"=="rebuild" goto rebuild
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="logs-backend" goto logs_backend
if "%1"=="logs-frontend" goto logs_frontend
if "%1"=="shell-backend" goto shell_backend
if "%1"=="shell-frontend" goto shell_frontend
if "%1"=="health" goto health
if "%1"=="clean" goto clean
if "%1"=="db-backup" goto db_backup
if "%1"=="db-restore" goto db_restore

echo Error: Unknown command '%1'
echo.
goto help

:help
echo DevHub Docker Helper
echo.
echo Usage: docker.bat [COMMAND]
echo.
echo Commands:
echo   dev            - Start development environment (frontend + backend)
echo   prod           - Start production environment (all-in-one)
echo   build          - Build all Docker images
echo   rebuild        - Rebuild all images from scratch
echo   stop           - Stop all services
echo   restart        - Restart all services
echo   logs           - View logs (follow mode)
echo   logs-backend   - View backend logs only
echo   logs-frontend  - View frontend logs only
echo   shell-backend  - Enter backend container shell
echo   shell-frontend - Enter frontend container shell
echo   health         - Check service health status
echo   clean          - Stop and remove all containers, volumes, and networks
echo   db-backup      - Backup the database
echo   db-restore     - Restore database from backup
echo   help           - Show this help message
echo.
goto end

:check_env
if not exist .env (
    echo Warning: .env file not found
    echo Creating .env from .env.docker template...
    copy .env.docker .env
    echo Created .env file. Please edit it with your credentials.
    exit /b 1
)
exit /b 0

:dev
call :check_env
if errorlevel 1 goto end
echo Starting development environment...
docker-compose -f %COMPOSE_FILE% up -d
echo.
echo Services started
echo.
echo Access:
echo   Frontend: http://localhost:4173
echo   Backend:  http://localhost:4000
echo.
echo Run 'docker.bat logs' to view logs
goto end

:prod
call :check_env
if errorlevel 1 goto end
echo Starting production environment...
docker-compose -f %PROD_COMPOSE_FILE% up -d
echo.
echo Production service started
echo.
echo Access: http://localhost:4000
echo.
echo Run 'docker.bat logs' to view logs
goto end

:build
call :check_env
if errorlevel 1 goto end
echo Building Docker images...
docker-compose -f %COMPOSE_FILE% build
echo Build complete
goto end

:rebuild
call :check_env
if errorlevel 1 goto end
echo Rebuilding Docker images from scratch...
docker-compose -f %COMPOSE_FILE% build --no-cache
echo Rebuild complete
goto end

:stop
echo Stopping services...
docker-compose -f %COMPOSE_FILE% down 2>nul
docker-compose -f %PROD_COMPOSE_FILE% down 2>nul
echo Services stopped
goto end

:restart
echo Restarting services...
docker-compose -f %COMPOSE_FILE% restart
echo Services restarted
goto end

:logs
docker-compose -f %COMPOSE_FILE% logs -f
goto end

:logs_backend
docker-compose -f %COMPOSE_FILE% logs -f backend
goto end

:logs_frontend
docker-compose -f %COMPOSE_FILE% logs -f frontend
goto end

:shell_backend
echo Entering backend container...
docker exec -it devhub-backend sh
goto end

:shell_frontend
echo Entering frontend container...
docker exec -it devhub-frontend sh
goto end

:health
echo Checking service health...
echo.
docker-compose -f %COMPOSE_FILE% ps
echo.
echo Backend health:
docker inspect devhub-backend --format="{{.State.Health.Status}}" 2>nul || echo Not running
echo.
echo Frontend health:
docker inspect devhub-frontend --format="{{.State.Health.Status}}" 2>nul || echo Not running
goto end

:clean
echo WARNING: This will remove all containers, volumes, and networks.
set /p CONFIRM="Are you sure? (y/N): "
if /i "%CONFIRM%"=="y" (
    echo Cleaning up...
    docker-compose -f %COMPOSE_FILE% down -v
    docker-compose -f %PROD_COMPOSE_FILE% down -v
    echo Cleanup complete
) else (
    echo Cancelled
)
goto end

:db_backup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=backup-%mydate%-%mytime%.db
echo Backing up database to %BACKUP_FILE%...
docker cp devhub-backend:/app/server/data/dev.db %BACKUP_FILE%
echo Backup saved to %BACKUP_FILE%
goto end

:db_restore
if "%2"=="" (
    echo Error: Please specify backup file
    echo Usage: docker.bat db-restore ^<backup-file^>
    goto end
)
echo Restoring database from %2...
docker cp %2 devhub-backend:/app/server/data/dev.db
docker-compose restart backend
echo Database restored
goto end

:end
endlocal
