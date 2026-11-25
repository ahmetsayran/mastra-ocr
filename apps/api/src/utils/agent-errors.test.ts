import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { toAgentHttpError } from './agent-errors';
import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
  TooManyRequestsException,
} from './http-errors';

describe('toAgentHttpError', () => {
  let consoleError: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Keeps the expected error logs out of the test output
    consoleError = spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('returns HTTP errors as they are', () => {
    const error = new NotFoundException('Bulunamadı');
    expect(toAgentHttpError(error, 'test', 'Hata')).toBe(error);
  });

  it('maps a provider rate limit to 429', () => {
    expect(toAgentHttpError({ statusCode: 429 }, 'test', 'Hata')).toBeInstanceOf(
      TooManyRequestsException,
    );
  });

  it('maps provider key and credit errors to 503', () => {
    for (const statusCode of [401, 402, 403]) {
      expect(toAgentHttpError({ statusCode }, 'test', 'Hata')).toBeInstanceOf(
        ServiceUnavailableException,
      );
    }
  });

  it('maps other errors to 502 with the fallback message', () => {
    const error = toAgentHttpError(new Error('timeout'), 'test', 'Belge okunamadı');
    expect(error).toBeInstanceOf(BadGatewayException);
    expect(error.message).toBe('Belge okunamadı');
  });
});
