import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { clearAccessToken, getAccessToken } from "./auth";

async function throwIfResNotOk(res: Response): Promise<void> {
    if (res.ok) return;

    // 401 => session is gone. Clear the in-memory token so any mounted
    // `useRequireAuth()` redirects to /signup, AND drop a friendlier
    // error message. Don't redirect from here directly - we're outside
    // React; the auth-changed event handles routing.
    if (res.status === 401) {
        clearAccessToken();
        throw new Error("401: Session expired. Please log in again.");
    }

    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
}

/**
 * Build the request headers, attaching `Authorization: Bearer <token>`
 * whenever an access token is in memory.
 */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...(extra ?? {}) };
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

export async function apiRequest(
    method: string,
    url: string,
    data?: unknown | undefined,
): Promise<Response> {
    const headers = authHeaders(data ? { "Content-Type": "application/json" } : undefined);
    const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
    on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
    ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
        const res = await fetch(queryKey.join("/") as string, {
            headers: authHeaders(),
            credentials: "include",
        });

        if (res.status === 401) {
            // Always clear the token on 401 - this fires the redirect for
            // any auth-gated page. Then either suppress or surface based
            // on the caller's preference.
            clearAccessToken();
            if (unauthorizedBehavior === "returnNull") return null;
            throw new Error("401: Session expired. Please log in again.");
        }

        await throwIfResNotOk(res);
        return await res.json();
    };

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
