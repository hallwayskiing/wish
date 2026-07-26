export async function adminApi(endpoint, options = {}) {
  const { headers, ...fetchOptions } = options;
  const response = await fetch(`/api/admin${endpoint}`, {
    credentials: 'same-origin',
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `请求失败（${response.status}）`);
    error.status = response.status;
    throw error;
  }
  return data;
}
