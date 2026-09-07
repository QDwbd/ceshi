import { useEffect, useMemo } from "react";
import { useRecoilState } from "recoil";
import { createTheme, Theme } from "@mui/material";
import { appWindow } from "@tauri-apps/api/window";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { atomThemeMode } from "@/services/states";
import { defaultTheme, defaultDarkTheme } from "@/pages/_theme";
import { useVerge } from "@/hooks/use-verge";

export type ThemeMode = "light" | "dark" | "system";

/**
 * custom theme
 */
export const useCustomTheme = () => {
  const { verge, patchVerge } = useVerge();
  const { theme_setting } = verge ?? {};
  const [systemMode, setSystemMode] = useRecoilState(atomThemeMode);

  // user selected theme mode: light | dark | system
  const themeMode: ThemeMode = theme_setting?.theme_mode ?? "system";
  const mode: "light" | "dark" =
    themeMode === "system" ? systemMode : themeMode;

  // follow the system theme when mode is "system"
  useEffect(() => {
    appWindow.theme().then((m) => m && setSystemMode(m));
    const unlisten = appWindow.onThemeChanged((e) => setSystemMode(e.payload));

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // keep `atomThemeMode` in sync with the effective mode
  // (used by the monaco editors etc.)
  useEffect(() => {
    if (themeMode !== "system") {
      setSystemMode(themeMode);
    } else {
      appWindow.theme().then((m) => m && setSystemMode(m));
    }
  }, [themeMode]);

  // switch the theme mode and persist to the verge config
  const setMode = async (newMode: ThemeMode) => {
    await patchVerge({
      theme_setting: { ...theme_setting, theme_mode: newMode },
    });
  };

  const theme = useMemo(() => {
    const setting = theme_setting || {};
    const dt = mode === "light" ? defaultTheme : defaultDarkTheme;

    const paperColor = mode === "light" ? "#ffffff" : "#17152f";

    let theme: Theme;

    try {
      theme = createTheme({
        breakpoints: {
          values: { xs: 0, sm: 650, md: 900, lg: 1200, xl: 1536 },
        },
        palette: {
          mode,
          primary: { main: setting.primary_color || dt.primary_color },
          secondary: { main: setting.secondary_color || dt.secondary_color },
          info: { main: setting.info_color || dt.info_color },
          error: { main: setting.error_color || dt.error_color },
          warning: { main: setting.warning_color || dt.warning_color },
          success: { main: setting.success_color || dt.success_color },
          text: {
            primary: setting.primary_text || dt.primary_text,
            secondary: setting.secondary_text || dt.secondary_text,
          },
        },
        typography: {
          // todo
          fontFamily: setting.font_family
            ? `${setting.font_family}, ${dt.font_family}`
            : dt.font_family,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: "transparent",
                backgroundImage: "none",
                border: "none",
                boxShadow: "none",
                backdropFilter: "none",
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: paperColor,
                backgroundImage: "none",
                border: "none",
                boxShadow: "0 18px 50px rgba(0, 0, 0, 0.24)",
                backdropFilter: "blur(22px)",
              },
            },
          },
        },
      });
    } catch {
      // fix #294
      theme = createTheme({
        breakpoints: {
          values: { xs: 0, sm: 650, md: 900, lg: 1200, xl: 1536 },
        },
        palette: {
          mode,
          primary: { main: dt.primary_color },
          secondary: { main: dt.secondary_color },
          info: { main: dt.info_color },
          error: { main: dt.error_color },
          warning: { main: dt.warning_color },
          success: { main: dt.success_color },
          text: { primary: dt.primary_text, secondary: dt.secondary_text },
        },
        typography: { fontFamily: dt.font_family },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: "transparent",
                backgroundImage: "none",
                border: "none",
                boxShadow: "none",
                backdropFilter: "none",
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: paperColor,
                backgroundImage: "none",
                border: "none",
                boxShadow: "0 18px 50px rgba(0, 0, 0, 0.24)",
                backdropFilter: "blur(22px)",
              },
            },
          },
        },
      });
    }

    // css
    const backgroundColor =
      mode === "light"
        ? "linear-gradient(135deg, #fff7ed 0%, #f5f3ff 42%, #ecfeff 100%)"
        : "linear-gradient(135deg, #170f2f 0%, #0f172a 52%, #062b35 100%)";
    const selectColor = mode === "light" ? "#ffffff" : "#f8f7ff";
    const scrollColor = mode === "light" ? "#a78bfa99" : "#22d3ee80";

    // the backdrop layer (custom image or the default gradient) is rendered
    // by `.layout__bg` and always keeps its full opacity
    const backgroundImage = setting.background_image
      ? `url("${convertFileSrc(setting.background_image)}")`
      : backgroundColor;

    const rootEle = document.documentElement;
    rootEle.style.setProperty("--background-color", backgroundColor);
    rootEle.style.setProperty("--selection-color", selectColor);
    rootEle.style.setProperty("--scroller-color", scrollColor);
    rootEle.style.setProperty("--primary-main", theme.palette.primary.main);
    rootEle.style.setProperty(
      "--layout-accent",
      mode === "light" ? "rgb(124 58 237 / 20%)" : "rgb(34 211 238 / 18%)",
    );
    rootEle.style.setProperty(
      "--layout-glow",
      mode === "light" ? "rgb(236 72 153 / 14%)" : "rgb(124 58 237 / 24%)",
    );
    rootEle.style.setProperty("--text-primary", theme.palette.text.primary);
    rootEle.style.setProperty("--text-secondary", theme.palette.text.secondary);
    rootEle.style.setProperty(
      "--border-color",
      mode === "light"
        ? "rgb(124 58 237 / 12%)"
        : "rgb(167 139 250 / 16%)",
    );
    rootEle.style.setProperty("--background-image", backgroundImage);
    // inject css
    let style = document.querySelector("style#verge-theme");
    if (!style) {
      style = document.createElement("style");
      style.id = "verge-theme";
      document.head.appendChild(style!);
    }
    if (style) {
      style.innerHTML = setting.css_injection || "";
    }

    // update svg icon
    const { palette } = theme;

    setTimeout(() => {
      const dom = document.querySelector("#Gradient2");
      if (dom) {
        dom.innerHTML = `
        <stop offset="0%" stop-color="${palette.primary.main}" />
        <stop offset="80%" stop-color="${palette.primary.dark}" />
        <stop offset="100%" stop-color="${palette.primary.dark}" />
        `;
      }
    }, 0);

    return theme;
  }, [mode, theme_setting]);

  return { theme, mode, setMode };
};
