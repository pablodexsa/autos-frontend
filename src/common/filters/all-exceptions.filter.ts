import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurri� un error inesperado. Intente nuevamente.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = this.translateMessage(exceptionResponse);
      } else if (
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any).message
      ) {
        const msg = (exceptionResponse as any).message;
        message = Array.isArray(msg)
          ? msg.map((m) => this.translateMessage(m))
          : this.translateMessage(msg);
      }
    }

    response.status(status).json({
      estado: 'error',
      codigo: status,
      mensaje: message,
    });
  }

  /**
   * Traduce mensajes comunes de class-validator y Nest a espa�ol.
   */
  private translateMessage(msg: string): string {
    const dictionary: Record<string, string> = {
      'must be a string': 'debe ser una cadena de texto',
      'must be a number': 'debe ser un n�mero',
      'must be a positive number': 'debe ser un n�mero positivo',
      'must not be empty': 'no puede estar vac�o',
      'should not be empty': 'no puede estar vac�o',
      'must be an email': 'debe ser un correo electr�nico v�lido',
      'must be a boolean value': 'debe ser verdadero o falso',
      'is not a valid enum value':
        'tiene un valor no permitido. Verifique la opci�n seleccionada.',
      'Bad Request Exception': 'Petici�n inv�lida',
      'Not Found Exception': 'No se encontr� el recurso solicitado',
    };

    // Buscar traducci�n parcial
    for (const key of Object.keys(dictionary)) {
      if (msg.includes(key)) return msg.replace(key, dictionary[key]);
    }

    return msg;
  }
}
