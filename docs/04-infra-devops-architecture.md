# Infra / DevOps Architecture

## Scope
Owns local dev environment (Docker Compose), deployment for the demo, environment/secrets management, and keeping the stack running smoothly for the whole team during the build.

## Tech Stack (all free)
- **Local orchestration:** Docker Compose
- **Relational + vector DB:** PostgreSQL with pgvector extension (Supabase free tier for hosted, or local container for dev)
- **Graph DB:** Neo4j AuraDB Free tier (hosted — no need to containerize)
- **Hosted demo:** Railway free tier or Render free tier (whichever has better free Postgres support at time of setup)
- **Frontend hosting:** Vercel or Netlify free tier (both trivial for a Vite/React app)

## docker-compose.yml (local dev skeleton)
```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

  postgres:
    image: ankane/pgvector:latest
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: knowledge_platform
    volumes:
      - pgdata:/var/lib/postgresql/data

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    env_file: .env
    depends_on:
      - backend

volumes:
  pgdata:
```
Note: Neo4j runs as a hosted AuraDB Free instance rather than a local container — one less thing to manage, and the team can share a single graph instance rather than syncing local graph state.

## Environment Setup Checklist (Day 1 priority)
1. Create shared Neo4j AuraDB Free instance — share URI/credentials with team via `.env.example`.
2. Create shared Supabase project (Postgres + pgvector) — same sharing approach.
3. Get Gemini API key (Google AI Studio, free tier) — shared or per-member depending on rate limits.
4. Get Groq API key (free) as backup LLM.
5. `docker compose up` full stack locally on day one to catch integration issues early — do not wait until day two.

## Deployment Plan for Demo
1. Backend + Postgres → Railway/Render free tier.
2. Frontend → Vercel/Netlify free tier, pointed at deployed backend URL.
3. Neo4j AuraDB Free — already hosted, just update connection string in deployed backend env.
4. Keep a local Docker Compose fallback running in case hosted demo has connectivity issues during judging.

## Secrets Management
- `.env` files per environment, never committed — `.env.example` checked into repo with empty values as a template.
- Shared secrets (API keys, DB credentials) distributed via a private channel (not git) to the team of four.

## CI (lightweight, optional if time allows)
- GitHub Actions: lint + basic test run on push. Skip if it eats into build time — not essential for a hackathon demo.

## Repo Structure
```
/backend      # FastAPI service (owned by Backend)
/frontend     # React app (owned by Frontend)
/ai_ml        # ingestion, extraction, graph, RAG, agents (owned by AI/ML)
/docs         # these architecture docs
docker-compose.yml
.env.example
README.md
```

## Notes for Team
- Smoke-test the full Compose stack together on day one — integration issues found early are cheap; found on demo day, expensive.
- Keep the local fallback ready regardless of hosted deployment status.
