/**
 * Verifies a Cloudflare Turnstile token by sending a verification request to Cloudflare's API
 *
 * This function helps protect your application from spam and abuse by validating
 * that the user has successfully completed the Turnstile challenge.
 *
 * @param turnstileToken - The token received from the Turnstile widget on the client side
 * @param cloudflareSecret - Your Cloudflare Turnstile secret key
 *
 * @returns A Response object from the Cloudflare API with verification results
 * @throws Error if the verification request fails with a non-200 status code
 *
 * @example
 * ```typescript
 * try {
 *   const result = await turnstileVerify(token, process.env.CLOUDFLARE_SECRET);
 *   const data = await result.json();
 *
 *   if (data.success) {
 *     // Token is valid, proceed with form submission
 *   } else {
 *     // Token is invalid, show error message
 *     console.error("Verification failed:", data.error-codes);
 *   }
 * } catch (error) {
 *   console.error("Error verifying token:", error);
 * }
 * ```
 */
export const turnstileVerify = async (turnstileToken: string, cloudflareSecret: string) => {
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			secret: cloudflareSecret,
			response: turnstileToken
		})
	});

	if (!response.ok) {
		throw new Error(`Turnstile verification failed: ${response.status}`);
	}

	return response;
};
