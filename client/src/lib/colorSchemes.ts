/** FoodieFinds brand color schemes (Antonio preview picker). */

export type ColorSchemeId =
  | "indigo-teal"
  | "midnight-magenta"
  | "emerald-trust"
  | "neon-obsidian";

export const COLOR_SCHEME_STORAGE_KEY = "ff-color-scheme";

export type ColorSchemeTokens = {
  id: ColorSchemeId;
  label: string;
  /** HSL components without hsl() — space-separated "H S% L%" for shadcn vars */
  primary: string;
  callAccent: string;
  success: string;
  warning: string;
  background: string;
  highlight?: string;
};

export const COLOR_SCHEMES: ColorSchemeTokens[] = [
  {
    id: "indigo-teal",
    label: "Indigo Teal",
    primary: "245 70% 55%", // #6B5CFF
    callAccent: "180 60% 41%", // #2AA8A8
    success: "142 71% 45%", // #22C55E
    warning: "38 92% 50%", // #F59E0B
    background: "240 17% 9%", // #12121A
  },
  {
    id: "midnight-magenta",
    label: "Midnight Magenta",
    primary: "330 77% 50%", // #E11D8A
    callAccent: "43 90% 61%", // #F5B942
    success: "142 71% 45%",
    warning: "38 92% 50%", // #F59E0B
    background: "285 43% 6%", // #140A16
    highlight: "325 100% 74%", // #FF7BCB
  },
  {
    id: "emerald-trust",
    label: "Emerald Trust",
    primary: "160 84% 39%", // #10B981
    callAccent: "213 52% 25%", // #1E3A5F
    success: "160 84% 39%",
    warning: "38 92% 50%", // money gold #F59E0B
    background: "150 26% 6%", // #0B1210
  },
  {
    id: "neon-obsidian",
    label: "Neon Obsidian",
    primary: "258 90% 66%", // #8B5CF6
    callAccent: "189 94% 53%", // #22D3EE
    success: "160 84% 39%",
    warning: "358 100% 68%", // coral CTA/alert #FF5A5F
    background: "240 23% 2%", // #050508
  },
];

export const DEFAULT_COLOR_SCHEME: ColorSchemeId = "indigo-teal";

export function getColorScheme(id: string | null | undefined): ColorSchemeTokens {
  return (
    COLOR_SCHEMES.find((s) => s.id === id) ??
    COLOR_SCHEMES.find((s) => s.id === DEFAULT_COLOR_SCHEME)!
  );
}

/** Apply scheme tokens as CSS variables on an element (usually <html>). */
export function applyColorSchemeToElement(
  el: HTMLElement,
  scheme: ColorSchemeTokens,
): void {
  el.dataset.colorScheme = scheme.id;
  el.style.setProperty("--primary", scheme.primary);
  el.style.setProperty("--sidebar-primary", scheme.primary);
  el.style.setProperty("--ring", scheme.primary);
  el.style.setProperty("--call-accent", scheme.callAccent);
  el.style.setProperty("--success", scheme.success);
  el.style.setProperty("--warning", scheme.warning);
  el.style.setProperty("--background", scheme.background);
  // Dark shell foregrounds for all preview schemes
  el.style.setProperty("--foreground", "0 0% 98%");
  el.style.setProperty("--card", scheme.background);
  el.style.setProperty("--card-foreground", "0 0% 98%");
  el.style.setProperty("--popover", `${scheme.background.split(" ")[0]} 20% 12%`);
  el.style.setProperty("--popover-foreground", "0 0% 98%");
  el.style.setProperty("--muted", `${scheme.background.split(" ")[0]} 15% 14%`);
  el.style.setProperty("--muted-foreground", "240 5% 70%");
  el.style.setProperty("--border", `${scheme.background.split(" ")[0]} 12% 18%`);
  el.style.setProperty("--primary-foreground", "0 0% 100%");
  if (scheme.highlight) {
    el.style.setProperty("--scheme-highlight", scheme.highlight);
  } else {
    el.style.removeProperty("--scheme-highlight");
  }
}
