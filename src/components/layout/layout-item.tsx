import { useNavigate, type Params, type Path } from "@/router";
import type { LinkProps } from "@generouted/react-router/client";
import {
  CloudDownloadRounded,
  GavelRounded,
  LanRounded,
  PublicRounded,
  SettingsRounded,
  StorageRounded,
  TerminalRounded,
} from "@mui/icons-material";
import { ListItem, ListItemButton, Tooltip } from "@mui/material";
import { useMatch, useResolvedPath } from "react-router-dom";
import type { ReactNode } from "react";

// map route path -> icon
const routeIcons: Record<string, ReactNode> = {
  "/proxies": <PublicRounded />,
  "/profiles": <CloudDownloadRounded />,
  "/connections": <LanRounded />,
  "/rules": <GavelRounded />,
  "/logs": <TerminalRounded />,
  "/settings": <SettingsRounded />,
  "/providers": <StorageRounded />,
};

export const LayoutItem = (props: LinkProps<Path, Params>) => {
  const { to, children } = props;

  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });
  const navigate = useNavigate();

  return (
    <ListItem className="nav-item" sx={{ width: "auto", py: 0 }}>
      <Tooltip title={children} placement="bottom" arrow>
        <ListItemButton
          selected={!!match}
          onClick={() => navigate(to)}
        >
          <span className="nav-item__icon">{routeIcons[to]}</span>
          <span className="nav-item__label">{children}</span>
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
};
