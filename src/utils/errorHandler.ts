import axios from "axios";
import { enqueueSnackbar } from "notistack";

/**
 * ?? Manejador global de errores del backend (NestJS)
 * Muestra mensajes en espa�ol con Snackbars visuales.
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
      enqueueSnackbar("Ocurri� un error inesperado. Intente nuevamente.", {
        variant: "error",
      });
    }

    console.error("?? Error del backend:", data);
  } else {
    enqueueSnackbar("No se pudo conectar con el servidor. Verifique su conexi�n.", {
      variant: "error",
    });
    console.error("? Error desconocido:", error);
  }
}

/**
 * ? Notificaci�n de �xito
 */
export function showSuccess(message: string) {
  enqueueSnackbar(message, { variant: "success" });
}

/**
 * ?? Notificaci�n de advertencia
 */
export function showWarning(message: string) {
  enqueueSnackbar(message, { variant: "warning" });
}

/**
 * ?? Notificaci�n informativa
 */
export function showInfo(message: string) {
  enqueueSnackbar(message, { variant: "info" });
}
