import { uploadApi } from '../client';

export interface UploadResult {
  size: number;
  echoedFields: string[];
  echoedFiles: string[];
}

interface UploadOptions {
  /** 0–100. */
  onProgress?: (percent: number) => void;
  /** An upload is the one request users need a Cancel button for. */
  signal?: AbortSignal;
  fields?: Record<string, string>;
}

/** What httpbin.org/post echoes back: the multipart parts, keyed by field name. */
interface HttpbinEcho {
  form?: Record<string, string>;
  files?: Record<string, string>;
}

/**
 * Multipart upload with progress. httpbin.org/post echoes the request back,
 * so the response tells you exactly what the browser sent.
 */
export async function uploadFile(file: File, { onProgress, signal, fields = {} }: UploadOptions = {}): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file, file.name);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);

  // Do NOT set Content-Type: the browser adds `multipart/form-data; boundary=…` itself.
  const { data } = await uploadApi.post<HttpbinEcho>('/post', form, {
    signal,
    onUploadProgress: (event) => {
      if (!event.total) return; // unknown for chunked bodies
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });

  return { size: file.size, echoedFields: Object.keys(data.form ?? {}), echoedFiles: Object.keys(data.files ?? {}) };
}
