import { useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Card, Form, ProgressBar, Stack } from 'react-bootstrap';
import { CloudArrowUp, XLg } from 'react-bootstrap-icons';
import { uploadFile, type UploadResult } from '../api/services/uploads';
import { ApiError } from '../lib/ApiError';
import { ErrorNotice } from './ErrorNotice';

export function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null); // null = not uploading
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null); // the in-flight request's cancel handle — not render state, so a ref

  const uploading = progress !== null;

  async function handleUpload() {
    if (!file) return;
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setError(null);
      setResult(null);
      setProgress(0);
      setResult(await uploadFile(file, { onProgress: setProgress, signal: controller.signal, fields: { purpose: 'avatar' } }));
    } catch (err) {
      // uploadApi has no interceptors, so this is a RAW axios error: normalise it here.
      if (!axios.isCancel(err)) setError(ApiError.from(err));
    } finally {
      setProgress(null);
      controllerRef.current = null;
    }
  }

  return (
    <Card className="mt-4">
      <Card.Header className="fw-semibold">Upload a profile picture</Card.Header>
      <Card.Body>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={2}>
            <Form.Control
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <CloudArrowUp className="me-1" />
              Upload
            </Button>
            {uploading && (
              <Button variant="outline-secondary" onClick={() => controllerRef.current?.abort()} aria-label="Cancel upload">
                <XLg />
              </Button>
            )}
          </Stack>

          {progress !== null && (
            <ProgressBar
              now={progress}
              // 100% means the bytes LEFT THE BROWSER — the server is still working. Say so.
              label={progress < 100 ? `${progress}%` : 'Processing…'}
              animated={progress === 100}
              striped
            />
          )}

          <ErrorNotice error={error} />

          {result && (
            <Alert variant="success" className="mb-0">
              Uploaded {(result.size / 1024).toFixed(1)} kB. The server echoed file part{' '}
              <code>{result.echoedFiles.join(', ') || '—'}</code> and fields <code>{result.echoedFields.join(', ') || '—'}</code>.
            </Alert>
          )}
        </Stack>
      </Card.Body>
    </Card>
  );
}
