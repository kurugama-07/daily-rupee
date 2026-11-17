import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { applyTheme, readThemePref, saveThemePref, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ThemePref; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: Monitor },
];

function useThemePref() {
  const [pref, setPref] = useState<ThemePref | null>(null);
  useEffect(() => {
    const p = readThemePref();
    setPref(p);
    applyTheme(p);
    const sync = () => setPref(readThemePref());
    window.addEventListener("sage-theme-change", sync);
    return () => window.removeEventListener("sage-theme-change", sync);
  }, []);
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);
  const set = (p: ThemePref) => {
    saveThemePref(p);
    setPref(p);
    window.dispatchEvent(new Event("sage-theme-change"));
  };
  return [pref, set] as const;
}

/** Three-way segmented switch: Light / Dark / Auto (follow device). */
export function ThemeSegmented({ inverted, className }: { inverted?: boolean; className?: string }) {
  const [pref, set] = useThemePref();
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-xl p-1",
        inverted ? "bg-sidebar-accent" : "border bg-muted",
        className,
      )}
    >
      {OPTIONS.map((o) => {
        const active = pref === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => set(o.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
              inverted
                ? active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                : active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <o.icon className="size-3.5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact icon button that flips between light and dark. */
export function ThemeIconButton({ className }: { className?: string }) {
  const [pref, set] = useThemePref();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, [pref]);
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => set(dark ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
