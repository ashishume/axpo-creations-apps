#!/bin/bash
# =============================================================================
# Backend deploy script: build and run with Docker Compose in detached mode
# =============================================================================
# Usage:
#   ./deploy.sh              # from backend/
#   ./deploy.sh --pull       # pull latest images before up
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BLUE}🐳 Backend deploy (Docker Compose)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v docker &> /dev/null; then
  echo -e "${RED}✗ Docker is not installed or not in PATH.${NC}"
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo -e "${RED}✗ Docker Compose (v2) is not available. Run: docker compose version${NC}"
  exit 1
fi

echo -e "${BLUE}ℹ${NC} Building images..."
docker compose build --no-cache

if [ "${1:-}" = "--pull" ]; then
  echo -e "${BLUE}ℹ${NC} Pulling latest base images..."
  docker compose pull
fi

echo -e "${BLUE}ℹ${NC} Starting services in detached mode..."
docker compose up -d

echo ""
echo -e "${GREEN}✓${NC} Deploy complete. Services running in detached mode."
echo ""
echo "  Backend API:  http://localhost:8000"
echo "  API docs:     http://localhost:8000/docs"
echo "  Health:       http://localhost:8000/health"
echo ""
echo "  Billing DB:   localhost:5433"
echo "  Teaching DB:  localhost:5434"
echo ""
echo "  Commands:"
echo "    docker compose ps      # status"
echo "    docker compose logs -f # follow logs"
echo "    docker compose down    # stop and remove"
echo ""
