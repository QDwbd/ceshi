import { BasePage } from "@/components/base";
import SettingClash from "@/components/setting/setting-clash";
import SettingSystem from "@/components/setting/setting-system";
import SettingVerge from "@/components/setting/setting-verge";
import { NotificationType, useNotification } from "@/hooks/use-notification";
import { Grid, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function SettingPage() {
  const { t } = useTranslation();

  const onError = (err: any) => {
    useNotification({
      title: t("Error"),
      body: err.message || err.toString(),
      type: NotificationType.Error,
    });
  };

  return (
    <BasePage title={t("Settings")}>
      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              backgroundColor: "transparent",
              backgroundImage: "none",
              backdropFilter: "none",
              border: "none",
            }}
          >
            <SettingClash onError={onError} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              backgroundColor: "transparent",
              backgroundImage: "none",
              backdropFilter: "none",
              border: "none",
            }}
          >
            <SettingSystem onError={onError} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              borderRadius: 1,
              boxShadow: "none",
              backgroundColor: "transparent",
              backgroundImage: "none",
              backdropFilter: "none",
              border: "none",
            }}
          >
            <SettingVerge onError={onError} />
          </Paper>
        </Grid>
      </Grid>
    </BasePage>
  );
}
