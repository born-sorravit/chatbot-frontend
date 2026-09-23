import type { ApiErrorBody } from '@/types/api';

/**
 * Typed wrapper over the backend's error envelope (docs/API.md §8).
 *
 * `code` is what UI branches on — never the message, which is prose and may
 * change or be localised.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let body: ApiErrorBody | undefined;

    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // A non-JSON error body (proxy timeout, HTML error page) must not
      // become a parse crash that hides the real status.
    }

    return new ApiError(
      response.status,
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? response.statusText ?? 'Request failed',
      body?.error?.details,
      body?.error?.requestId,
    );
  }

  get isAuthError() {
    return this.status === 401;
  }
}
