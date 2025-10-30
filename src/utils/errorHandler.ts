import axios from "axios";
import { enqueueSnackbar } from "notistack";

/**
 * ?? Manejador global de errores del backend (NestJS)
 * Muestra mensajes en español con Snackbars visuales.
 */
export function handleApiError(error: any) {
  if (axios.isAxiosError(error) && error.response) {
    const { data } = error.response;

    if (Array.isArray(data?.mensaje)) {
      data.mensaje.forEach((msg: string) =>
        enqueueSnackbar(msg, { variant: "error" })
      );
    } else if (data?.mensaje) {
      enqueueSnackbar(data.mensaje, { variant: "error" });
    } else {
      enqueueSnackbar("Ocurrió un error inesperado. Intente nuevamente.", {
        variant: "error",
      });
    }

    console.error("?? Error del backend:", data);
  } else {
    enqueueSnackbar("No se pudo conectar con el servidor. Verifique su conexión.", {
      variant: "error",
    });
    console.error("? Error desconocido:", error);
  }
}

/**
 * ? Notificación de éxito
 */
export function showSuccess(message: string) {
  enqueueSnackbar(message, { variant: "success" });
}

/**
 * ?? Notificación de advertencia
 */
export function showWarning(message: string) {
  enqueueSnackbar(message, { variant: "warning" });
}

/**
 * ?? Notificación informativa
 */
export function showInfo(message: string) {
  enqueueSnackbar(message, { variant: "info" });
}
