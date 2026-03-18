#!/bin/bash

# =============================================================================
# Backend Runner Script
# =============================================================================
# This script starts the FastAPI backend with proper environment configuration
# Usage:
#   ./run.sh           # Start in development mode (uses .env.local)
#   ./run.sh dev       # Start in development mode (uses .env.local)
#   ./run.sh prod      # Start in production mode (uses .env.production)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory (backend/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Use 'python' when venv is active (Windows/Linux/Mac), else 'python3'
if command -v python &> /dev/null && python -c "import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)" 2>/dev/null; then
    PYTHON=python
elif command -v python3 &> /dev/null; then
    PYTHON=python3
else
    PYTHON=python
fi

# Parse arguments
MODE="${1:-dev}"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if required files exist
check_env_files() {
    if [ "$MODE" = "prod" ]; then
        if [ -f ".env.production" ]; then
            print_success "Found .env.production"
        else
            print_warning ".env.production not found (optional on Render/Railway — use Environment variables)"
        fi
    else
        if [ ! -f ".env.local" ]; then
            print_warning ".env.local not found, will use .env if available"
            if [ ! -f ".env" ]; then
                print_error "No environment file found!"
                echo "  Create .env.local from .env.example:"
                echo "  cp .env.example .env.local"
                exit 1
            fi
        else
            print_success "Found .env.local"
        fi
    fi
}

# Function to check Python dependencies
check_dependencies() {
    if ! command -v $PYTHON &> /dev/null; then
        print_error "Python 3 is not installed!"
        exit 1
    fi

    if ! $PYTHON -c "import fastapi" 2>/dev/null; then
        print_warning "Dependencies not installed. Installing..."
        if [ -f "requirements.txt" ]; then
            $PYTHON -m pip install -r requirements.txt
            print_success "Dependencies installed"
        else
            print_error "requirements.txt not found!"
            exit 1
        fi
    fi
}

# Main execution
echo ""
echo "🚀 Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Set environment mode and load the right env file
if [ "$MODE" = "prod" ]; then
    export ENVIRONMENT=production
    print_info "Mode: ${GREEN}Production${NC}"
    print_info "Config: ${GREEN}.env.production${NC}"
    if [ -f ".env.production" ]; then
        set -a
        # shellcheck source=/dev/null
        . ./.env.production
        set +a
        print_success "Loaded .env.production"
    fi
else
    export ENVIRONMENT=development
    print_info "Mode: ${BLUE}Development${NC}"
    print_info "Config: ${BLUE}.env.local${NC}"
    if [ -f ".env.local" ]; then
        set -a
        # shellcheck source=/dev/null
        . ./.env.local
        set +a
        print_success "Loaded .env.local"
    fi
fi

echo ""

# Check requirements
print_info "Checking requirements..."
check_env_files
check_dependencies

echo ""
print_success "All checks passed!"
echo ""

# Detect LAN IP for external clients
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")

PORT=8000

# Start the server
if [ "$MODE" = "prod" ]; then
    print_info "Starting production server..."
else
    print_info "Starting development server with hot reload..."
fi

echo ""
echo -e "  ${BLUE}Local:${NC}    http://localhost:${PORT}"
echo -e "  ${BLUE}Network:${NC}  http://${LAN_IP}:${PORT}"
echo ""

if [ "$MODE" = "prod" ]; then
    exec $PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
else
    exec $PYTHON -m uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT
fi
