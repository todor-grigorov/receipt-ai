import type { AxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { debug, error } from '../logger'

// ── API Error Response Schema ─────────────────────────────
const ApiErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
})

const ApiErrorResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())).nullable().optional(),
})

export type ApiErrorPayload = z.infer<typeof ApiErrorResponseSchema>

// ── Base Error Class ──────────────────────────────────────
export abstract class ApiError extends Error {
  constructor(private readonly request: AxiosRequestConfig) {
    super()
    this.name = 'ApiError'
  }

  public getRequestString(): string {
    return `${this.request.method?.toUpperCase()} ${this.request.url}`
  }
}

// ── Unknown API Error ─────────────────────────────────────
export class UnknownApiError extends ApiError {
  constructor(request: AxiosRequestConfig) {
    super(request)
    this.name = 'UnknownApiError'
  }
}

// ── API Error Response ────────────────────────────────────
export class ApiErrorResponse extends ApiError {
  private readonly responseData: ApiErrorPayload | null

  constructor(
    request: AxiosRequestConfig,
    private readonly httpStatusCode: number,
    private readonly httpStatusText: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: any
  ) {
    super(request)
    this.name = 'ApiErrorResponse'

    const parsed = ApiErrorResponseSchema.safeParse(response)

    if (parsed.success) {
      this.responseData = parsed.data
    } else {
      debug('Response does not match expected error format:', response)
      this.responseData = null
    }
  }

  public getHttpStatusCode(): number {
    return this.httpStatusCode
  }

  public getHttpStatusText(): string {
    return this.httpStatusText
  }

  public getResponseData(): ApiErrorPayload | null {
    return this.responseData
  }

  public getResponseDataString(): string {
    return this.responseData ? JSON.stringify(this.responseData) : ''
  }

  public isNotFound(): boolean {
    return this.httpStatusCode === 404
  }

  public isUnauthorized(): boolean {
    return this.httpStatusCode === 401
  }

  public isForbidden(): boolean {
    return this.httpStatusCode === 403
  }

  public isValidationError(): boolean {
    return this.httpStatusCode === 422
  }

  public getValidationErrors(): Record<string, string[]> | null {
    return this.responseData?.errors ?? null
  }
}
