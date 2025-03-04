import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeFormat from 'rehype-format';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkEmoji from 'remark-emoji';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkToc from 'remark-toc';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';
import matter from 'gray-matter';

/**
 * Configuration options for the markdown parser.
 */
export interface MarkdownOptions {
	/**
	 * Enable GitHub Flavored Markdown syntax support.
	 * Includes tables, strikethrough, tasklists, and more.
	 * @default true
	 */
	gfm?: boolean;

	/**
	 * Enable syntax highlighting for code blocks.
	 * Uses rehype-highlight under the hood.
	 * @default true
	 */
	highlight?: boolean;

	/**
	 * Enable emoji shortcode conversion to unicode characters.
	 * @default true
	 */
	emoji?: boolean;

	/**
	 * Generate a table of contents from headings.
	 * Uses remark-toc plugin.
	 * @default false
	 */
	toc?: boolean;

	/**
	 * Enable math formula rendering support.
	 * Uses remark-math plugin.
	 * @default false
	 */
	math?: boolean;

	/**
	 * Add anchor links to headings for easy linking.
	 * Uses rehype-slug and rehype-autolink-headings.
	 * @default true
	 */
	headingAnchors?: boolean;

	/**
	 * Level of HTML sanitization to apply:
	 * - 'strict': Most restrictive, only basic HTML allowed
	 * - 'balanced': Allows common HTML with some attributes
	 * - 'permissive': Allows most tags including iframe and script (use with caution)
	 * - 'none': No sanitization (unsafe for user-generated content)
	 * @default 'balanced'
	 */
	sanitizationLevel?: 'strict' | 'balanced' | 'permissive' | 'none';

	/**
	 * Custom CSS classes to apply to specific HTML elements.
	 * Keys are HTML tag names, values are space-separated class names.
	 * @example { 'h1': 'title main-title', 'p': 'content' }
	 * @default {}
	 */
	cssClasses?: Record<string, string>;
}

/**
 * Default options for markdown parsing.
 */
const defaultOptions: MarkdownOptions = {
	gfm: true,
	highlight: true,
	emoji: true,
	toc: false,
	math: false,
	headingAnchors: true,
	sanitizationLevel: 'balanced',
	cssClasses: {}
};

/**
 * Extended sanitization schema for balanced security level.
 * Allows more attributes and tags than the default schema.
 */
const extendedSchema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		'*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'id', 'data-*']
	},
	tagNames: [...(defaultSchema.tagNames || []), 'kbd', 'mark', 'svg', 'path']
};

/**
 * Applies custom CSS classes to HTML elements in the syntax tree.
 *
 * @param tree - The rehype syntax tree
 * @param cssClasses - Object mapping HTML tag names to CSS class names
 */
function applyCustomClasses(tree: any, cssClasses: Record<string, string>): void {
	visit(tree, 'element', (node: any) => {
		if (cssClasses[node.tagName]) {
			node.properties = node.properties || {};
			const existingClasses = Array.isArray(node.properties.className)
				? node.properties.className
				: node.properties.className
					? [node.properties.className]
					: [];

			node.properties.className = [
				...existingClasses,
				...cssClasses[node.tagName].split(' ')
			].filter(Boolean);
		}
	});
}

/**
 * Parses markdown content into HTML with customizable processing options.
 *
 * This function processes markdown through a unified.js pipeline with configurable
 * plugins and transformations. The pipeline includes parsing, plugin processing,
 * sanitization, and HTML generation.
 *
 * @param content - The markdown content to parse
 * @param options - Options to customize the markdown parsing behavior
 * @returns A promise resolving to the processed HTML string
 *
 * @example
 * // Basic usage with default options
 * const html = await parseMarkdown('# Hello world');
 *
 * @example
 * // With custom options
 * const html = await parseMarkdown('# Table of Contents\n\n## Section 1\n\nContent', {
 *   toc: true,
 *   highlight: true,
 *   cssClasses: { 'h1': 'page-title', 'p': 'content' }
 * });
 */
export async function parseMarkdown(
	content: string,
	options: MarkdownOptions = {}
): Promise<string> {
	const opts = { ...defaultOptions, ...options };

	// Start building the processor pipeline
	let processor = unified().use(remarkParse);

	// Add remark plugins conditionally
	// @ts-ignore
	if (opts.gfm) processor = processor.use(remarkGfm);
	// @ts-ignore
	if (opts.emoji) processor = processor.use(remarkEmoji);
	// @ts-ignore
	if (opts.toc) processor = processor.use(remarkToc, { tight: true, ordered: false });
	// @ts-ignore
	if (opts.math) processor = processor.use(remarkMath);

	// Convert from remark to rehype
	// @ts-ignore
	processor = processor.use(remarkRehype, { allowDangerousHtml: true });

	// Add rehype plugins
	// @ts-ignore
	processor = processor.use(rehypeFormat);

	// Add heading anchors if enabled
	if (opts.headingAnchors) {
		// @ts-ignore
		processor = processor.use(rehypeSlug);
		// @ts-ignore
		processor = processor.use(rehypeAutolinkHeadings, {
			behavior: 'append',
			content: h('span.anchor-icon', '#')
		});
	}

	// Add syntax highlighting if enabled
	if (opts.highlight) {
		// @ts-ignore
		processor = processor.use(rehypeHighlight, { ignoreMissing: true });
	}

	// Add sanitization based on security level
	if (opts.sanitizationLevel !== 'none') {
		let schema;
		switch (opts.sanitizationLevel) {
			case 'balanced':
				schema = extendedSchema;
				break;
			case 'permissive':
				schema = {
					...extendedSchema,
					tagNames: [...(extendedSchema.tagNames || []), 'iframe', 'script']
				};
				break;
			default: // strict
				schema = defaultSchema;
		}
		// @ts-ignore
		processor = processor.use(rehypeSanitize, schema);
	}

	// Add custom CSS classes if provided
	if (Object.keys(opts.cssClasses || {}).length > 0) {
		processor = processor.use(() => (tree: any) => applyCustomClasses(tree, opts.cssClasses || {}));
	}

	// Stringify the final result
	// @ts-ignore
	processor = processor.use(rehypeStringify);

	// Process the content
	const result = await processor.process(content);
	return String(result);
}

/**
 * Extracts frontmatter from markdown content and returns it along with the cleaned markdown.
 *
 * This function uses gray-matter to parse YAML, JSON, or TOML frontmatter from
 * markdown documents. Frontmatter must be enclosed between delimiter lines (typically '---').
 *
 * @param content - Markdown content with frontmatter
 * @returns A tuple containing [frontmatter data object, markdown content without frontmatter]
 *
 * @example
 * // Input:
 * // ---
 * // title: Hello World
 * // author: Jane Doe
 * // ---
 * // # Hello World
 * // This is a markdown document.
 *
 * const [frontmatter, markdown] = extractFrontmatter(input);
 * // frontmatter = { title: 'Hello World', author: 'Jane Doe' }
 * // markdown = '# Hello World\nThis is a markdown document.'
 */
export function extractFrontmatter(content: string): [Record<string, any>, string] {
	const { data, content: markdownContent } = matter(content);
	return [data, markdownContent];
}
