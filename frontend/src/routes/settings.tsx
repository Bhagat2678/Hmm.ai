import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Badge,
  Palette,
  Camera,
  Save,
  CheckCircle2,
  Cpu,
  BellRing,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Workspace Settings - Bedrock" },
      {
        name: "description",
        content: "Manage your profile, visual preferences, and API integrations.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return (
      localStorage.getItem("bedrock-avatarUrl") ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60"
    );
  });
  const [fullName, setFullName] = useState(() => {
    return localStorage.getItem("bedrock-fullName") || "Operator";
  });
  const [handle, setHandle] = useState(() => {
    return localStorage.getItem("bedrock-handle") || "operator_eng";
  });
  const [bio, setBio] = useState(() => {
    return (
      localStorage.getItem("bedrock-bio") ||
      "Reliability Engineer & Operator on Unit 300 Refinery Operations."
    );
  });

  const [clarityThreshold, setClarityThreshold] = useState(() => {
    return localStorage.getItem("bedrock-clarityThreshold") || "85";
  });
  const [emailAlerts, setEmailAlerts] = useState(() => {
    const val = localStorage.getItem("bedrock-emailAlerts");
    return val !== null ? JSON.parse(val) : true;
  });
  const [vibrationAlerts, setVibrationAlerts] = useState(() => {
    const val = localStorage.getItem("bedrock-vibrationAlerts");
    return val !== null ? JSON.parse(val) : true;
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success("Avatar image updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bedrock-fullName", fullName);
    localStorage.setItem("bedrock-handle", handle);
    localStorage.setItem("bedrock-bio", bio);
    localStorage.setItem("bedrock-clarityThreshold", clarityThreshold);
    localStorage.setItem("bedrock-emailAlerts", JSON.stringify(emailAlerts));
    localStorage.setItem("bedrock-vibrationAlerts", JSON.stringify(vibrationAlerts));
    localStorage.setItem("bedrock-avatarUrl", avatarUrl);

    setIsSaved(true);
    toast.success("Workspace settings saved successfully");
    window.dispatchEvent(new Event("bedrock-settings-update"));
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Hidden Avatar File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* 1:1 Stitch Settings Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Manage your profile, visual preferences, and API integrations.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Identity Section (1:1 Stitch) */}
        <section className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Badge className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Profile Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Avatar Column */}
            <div className="col-span-1 flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer"
                title="Click to change avatar"
              >
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center shadow-md">
                  <img
                    src={avatarUrl}
                    alt="Operator Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center text-white">
                  <Camera className="h-6 w-6" />
                </div>
              </div>
              <p
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-primary cursor-pointer hover:underline"
              >
                Change Avatar
              </p>
            </div>

            {/* Inputs Column */}
            <div className="col-span-3 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-border/60 bg-white/60 px-4 py-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Workspace Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full rounded-2xl border border-border/60 bg-white/60 pl-8 pr-4 py-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border/60 bg-white/60 p-4 text-xs font-semibold text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Appearance</h2>
          </div>

          <div className="max-w-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Clarity Threshold %</label>
              <span className="font-mono text-xs font-bold text-primary">{clarityThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={clarityThreshold}
              onChange={(e) => setClarityThreshold(e.target.value)}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground">
              Sets context retention sensitivity for vector searches and knowledge retrieval.
            </p>
          </div>
        </section>

        {/* AI & Notification Preferences */}
        <section className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <BellRing className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Notifications & Alerts</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
              <div>
                <p className="text-xs font-bold text-foreground">Daily Email Shift Summary</p>
                <p className="text-[11px] text-muted-foreground">Receive daily AI shift reports and document ingestion logs.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-5 w-5 rounded border-primary/30 text-primary accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
              <div>
                <p className="text-xs font-bold text-foreground">High-Vibration Telemetry Alerts</p>
                <p className="text-[11px] text-muted-foreground">Dispatch high-priority push alerts when ISO 10816 limits are breached.</p>
              </div>
              <input
                type="checkbox"
                checked={vibrationAlerts}
                onChange={(e) => setVibrationAlerts(e.target.checked)}
                className="h-5 w-5 rounded border-primary/30 text-primary accent-primary"
              />
            </label>
          </div>
        </section>

        {/* Footer Save & Logout */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-100 px-6 py-3 text-xs font-bold text-red-600 hover:bg-red-200 cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:brightness-110 cursor-pointer transition-all active:scale-95"
          >
            {isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaved ? "Saved!" : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
