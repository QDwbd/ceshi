import logoUrl from "@/assets/image/logo.png";
import { LayoutControl } from "@/components/layout/layout-control";
import { LayoutTraffic } from "@/components/layout/layout-traffic";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UpdateButton } from "@/components/layout/update-button";
import { useCustomTheme } from "@/components/layout/use-custom-theme";
import { NotificationType, useNotification } from "@/hooks/use-notification";
import { useVerge } from "@/hooks/use-verge";
import { getAxios } from "@/services/api";
import getSystem from "@/utils/get-system";
import { Paper, ThemeProvider, useTheme } from "@mui/material";
import { emit, listen } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SWRConfig, mutate } from "swr";
// import { routers } from "./_routers";
import { LayoutItem } from "@/components/layout/layout-item";
import PageTransition from "@/components/layout/page-transition";
import { classNames } from "@/utils";
import { Modals } from "@generouted/react-router/lazy";
import { useNavigate, type Path } from "../router";
import styles from "./_app.module.scss";

dayjs.extend(relativeTime);

const OS = getSystem();

export const routes = {
  proxies: "/proxies",
  profiles: "/profiles",
  connections: "/connections",
  rules: "/rules",
  logs: "/logs",
  settings: "/settings",
  providers: "/providers",
};

export default function App() {
  const { t } = useTranslation();

  const { theme } = useCustomTheme();

  const { verge } = useVerge();
  const { language } = verge || {};

  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  // const location = useLocation();
  // const routes = useRoutes(routers);
  // if (!routes) return null;

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      // macOS有cmd+w
      if (e.key === "Escape" && OS !== "macos") {
        appWindow.close();
      }
    });

    listen("verge://refresh-clash-config", async () => {
      // the clash info may be updated
      await getAxios(true);
      mutate("getProxies");
      mutate("getVersion");
      mutate("getClashConfig");
      mutate("getProviders");
    });

    // update the verge config
    listen("verge://refresh-verge-config", () => mutate("getVergeConfig"));

    // 设置提示监听
    listen("verge://notice-message", ({ payload }) => {
      const [status, msg] = payload as [string, string];
      switch (status) {
        case "set_config::ok":
          useNotification({
            title: t("Success"),
            body: "Refresh Clash Config",
            type: NotificationType.Success,
          });
          break;
        case "set_config::error":
          useNotification({
            title: t("Error"),
            body: msg,
            type: NotificationType.Error,
          });
          break;
        default:
          break;
      }
    });

    listen("verge://mutate-proxies", () => {
      mutate("getProxies");
      mutate("getProviders");
    });

    listen("scheme-request-received", (req) => {
      const message: string = req.payload as string;
      const url = new URL(message);
      if (url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
      if (url.pathname.startsWith("//")) url.pathname = url.pathname.slice(1);
      switch (url.pathname) {
        case "/subscribe-remote-profile":
          navigate("/profiles", {
            state: {
              subscribe: {
                url: url.searchParams.get("url"),
                name: url.searchParams.has("name")
                  ? decodeURIComponent(url.searchParams.get("name")!)
                  : undefined,
                desc: url.searchParams.has("desc")
                  ? decodeURIComponent(url.searchParams.get("desc")!)
                  : undefined,
              },
            },
          });
      }
    });

    setTimeout(() => {
      appWindow.show();
      appWindow.unminimize();
      appWindow.setFocus();
      emit("init-complete");
    }, 50);
  }, []);

  useEffect(() => {
    if (language) {
      dayjs.locale(language === "zh" ? "zh-cn" : language);
      i18next.changeLanguage(language);
    }
  }, [language]);

  // Show the full nav labels when there is enough room, otherwise switch to
  // icons only. Never show an ellipsis / truncated label.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let lastWidth = nav.clientWidth;
    let raf = 0;
    let disposed = false;

    const measure = () => {
      const labels = Array.from(
        nav.querySelectorAll<HTMLElement>(".nav-item__label"),
      );
      if (labels.length === 0) return;

      // temporarily reveal the labels so their natural width can be measured
      const wasCrowded = nav.classList.contains("nav-crowded");
      if (wasCrowded) nav.classList.remove("nav-crowded");
      void nav.offsetWidth; // force reflow so labels participate in layout

      const crowded = labels.some((el) => el.scrollWidth > el.clientWidth + 1);
      nav.classList.toggle("nav-crowded", crowded);
    };

    measure();

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== lastWidth) {
        lastWidth = width;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(measure);
      }
    });
    ro.observe(nav);

    // re-measure when the label text changes (e.g. language switch)
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    mo.observe(nav, { childList: true, subtree: true, characterData: true });

    // re-measure once the webfonts are ready (label widths may change)
    document.fonts?.ready.then(() => {
      if (!disposed) measure();
    });

    return () => {
      disposed = true;
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <SWRConfig value={{ errorRetryCount: 3 }}>
      <ThemeProvider theme={theme}>
        <Paper
          square
          elevation={0}
          className={`${OS} layout`}
          onPointerDown={(e: any) => {
            if (e.target?.dataset?.windrag) appWindow.startDragging();
          }}
          onContextMenu={(e) => {
            // only prevent it on Windows
            const validList = ["input", "textarea"];
            const target = e.currentTarget;
            if (
              OS === "windows" &&
              !(
                validList.includes(target.tagName.toLowerCase()) ||
                target.isContentEditable
              )
            ) {
              e.preventDefault();
            }
          }}
          sx={{ bgcolor: "transparent" }}
        >
          <div className="layout__bg" />
          <div className="layout__overlay" />

          <header className="layout__bar" data-windrag>
            <div className="bar__brand" data-windrag>
              <div className="bar__logo">
                <img src={logoUrl} alt="logo" draggable={false} />
              </div>

              {!(OS === "windows" && WIN_PORTABLE) && (
                <UpdateButton className="the-newbtn" />
              )}
            </div>

            <nav ref={navRef} className="bar__nav" data-windrag>
              {Object.entries(routes).map(([name, to]) => (
                <LayoutItem key={name} to={to as Path}>
                  {t(`label_${name}`)}
                </LayoutItem>
              ))}
            </nav>

            <div className="bar__right">
              <div className="bar__traffic" data-windrag>
                <LayoutTraffic />
              </div>

              <ThemeToggle />

              {OS === "windows" && (
                <div className="the-bar">
                  <LayoutControl />
                </div>
              )}
            </div>
          </header>

          <main className="layout__main">
            <AnimatePresence mode="wait" initial={false}>
              {/* {React.cloneElement(routes, { key: location.pathname })} */}
              <PageTransition />
            </AnimatePresence>
            <Modals />
          </main>
        </Paper>
      </ThemeProvider>
    </SWRConfig>
  );
}

export const Catch = () => {
  const theme = useTheme();
  return (
    <div
      className={classNames(
        styles.oops,
        theme.palette.mode === "dark" && styles.dark,
      )}
    >
      <h1>Oops!</h1>
      <p>Something went wrong... Caught at _app error boundary</p>
    </div>
  );
};

export const Pending = () => <div>Loading from _app...</div>;
