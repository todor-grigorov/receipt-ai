import type { AxiosRequestConfig } from 'axios'
import type { ZodIssue } from 'zod'
import { ApiError } from './apiError'

export class DtoSchemaError extends ApiError {
  constructor(
    request: AxiosRequestConfig,
    private readonly parseIssues: ZodIssue[]
  ) {
    super(request)
    this.name = 'DtoSchemaError'
  }

  public getParseIssues(): ZodIssue[] {
    return this.parseIssues
  }

  public getParseIssueString(): string {
    return JSON.stringify(this.parseIssues)
  }
}
