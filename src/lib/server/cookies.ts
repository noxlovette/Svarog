/**
 * Represents a Response object with extended headers that explicitly provides
 * cookie-specific methods.
 *
 * @typedef {Object} CookieResponse
 * @property {Object} headers - Extended Headers object with cookie methods
 * @property {function} headers.get - Gets a header value by name
 * @property {function} headers.getSetCookie - Returns all Set-Cookie headers as string array
 */

/**
 * Transfers Set-Cookie headers from one response to another.
 *
 * This utility copies all cookie headers from a source response (typically from
 * an authentication service) to a destination response (typically your main API response),
 * allowing cookie propagation across different services.
 *
 * @param {Response} originalResponse - The destination response that will receive the cookies
 * @param {CookieResponse} cookieResponse - The source response containing cookies to be transferred
 * @returns {Response} A new Response with headers from originalResponse plus all Set-Cookie headers from cookieResponse
 *
 * @example
 * // Transfer authentication cookies to your API response
 * const authResponse = await fetch('/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify(credentials)
 * });
 *
 * const apiResponse = new Response(JSON.stringify({ data: userProfile }), {
 *   headers: { 'Content-Type': 'application/json' }
 * });
 *
 * return setCookiesFromResponse(apiResponse, authResponse);
 */
export const setCookiesFromResponse = (
	originalResponse: Response,
	cookieResponse: CookieResponse
): Response => {
	const newResponse = new Response(originalResponse.body, originalResponse);
	const setCookieHeaders = cookieResponse.headers.getSetCookie();
	setCookieHeaders.forEach((cookie) => {
		newResponse.headers.append('set-cookie', cookie);
	});
	return newResponse;
};

/**
 * Standard options available for HTTP cookies.
 *
 * @typedef {Object} CookieOptions
 * @property {string} path - Cookie path (always defined, defaults to "/")
 * @property {boolean} [httpOnly] - Prevents client-side JavaScript from accessing the cookie
 * @property {boolean} [secure] - Cookie will only be sent over HTTPS
 * @property {"lax" | "strict" | "none"} [sameSite] - Controls cross-site request behavior
 * @property {string} [domain] - Cookie domain scope
 * @property {number} [maxAge] - Cookie lifetime in seconds
 */

/**
 * Parses an array of cookie directive strings into a structured CookieOptions object.
 *
 * This function normalizes and converts raw cookie option strings (typically extracted
 * from a Set-Cookie header) into a typed object with appropriate value conversions.
 *
 * @param {string[]} opts - Array of cookie option strings (e.g., ["Path=/", "HttpOnly"])
 * @returns {CookieOptions} A structured object with parsed cookie options
 *
 * @example
 * // Parse options from a Set-Cookie header
 * const setCookieHeader = "id=123; Path=/app; HttpOnly; SameSite=Strict; Max-Age=3600";
 * const optionsParts = setCookieHeader.split(';').slice(1).map(s => s.trim());
 * const options = parseCookieOptions(optionsParts);
 * // Result: { path: "/app", httpOnly: true, sameSite: "strict", maxAge: 3600 }
 */
export const parseCookieOptions = (opts: string[]): CookieOptions => {
	const options: CookieOptions = { path: '/' }; // Ensure path is always defined
	opts.forEach((opt) => {
		const [key, val] = opt.trim().split('=');
		const normalizedKey = key.toLowerCase().replace(/-/g, '');
		switch (normalizedKey) {
			case 'path':
				options.path = val || '/';
				break;
			case 'httponly':
				options.httpOnly = true;
				break;
			case 'secure':
				options.secure = true;
				break;
			case 'samesite':
				options.sameSite = val as 'lax' | 'strict' | 'none';
				break;
			case 'domain':
				options.domain = val;
				break;
			case 'maxage':
			case 'max-age':
				options.maxAge = val ? parseInt(val) : undefined;
				break;
		}
	});
	return options;
};

export type CookieResponse = Response & {
	headers: Headers & {
		get(name: 'set-cookie'): string | null;
		getSetCookie(): string[];
	};
};

export interface CookieOptions {
	path: string;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: 'lax' | 'strict' | 'none';
	domain?: string;
	maxAge?: number;
}
