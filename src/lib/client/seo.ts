import type { SEOProps } from '../components/SEO.svelte';

/**
 * Creates a reusable SEO configuration factory with site-wide defaults.
 *
 * This utility helps maintain consistent SEO metadata across multiple pages
 * while allowing page-specific customization. It's particularly useful for
 * larger applications where you want to ensure brand consistency and reduce
 * repetition in your SEO configuration.
 *
 * @param baseConfig - Site-wide default SEO configuration
 * @param baseConfig.siteName - The name of the site (used in title formatting)
 * @param baseConfig.baseUrl - The base URL of the site (e.g., "https://example.com")
 * @param baseConfig.defaultImage - Default image for social media shares
 * @param baseConfig.defaultDescription - Optional default meta description
 * @param baseConfig.defaultKeywords - Optional default keywords
 *
 * @returns A function that generates page-specific SEO props with the site defaults applied
 *
 * @example
 * // Create a site-wide SEO configuration
 * const seoConfig = createSEOConfig({
 *   siteName: 'Svarog',
 *   baseUrl: 'https://example.com',
 *   defaultImage: 'https://example.com/images/og.png',
 *   defaultDescription: 'A powerful web application framework'
 * });
 *
 * // Use in a specific page
 * const dashboardSEO = seoConfig({
 *   title: 'Dashboard',
 *   path: '/dashboard'
 * });
 *
 * // In your Svelte component
 * <SEO {...dashboardSEO} />
 */
export function createSEOConfig(baseConfig: {
	siteName: string;
	baseUrl: string;
	defaultImage: string;
	defaultDescription?: string;
	defaultKeywords?: string;
}) {
	/**
	 * Creates SEO props for a specific page using the site-wide defaults.
	 *
	 * @param pageConfig - Page-specific SEO configuration
	 * @param pageConfig.title - The page title (will be combined with siteName)
	 * @param pageConfig.description - Page-specific description (falls back to site default)
	 * @param pageConfig.path - Page path to be appended to baseUrl (e.g., "/about")
	 * @param pageConfig.image - Page-specific image (falls back to site default)
	 * @param pageConfig.keywords - Page-specific keywords (falls back to site default)
	 * @param pageConfig.ogType - Open Graph type (defaults to "website")
	 *
	 * @returns Partial SEO props that can be spread into the SEO component
	 *
	 * @example
	 * // With minimal configuration
	 * const pageSEO = seoConfig({
	 *   title: 'About Us'
	 * });
	 *
	 * // With full configuration
	 * const pageSEO = seoConfig({
	 *   title: 'Products',
	 *   description: 'Browse our product catalog',
	 *   path: '/products',
	 *   image: 'https://example.com/images/products.jpg',
	 *   keywords: 'products, catalog, items',
	 *   ogType: 'product'
	 * });
	 */
	return function createPageSEO(pageConfig: {
		title: string;
		description?: string;
		path?: string;
		image?: string;
		keywords?: string;
		ogType?: string;
	}): Partial<SEOProps> {
		const {
			title,
			description = baseConfig.defaultDescription || '',
			path = '',
			image = baseConfig.defaultImage,
			keywords = baseConfig.defaultKeywords || '',
			ogType = 'website'
		} = pageConfig;

		return {
			title: `${title} | ${baseConfig.siteName}`,
			description,
			keywords,
			ogTitle: `${title} | ${baseConfig.siteName}`,
			ogUrl: `${baseConfig.baseUrl}${path}`,
			ogImage: image,
			og: {
				type: ogType
			}
		};
	};
}
