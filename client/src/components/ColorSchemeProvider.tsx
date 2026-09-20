import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyColorSchemeToElement,
  COLOR_SCHEME_STORAGE_KEY,
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  getColorScheme,
  type ColorSchemeId,
  type ColorSchemeTokens,
} from "@/lib/colorSchemes";

type ColorSchemeContextValue = {
  schemeId: ColorSchemeId;
  scheme: ColorSchemeTokens;
  schemes: ColorSchemeTokens[];
  setSchemeId: (id: ColorSchemeId) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function readStoredSchemeId(): ColorSchemeId {
  if (typeof window === "undefined") return DEFAULT_COLOR_SCHEME;
  const raw = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  const match = COLOR_SCHEMES.find((s) => s.id === raw);
  return match?.id ?? DEFAULT_COLOR_SCHEME;
}

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [schemeId, setSchemeIdState] = useState<ColorSchemeId>(readStoredSchemeId);

  const scheme = useMemo(() => getColorScheme(schemeId), [schemeId]);

  useEffect(() => {
    applyColorSchemeToElement(document.documentElement, scheme);
  }, [scheme]);

  const setSchemeId = useCallback((id: ColorSchemeId) => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, id);
    setSchemeIdState(id);
  }, []);

  const value = useMemo(
    () => ({ schemeId, scheme, schemes: COLOR_SCHEMES, setSchemeId }),
    [schemeId, scheme, setSchemeId],
  );

  return (
    <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error("useColorScheme must be used within a ColorSchemeProvider");
  }
  return ctx;
}
