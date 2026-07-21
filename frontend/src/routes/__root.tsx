import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/contexts/AuthContext";
import { Home } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-lg text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-10 select-none text-[10rem] font-black leading-none tracking-tighter text-primary/10"
        >
          404
        </div>
        <div className="relative rounded-2xl border border-border bg-card/60 p-10 backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Signal lost
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The route you requested is offline or has been decommissioned. Return
            to the dashboard to resume operations.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Home className="h-4 w-4" aria-hidden />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 text-center backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive">
          Runtime fault
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Something interrupted this view
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The interface hit an unexpected error. Try again, or return to the
          dashboard to continue.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mhmm.ai — Industrial Knowledge Intelligence" },
      {
        name: "description",
        content:
          "Query, visualize, and monitor industrial equipment intelligence. Mhmm.ai unifies documents, knowledge graphs, and predictive alerts for operators and engineers.",
      },
      { name: "author", content: "Mhmm.ai" },
      { name: "theme-color", content: "#0f172a" },
      { property: "og:title", content: "Mhmm.ai — Industrial Knowledge Intelligence" },
      {
        property: "og:description",
        content:
          "Unified knowledge intelligence for industrial operations: documents, graph exploration, and predictive alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mhmm.ai — Industrial Knowledge Intelligence" },
      {
        name: "twitter:description",
        content:
          "Unified knowledge intelligence for industrial operations: documents, graph exploration, and predictive alerts.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isLoginPage ? <Outlet /> : <AppShell />}
      </AuthProvider>
    </QueryClientProvider>
  );
}

// AppShell renders <Outlet /> internally so nested routes render.
export { Outlet };
