// validation.ts
// A collection of validation functions for form inputs in Svelte applications

/**
 * Validates that a string has a minimum length
 * @param value The string to validate
 * @param minLength The minimum length required
 * @returns An error message if invalid, or null if valid
 */
export function validateMinLength(value: string, minLength: number): string | null {
	if (!value || value.trim().length < minLength) {
		return `Must be at least ${minLength} characters`;
	}
	return null;
}

/**
 * Validates an email address format
 * @param email The email address to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateEmail(email: string): string | null {
	// This regex matches the one in your PostgreSQL schema
	const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

	if (!email || !emailRegex.test(email)) {
		return 'Please enter a valid email address';
	}
	return null;
}

/**
 * Validates a password meets minimum security requirements
 * @param password The password to validate
 * @returns An error message if invalid, or null if valid
 */
export function validatePassword(password: string): string | null {
	if (!password) {
		return 'Password is required';
	}

	if (password.length < 8) {
		return 'Password must be at least 8 characters long';
	}

	// Check for at least one number
	if (!/\d/.test(password)) {
		return 'Password must contain at least one number';
	}

	// Check for at least one uppercase letter
	if (!/[A-Z]/.test(password)) {
		return 'Password must contain at least one uppercase letter';
	}

	// Check for at least one special character
	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
		return 'Password must contain at least one special character';
	}

	return null;
}

/**
 * Validates that two password fields match
 * @param password The main password
 * @param confirmPassword The confirmation password
 * @returns An error message if they don't match, or null if they match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
	if (password !== confirmPassword) {
		return 'Passwords do not match';
	}
	return null;
}

/**
 * Validates a username
 * @param username The username to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateUsername(username: string): string | null {
	if (!username) {
		return 'Username is required';
	}

	if (username.length < 3) {
		return 'Username must be at least 3 characters long';
	}

	// Only allow alphanumeric characters and underscores
	if (!/^[a-zA-Z0-9_]+$/.test(username)) {
		return 'Username can only contain letters, numbers, and underscores';
	}

	return null;
}

/**
 * Creates a validator that ensures a field has a value
 * @param fieldName The name of the field for the error message
 * @returns A validation function
 */
export function validateRequired(fieldName: string) {
	return function (value: any): string | null {
		if (!value || (typeof value === 'string' && value.trim() === '')) {
			return `${fieldName} is required`;
		}
		return null;
	};
}

/**
 * A type for validation functions
 */
export type ValidatorFn = (value: any) => string | null;

/**
 * Combines multiple validators into a single validator
 * @param validators An array of validator functions
 * @returns A function that runs all validators and returns the first error
 */
export function composeValidators(...validators: ValidatorFn[]) {
	return function (value: any): string | null {
		for (const validator of validators) {
			const error = validator(value);
			if (error) {
				return error;
			}
		}
		return null;
	};
}

/**
 * A reusable form validator that can be used with Svelte stores
 * @param initialValues The initial form values
 * @param validationSchema An object mapping field names to validator functions
 * @returns An object with validation methods and state
 */
export function createFormValidator<T extends Record<string, any>>(
	initialValues: T,
	validationSchema: Record<keyof T, ValidatorFn>
) {
	let values = { ...initialValues };
	let errors: Partial<Record<keyof T, string>> = {};
	let touched: Partial<Record<keyof T, boolean>> = {};

	function validateField(field: keyof T): string | null {
		const validator = validationSchema[field];
		if (!validator) return null;

		const error = validator(values[field]);
		errors = { ...errors, [field]: error };
		return error;
	}

	function validateAll(): boolean {
		let isValid = true;

		for (const field in validationSchema) {
			touched = { ...touched, [field]: true };
			const error = validateField(field as keyof T);
			if (error) {
				isValid = false;
			}
		}

		return isValid;
	}

	function handleChange(field: keyof T, value: any) {
		values = { ...values, [field]: value };
		if (touched[field]) {
			validateField(field);
		}
		return values;
	}

	function handleBlur(field: keyof T) {
		touched = { ...touched, [field]: true };
		validateField(field);
	}

	function resetForm() {
		values = { ...initialValues };
		errors = {};
		touched = {};
	}

	return {
		values,
		errors,
		touched,
		validateField,
		validateAll,
		handleChange,
		handleBlur,
		resetForm
	};
}

/**
 * Checks if a field has been modified by the user
 * @param initialValue The initial value
 * @param currentValue The current value
 * @returns True if the value has been modified
 */
export function isDirty<T>(initialValue: T, currentValue: T): boolean {
	if (typeof initialValue !== typeof currentValue) {
		return true;
	}

	if (typeof initialValue === 'object' && initialValue !== null) {
		// Handle arrays
		if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
			if (initialValue.length !== currentValue.length) {
				return true;
			}

			for (let i = 0; i < initialValue.length; i++) {
				if (isDirty(initialValue[i], currentValue[i])) {
					return true;
				}
			}

			return false;
		}

		// Handle objects
		const initialKeys = Object.keys(initialValue);
		const currentKeys = Object.keys(currentValue as object);

		if (initialKeys.length !== currentKeys.length) {
			return true;
		}

		for (const key of initialKeys) {
			if (
				isDirty(
					(initialValue as Record<string, any>)[key],
					(currentValue as Record<string, any>)[key]
				)
			) {
				return true;
			}
		}

		return false;
	}

	// Handle primitive values
	return initialValue !== currentValue;
}

/**
 * A simple debounce function for form inputs
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;

	return function (...args: Parameters<T>) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}

/**
 * A utility to check for unique values via API
 * @param apiEndpoint The API endpoint to check
 * @param field The field name to check
 * @returns A validation function that checks uniqueness
 */
export function validateUnique(apiEndpoint: string, field: string) {
	return async function (value: string): Promise<string | null> {
		if (!value) return null;

		try {
			const response = await fetch(`${apiEndpoint}?${field}=${encodeURIComponent(value)}`);
			const data = await response.json();

			if (data.exists) {
				return `This ${field} is already taken`;
			}

			return null;
		} catch (error) {
			console.error('Error checking uniqueness:', error);
			return `Unable to verify ${field} availability`;
		}
	};
}

/**
 * Validates a URL format
 * @param url The URL to validate
 * @param requireHttps Whether to require HTTPS protocol
 * @returns An error message if invalid, or null if valid
 */
export function validateUrl(url: string, requireHttps: boolean = false): string | null {
	if (!url) {
		return 'URL is required';
	}

	try {
		const urlObj = new URL(url);

		// Check if protocol is valid
		if (requireHttps && urlObj.protocol !== 'https:') {
			return 'URL must use HTTPS protocol';
		}

		// Make sure hostname exists
		if (!urlObj.hostname) {
			return 'Invalid URL format';
		}

		return null;
	} catch (error) {
		return 'Please enter a valid URL (e.g., https://example.com)';
	}
}

/**
 * Validates a phone number format
 * @param phone The phone number to validate
 * @param countryCode The expected country code format (default: international)
 * @returns An error message if invalid, or null if valid
 */
export function validatePhone(
	phone: string,
	countryCode: 'international' | 'us' | 'uk' | 'none' = 'international'
): string | null {
	if (!phone) {
		return 'Phone number is required';
	}

	// Remove common separators for validation
	const cleaned = phone.replace(/[\s\-\.()]/g, '');

	// Different regex patterns based on country code
	let isValid = false;
	let expectedFormat = '';

	switch (countryCode) {
		case 'us':
			// US format: XXX-XXX-XXXX (10 digits)
			isValid = /^1?\d{10}$/.test(cleaned);
			expectedFormat = 'XXX-XXX-XXXX';
			break;
		case 'uk':
			// UK format: Various formats with country code
			isValid = /^((\+44)|0)7\d{9}$/.test(cleaned);
			expectedFormat = '+44 XXXX XXXXXX or 07XXX XXXXXX';
			break;
		case 'none':
			// Just numbers, min 7 digits, max 15 digits (ITU-T recommendation)
			isValid = /^\d{7,15}$/.test(cleaned);
			expectedFormat = 'between 7 and 15 digits';
			break;
		case 'international':
		default:
			// International format: +CountryCode followed by digits
			isValid = /^\+[1-9]\d{1,14}$/.test(cleaned);
			expectedFormat = '+[country code][number]';
	}

	if (!isValid) {
		return `Please enter a valid phone number (${expectedFormat})`;
	}

	return null;
}

/**
 * Validates a date is within a specific range
 * @param date The date to validate (Date object or ISO string)
 * @param minDate The minimum allowed date (optional)
 * @param maxDate The maximum allowed date (optional)
 * @returns An error message if invalid, or null if valid
 */
export function validateDateRange(
	date: Date | string,
	minDate?: Date | string,
	maxDate?: Date | string
): string | null {
	if (!date) {
		return 'Date is required';
	}

	try {
		const dateObj = date instanceof Date ? date : new Date(date);

		// Check if date is valid
		if (isNaN(dateObj.getTime())) {
			return 'Invalid date format';
		}

		// Check minimum date if provided
		if (minDate) {
			const minDateObj = minDate instanceof Date ? minDate : new Date(minDate);
			if (dateObj < minDateObj) {
				return `Date must be on or after ${minDateObj.toLocaleDateString()}`;
			}
		}

		// Check maximum date if provided
		if (maxDate) {
			const maxDateObj = maxDate instanceof Date ? maxDate : new Date(maxDate);
			if (dateObj > maxDateObj) {
				return `Date must be on or before ${maxDateObj.toLocaleDateString()}`;
			}
		}

		return null;
	} catch (error) {
		return 'Invalid date';
	}
}

/**
 * Validates a file size is within limits
 * @param fileSize Size of the file in bytes
 * @param maxSizeInMB Maximum allowed size in megabytes
 * @returns An error message if invalid, or null if valid
 */
export function validateFileSize(fileSize: number, maxSizeInMB: number): string | null {
	if (!fileSize || fileSize <= 0) {
		return 'Invalid file size';
	}

	const fileSizeInMB = fileSize / (1024 * 1024);
	if (fileSizeInMB > maxSizeInMB) {
		return `File size exceeds maximum allowed size of ${maxSizeInMB} MB`;
	}

	return null;
}

/**
 * Validates a file type against a list of allowed extensions
 * @param fileName The name of the file
 * @param allowedExtensions Array of allowed file extensions (without the dot)
 * @returns An error message if invalid, or null if valid
 */
export function validateFileType(fileName: string, allowedExtensions: string[]): string | null {
	if (!fileName) {
		return 'Filename is required';
	}

	const extension = fileName.split('.').pop()?.toLowerCase() || '';

	if (!extension || !allowedExtensions.includes(extension)) {
		return `File type not allowed. Accepted types: ${allowedExtensions.join(', ')}`;
	}

	return null;
}

/**
 * Validates that a number is within a specified range
 * @param value The number to validate
 * @param min The minimum allowed value (optional)
 * @param max The maximum allowed value (optional)
 * @returns An error message if invalid, or null if valid
 */
export function validateNumberRange(value: number, min?: number, max?: number): string | null {
	if (value === undefined || value === null || isNaN(value)) {
		return 'Please enter a valid number';
	}

	if (min !== undefined && value < min) {
		return `Value must be greater than or equal to ${min}`;
	}

	if (max !== undefined && value > max) {
		return `Value must be less than or equal to ${max}`;
	}

	return null;
}

/**
 * Validates that a string matches a specific regex pattern
 * @param value The string to validate
 * @param pattern The regex pattern to match
 * @param errorMessage Custom error message
 * @returns The custom error message if invalid, or null if valid
 */
export function validatePattern(
	value: string,
	pattern: RegExp,
	errorMessage: string = 'Input format is invalid'
): string | null {
	if (!value) {
		return null; // Let required validation handle empty values
	}

	if (!pattern.test(value)) {
		return errorMessage;
	}

	return null;
}

/**
 * Validates a credit card number using the Luhn algorithm
 * @param cardNumber The credit card number to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateCreditCard(cardNumber: string): string | null {
	if (!cardNumber) {
		return 'Credit card number is required';
	}

	// Remove spaces and dashes
	const cleaned = cardNumber.replace(/[\s-]/g, '');

	// Check if contains only digits
	if (!/^\d+$/.test(cleaned)) {
		return 'Credit card number can only contain digits';
	}

	// Check length (most card types are between 13-19 digits)
	if (cleaned.length < 13 || cleaned.length > 19) {
		return 'Credit card number has an invalid length';
	}

	// Luhn algorithm (checksum)
	let sum = 0;
	let shouldDouble = false;

	// Loop from right to left
	for (let i = cleaned.length - 1; i >= 0; i--) {
		let digit = parseInt(cleaned.charAt(i));

		if (shouldDouble) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}

		sum += digit;
		shouldDouble = !shouldDouble;
	}

	if (sum % 10 !== 0) {
		return 'Invalid credit card number';
	}

	return null;
}
