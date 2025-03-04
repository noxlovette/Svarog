/**
 * Standard error response structure for API errors.
 *
 * @interface ApiErrorResponse
 * @property {Object} error - Error information container
 * @property {string} error.message - Human-readable error message
 * @property {number} error.code - Numeric error code for programmatic handling
 */
export interface ApiErrorResponse {
	error: {
		message: string;
		code: number;
	};
}

/**
 * Union type representing either a successful or failed API response.
 *
 * @template T The expected data type for successful responses
 * @typedef {Object} ApiResult
 */
export type ApiResult<T> =
	| { success: true; data: T }
	| { success: false; status: number; message: string };

/**
 * Response type for user signup operations.
 *
 * @interface SignupResponse
 * @property {string} id - Unique identifier for the newly created user
 */
export interface SignupResponse {
	id: string;
}

/**
 * Response type for resource creation operations.
 *
 * @interface NewResponse
 * @property {string} id - Unique identifier for the newly created resource
 */
export interface NewResponse {
	id: string;
}

/**
 * Response type for authentication operations.
 *
 * @interface AuthResponse
 * @property {string} accessToken - JWT or similar token for API access
 * @property {string} [refreshToken] - Optional token used to obtain new access tokens
 */
export interface AuthResponse {
	accessToken: string;
	refreshToken?: string;
}

/**
 * Empty response type for operations that don't return data.
 *
 * @typedef {Object} EmptyResponse
 */
export type EmptyResponse = Record<string, never>;

/**
 * Response type for file upload operations.
 *
 * @interface UploadResponse
 * @property {string} filePath - Path or URL to the uploaded file
 */
export interface UploadResponse {
	filePath: string;
}

/**
 * Processes HTTP responses and converts them into a consistent ApiResult format.
 *
 * This utility handles different response scenarios:
 * - Error responses (non-2xx status codes)
 * - Empty responses (204 No Content)
 * - JSON data responses
 *
 * @template T The expected data type for successful responses
 * @param {Response} response - The fetch Response object to process
 * @returns {Promise<ApiResult<T>>} A promise resolving to a typed ApiResult
 *
 * @example
 * // Get user profile
 * const response = await fetch('/api/user/profile');
 * const result = await handleApiResponse<UserProfile>(response);
 *
 * if (isSuccessResponse(result)) {
 *   const profile = result.data;
 *   // Handle successful response
 * } else {
 *   // Handle error: result.message, result.status
 * }
 */
export async function handleApiResponse<T>(response: Response): Promise<ApiResult<T>> {
	if (!response.ok) {
		const errorData = (await response.json()) as ApiErrorResponse;
		return {
			success: false,
			status: response.status,
			message: errorData.error.message
		};
	}

	// For 204 No Content
	if (response.status === 204) {
		return { success: true, data: {} as T };
	}

	// For responses with content
	const data = (await response.json()) as T;
	return { success: true, data };
}

/**
 * Type guard to check if an ApiResult represents a successful response.
 *
 * This function helps with TypeScript type narrowing, allowing you to safely
 * access the data property only when a response is successful.
 *
 * @template T The expected data type for successful responses
 * @param {ApiResult<T>} response - The API result to check
 * @returns {boolean} True if the response is successful, false otherwise
 *
 * @example
 * const result = await handleApiResponse<UserData>(response);
 *
 * if (isSuccessResponse(result)) {
 *   // TypeScript now knows result.data exists and is of type UserData
 *   const userData = result.data;
 * } else {
 *   // TypeScript now knows result has status and message properties
 *   console.error(`Error ${result.status}: ${result.message}`);
 * }
 */
export function isSuccessResponse<T>(
	response: ApiResult<T>
): response is { success: true; data: T } {
	return response.success === true;
}

/**
 * Generic response type mapper for mapping API responses to specific types.
 *
 * This utility type allows you to create responses that combine common API
 * success/error patterns with specific data types.
 *
 * @template T The specific response data type
 */
export type ApiResponse<T> = ApiResult<T>;

/**
 * Creates a typed API client function for a specific endpoint and response type.
 *
 * @template T The expected response data type
 * @param {string} endpoint - The API endpoint URL
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<ApiResult<T>>} A promise resolving to a typed API result
 *
 * @example
 * // Create typed API fetchers
 * const getUser = (id: string) => createApiRequest<UserProfile>(`/api/users/${id}`);
 * const createPost = (data: PostInput) => createApiRequest<PostResponse>('/api/posts', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data)
 * });
 */
export async function createApiRequest<T>(
	endpoint: string,
	options?: RequestInit
): Promise<ApiResult<T>> {
	try {
		const response = await fetch(endpoint, options);
		return handleApiResponse<T>(response);
	} catch (error) {
		return {
			success: false,
			status: 0,
			message: error instanceof Error ? error.message : 'Unknown network error'
		};
	}
}
