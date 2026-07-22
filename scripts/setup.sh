#!/bin/bash
# ==============================================================================
# Bedrock Developer Setup Script (Native Workflow Default)
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

log_info "Setting up Bedrock Native Development Environment..."

# 1. Environment files setup
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        log_info "Creating root .env from .env.example..."
        cp .env.example .env
    else
        log_warn ".env.example not found; skipping root .env creation."
    fi
else
    log_info "Root .env file already exists."
fi

if [ ! -f backend/.env ]; then
    if [ -f .env.example ]; then
        log_info "Creating backend/.env from .env.example..."
        cp .env.example backend/.env
    fi
else
    log_info "Backend backend/.env file already exists."
fi

# 2. Python virtual environment setup
if [ ! -d ".venv" ]; then
    log_info "Creating Python virtual environment in .venv..."
    python3 -m venv .venv
else
    log_info "Python virtual environment (.venv) already exists."
fi

log_info "Activating Python virtual environment..."
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null

log_info "Upgrading pip..."
pip install --upgrade pip --quiet

if [ -f "backend/requirements.txt" ]; then
    log_info "Installing backend requirements..."
    pip install -r backend/requirements.txt --quiet
fi

if [ -f "ai_ml/requirements.txt" ]; then
    log_info "Installing ai_ml requirements..."
    pip install -r ai_ml/requirements.txt --quiet
fi

# 3. Frontend npm setup
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    log_info "Installing Frontend npm dependencies..."
    (cd frontend && npm install --quiet)
else
    log_warn "Frontend package.json not found; skipping npm install."
fi

# 4. Runtime Health & Environment Verification
log_info "Running Service Connectivity & Environment Verifications..."

python3 - << 'EOF'
import os, sys

def check_env():
    # Load backend/.env if present
    env_path = 'backend/.env' if os.path.exists('backend/.env') else '.env'
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    k, v = line.strip().split('=', 1)
                    os.environ.setdefault(k, v)

    print("\n--- Service & Cloud Connectivity Health Check ---")

    # 1. Supabase / PostgreSQL DB
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        try:
            import psycopg2
            conn = psycopg2.connect(db_url, connect_timeout=5)
            conn.close()
            print("✅ Supabase / PostgreSQL Connection: SUCCESSFUL")
        except Exception as e:
            print(f"⚠️  Database Connection Warning: {e}")
    else:
        print("⚠️  DATABASE_URL not set in environment")

    # 2. Neo4j AuraDB Connection
    neo4j_uri = os.environ.get("NEO4J_URI")
    neo4j_pwd = os.environ.get("NEO4J_PASSWORD")
    if neo4j_uri and neo4j_pwd:
        try:
            from neo4j import GraphDatabase
            driver = GraphDatabase.driver(neo4j_uri, auth=("neo4j", neo4j_pwd), connection_timeout=5.0)
            driver.verify_connectivity()
            driver.close()
            print("✅ Neo4j AuraDB Connection: SUCCESSFUL")
        except Exception as e:
            print(f"⚠️  Neo4j Connection Warning (NetworkX memory graph active fallback): {e}")
    else:
        print("ℹ️  Neo4j credentials not configured (Using NetworkX memory graph)")

    # 3. Gemini 2.5 Flash API
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            res = client.models.generate_content(model="gemini-2.5-flash", contents="Test probe")
            if res and res.text:
                print("✅ Gemini 2.5 Flash API: SUCCESSFUL")
        except Exception as e:
            print(f"⚠️  Gemini API Warning: {e}")
    else:
        print("⚠️  GEMINI_API_KEY not set")

    # 4. Groq Fallback API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            import urllib.request, json
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps({"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "hi"}]}).encode(),
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    print("✅ Groq Fallback API: SUCCESSFUL")
        except Exception as e:
            print(f"⚠️  Groq API Warning: {e}")
    else:
        print("ℹ️  GROQ_API_KEY not configured")

    print("------------------------------------------------\n")

check_env()
EOF

log_info "----------------------------------------------------"
log_info "✅ Setup Complete! To start the platform natively, run:"
log_info "   bash scripts/start-dev.sh"
log_info "----------------------------------------------------"
