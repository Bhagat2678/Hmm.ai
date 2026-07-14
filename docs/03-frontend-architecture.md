# Frontend Architecture

## Scope
React + Tailwind web app (PWA-capable for "any device" requirement). Owns query UI, document upload UI, knowledge graph visualization, and alerts dashboard.

## Tech Stack
- **Framework:** React (Vite for fast dev/build)
- **Styling:** Tailwind CSS
- **Graph visualization:** `react-force-graph` (or `vis-network` as alternative)
- **HTTP client:** fetch / axios
- **State:** React Query (TanStack Query) for server-state + polling — avoids need for WebSockets
- **PWA:** `vite-plugin-pwa` for installable/mobile-friendly demo

## Page/Route Structure
```
/                 → Dashboard (recent alerts, ingestion status summary)
/upload           → Document upload page
/documents        → Document list + status
/query            → Search/ask interface (main demo screen)
/graph            → Knowledge graph explorer
/alerts           → Failure-intelligence alerts list
```

## Key Components
| Component | Purpose |
|---|---|
| `UploadDropzone` | Drag-and-drop file upload → `POST /api/documents/upload` |
| `DocumentStatusList` | Polls `GET /api/documents`, shows ingestion progress badges |
| `QueryBox` + `AnswerCard` | Query input → `POST /api/query`, renders answer + cited source documents |
| `GraphExplorer` | `react-force-graph` view, fetches `GET /api/graph/neighborhood`, click-to-expand nodes |
| `AlertsFeed` | Polls `GET /api/alerts` every ~10s, shows severity-coded cards, acknowledge button |
| `AppShell` | Nav, responsive layout for "any device" requirement |

## API Integration Pattern (React Query + polling)
```jsx
// example: alerts polling
const { data: alerts } = useQuery({
  queryKey: ['alerts'],
  queryFn: () => fetch('/api/alerts').then(r => r.json()),
  refetchInterval: 10000, // poll every 10s — replaces need for WebSockets in MVP
});
```

## Graph Visualization Notes
- Color-code nodes by type (Equipment / Document / Incident / Person / RegulatoryRef).
- Click a node → side panel with details + "expand neighborhood" action → refetch with increased depth.
- This is the strongest visual demo moment — prioritize polish here once core query flow works.

## Query/Answer UI
- Show the synthesized answer, then a "Sources" section listing the specific documents/graph nodes the answer drew from (builds trust, and is a good judge talking point re: explainability).

## Responsive/Mobile Considerations
- Tailwind responsive classes throughout; test upload + query flows on a phone-width viewport specifically, since "any device" is explicitly in the challenge statement.

## Environment Variables
```
VITE_API_BASE_URL=
```

## Notes for Team
- Build the query flow and alerts feed first — they're the core demo path. Graph explorer and polish come after those work end-to-end against the real backend.
