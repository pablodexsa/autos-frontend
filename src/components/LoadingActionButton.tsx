import React from "react";
import { Button, ButtonProps, CircularProgress, Box } from "@mui/material";

type LoadingActionButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: number;
};

const LoadingActionButton: React.FC<LoadingActionButtonProps> = ({
  loading = false,
  loadingText = "Procesando...",
  spinnerSize = 18,
  disabled,
  children,
  sx,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      sx={{
        minWidth: 160,
        ...sx,
      }}
    >
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
        {loading && <CircularProgress size={spinnerSize} color="inherit" />}
        <span>{loading ? loadingText : children}</span>
      </Box>
    </Button>
  );
};

export default LoadingActionButton;