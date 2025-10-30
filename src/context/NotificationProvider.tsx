import React, { ReactNode } from "react";
import { SnackbarProvider, closeSnackbar } from "notistack";
import { IconButton, Slide } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  children: ReactNode;
}

const NotificationProvider: React.FC<Props> = ({ children }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      TransitionComponent={Slide}
      preventDuplicate
      dense
      style={{
        fontFamily: "Roboto, sans-serif",
      }}
      classes={{
        containerRoot: "snackbar-container",
      }}
      iconVariant={{
        success: "? ",
        error: "? ",
        warning: "?? ",
        info: "?? ",
      }}
      action={(snackbarId) => (
        <IconButton
          size="small"
          onClick={() => closeSnackbar(snackbarId)}
          sx={{ color: "white" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    >
      {children}
    </SnackbarProvider>
  );
};

export default NotificationProvider;
