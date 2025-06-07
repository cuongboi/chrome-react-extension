import { GHRequestHeaders } from './contains';

export const fetchJson = async <T>(
  input: RequestInfo | URL,
  options: Omit<RequestInit, 'body'> & {
    body?: unknown;
  } = {},
): Promise<T> => {
  const response = await fetch(input, {
    ...options,
    headers: {
      ...GHRequestHeaders,
      ...options.headers,
    },
    mode: 'cors',
    credentials: 'include',
    body:
      typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body),
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  try {
    return response.json();
  } catch {
    return response.text() as unknown as T;
  }
};
