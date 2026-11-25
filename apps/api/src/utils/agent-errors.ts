import {
  BadGatewayException,
  HttpError,
  ServiceUnavailableException,
  TooManyRequestsException,
} from './http-errors';

export function toAgentHttpError(error: unknown, context: string, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return error;
  }

  console.error(`Error in ${context}:`, error);

  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? error.statusCode
      : undefined;

  if (statusCode === 429) {
    return new TooManyRequestsException(
      'Yapay zekâ servisi şu an yoğun, biraz sonra tekrar deneyin',
    );
  }
  if (statusCode === 401 || statusCode === 402 || statusCode === 403) {
    return new ServiceUnavailableException(
      'Yapay zekâ servisine bağlanılamadı, OpenRouter anahtarını kontrol edin',
    );
  }
  return new BadGatewayException(fallbackMessage);
}
