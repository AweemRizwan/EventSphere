import React, { createContext, useContext, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleTheme, setTheme } from "@/store/slices/uiSlice";

interface ThemeContextValue {
  theme: "light" | "dark";
  toggle: () => void;
  set: (t: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", toggle: () => {}, set: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((s) => s.ui.theme);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => dispatch(toggleTheme()), set: (t) => dispatch(setTheme(t)) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
