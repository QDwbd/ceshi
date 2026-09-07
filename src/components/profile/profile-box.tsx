import { alpha, Box, styled } from "@mui/material";

export const ProfileBox = styled(Box)(({
  theme,
  "aria-selected": selected,
}) => {
  const { mode, primary, text } = theme.palette;
  const key = `${mode}-${!!selected}`;

  // Keep every profile card fully transparent, including the selected state.
  const backgroundColor = {
    "light-true": "transparent",
    "light-false": "transparent",
    "dark-true": "transparent",
    "dark-false": "transparent",
  }[key]!;

  const color = {
    "light-true": text.secondary,
    "light-false": text.secondary,
    "dark-true": alpha(text.secondary, 0.85),
    "dark-false": alpha(text.secondary, 0.65),
  }[key]!;

  const h2color = {
    "light-true": primary.main,
    "light-false": text.primary,
    "dark-true": primary.light,
    "dark-false": text.primary,
  }[key]!;

  return {
    position: "relative",
    width: "100%",
    display: "block",
    cursor: "pointer",
    textAlign: "left",
    borderRadius: 14,
    boxShadow: "none",
    padding: "10px 14px",
    boxSizing: "border-box",
    backgroundColor,
    color,
    "& h2": { color: h2color },
  };
});
