import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, User, Loader2, Sparkles, Shield, ArrowRight } from "lucide-react";
import api from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { username, password });
      if (response.data.access_token) {
        login(response.data.access_token, rememberMe);
        toast.success("Authentication successful");

        setTimeout(() => {
          router.invalidate();
          navigate({ to: "/" });
        }, 100);
      }
    } catch {
      toast.error("Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Background Radial Glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(236,220,255,0.7) 0%, rgba(254,247,255,1) 70%)",
        }}
      />

      <div className="w-full max-w-md space-y-8 glass-panel rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-2xl border border-primary/20">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 flex items-center justify-center">
            <img src="/logo.png" alt="Bedrock Logo" className="h-16 w-16 object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Shield className="h-3.5 w-3.5" />
            Industrial AI Operational Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bedrock Workspace
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ingest engineering documents, query equipment knowledge, and monitor predictive maintenance alerts.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-border/60 bg-white/60 py-3 pl-10 pr-4 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-border/60 bg-white/60 py-3 pl-10 pr-4 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-primary/30 text-primary focus:ring-primary/20 cursor-pointer"
              />
              Remember me
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:brightness-110 disabled:opacity-40 cursor-pointer transition-all active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] font-semibold text-muted-foreground">
              Demo access: <span className="font-mono text-primary font-bold">demo</span> / <span className="font-mono text-primary font-bold">demo</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
