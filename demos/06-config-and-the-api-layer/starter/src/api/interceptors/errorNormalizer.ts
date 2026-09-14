import type { AxiosInstance } from 'axios';

/** Does nothing yet. Lab 4.3: turn every rejection into an ApiError — except cancellations. */
// TODO(lab-4.3): response error interceptor → ApiError.from(error); pass axios.isCancel() through untouched
export function installErrorNormalizer(_instance: AxiosInstance) {}
