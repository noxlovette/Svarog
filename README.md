# Svarog Toolbox

[![npm version](https://badge.fury.io/js/svarog.svg)](https://badge.fury.io/js/svarog)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive collection of TypeScript utilities for modern web development, focusing on API interactions, authentication, form handling, validation, and more. Designed to streamline development workflows with well-documented, type-safe functions.

## Installation

```bash
npm install svarog
```

or

```bash
pnpm add svarog
```

## Features

- 🔄 **API Utilities**: Standardized API response handling with type-safe results
- 🔐 **Authentication**: JWT validation and token refresh mechanisms
- 🍪 **Cookie Management**: Utilities for handling HTTP cookies
- 📝 **Form Handling**: Enhanced form processing with validation and submission handling
- ✅ **Validation**: Comprehensive form validation functions
- 📄 **Markdown Processing**: Powerful markdown parsing with customizable options
- 🕒 **Date & Time Formatting**: Flexible date/time display options
- 🔄 **Turnstile Integration**: Cloudflare Turnstile verification support

## Usage Examples

### API Response Handling

```typescript
import { handleApiResponse, isSuccessResponse } from 'svarog/api';

// Get user profile
async function fetchUserProfile(userId: string) {
	const response = await fetch(`/api/users/${userId}`);
	const result = await handleApiResponse<UserProfile>(response);

	if (isSuccessResponse(result)) {
		return result.data;
	} else {
		console.error(`Error ${result.status}: ${result.message}`);
		return null;
	}
}
```

### Form Validation

```typescript
import {
	validateEmail,
	validatePassword,
	validateMinLength,
	composeValidators
} from 'svarog/validation';

// Create a composite validator
const validateUsername = composeValidators(validateMinLength(3), (value) =>
	!/^[a-zA-Z0-9_]+$/.test(value)
		? 'Username can only contain letters, numbers, and underscores'
		: null
);

// Use in form submit handler
function handleSubmit(event) {
	const email = emailInput.value;
	const password = passwordInput.value;

	const emailError = validateEmail(email);
	const passwordError = validatePassword(password);

	if (emailError || passwordError) {
		// Handle validation errors
		return;
	}

	// Proceed with form submission
}
```

### Enhanced Form Handling in SvelteKit

```typescript
import { enhanceForm } from 'svarog/form';

// In your Svelte component
const enhance = enhanceForm({
  messages: {
    success: 'Your profile was updated successfully',
    defaultError: 'Could not update profile'
  },
  isLoadingStore: loadingStore,
  notificationStore: toastStore
});

// Use in your form
<form method="POST" use:enhance>
  <!-- form fields -->
</form>
```

### Date Formatting

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from 'svarog/time';

// Format a date with custom options
formatDate(new Date(), {
	year: true,
	month: 'long',
	day: true
}); // "March 6, 2025"

// Format relative time
formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
```

### Markdown Processing

```typescript
import { parseMarkdown, extractFrontmatter } from 'svarog/markdown';

// Parse markdown with custom options
const html = await parseMarkdown(markdownContent, {
	gfm: true,
	highlight: true,
	toc: true,
	headingAnchors: true
});

// Extract and use frontmatter
const [metadata, content] = extractFrontmatter(markdownWithFrontmatter);
```

### JWT Authentication

```typescript
import { getUserFromToken, requireAuth } from 'svarog/token';

// In a SvelteKit load function
export async function load({ event }) {
	// Get authenticated user or null
	const user = await getUserFromToken(event);

	return {
		user
	};
}

// For protected routes
export async function load({ event }) {
	// This will redirect to login if not authenticated
	const user = await requireAuth(event);

	return {
		user
	};
}
```

## API Reference

The package is organized into several modules:

- **api**: Type-safe API response handling utilities
- **cookies**: HTTP cookie management functions
- **form**: Enhanced form handling for SvelteKit
- **markdown**: Markdown parsing and processing tools
- **time**: Date and time formatting functions
- **token**: JWT authentication utilities
- **turnstile**: Cloudflare Turnstile verification
- **validation**: Form validation functions

Each module is thoroughly documented with JSDoc comments. For detailed API reference, please refer to the source code or the generated documentation.

## TypeScript Support

This package is written in TypeScript and includes comprehensive type definitions for all exported functions and interfaces.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
