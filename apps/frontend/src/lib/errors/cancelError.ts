import type { AxiosRequestConfig } from 'axios'
import { ApiError } from './apiError'

export class RequestCancelled extends ApiError {
  constructor(request: AxiosRequestConfig) {
    super(request)
    this.name = 'RequestCancelled'
  }
}
