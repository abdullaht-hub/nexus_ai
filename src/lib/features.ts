import { Feature, Client, ToolDefinition } from './types';

// Shared tools available to all features — Firecrawl web research
const sharedTools: ToolDefinition[] = [
    {
        name: 'firecrawl_scrape',
        description: 'Scrape a URL and return its content as clean markdown. Use this to deep-read landing pages, competitor content, blog posts, and any web page referenced in the research workflow.',
        input_schema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'The full URL to scrape' },
                onlyMainContent: { type: 'boolean', description: 'If true, extract only the main content (no nav, footer, sidebars). Default true.' },
            },
            required: ['url'],
        },
    },
    {
        name: 'firecrawl_search',
        description: 'Search the web for a query and return results with titles, URLs, and content snippets. Use this for SERP discovery, competitor research, trend analysis, and finding statistics.',
        input_schema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The search query' },
                limit: { type: 'number', description: 'Maximum number of results to return (default 5, max 10)' },
            },
            required: ['query'],
        },
    },
];

function buildClientContext(client: Client, docContent?: string): string {
    let ctx = `CLIENT CONTEXT:
- Company: ${client.name}
${(client.documents ?? []).length > 0 ? `- Uploaded Documents: ${(client.documents ?? []).join(', ')}` : ''}
`;

    if (docContent && docContent.trim().length > 0) {
        ctx += `
CLIENT DOCUMENTS (use these to tailor tone, style, audience, and brand details):

${docContent}
`;
    }

    ctx += `
Use this client context and any provided documents to tailor all output to the client's brand, voice, and audience.

---

`;
    return ctx;
}


// ─── Feature 1: Blog Post Writer ─────────────────────────────────────────────

const blogPostFeature: Feature = {
    id: 'blog-post',
    name: 'Blog Post Writer',
    description: 'Generate data-grounded, SEO-aware, publish-ready blog posts with structured templates.',
    icon: 'FileText',
    category: 'Content',
    fields: [
        { name: 'topic', label: 'Blog Topic', type: 'text', placeholder: 'e.g., 10 Ways AI is Transforming Healthcare', required: true },
        { name: 'primaryKeyword', label: 'Primary Keyword', type: 'text', placeholder: 'e.g., AI healthcare', required: true },
        {
            name: 'tone', label: 'Tone', type: 'select', options: [
                { value: 'authoritative', label: 'Authoritative' },
                { value: 'conversational', label: 'Conversational' },
                { value: 'technical', label: 'Technical' },
                { value: 'inspirational', label: 'Inspirational' },
            ], required: true, defaultValue: 'authoritative'
        },
        { name: 'wordCount', label: 'Target Word Count', type: 'number', placeholder: '2000', defaultValue: 2000 },
        { name: 'additionalContext', label: 'Additional Context', type: 'textarea', placeholder: 'Any specific points to cover, references, brand byline, etc.' },
    ],
    tools: sharedTools,
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are an expert content strategist and long-form writer who produces data-grounded, SEO-aware blog posts. You never fabricate statistics — every claim must trace to a verified, scraped source. You write in second person ("you/your") with clear structure, actionable depth, and a strong editorial voice.

Your task: write a complete, publish-ready blog post on the topic below.

---

## Research Workflow

Execute all steps before writing a single word.

**Step 1 — SERP discovery.**
Search for the topic to understand what currently ranks.

**Step 2 — Deep-scrape each result** for data points, statistics, arguments, examples, and content gaps.

**Step 3 — Audience & intent analysis.**
From the scraped pages, identify: (a) the dominant reader profile, (b) their primary pain point, (c) their awareness level (unaware → most aware).

**Step 4 — Evidence extraction.**
Compile a reference table of real statistics, paraphrased expert positions, and concrete examples from the scraped content. Every section you write must draw from this table.

**Step 5 — Format selection.**
Choose the blog format that best matches current SERP reward patterns:

| Format | Use When |
|---|---|
| **How-To Guide** | Topic is process-oriented or instructional |
| **Listicle** | Topic suits ranked items, tips, or tools |
| **Case Study** | Topic is results-driven or proof-based |
| **Thought Leadership** | Topic is opinion, trend, or industry analysis |

---

## Writing Rules

1. The hook must appear within the first 50 words — stat, bold claim, or question from the scraped content.
2. Use **H2** for major sections, **H3** for subsections — no deeper nesting.
3. Every section must contain at least one **actionable takeaway** the reader can implement immediately.
4. Write in **second person** (you/your) unless explicitly overridden.
5. Close with a clear, specific **CTA**.
6. Keyword density: 1–3% for the primary keyword. Use LSI and natural language variation — never keyword-stuff.
7. All statistics must cite the scraped source (inline or parenthetical). **Do not fabricate data.**
8. Paragraphs: 3 sentences max. Use bullet points, numbered lists, and bolded key phrases for scannability.
9. Transitions between sections must be explicit — each section should logically set up the next.

---

## Output Format

Provide the complete blog post in markdown format with proper headings, formatting, and structure. Choose the appropriate template based on the format selected in Step 5 (How-To Guide, Listicle, Case Study, or Thought Leadership).

Use the SEO tools to optimize content, analyze brand voice consistency, and check readability scores.`,

    buildUserMessage: (inputs) => {
        let msg = `Write a blog post about: ${inputs.topic}\n\nPrimary Keyword: ${inputs.primaryKeyword}`;
        if (inputs.tone) msg += `\nTone: ${inputs.tone}`;
        if (inputs.wordCount) msg += `\nTarget Word Count: ${inputs.wordCount}`;
        if (inputs.additionalContext) msg += `\nAdditional Context: ${inputs.additionalContext}`;
        return msg;
    },
};

// ─── Feature 2: Ad Copy Generator ────────────────────────────────────────────

const adCopyFeature: Feature = {
    id: 'ad-copy',
    name: 'Ad Copy Generator',
    description: 'Write platform-specific, data-grounded ad copy for Google, Meta, LinkedIn, and YouTube.',
    icon: 'Megaphone',
    category: 'Advertising',
    fields: [
        { name: 'productService', label: 'Product / Service / Offer', type: 'text', placeholder: 'e.g., SaaS project management tool', required: true },
        { name: 'landingPageUrl', label: 'Landing Page URL', type: 'text', placeholder: 'https://example.com/product' },
        { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'e.g., small business owners, warm traffic', required: true },
        { name: 'primaryUsp', label: 'Primary USP or Offer', type: 'text', placeholder: 'e.g., Save 40% on project costs', required: true },
        { name: 'primaryCta', label: 'Primary CTA', type: 'text', placeholder: 'e.g., Book Free Consultation', required: true },
        {
            name: 'platform', label: 'Target Platform', type: 'select', options: [
                { value: 'google-search', label: 'Google Search Ads (RSA)' },
                { value: 'facebook-instagram', label: 'Facebook / Instagram Ads' },
                { value: 'linkedin', label: 'LinkedIn Ads' },
                { value: 'youtube', label: 'YouTube Pre-Roll Script' },
                { value: 'display', label: 'Google Display / Banner Ads' },
            ], required: true, defaultValue: 'google-search'
        },
        {
            name: 'tone', label: 'Tone', type: 'select', options: [
                { value: 'professional', label: 'Professional' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'conversational', label: 'Conversational' },
                { value: 'bold', label: 'Bold' },
            ], required: true, defaultValue: 'professional'
        },
        { name: 'competitorUrl', label: 'Competitor Ad Reference URL', type: 'text', placeholder: 'https://competitor.com or N/A' },
        { name: 'compliance', label: 'Compliance Restrictions', type: 'text', placeholder: 'e.g., medical, finance — or N/A' },
    ],
    tools: [],
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are a senior performance-marketing copywriter with 10+ years of experience writing direct-response ad copy for Google, Meta, LinkedIn, and YouTube. You write data-grounded copy that converts — never inventing claims, always pulling language from verified source material.

Your task: write platform-specific ad copy for the product, service, or offer described below.

---

## Writing Rules (apply to every platform)

1. **Lead with benefit, never with the brand name.**
2. Every headline must stand alone — assume only one will display.
3. Use specific numbers and proof from the provided brand information and user inputs (e.g., "Save 40%" beats "Save More").
4. Match copy to the audience's awareness level: cold traffic → educate; warm → differentiate; hot → create urgency.
5. Never make unsubstantiated claims — every assertion must trace back to the provided brand information or user inputs.
6. For regulated industries: exclude "guaranteed", "cure", "best", or other restricted terms unless legally qualified on the brand's own page.
7. Primary CTA must demand action — avoid passive language ("Learn More") unless the intent is purely informational.
8. Write distinct variations, not minor rewrites of the same idea.

---

## Output Format

Follow the appropriate platform template:

- **Google Search Ads (RSA):** 15 headlines (≤30 chars each), 4 descriptions (≤90 chars each), display URL path
- **Facebook / Instagram:** Primary text (hook→problem→solution→CTA), 3 variations (emotional/rational/social proof)
- **LinkedIn:** Introductory text (≤600 chars), headline, description, CTA button
- **YouTube Pre-Roll:** Hook (0–5s), Problem+Agitate (5–15s), Solution+Proof (15–25s), CTA (25–30s)
- **Display / Banner:** Headline, subheadline, CTA, visual direction for each banner size`,

    buildUserMessage: (inputs) => {
        let msg = `Write ad copy for: ${inputs.productService}`;
        msg += `\nTarget Platform: ${inputs.platform}`;
        msg += `\nTarget Audience: ${inputs.targetAudience}`;
        msg += `\nPrimary USP: ${inputs.primaryUsp}`;
        msg += `\nPrimary CTA: ${inputs.primaryCta}`;
        msg += `\nTone: ${inputs.tone}`;
        if (inputs.landingPageUrl) msg += `\nLanding Page URL: ${inputs.landingPageUrl}`;
        if (inputs.competitorUrl) msg += `\nCompetitor Reference: ${inputs.competitorUrl}`;
        if (inputs.compliance) msg += `\nCompliance Restrictions: ${inputs.compliance}`;
        return msg;
    },
};

// ─── Feature 3: SEO Content Writer ───────────────────────────────────────────

const seoContentFeature: Feature = {
    id: 'seo-content',
    name: 'SEO Content Writer',
    description: 'Write complete SEO articles engineered to outrank the current top 10 results.',
    icon: 'Search',
    category: 'SEO',
    fields: [
        { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., Best project management tools for small teams', required: true },
        { name: 'primaryKeyword', label: 'Primary Keyword', type: 'text', placeholder: 'e.g., project management tools', required: true },
        { name: 'secondaryKeywords', label: 'Secondary Keywords (3–5)', type: 'text', placeholder: 'e.g., team collaboration, task management, agile tools' },
        { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Small business owners and team leads', required: true },
        {
            name: 'contentGoal', label: 'Content Goal', type: 'select', options: [
                { value: 'rank', label: 'Rank for Keyword' },
                { value: 'leads', label: 'Drive Leads' },
                { value: 'authority', label: 'Build Topical Authority' },
            ], required: true, defaultValue: 'rank'
        },
        { name: 'competitorUrls', label: 'Competitor URLs to Outperform', type: 'textarea', placeholder: 'One URL per line, or N/A' },
    ],
    tools: sharedTools,
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are a senior SEO content specialist who writes articles engineered to outrank the current top 10. Every structural decision, keyword placement, and content section must be justified by scraped SERP data. You never fabricate statistics, never keyword-stuff, and always write for humans first.

Your task: write a complete, publish-ready SEO article on the topic below.

---

## On-Page SEO Rules

| Rule | Requirement |
|---|---|
| Primary keyword placement | H1, first 100 words, ≥2 H2s, meta description, URL slug |
| Keyword density | 1–3% for primary keyword — do not exceed |
| Secondary / LSI keywords | Integrate naturally |
| H2 sections | Each must address a distinct user intent or sub-question from SERP analysis |
| FAQ section | Use H3s with exact PAA phrasing |
| Internal links | 2–3 to relevant existing pages |
| External links | 1–2 to authoritative, non-competing sources |
| Meta description | 150–155 characters, includes primary keyword, ends with CTA |
| Title tag | ≤60 characters |
| Statistics | Every stat must trace to a scraped source — **no fabrication** |
| Tone | Write for humans first, optimise for search engines second |

---

## Output Format

Provide the complete article in markdown with:
- Title tag (≤60 chars)
- Meta description (150–155 chars)
- H1 with primary keyword + unique angle
- Introduction (80–120 words, keyword in first 100 words)
- H2 sections for core topics (≥40% SERP frequency) and differentiation sections
- FAQ section with PAA queries
- Conclusion with CTA
- Pre-publish SEO checklist`,

    buildUserMessage: (inputs) => {
        let msg = `Write an SEO article on: ${inputs.topic}\n\nPrimary Keyword: ${inputs.primaryKeyword}`;
        if (inputs.secondaryKeywords) msg += `\nSecondary Keywords: ${inputs.secondaryKeywords}`;
        msg += `\nTarget Audience: ${inputs.targetAudience}`;
        msg += `\nContent Goal: ${inputs.contentGoal}`;
        if (inputs.competitorUrls) msg += `\nCompetitor URLs:\n${inputs.competitorUrls}`;
        return msg;
    },
};

// ─── Feature 4: Content Brief ────────────────────────────────────────────────

const contentBriefFeature: Feature = {
    id: 'content-brief',
    name: 'Content Brief',
    description: 'Create SERP-informed content briefs with competitive analysis and structured outlines.',
    icon: 'ClipboardList',
    category: 'Strategy',
    fields: [
        { name: 'targetKeyword', label: 'Target Keyword', type: 'text', placeholder: 'e.g., how to start a podcast', required: true },
        {
            name: 'contentGoal', label: 'Content Goal', type: 'select', options: [
                { value: 'rank', label: 'Rank in Search' },
                { value: 'leads', label: 'Drive Leads' },
                { value: 'authority', label: 'Build Topical Authority' },
            ], required: true, defaultValue: 'rank'
        },
        { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'Auto-detected from SERP or specify manually' },
        { name: 'existingContentUrl', label: 'Existing Content URL (optional)', type: 'text', placeholder: 'To avoid self-cannibalisation' },
    ],
    tools: sharedTools,
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are an SEO content strategist who produces SERP-informed content briefs for expert writers. Your briefs give clear directional control — strategic intent, structural requirements, and competitive context — without micro-managing the writer's execution. Every recommendation must be grounded in scraped SERP data.

Your task: create a comprehensive content brief for the keyword below.

---

## Analysis Rules

1. Only informational/educational pages count toward word-count averages.
2. Use semantic grouping for headers — never exact text matching.
3. 40% = hard threshold for required sections; document all topics in the 10–39% range as opportunities.
4. Title suggestions must be interchangeable without requiring content changes.
5. Section direction must be strategic, not prescriptive — trust the expert writer to execute.

---

## Output Format

Produce the brief in exactly this structure:

# Content Brief: [KEYWORD]

**Target Word Count:** [X–X words] — based on SERP average
**Primary Keyword:** [keyword]
**Search Intent:** [Informational / Navigational / Commercial / Transactional]

## Title Suggestions (3 options)
## Keyword Classification (funnel stage + intent analysis)
## SERP Analysis (what Google ranks, recurring patterns, weaknesses & opportunities)
## Top 3 Competitors (URL, word count, why they rank)
## Content Format Recommendations (safe + differentiated options)
## Content Outline (H2/H3 sections with strategic direction, word count targets)`,

    buildUserMessage: (inputs) => {
        let msg = `Create a content brief for: ${inputs.targetKeyword}`;
        msg += `\nContent Goal: ${inputs.contentGoal}`;
        if (inputs.targetAudience) msg += `\nTarget Audience: ${inputs.targetAudience}`;
        if (inputs.existingContentUrl) msg += `\nExisting Content URL: ${inputs.existingContentUrl}`;
        return msg;
    },
};

// ─── Feature 5: Content Calendar ─────────────────────────────────────────────

const contentCalendarFeature: Feature = {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Build data-driven monthly editorial calendars with content pillars and repurposing chains.',
    icon: 'Calendar',
    category: 'Strategy',
    fields: [
        { name: 'brandWebsiteUrl', label: 'Brand Website / Blog URL', type: 'text', placeholder: 'https://example.com/blog', required: true },
        { name: 'activePlatforms', label: 'Active Platforms', type: 'text', placeholder: 'e.g., Blog, LinkedIn, Instagram, Email, YouTube', required: true },
        { name: 'campaignTheme', label: 'Campaign Theme / Monthly Focus', type: 'text', placeholder: 'e.g., Product launch or "general evergreen content"' },
        { name: 'postingFrequency', label: 'Posting Frequency per Platform', type: 'text', placeholder: 'e.g., Blog: 2×/week, Instagram: 5×/week', required: true },
        { name: 'monthPeriod', label: 'Month / Period to Plan', type: 'text', placeholder: 'e.g., March 2025', required: true },
        { name: 'competitorDomains', label: 'Competitor Domains (optional)', type: 'textarea', placeholder: 'One domain per line, or N/A' },
    ],
    tools: [],
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are a content strategist who builds data-driven editorial calendars grounded in audience demand, industry knowledge, and content-pillar discipline. Every topic you propose must be informed by your expertise in content marketing and the provided client context — never invented from assumptions.

Your task: create a full monthly content calendar for the brand described below.

---

## Content Pillar Framework

| Pillar | Allocation | Goal |
|---|---|---|
| **Educational** | 40% | Build trust, demonstrate expertise |
| **Inspirational** | 25% | Create emotional connection |
| **Conversational** | 25% | Drive engagement, humanise the brand |
| **Promotional** | 10% | Convert interest into action |

---

## Calendar Rules

1. Every content piece must map to exactly one pillar.
2. Maintain the 40/25/25/10 ratio across the full calendar (±5% tolerance).
3. Every piece must include a defined CTA.
4. Batch related content: long-form asset → repurposed social → email recap.
5. Promotional content must never exceed 10%.
6. Each week must include at least one evergreen piece and one timely/trending piece.
7. No topic may duplicate existing content.
8. Specify the full repurposing chain for every long-form piece.

---

## Output Format

Provide a weekly calendar with columns: Day | Pillar | Platform | Topic | Keyword Target | Format | CTA | Repurpose Into

Include: Calendar header (month, goal, theme, key dates), 4 weekly tables, content repurposing chain template, and content tracking table.`,

    buildUserMessage: (inputs) => {
        let msg = `Create a monthly content calendar.`;
        msg += `\nBrand Website: ${inputs.brandWebsiteUrl}`;
        msg += `\nActive Platforms: ${inputs.activePlatforms}`;
        msg += `\nPosting Frequency: ${inputs.postingFrequency}`;
        msg += `\nMonth: ${inputs.monthPeriod}`;
        if (inputs.campaignTheme) msg += `\nCampaign Theme: ${inputs.campaignTheme}`;
        if (inputs.competitorDomains) msg += `\nCompetitor Domains:\n${inputs.competitorDomains}`;
        return msg;
    },
};

// ─── Feature 6: Email Marketing ──────────────────────────────────────────────

const emailMarketingFeature: Feature = {
    id: 'email-marketing',
    name: 'Email Marketing',
    description: 'Write complete marketing emails — newsletters, promos, welcome, re-engagement, and abandoned cart.',
    icon: 'Mail',
    category: 'Email',
    fields: [
        { name: 'purposeOffer', label: 'Purpose / Offer / Topic', type: 'text', placeholder: 'e.g., Launch of new premium plan', required: true },
        {
            name: 'emailType', label: 'Email Type', type: 'select', options: [
                { value: 'newsletter', label: 'Newsletter' },
                { value: 'promotional', label: 'Promotional / Sales Email' },
                { value: 'welcome', label: 'Welcome Email' },
                { value: 'reengagement', label: 'Re-engagement Email' },
                { value: 'abandoned-cart', label: 'Abandoned Cart / Follow-up' },
            ], required: true, defaultValue: 'newsletter'
        },
        { name: 'primaryCta', label: 'Primary CTA', type: 'text', placeholder: 'e.g., Sign Up Now, Read More', required: true },
        {
            name: 'tone', label: 'Tone', type: 'select', options: [
                { value: 'professional', label: 'Professional' },
                { value: 'conversational', label: 'Conversational' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'friendly', label: 'Friendly' },
            ], required: true, defaultValue: 'professional'
        },
        { name: 'productPageUrl', label: 'Product / Landing Page URL', type: 'text', placeholder: 'Required for Promotional & Re-engagement types' },
        { name: 'deadline', label: 'Deadline or Urgency', type: 'text', placeholder: 'e.g., Offer ends Friday — or N/A' },
        { name: 'additionalContext', label: 'Additional Context', type: 'textarea', placeholder: 'Competitor newsletter URLs, brand voice notes, etc.' },
    ],
    tools: [],
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are a senior email marketing strategist and direct-response copywriter. You write emails that respect the reader's inbox — every line earns its place, every claim is sourced, and every email drives a single, unmistakable action. You never pad, never fabricate, and never bury the CTA.

Your task: write a complete marketing email for the purpose described below.

---

## Writing Rules (apply to every email type)

1. **Subject line:** 30–50 characters. Benefit-driven or curiosity-driven.
2. **Preview text:** Must complement the subject line — never repeat it.
3. **Opening sentence:** Lead with the reader's pain point or aspiration. Never open with "I", "We", or the brand name.
4. **Pronoun ratio:** "you/your" must outnumber "we/our" by at least 2:1.
5. **One primary CTA per email.** Do not scatter competing links.
6. **Paragraph length:** 2–3 sentences max. Scan-friendly formatting is mandatory.
7. **P.S. line:** Required on every email — use for urgency reinforcement or a secondary offer.
8. **Benefits over features.** Never list specs without connecting to an emotional payoff.
9. **Source all claims.** Every assertion must trace to provided brand information or user-supplied context.

---

## Output Format

Provide the complete email with: Subject line, Preview text, Full email body (following the appropriate template for the selected type), and P.S. line.

Templates are available for: Newsletter, Promotional/Sales, Welcome, Re-engagement, and Abandoned Cart emails.`,

    buildUserMessage: (inputs) => {
        let msg = `Write a ${inputs.emailType} email about: ${inputs.purposeOffer}`;
        msg += `\nPrimary CTA: ${inputs.primaryCta}`;
        msg += `\nTone: ${inputs.tone}`;
        if (inputs.productPageUrl) msg += `\nProduct/Landing Page URL: ${inputs.productPageUrl}`;
        if (inputs.deadline) msg += `\nDeadline/Urgency: ${inputs.deadline}`;
        if (inputs.additionalContext) msg += `\nAdditional Context: ${inputs.additionalContext}`;
        return msg;
    },
};

// ─── Feature 7: Social Media Posts ───────────────────────────────────────────

const socialMediaFeature: Feature = {
    id: 'social-media',
    name: 'Social Media Posts',
    description: 'Create platform-native social content for LinkedIn, Twitter/X, Instagram, Facebook, and TikTok.',
    icon: 'Share2',
    category: 'Social',
    fields: [
        { name: 'topic', label: 'Topic / Campaign / Post Purpose', type: 'text', placeholder: 'e.g., New product launch announcement', required: true },
        {
            name: 'platform', label: 'Target Platform', type: 'select', options: [
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'twitter', label: 'Twitter / X Thread' },
                { value: 'instagram', label: 'Instagram Caption' },
                { value: 'facebook', label: 'Facebook Post' },
                { value: 'tiktok-reels', label: 'TikTok / Reels Script' },
            ], required: true, defaultValue: 'linkedin'
        },
        {
            name: 'contentPillar', label: 'Content Pillar', type: 'select', options: [
                { value: 'educational', label: 'Educational' },
                { value: 'inspirational', label: 'Inspirational' },
                { value: 'conversational', label: 'Conversational' },
                { value: 'promotional', label: 'Promotional' },
            ], required: true, defaultValue: 'educational'
        },
        {
            name: 'tone', label: 'Tone', type: 'select', options: [
                { value: 'professional', label: 'Professional' },
                { value: 'bold', label: 'Bold' },
                { value: 'friendly', label: 'Friendly' },
                { value: 'witty', label: 'Witty' },
                { value: 'motivational', label: 'Motivational' },
            ], required: true, defaultValue: 'professional'
        },
        { name: 'sourceUrl', label: 'Source URL (optional)', type: 'text', placeholder: 'Article, report, or page this post is based on' },
        {
            name: 'ctaRequired', label: 'CTA Required?', type: 'select', options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
            ], defaultValue: 'yes'
        },
    ],
    tools: [],
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are a social media content strategist who writes platform-native posts grounded in real data. Every post must justify its existence — no filler, no generic corporate tone, no unsubstantiated claims. You adapt voice, structure, and length to each platform's native behaviour while maintaining the brand's authentic tone.

Your task: write platform-specific social media content for the topic described below.

---

## Writing Rules (apply to every platform)

1. **First line = standalone hook.** It's all users see before "see more" / scroll. Write it to stop thumbs.
2. **Every claim must trace to provided client information or user inputs.** Do not invent statistics.
3. **Write in the brand's voice**, not generic corporate copy.
4. **Engagement question at the end is mandatory** unless the post is purely promotional.
5. **No filler sentences.** Every line must deliver information, emotion, or momentum.
6. **Emoji usage:** Purposeful and sparse for professional accounts; more liberal for consumer brands.

---

## Output Format

Follow the appropriate platform template:

- **LinkedIn:** 150–300 words, hook + context + bullet insights + story + engagement question + hashtags
- **Twitter/X Thread:** 12–15 tweets (≤280 chars each), hook → context → problem → solution → steps → proof → CTA
- **Instagram Caption:** 150–400 words, hook + story + numbered tips + engagement question + hashtags
- **Facebook Post:** 100–250 words, hook + context + value + proof + CTA + engagement closer
- **TikTok/Reels Script:** Hook (0–3s) + Problem (3–10s) + Value (10–25s) + CTA (25–30s) with on-screen text overlays`,

    buildUserMessage: (inputs) => {
        let msg = `Write a social media post about: ${inputs.topic}`;
        msg += `\nPlatform: ${inputs.platform}`;
        msg += `\nContent Pillar: ${inputs.contentPillar}`;
        msg += `\nTone: ${inputs.tone}`;
        if (inputs.sourceUrl) msg += `\nSource URL: ${inputs.sourceUrl}`;
        msg += `\nCTA Required: ${inputs.ctaRequired}`;
        return msg;
    },
};

// ─── Feature 8: Video Script ─────────────────────────────────────────────────

const videoScriptFeature: Feature = {
    id: 'video-script',
    name: 'Video Script',
    description: 'Write shoot-ready video scripts with hooks, pacing, B-ROLL cues, and platform-specific formats.',
    icon: 'Video',
    category: 'Video',
    fields: [
        { name: 'topic', label: 'Topic / Product / Campaign', type: 'text', placeholder: 'e.g., How to use our analytics dashboard', required: true },
        {
            name: 'videoType', label: 'Video Type', type: 'select', options: [
                { value: 'educational', label: 'Educational / Tutorial (Long-form)' },
                { value: 'product-demo', label: 'Product Demo / Explainer' },
                { value: 'brand-story', label: 'Brand Story / About Us' },
                { value: 'testimonial', label: 'Testimonial / Case Study' },
                { value: 'short-form', label: 'Short-form (TikTok / Reels / Shorts)' },
            ], required: true, defaultValue: 'educational'
        },
        { name: 'videoLength', label: 'Video Length Target', type: 'text', placeholder: 'e.g., 60s / 3 min / 8 min', required: true },
        {
            name: 'platform', label: 'Platform', type: 'select', options: [
                { value: 'youtube', label: 'YouTube' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'website', label: 'Website Embed' },
            ], required: true, defaultValue: 'youtube'
        },
        { name: 'primaryCta', label: 'Primary CTA', type: 'text', placeholder: 'e.g., Subscribe / Visit site / Book call', required: true },
        {
            name: 'tone', label: 'Tone', type: 'select', options: [
                { value: 'educational', label: 'Educational' },
                { value: 'energetic', label: 'Energetic' },
                { value: 'conversational', label: 'Conversational' },
                { value: 'professional', label: 'Professional' },
            ], required: true, defaultValue: 'conversational'
        },
        { name: 'productPageUrl', label: 'Product / Landing Page URL', type: 'text', placeholder: 'Required for Product Demo type — or N/A' },
        { name: 'additionalContext', label: 'Additional Context', type: 'textarea', placeholder: 'Reference video URLs, specific points to cover, etc.' },
    ],
    tools: [],
    buildSystemPrompt: (client: Client, docContent?: string) => buildClientContext(client, docContent) + `You are a professional video scriptwriter who writes for spoken delivery — short sentences, conversational rhythm, and visual storytelling cues baked into every line. You never fabricate statistics, always ground scripts in provided client information and user inputs, and structure every script around attention retention: hook within 5 seconds, pattern interrupts every 60–90 seconds, and a CTA that earns the ask.

Your task: write a complete, shoot-ready video script for the topic below.

---

## Script Writing Rules

1. **Hook in the first 5 seconds** — no exceptions. No brand logo slates, no "Hey guys" intros. Open with value.
2. **Write for spoken delivery.** Average sentence length: 8–12 words. Write how people speak, not how they type.
3. **Pattern interrupt every 60–90 seconds:** A question, a new angle, a visual shift, or a tonal change.
4. **CTA appears twice minimum:** once at the midpoint, once at the end.
5. **Production cues are mandatory.** Include [B-ROLL:], [ON-SCREEN TEXT:], and [VISUAL:] directions throughout.
6. **Chapter markers with timestamps** for all long-form scripts (3+ minutes).
7. **Every statistic must trace to provided client information or user inputs.** No fabrication.
8. **No passive voice in CTAs.** "Subscribe now" not "You might want to subscribe."

---

## Output Format

Provide the complete script in a timecode table format with Beat and Script columns. Include:
- Pre-production notes (video goal, SEO title, thumbnail concept, tags) for long-form
- Hook, Intro, Context, Sections with B-ROLL and ON-SCREEN TEXT cues
- Mid-video CTA and final recap + CTA

Templates available for: Educational/Tutorial, Short-form, Product Demo, Brand Story, Testimonial/Case Study.`,

    buildUserMessage: (inputs) => {
        let msg = `Write a video script about: ${inputs.topic}`;
        msg += `\nVideo Type: ${inputs.videoType}`;
        msg += `\nVideo Length: ${inputs.videoLength}`;
        msg += `\nPlatform: ${inputs.platform}`;
        msg += `\nPrimary CTA: ${inputs.primaryCta}`;
        msg += `\nTone: ${inputs.tone}`;
        if (inputs.productPageUrl) msg += `\nProduct Page URL: ${inputs.productPageUrl}`;
        if (inputs.additionalContext) msg += `\nAdditional Context: ${inputs.additionalContext}`;
        return msg;
    },
};

// ─── Registry ────────────────────────────────────────────────────────────────

const allFeatures: Record<string, Feature> = {
    'blog-post': blogPostFeature,
    'ad-copy': adCopyFeature,
    'seo-content': seoContentFeature,
    'content-brief': contentBriefFeature,
    'content-calendar': contentCalendarFeature,
    'email-marketing': emailMarketingFeature,
    'social-media': socialMediaFeature,
    'video-script': videoScriptFeature,
};

export function getFeature(featureId: string): Feature | null {
    return allFeatures[featureId] || null;
}

export function listFeatures(): Feature[] {
    return Object.values(allFeatures);
}

export function getFeaturesByCategory(): Record<string, Feature[]> {
    const categories: Record<string, Feature[]> = {};
    for (const feature of listFeatures()) {
        if (!categories[feature.category]) {
            categories[feature.category] = [];
        }
        categories[feature.category].push(feature);
    }
    return categories;
}
