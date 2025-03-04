import { env } from '$env/dynamic/private';
import { importSPKI, jwtVerify } from 'jose';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Validates a JWT access token against the public key
 *
 * @param jwt The JWT token to validate
 * @returns The decoded payload if valid
 * @throws Error if token is invalid or about to expire
 */
export async function ValidateAccess(jwt: string) {
	const spki = env.spki || '';
	const alg = env.alg || 'RS256';
	const publicKey = await importSPKI(spki, alg);

	const { payload } = await jwtVerify(jwt, publicKey, {
		issuer: 'auth:auth'
		// Consider adding audience validation for additional security
		// audience: 'your-app-audience'
	});

	const EXPIRY_BUFFER = 30; // seconds
	if (payload.exp && typeof payload.exp === 'number') {
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp - now < EXPIRY_BUFFER) {
			throw new Error('Token about to expire');
		}
	}

	return payload;
}

/**
 * Refreshing state flags to prevent multiple simultaneous refresh attempts
 * Using a Map to track refresh state by session/user
 */
const refreshingStates = new Map<string, boolean>();

/**
 * Handles token refresh when the access token is invalid or expired
 *
 * @param event The SvelteKit request event
 * @param sessionId A unique identifier for the current session (to prevent race conditions)
 * @returns The validated user payload or null if refresh fails
 * @throws Redirects to login if refresh fails
 */
export async function handleTokenRefresh(event: RequestEvent, sessionId: string = 'default') {
	// Check if already refreshing for this session
	if (refreshingStates.get(sessionId)) {
		// Wait for the other refresh to complete (with timeout)
		let attempts = 0;
		while (refreshingStates.get(sessionId) && attempts < 30) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			attempts++;
		}

		// If we still have a valid token after waiting, use it
		const accessToken = event.cookies.get('accessToken');
		if (accessToken) {
			try {
				return await ValidateAccess(accessToken);
			} catch (error) {
				// Token still invalid after waiting, continue with refresh
			}
		}
	}

	// Set refreshing state
	refreshingStates.set(sessionId, true);

	try {
		const refreshToken = event.cookies.get('refreshToken');
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		const refreshRes = await event.fetch('/auth/refresh', {
			headers: {
				Cookie: `refreshToken=${refreshToken}`,
				Accept: 'application/json'
			}
		});

		if (!refreshRes.ok) {
			throw new Error(`Refresh failed with status: ${refreshRes.status}`);
		}

		const newAccessToken = event.cookies.get('accessToken');
		if (!newAccessToken) {
			throw new Error('No new access token provided after refresh');
		}

		return await ValidateAccess(newAccessToken);
	} catch (error) {
		console.error('Token refresh failed:', error);
		throw redirect(302, '/auth/login');
	} finally {
		// Clear refreshing state
		refreshingStates.delete(sessionId);
	}
}

/**
 * Gets the authenticated user from the access token or refresh token
 *
 * @param event The SvelteKit request event
 * @returns The authenticated user payload or null if no valid token
 * @throws Redirects to login if refresh fails
 */
export async function getUserFromToken(event: RequestEvent): Promise<any> {
	const accessToken = event.cookies.get('accessToken');

	// Generate a session ID from the request for race condition prevention
	const sessionId =
		event.request.headers.get('x-session-id') || event.cookies.get('sessionId') || 'default';

	if (accessToken) {
		try {
			// Try to validate the current access token
			return await ValidateAccess(accessToken);
		} catch (error) {
			// Token is invalid, try refresh if we have a refresh token
			if (event.cookies.get('refreshToken')) {
				return await handleTokenRefresh(event, sessionId);
			}
		}
	} else if (event.cookies.get('refreshToken')) {
		// No access token but we have a refresh token
		return await handleTokenRefresh(event, sessionId);
	}

	// No valid tokens
	return null;
}

/**
 * Checks if the current request has a valid authentication token
 *
 * @param event The SvelteKit request event
 * @returns True if the user is authenticated
 */
export async function isAuthenticated(event: RequestEvent): Promise<boolean> {
	try {
		const user = await getUserFromToken(event);
		return !!user;
	} catch (error) {
		return false;
	}
}

/**
 * Requires authentication for a route, redirecting to login if not authenticated
 *
 * @param event The SvelteKit request event
 * @returns The authenticated user payload
 * @throws Redirects to login if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<any> {
	const user = await getUserFromToken(event);

	if (!user) {
		const returnUrl = event.url.pathname + event.url.search;
		throw redirect(302, `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
	}

	return user;
}
