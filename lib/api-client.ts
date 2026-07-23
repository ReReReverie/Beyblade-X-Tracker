type ApiErrorBody = { error?: unknown };

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly response: Response;

  constructor(status: number, message: string, response: Response, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.response = response;
  }
}

export async function apiRequest<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, getResponseErrorMessage(response, body), response, body);
  }

  return body as T;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError || error instanceof Error ? error.message : fallback;
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

function getResponseErrorMessage(response: Response, body: unknown) {
  const serverMessage = getServerMessage(body);
  switch (response.status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return serverMessage || "The requested resource was not found.";
    case 409:
      return serverMessage || "The request conflicts with the current data.";
    case 429:
      return serverMessage || "Too many requests. Please try again shortly.";
    default:
      return serverMessage || "The request could not be completed.";
  }
}

function getServerMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("error" in body)) return undefined;
  const error = (body as ApiErrorBody).error;
  return typeof error === "string" && error.trim() ? error : undefined;
}
