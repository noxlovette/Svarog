<!-- 
  SEO.svelte - Search Engine Optimization Component
  
  This component manages metadata for SEO, Open Graph, and JSON-LD schemas
  to improve search engine visibility, social media sharing, and structured data.
  
  @component
  @example
    <SEO
      title="Dashboard | Svarog"
      description="Access your application dashboard."
      keywords="dashboard, web application, svarog"
    />
-->
<script lang="ts">
	/**
	 * Schema structured data configuration.
	 */
	export interface SchemaConfig {
		/**
		 * Type of schema to use (e.g., WebApplication, Organization, etc.).
		 * @default "WebApplication"
		 */
		type?: string;

		/**
		 * Version of the application or service.
		 * @default "1.0.0"
		 */
		version?: string;

		/**
		 * Application category according to schema.org.
		 * @default "EducationalApplication"
		 */
		category?: string;

		/**
		 * List of features as a comma-separated string.
		 */
		featureList?: string;

		/**
		 * Date the application was published (ISO format).
		 */
		publishDate?: string;

		/**
		 * URL to screenshot of the application.
		 */
		screenshot?: string | null;

		/**
		 * Author organization or person name.
		 */
		authorName?: string;

		/**
		 * Author organization or person URL.
		 */
		authorUrl?: string;

		/**
		 * Operating system the application runs on.
		 * @default "All"
		 */
		operatingSystem?: string;

		/**
		 * Whether to include schema data.
		 * @default true
		 */
		enabled?: boolean;
	}

	/**
	 * Open Graph configuration.
	 */
	export interface OpenGraphConfig {
		/**
		 * Type of content (website, article, product, etc.).
		 * @default "website"
		 */
		type?: string;

		/**
		 * Locale for the content.
		 * @default "en_GB"
		 */
		locale?: string;

		/**
		 * Whether to include Open Graph data.
		 * @default true
		 */
		enabled?: boolean;
	}

	/**
	 * Component props for SEO metadata.
	 */
	export interface SEOProps {
		/**
		 * Page title (will be displayed in browser tab).
		 * @default "Ogonek"
		 */
		title?: string;

		/**
		 * Page description for search engines.
		 * @default "Ogonek. The digital classroom for private teachers."
		 */
		description?: string;

		/**
		 * Keywords for search engines, comma-separated.
		 * @default "education, teach, English, classroom management, teaching, learning"
		 */
		keywords?: string;

		/**
		 * Robots directive for search engines.
		 * @default "index, follow"
		 */
		robots?: string;

		/**
		 * Open Graph title (for social media sharing).
		 * If not provided, falls back to title.
		 */
		ogTitle?: string;

		/**
		 * URL for the Open Graph object (current page).
		 * @default "https://ogonek.noxlovette.com"
		 */
		ogUrl?: string;

		/**
		 * Image URL for social media shares.
		 * @default "https://ogonek.noxlovette.com/images/og.png"
		 */
		ogImage?: string;

		/**
		 * Optional canonical URL for the page.
		 */
		canonical?: string;

		/**
		 * Twitter card type.
		 * @default "summary_large_image"
		 */
		twitterCard?: string;

		/**
		 * Twitter username (without @).
		 */
		twitterSite?: string;

		/**
		 * Open Graph configuration.
		 */
		og?: OpenGraphConfig;

		/**
		 * Schema.org structured data configuration.
		 */
		schema?: SchemaConfig;
	}

	/**
	 * Component props with default values.
	 */
	let {
		// Basic SEO
		title = 'Svarog',
		description = 'A customizable web application framework.',
		keywords = 'web, application, framework, javascript, typescript',
		robots = 'index, follow',
		canonical,

		// Open Graph
		ogTitle,
		ogUrl = 'https://example.com',
		ogImage = 'https://example.com/images/og.png',

		// Twitter
		twitterCard = 'summary_large_image',
		twitterSite,

		// Configuration objects
		og = {},
		schema = {}
	}: SEOProps = $props();

	// Compute derived values
	const ogConfig: Required<OpenGraphConfig> = {
		type: og.type || 'website',
		locale: og.locale || 'en_GB',
		enabled: og.enabled !== false
	};

	const schemaConfig: Required<SchemaConfig> = {
		type: schema.type || 'WebApplication',
		version: schema.version || '1.0.0',
		category: schema.category || 'WebApplication',
		featureList: schema.featureList || 'Feature 1, Feature 2, Feature 3',
		publishDate: schema.publishDate || new Date().toISOString().split('T')[0],
		screenshot: schema.screenshot || null,
		authorName: schema.authorName || 'Your Organization',
		authorUrl: schema.authorUrl || 'https://example.com',
		operatingSystem: schema.operatingSystem || 'All',
		enabled: schema.enabled !== false
	};

	// For Open Graph, use the provided ogTitle or fall back to title
	ogTitle = ogTitle || title;

	/**
	 * Builds the JSON-LD schema based on configuration.
	 */
	function buildSchema() {
		const baseSchema = {
			'@context': 'http://schema.org',
			'@type': schemaConfig.type,
			name: title,
			url: ogUrl,
			description: description
		};

		if (schemaConfig.type === 'WebApplication') {
			return {
				...baseSchema,
				applicationCategory: schemaConfig.category,
				operatingSystem: schemaConfig.operatingSystem,
				...(schemaConfig.screenshot && { screenshot: schemaConfig.screenshot }),
				featureList: schemaConfig.featureList,
				softwareVersion: schemaConfig.version,
				author: {
					'@type': 'Organization',
					name: schemaConfig.authorName,
					url: schemaConfig.authorUrl
				},
				datePublished: schemaConfig.publishDate
			};
		}

		return baseSchema;
	}

	/**
	 * The structured data as a JSON string.
	 */
	const structuredData = JSON.stringify(buildSchema(), null, 2);
</script>

<svelte:head>
	<!-- Basic SEO metadata -->
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	<meta name="robots" content={robots} />

	{#if canonical}
		<link rel="canonical" href={canonical} />
	{/if}

	<!-- Open Graph metadata for social sharing -->
	{#if ogConfig.enabled}
		<meta property="og:locale" content={ogConfig.locale} />
		<meta property="og:title" content={ogTitle} />
		<meta property="og:description" content={description} />
		<meta property="og:url" content={ogUrl} />
		<meta property="og:image" content={ogImage} />
		<meta property="og:type" content={ogConfig.type} />
	{/if}

	<!-- Twitter Card metadata -->
	{#if twitterCard}
		<meta name="twitter:card" content={twitterCard} />
		<meta name="twitter:title" content={ogTitle} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:image" content={ogImage} />
		{#if twitterSite}
			<meta name="twitter:site" content={`@${twitterSite}`} />
		{/if}
	{/if}

	<!-- JSON-LD structured data for rich results -->
	{#if schemaConfig.enabled}
		<script type="application/ld+json">
        {structuredData}
		</script>
	{/if}
</svelte:head>
