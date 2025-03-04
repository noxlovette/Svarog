/**
 * Action result representing a successful operation.
 *
 * @interface ActionResultSuccess
 * @property {string} type - Always 'success' for this result type
 * @property {number} status - HTTP status code (typically 200-299)
 * @property {Record<string, any>} [data] - Optional data returned from the action
 */
export type ActionResultSuccess = {
	type: 'success';
	status: number;
	data?: Record<string, any>;
};

/**
 * Action result representing a redirect operation.
 *
 * @interface ActionResultRedirect
 * @property {string} type - Always 'redirect' for this result type
 * @property {number} status - HTTP status code (typically 302, 303, or 307)
 * @property {string} location - URL to redirect to
 */
export type ActionResultRedirect = {
	type: 'redirect';
	status: number;
	location: string;
};

/**
 * Action result representing a failed operation (handled error).
 *
 * @interface ActionResultFailure
 * @property {string} type - Always 'failure' for this result type
 * @property {number} status - HTTP status code (typically 400-499)
 * @property {Record<string, any>} [data] - Optional error details
 */
export type ActionResultFailure = {
	type: 'failure';
	status: number;
	data?: Record<string, any>;
};

/**
 * Action result representing an unhandled error.
 *
 * @interface ActionResultError
 * @property {string} type - Always 'error' for this result type
 * @property {number} [status] - Optional HTTP status code (typically 500)
 * @property {Error} [error] - Optional JavaScript Error object
 */
export type ActionResultError = {
	type: 'error';
	status?: number;
	error?: Error;
};

/**
 * Union type for all possible action results.
 *
 * @typedef {Object} CustomActionResult
 */
export type CustomActionResult =
	| ActionResultSuccess
	| ActionResultRedirect
	| ActionResultFailure
	| ActionResultError;

/**
 * Configuration for notification messages based on result types.
 *
 * @interface MessageConfig
 * @property {string} [success] - Message to show on successful operations
 * @property {string} [redirect] - Message to show before redirects
 * @property {string} [failure] - Message to show on handled failures
 * @property {string} [error] - Message to show on unhandled errors
 * @property {string} [defaultError] - Fallback message when specific error message isn't available
 */
export type MessageConfig = {
	success?: string;
	redirect?: string;
	failure?: string;
	error?: string;
	defaultError?: string;
};

/**
 * Configuration for custom handlers based on result types.
 *
 * @interface HandlerConfig
 * @property {Function} [success] - Handler for successful operations
 * @property {Function} [redirect] - Handler for redirect operations
 * @property {Function} [failure] - Handler for handled failures
 * @property {Function} [error] - Handler for unhandled errors
 */
export type HandlerConfig = {
	success?: (result: ActionResultSuccess) => Promise<void> | void;
	redirect?: (result: ActionResultRedirect) => Promise<void> | void;
	failure?: (result: ActionResultFailure) => Promise<void> | void;
	error?: (result: ActionResultError) => Promise<void> | void;
};

/**
 * Configuration options for the enhanceForm function.
 *
 * @interface EnhanceConfig
 * @property {MessageConfig} [messages] - Notification messages configuration
 * @property {HandlerConfig} [handlers] - Custom handlers configuration
 * @property {boolean|string} [navigate] - Navigation behavior after form submission
 *   - If true: Navigate to the URL in result.location
 *   - If string: Navigate to the specified URL
 *   - If false: Don't navigate
 * @property {boolean} [shouldUpdate] - Whether to update the form after submission
 * @property {Object} [isLoadingStore] - Store to track loading state
 * @property {Function} isLoadingStore.true - Function to set loading state to true
 * @property {Function} isLoadingStore.false - Function to set loading state to false
 * @property {Object} [notificationStore] - Store to display notifications
 * @property {Function} notificationStore.set - Function to set notification message and type
 */
export type EnhanceConfig = {
	messages?: MessageConfig;
	handlers?: HandlerConfig;
	navigate?: boolean | string;
	shouldUpdate?: boolean;
	isLoadingStore?: { true: () => void; false: () => void };
	notificationStore?: { set: (notification: { message: string; type: string }) => void };
};

/**
 * Enhanced form handling function for SvelteKit forms.
 *
 *
 * This utility wraps SvelteKit's form actions with standardized error handling,
 * loading states, notifications, and navigation. It provides a consistent way to
 * handle different result types (success, redirect, failure, error) across your
 * application.
 *
 * @param {EnhanceConfig} config - Configuration options
 * @returns {SubmitFunction} A SvelteKit-compatible submit function
 *
 * @example
 * // Basic usage
 * const enhance = enhanceForm({
 *   messages: {
 *     success: 'Your changes were saved',
 *     defaultError: 'Could not save changes'
 *   }
 * });
 *
 * // Usage with navigation and notifications
 * const enhance = enhanceForm({
 *   navigate: '/dashboard',
 *   notificationStore: notificationStore,
 *   isLoadingStore: loadingStore
 * });
 *
 * // In your Svelte component:
 * <form method="POST" use:enhance>
 *   <!-- form fields -->
 * </form>
 */
import type { SubmitFunction } from '@sveltejs/kit';
type SubmitFunctionArgs = Parameters<SubmitFunction>[0];
export function enhanceForm(config: EnhanceConfig = {}): SubmitFunction {
	const {
		messages = {},
		handlers = {},
		navigate = false,
		shouldUpdate = true,
		isLoadingStore,
		notificationStore
	} = config;

	return ({ formElement, formData, action, cancel, submitter }: SubmitFunctionArgs) => {
		// Start loading
		if (isLoadingStore) {
			isLoadingStore.true();
		}

		return async ({ result, update }: { result: CustomActionResult; update: () => void }) => {
			// End loading regardless of result
			if (isLoadingStore) {
				isLoadingStore.false();
			}

			// Extract error message based on result type
			const getErrorMessage = () => {
				if (result.type === 'failure' && result.data?.message) {
					return String(result.data.message);
				} else if (result.type === 'error' && result.error?.message) {
					return String(result.error.message);
				}
				return messages.defaultError || 'Something went wrong';
			};

			// Show notification if the notification store is provided
			const showNotification = (message: string, type: string) => {
				if (notificationStore) {
					notificationStore.set({ message, type });
				}
			};

			// Handle the result
			switch (result.type) {
				case 'success':
					// Show success notification if provided
					if (messages.success) {
						showNotification(messages.success, 'success');
					}
					// Call success handler if provided
					if (handlers.success) {
						await handlers.success(result);
					}
					break;

				case 'redirect':
					// Show redirect notification if provided
					if (messages.redirect) {
						showNotification(messages.redirect, 'success');
					}
					// Call redirect handler if provided
					if (handlers.redirect) {
						await handlers.redirect(result);
					}
					// Update the form if requested
					if (shouldUpdate) {
						update();
					}
					// Navigate if requested
					if (typeof window !== 'undefined' && typeof navigate !== 'undefined') {
						const goto = async (path: string) => {
							try {
								// Try to use SvelteKit's goto if available
								const { goto: svelteGoto } = await import('$app/navigation');
								await svelteGoto(path);
							} catch (e) {
								// Fallback to window.location if $app/navigation is not available
								window.location.href = path;
							}
						};

						if (navigate === true) {
							await goto(result.location);
						} else if (typeof navigate === 'string') {
							await goto(navigate);
						}
					}
					break;

				case 'failure':
					// Show failure notification
					showNotification(messages.failure || getErrorMessage(), 'error');
					// Call failure handler if provided
					if (handlers.failure) {
						await handlers.failure(result);
					}
					break;

				case 'error':
					// Show error notification
					showNotification(messages.error || getErrorMessage(), 'error');
					// Call error handler if provided
					if (handlers.error) {
						await handlers.error(result);
					}
					break;
			}
		};
	};
}
