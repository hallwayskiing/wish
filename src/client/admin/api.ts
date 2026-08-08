export class AdminApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

export async function adminApi<T>(
  endpoint: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<T> {
  const { headers, ...fetchOptions } = options;
  const response = await fetch(`/api/admin${endpoint}`, {
    credentials: 'same-origin',
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorObj = data && typeof data === 'object' ? (data as { error?: string }) : undefined;
    const errorMsg =
      typeof errorObj?.error === 'string' ? errorObj.error : `请求失败（${response.status}）`;
    throw new AdminApiError(errorMsg, response.status);
  }
  return data as T;
}
