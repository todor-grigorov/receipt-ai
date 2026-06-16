import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type RawAxiosRequestHeaders,
} from 'axios'
import { z } from 'zod'
import { ApiErrorResponse, UnknownApiError } from './errors/apiError'
import { RequestCancelled } from './errors/cancelError'
import { DtoSchemaError } from './errors/dtoError'
import { error, debug } from './logger'

export default class HttpRequest {
  // ── GET ───────────────────────────────────────────────
  public static async get<DtoType extends z.ZodTypeAny>(
    path: string,
    responseType: DtoType,
    signal?: AbortSignal,
    params?: Record<string, string | string[] | boolean | number>
  ): Promise<z.infer<DtoType>> {
    return HttpRequest.request<DtoType>(
      {
        url: path,
        method: 'get',
        params,
        paramsSerializer: { indexes: null },
      },
      responseType,
      null,
      signal
    )
  }

  // ── POST ──────────────────────────────────────────────
  public static async post<DtoType extends z.ZodTypeAny>({
    path,
    data = null,
    additionalHeaders = null,
    responseType = null,
  }: {
    path: string
    data?: object | null
    additionalHeaders?: RawAxiosRequestHeaders | null
    responseType?: DtoType | null
  }): Promise<z.infer<DtoType>> {
    return HttpRequest.request<DtoType>(
      { url: path, method: 'post', data },
      responseType,
      additionalHeaders
    )
  }

  // ── DELETE ────────────────────────────────────────────
  public static async delete(path: string): Promise<void> {
    await HttpRequest.request({ url: path, method: 'delete' }, null)
  }

  // ── Core Request ──────────────────────────────────────
  public static async request<DtoType extends z.ZodTypeAny>(
    request: AxiosRequestConfig,
    responseType: DtoType | null = null,
    additionalHeaders: RawAxiosRequestHeaders | null = null,
    signal?: AbortSignal
  ): Promise<z.infer<DtoType>> {
    let response

    try {
      const axiosConfig: AxiosRequestConfig = {
        ...request,
        headers: { ...additionalHeaders },
        signal,
      }

      response = await axios.request(axiosConfig)
    } catch (err) {
      const e = err as AxiosError

      if (axios.isCancel(err)) {
        throw new RequestCancelled(request)
      }

      if (e.response) {
        error(
          `HTTP ${request.method?.toUpperCase()} ${request.url} failed`,
          `Status: ${e.response.status} ${e.response.statusText}`
        )
        throw new ApiErrorResponse(
          request,
          e.response.status,
          e.response.statusText,
          e.response.data
        )
      }

      throw new UnknownApiError(request)
    }

    const data = response.data

    if (responseType) {
      const result = responseType.safeParse(data)

      if (result.success) {
        return result.data as z.infer<DtoType>
      } else {
        error(
          `Schema validation failed for ${request.method?.toUpperCase()} ${request.url}`
        )
        debug('Validation issues:', result.error.issues)
        throw new DtoSchemaError(request, result.error.issues)
      }
    }

    return data as z.infer<DtoType>
  }

  // ── POST FormData (file upload) ───────────────────────
  public static async postFormData<DtoType extends z.ZodTypeAny>({
    path,
    formData,
    responseType = null,
    signal,
  }: {
    path: string
    formData: FormData
    responseType?: DtoType | null
    signal?: AbortSignal
  }): Promise<z.infer<DtoType>> {
    return HttpRequest.request<DtoType>(
      { url: path, method: 'post', data: formData },
      responseType,
      { 'Content-Type': 'multipart/form-data' },
      signal
    )
  }
}
