#!/bin/bash
# ==============================================================================
# Mhmm.ai Native Development Startup Script (Default Non-Docker Workflow)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

log_info "Starting Mhmm.ai Platform Natively (No Docker Required)..."

# 1. Activate Python Virtual Environment
if [ -d ".venv" ]; then
    log_info "Activating Python virtual environment (.venv)..."
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
else
    log_warn ".venv not found. Running setup.sh..."
    bash scripts/setup.sh
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
fi

# 2. Verify environment files
if [ ! -f backend/.env ]; then
    if [ -f .env ]; then
        cp .env backend/.env
    fi
fi

# Cleanup child processes on exit
cleanup() {
    log_warn "\nShutting down Mhmm.ai native services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start FastAPI Backend Service
log_info "Launching FastAPI backend on http://localhost:8000..."
(
    cd backend
    export PYTHONPATH="${ROOT_DIR}:${ROOT_DIR}/backend:${PYTHONPATH}"
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

# Wait briefly for backend startup
sleep 3

# 4. Start React Frontend Service via Vite
log_info "Launching React Vite frontend on http://localhost:5173..."
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}🚀 Mhmm.ai Platform Running Natively!${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "📡 Backend API:         ${GREEN}http://localhost:8000${NC}"
echo -e "📖 API OpenAPI Docs:     ${GREEN}http://localhost:8000/docs${NC}"
echo -e "🎨 Frontend Workspace:   ${GREEN}http://localhost:5173${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "Press Ctrl+C to stop all services."

# Wait on background processes
wait
