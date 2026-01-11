#!/bin/bash
# DevHub Docker Helper Script

set -e

COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    echo -e "${BLUE}DevHub Docker Helper${NC}"
    echo ""
    echo "Usage: ./docker.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev           - Start development environment (frontend + backend)"
    echo "  prod          - Start production environment (all-in-one)"
    echo "  build         - Build all Docker images"
    echo "  rebuild       - Rebuild all images from scratch"
    echo "  stop          - Stop all services"
    echo "  restart       - Restart all services"
    echo "  logs          - View logs (follow mode)"
    echo "  logs-backend  - View backend logs only"
    echo "  logs-frontend - View frontend logs only"
    echo "  shell-backend - Enter backend container shell"
    echo "  shell-frontend- Enter frontend container shell"
    echo "  health        - Check service health status"
    echo "  clean         - Stop and remove all containers, volumes, and networks"
    echo "  db-backup     - Backup the database"
    echo "  db-restore    - Restore database from backup"
    echo "  help          - Show this help message"
    echo ""
}

check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Warning: .env file not found${NC}"
        echo "Creating .env from .env.docker template..."
        cp .env.docker .env
        echo -e "${GREEN}Created .env file. Please edit it with your credentials.${NC}"
        exit 1
    fi
}

dev() {
    check_env
    echo -e "${GREEN}Starting development environment...${NC}"
    docker-compose -f "$COMPOSE_FILE" up -d
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    echo "Access:"
    echo "  Frontend: http://localhost:4173"
    echo "  Backend:  http://localhost:4000"
    echo ""
    echo "Run './docker.sh logs' to view logs"
}

prod() {
    check_env
    echo -e "${GREEN}Starting production environment...${NC}"
    docker-compose -f "$PROD_COMPOSE_FILE" up -d
    echo -e "${GREEN}✓ Production service started${NC}"
    echo ""
    echo "Access: http://localhost:4000"
    echo ""
    echo "Run './docker.sh logs' to view logs"
}

build() {
    check_env
    echo -e "${GREEN}Building Docker images...${NC}"
    docker-compose -f "$COMPOSE_FILE" build
    echo -e "${GREEN}✓ Build complete${NC}"
}

rebuild() {
    check_env
    echo -e "${GREEN}Rebuilding Docker images from scratch...${NC}"
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    echo -e "${GREEN}✓ Rebuild complete${NC}"
}

stop() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    docker-compose -f "$PROD_COMPOSE_FILE" down 2>/dev/null || true
    echo -e "${GREEN}✓ Services stopped${NC}"
}

restart() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose -f "$COMPOSE_FILE" restart
    echo -e "${GREEN}✓ Services restarted${NC}"
}

logs() {
    docker-compose -f "$COMPOSE_FILE" logs -f
}

logs_backend() {
    docker-compose -f "$COMPOSE_FILE" logs -f backend
}

logs_frontend() {
    docker-compose -f "$COMPOSE_FILE" logs -f frontend
}

shell_backend() {
    echo -e "${BLUE}Entering backend container...${NC}"
    docker exec -it devhub-backend sh
}

shell_frontend() {
    echo -e "${BLUE}Entering frontend container...${NC}"
    docker exec -it devhub-frontend sh
}

health() {
    echo -e "${BLUE}Checking service health...${NC}"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Backend health:"
    docker inspect devhub-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "Not running"
    echo ""
    echo "Frontend health:"
    docker inspect devhub-frontend --format='{{.State.Health.Status}}' 2>/dev/null || echo "Not running"
}

clean() {
    echo -e "${RED}This will remove all containers, volumes, and networks.${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning up...${NC}"
        docker-compose -f "$COMPOSE_FILE" down -v
        docker-compose -f "$PROD_COMPOSE_FILE" down -v
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    fi
}

db_backup() {
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).db"
    echo -e "${GREEN}Backing up database to $BACKUP_FILE...${NC}"
    docker cp devhub-backend:/app/server/data/dev.db "./$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup saved to $BACKUP_FILE${NC}"
}

db_restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Please specify backup file${NC}"
        echo "Usage: ./docker.sh db-restore <backup-file>"
        exit 1
    fi
    
    echo -e "${YELLOW}Restoring database from $1...${NC}"
    docker cp "$1" devhub-backend:/app/server/data/dev.db
    docker-compose restart backend
    echo -e "${GREEN}✓ Database restored${NC}"
}

# Main command handler
case "$1" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    build)
        build
        ;;
    rebuild)
        rebuild
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    logs-backend)
        logs_backend
        ;;
    logs-frontend)
        logs_frontend
        ;;
    shell-backend)
        shell_backend
        ;;
    shell-frontend)
        shell_frontend
        ;;
    health)
        health
        ;;
    clean)
        clean
        ;;
    db-backup)
        db_backup
        ;;
    db-restore)
        db_restore "$2"
        ;;
    help|--help|-h|"")
        print_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        echo ""
        print_help
        exit 1
        ;;
esac
