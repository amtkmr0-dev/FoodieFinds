import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { clearAccessToken, getAccessToken, getStoredUser, type AuthUser } from "@/lib/auth";

/**
 * Auth gate for any page that requires a logged-in user.
 *
 * Returns the current user OR `null` while the redirect to `/signup` is in
 * flight. Pages should treat `null` as "render nothing yet" - typically:
 *
 *     const user = useRequireAuth();
 *     if (!user) return null;
 *
 * Why a hook (not a HOC or `<Protected>` wrapper)?
 * - Each page already manages its own state; one extra hook line is the
 *   smallest possible disruption.
 * - It re-evaluates on the `auth-changed` event dispatched by
 *   `setAccessToken` / `clearAccessToken`, so a 401 from anywhere in the
 *   app (which now clears the token) flips every guarded page to redirect.
 *
 * The redirect target is `/signup` because that's the OTP login route in
 * `App.tsx` (the page also handles fresh signups, hence the name).
 */
export function useRequireAuth(): AuthUser | null {
    const [, setLocation] = useLocation();
    const [user, setUser] = useState<AuthUser | null>(getStoredUser());

    useEffect(() => {
        // Re-read the auth state whenever login/logout fires.
        const sync = () => {
            const u = getStoredUser();
            setUser(u);
            if (!u || !getAccessToken()) {
                // Replace, not push — the back button shouldn't return to
                // the auth-gated page.
                setLocation("/signup", { replace: true });
            }
        };
        window.addEventListener("auth-changed", sync);

        // Initial check on mount.
        if (!user || !getAccessToken()) {
            setLocation("/signup", { replace: true });
        }

        return () => window.removeEventListener("auth-changed", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Surface null until both the user blob and the in-memory token agree.
    // This avoids a one-frame flash of authed UI right after a logout.
    return user && getAccessToken() ? user : null;
}

/**
 * Triggered by `queryClient.ts` whenever any API call returns 401. Clears
 * the in-memory token, which dispatches `auth-changed`, which fires the
 * redirect in every mounted `useRequireAuth` page.
 *
 * Exported for tests and for the very rare case where a non-react-query
 * code path needs to surface "session expired" UX without throwing.
 */
export function handleSessionExpired(): void {
    clearAccessToken();
}
