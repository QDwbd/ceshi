import { useVerge } from "@/hooks/use-verge";
import {
  BrightnessAutoRounded,
  DarkModeRounded,
  LightModeRounded,
} from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useCustomTheme, type ThemeMode } from "./use-custom-theme";

const modeIconMap: Record<ThemeMode, ReactNode> = {
  light: <LightModeRounded />,
  dark: <DarkModeRounded />,
  system: <BrightnessAutoRounded />,
};

/**
 * quick theme mode switch in the top bar
 */
export const ThemeToggle = () => {
  const { t } = useTranslation();
  const { setMode } = useCustomTheme();
  const { verge } = useVerge();
  const themeMode: ThemeMode = verge?.theme_setting?.theme_mode ?? "system";

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = async (mode: ThemeMode) => {
    setAnchorEl(null);
    await setMode(mode);
  };

  return (
    <>
      <IconButton
        size="small"
        title={t("Theme Setting")}
        onClick={handleClick}
        sx={{ color: "text.secondary" }}
      >
        {modeIconMap[themeMode]}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {(["light", "dark", "system"] as const).map((mode) => (
          <MenuItem
            key={mode}
            selected={themeMode === mode}
            onClick={() => handleSelect(mode)}
          >
            {modeIconMap[mode]}&nbsp;
            {t(`theme.${mode}`)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
