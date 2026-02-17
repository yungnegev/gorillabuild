import type { User } from "@gorillabuild/shared";

type RequestOptions = {
  headers?: Record<string, string>;
};

function createFetcher(baseUrl: string, defaultOptions?: RequestOptions) {
  return async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...defaultOptions?.headers,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  };
}

export function createApiClient(baseUrl: string, options?: RequestOptions) {
  const fetcher = createFetcher(baseUrl, options);

  return {
    health: () => fetcher<{ status: string }>("/api/health"),

    // Placeholder — expand as you build features
    users: {
      me: () => fetcher<User>("/api/users/me"),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
