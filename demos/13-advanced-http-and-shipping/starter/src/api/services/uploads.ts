import { uploadApi } from '../client';

export interface UploadResult {
  size: number;
  echoedFields: string[];
  echoedFiles: string[];
}

/** Uploads a file and returns what the server echoed. Lab 2.2: FormData, onUploadProgress, cancellation. */
// TODO(lab-2.2): build a FormData, forward onProgress → onUploadProgress (guard event.total), forward signal
export async function uploadFile(file: File): Promise<UploadResult> {
  await uploadApi.post('/post', file);
  return { size: file.size, echoedFields: [], echoedFiles: [] };
}
