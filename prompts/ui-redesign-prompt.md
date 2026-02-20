# NexusAI Content Engine — Complete UI Redesign Prompt

---

## Role & Context

You are a **senior full-stack developer and elite UI/UX designer** specializing in dark-themed SaaS dashboards, editorial tools, and AI-powered content platforms. You have deep expertise in **Next.js 14+ (App Router)**, **React**, **TypeScript**, and **modern CSS** (no Tailwind — vanilla CSS only with design tokens). Your design aesthetic is inspired by **Linear**, **Raycast**, **Vercel Dashboard**, **Notion**, and **Arc Browser** — minimal, information-dense, beautifully animated, and obsessively polished.

You are redesigning the entire front-end UI for **NexusAI Content Engine** — a multi-tenant AI-powered content generation platform. The back-end API routes, data models, orchestration logic, and AI prompt system are **already built and working**. You must **not** change any API contracts, routes, or backend logic. Your job is exclusively to redesign the UI layer: the pages, components, CSS, and layout.

---

## What The App Does (Product Overview)

NexusAI Content Engine is a SaaS tool that lets users:

1. **Create and manage client namespaces** — each client represents a brand/business
2. **Upload brand documents** (guidelines, style guides, audience reports) per client — these are injected into AI prompts to tailor output
3. **Run AI-powered content generation features** (8 total) against a selected client, with a selected LLM model, filling in feature-specific form fields
4. **Stream output in real-time** via Server-Sent Events (SSE) — some features use Firecrawl tools (web scraping/search) that show tool call indicators during generation
5. **Save and review output history** per client
6. **Select from multiple LLM models** (fetched dynamically from OpenRouter) grouped by provider and tier (fast/recommended/premium)

---

## Current Architecture (DO NOT CHANGE)

### Tech Stack
- **Framework**: Next.js 14 (App Router, `use client` components)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS custom properties (design tokens) — `globals.css`
- **Icons**: `lucide-react`
- **Font**: Inter (Google Fonts)
- **No component library** — everything is hand-built

### API Routes (DO NOT CHANGE — your UI must call these exactly)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client `{ name }` |
| PUT | `/api/clients/[clientId]` | Update client |
| DELETE | `/api/clients/[clientId]` | Delete client |
| GET | `/api/clients/[clientId]/files` | List client's uploaded files |
| POST | `/api/clients/[clientId]/files` | Upload files (FormData with `files` + `type`) |
| DELETE | `/api/clients/[clientId]/files?name=...&type=...` | Delete a file |
| GET | `/api/clients/[clientId]/outputs` | List saved outputs |
| POST | `/api/clients/[clientId]/outputs` | Save an output `{ featureId, featureName, inputs, output }` |
| GET | `/api/features` | List all features (returns `{ id, name, description, icon, category, fields }[]`) |
| GET | `/api/models` | Get models `{ models: ModelOption[], defaultModelId }` |
| POST | `/api/orchestrate` | Run a feature — SSE stream. Body: `{ clientId, featureId, inputs, modelId? }` |

### SSE Stream Events (from `/api/orchestrate`)
The orchestrate endpoint returns a text/event-stream with these event types:
```
data: { "type": "status", "content": "Running feature: Blog Post Writer for client: Acme (model: ...)" }
data: { "type": "tool_use", "toolName": "firecrawl_search", "toolInput": { "query": "..." } }
data: { "type": "tool_result", "toolName": "firecrawl_search", "content": "..." }
data: { "type": "text", "content": "partial text chunk..." }
data: { "type": "error", "content": "error message" }
data: { "type": "done" }
```

### Data Types
```typescript
interface Client {
  id: string;
  name: string;
  documents: string[];   // filenames of uploaded docs
  createdAt: string;
  updatedAt: string;
}

interface FeatureField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | number;
}

// Feature metadata returned by GET /api/features
interface FeatureMeta {
  id: string;
  name: string;
  description: string;
  icon: string;       // Lucide icon name: 'FileText' | 'Megaphone' | 'Search' | 'Calendar' | 'Mail' | 'Share2' | 'Video' | 'ClipboardList'
  category: string;   // 'Content' | 'Advertising' | 'SEO' | 'Strategy' | 'Email' | 'Social' | 'Video'
  fields: FeatureField[];
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  tier: 'fast' | 'recommended' | 'premium';
  description: string;
}

interface SavedOutput {
  id: string;
  clientId: string;
  featureId: string;
  featureName: string;
  inputs: FeatureInput;
  output: string;
  createdAt: string;
}
```

### The 8 Features
Each feature has a unique color, icon, and category:
| Feature | ID | Icon | Color | Category | Has Firecrawl Tools? |
|---------|-----|------|-------|----------|---------------------|
| Blog Post Writer | `blog-post` | FileText | `#6366f1` | Content | ✅ Yes |
| Ad Copy Generator | `ad-copy` | Megaphone | `#ec4899` | Advertising | ❌ No |
| SEO Content Writer | `seo-content` | Search | `#f59e0b` | SEO | ✅ Yes |
| Content Brief | `content-brief` | ClipboardList | `#8b5cf6` | Strategy | ✅ Yes |
| Content Calendar | `content-calendar` | Calendar | `#14b8a6` | Strategy | ❌ No |
| Email Marketing | `email-marketing` | Mail | `#f97316` | Email | ❌ No |
| Social Media Posts | `social-media` | Share2 | `#3b82f6` | Social | ❌ No |
| Video Script | `video-script` | Video | `#ef4444` | Video | ❌ No |

---

## Current UI Structure (What Exists Now — Needs Complete Redesign)

### Views / Pages
The app is a single-page app with 4 views managed by `useState<View>`:

1. **Dashboard** (`view = 'dashboard'`)
   - 4 stat cards (Active Clients, Features count, Outputs Generated, Python Tools)
   - "Recent Clients" section with client cards (max 6)
   - "+ New Client" button

2. **Clients** (`view = 'clients'`)
   - Full client list as cards in a grid
   - Each card shows: avatar (first letter), name, doc count, tags
   - Hover reveals Edit/Delete action buttons
   - "+ New Client" button

3. **Client Workspace** (`view = 'workspace'`)
   - Header with back button, large avatar, client name, doc count, Edit button
   - 3 tabs: Overview | Features | History
   - **Overview tab**: uploaded documents list + "Quick Launch" feature grid
   - **Features tab**: feature card grid (same as Quick Launch)
   - **History tab**: list of saved outputs with date, feature name, preview text; click to view full output

4. **Feature Launcher** (`view = 'features'`)
   - Feature selection grid (if no feature selected yet)
   - Once selected: split-panel layout (left = form, right = output)
   - **Left panel (form)**: feature icon/name, client selector dropdown, model selector dropdown (grouped by provider with tier badges), dynamic form fields from `feature.fields`, Run/Stop button
   - **Right panel (output)**: header with Copy/Save buttons, error display, tool call indicators (spinning for running, wrench for done), streaming text output, empty state

### Components
| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `Sidebar` | `Sidebar.tsx` | 77 | Fixed left sidebar: brand logo, nav links (Dashboard/Clients/Features), client list with avatars |
| `ClientList` | `ClientList.tsx` | 84 | Renders client cards in a grid; loading/empty states |
| `ClientForm` | `ClientForm.tsx` | 76 | Modal for create/edit client — name input + FileUpload component |
| `FileUpload` | `FileUpload.tsx` | 195 | File upload with drag-drop zone, type toggle (Brand Docs / Assets), file list with delete |
| `ClientWorkspace` | `ClientWorkspace.tsx` | 157 | Client detail page with tabs (Overview/Features/History) |
| `FeatureLauncher` | `FeatureLauncher.tsx` | 463 | The main content generation UI — feature picker, form, streaming output |

### Current Design System (CSS Custom Properties)
```css
--bg-primary: #0a0b0f;        /* Deepest background */
--bg-secondary: #111318;      /* Sidebar / panels */
--bg-tertiary: #1a1c24;       /* Cards / elevated surfaces */
--bg-card: #13151b;            /* Card backgrounds */
--bg-card-hover: #1a1d26;
--border-primary: #1f2233;
--border-glow: #6366f130;
--text-primary: #f0f1f5;
--text-secondary: #8b8fa3;
--text-tertiary: #5c5f72;
--accent-primary: #6366f1;     /* Indigo */
--accent-secondary: #8b5cf6;   /* Purple */
--accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa);
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

---

## What You Must Build (Redesign Requirements)

### 🎯 Overall Design Goals

1. **Premium dark-theme SaaS aesthetic** — think Linear meets Vercel Dashboard. Deep, rich blacks with subtle gradients. No generic "dark mode" feel.
2. **Glassmorphism & depth** — use `backdrop-filter: blur()`, subtle transparencies, layered surfaces with clear visual hierarchy
3. **Micro-animations everywhere** — smooth hover transitions, staggered entrance animations for card grids, skeleton loading states, progress indicators, button feedback, modal transitions
4. **Information density without clutter** — maximize useful content per screen. Use compact but readable typography, smart spacing, and progressive disclosure
5. **Consistent visual rhythm** — uniform spacing scale, consistent border radii, predictable interaction patterns
6. **Responsive** — must work on 1024px+ screens; sidebar collapses on mobile

### 📐 Layout Redesign

**Sidebar** (redesign):
- Collapsible sidebar (icon-only mode ↔ expanded mode) with a smooth transition
- Brand mark at top with a subtle glow/pulse animation
- Navigation with icon + label, active state with a glowing left border indicator (not just background highlight)
- Client list section: compact, scrollable; each client shows avatar with their brand color (generate from name hash), name, and a subtle badge showing doc count
- Quick-action button at bottom: "+ New Client"
- Subtle gradient border on the right edge instead of flat 1px border

**Main Content Area**:
- Breadcrumb navigation at the top (e.g., `Dashboard > Clients > Acme Corp > Blog Post Writer`)
- Smooth page transitions when switching views (fade + slide)
- Consistent max-width container with generous but not wasteful padding

### 📊 Dashboard (Redesign)

- **Hero stat cards** at top — 4 cards in a row with:
  - Large number with animated count-up effect on mount
  - Subtle icon with a glowing background circle
  - Sparkline or mini trend indicator (can be decorative/static)
  - Card has a subtle gradient border on hover
- **Quick Actions row** — horizontal scrollable row of feature shortcut pills/chips (click to jump straight to FeatureLauncher with that feature pre-selected)
- **Recent Activity feed** — timeline-style list showing recent saved outputs across all clients (output preview, feature badge, client name, timestamp, "View" button)
- **Client cards section** — redesigned cards with:
  - Gradient top-border using the client's brand color
  - Document count badge
  - Last activity timestamp
  - Hover: slight scale + glow effect
  - Staggered entrance animation (each card fades in 50ms after the previous)

### 👥 Clients Page (Redesign)

- Search/filter bar at top (client name search, sort by name/date)
- Grid of client cards (see above design)
- Floating action button (FAB) or prominent "+ New Client" button with gradient background + shadow
- Empty state: illustrated empty state with call-to-action (use an SVG illustration or styled icon composition)

### 🏢 Client Workspace (Redesign)

- **Hero header** with large avatar (gradient background from name hash), client name, creation date, doc count — spans full width with a subtle background gradient
- **Tab bar** redesigned as a segmented control with a sliding active indicator (animated pill that slides between tabs)
- **Overview tab**:
  - **Documents section**: card-based file list with file type icons (different icons for .md, .txt, .csv, .json), file size, upload date, delete button with confirmation
  - **Quick Launch section**: feature cards in a 2×4 or 4×2 grid, each card shows: feature icon, name, category badge, description on hover tooltip, and the feature's accent color as a subtle left border or gradient accent
- **Features tab**: same feature grid as Quick Launch but with more detail (description visible, category tags)
- **History tab**:
  - Sortable list (newest first) with columns: Feature, Date, Preview, Actions
  - Click to expand/view full output inline (accordion-style) or in a slide-over panel from the right
  - Each row has: feature icon + color badge, formatted date, truncated output preview, Copy/Delete buttons
  - Empty state: "No outputs yet — launch a feature to get started"

### ⚡ Feature Launcher (Redesign — MOST IMPORTANT PAGE)

This is the primary workspace. It needs to feel like a **professional content studio**.

**Feature Selection Grid** (shown when no feature is selected):
- Categorized sections: features grouped by `category` with section headers
- Cards are larger, with the feature's accent color as a gradient left border
- Each card: icon (in a colored circle), name, description, category pill
- Hover: card lifts with shadow + border glow in the feature's accent color
- Client context shown at top: "Generating for [Client Name]" with avatar

**Feature Form + Output (split panel — shown after selecting a feature)**:

The split panel should be the star of the app. Design it as a **two-column layout**:

**Left Column — Input Form (40% width)**:
- Sticky header: feature icon (colored), feature name, category, "Change Feature" button
- **Client selector**: styled dropdown with client avatars inline
- **Model selector**: redesigned as a custom dropdown/popover (not native `<select>`), showing:
  - Model name + provider label
  - Tier badge (🚀 Fast / ★ Recommended / ⚡ Premium) with distinct colors
  - Grouped by provider with dividers
  - Selected model shown as a chip above the dropdown
- **Dynamic form fields**: render based on `feature.fields[]`
  - Text inputs: clean with floating labels or top-aligned labels
  - Textareas: auto-expanding with character hint
  - Selects: styled custom dropdowns matching the model selector
  - Number inputs: with increment/decrement buttons
  - Required fields: subtle red asterisk + validation state (red border if empty on submit attempt)
  - Each field has a subtle focus ring animation in the feature's accent color
- **Run button**: large, full-width, gradient background in the feature's accent color, with a subtle pulse animation when all required fields are filled. Shows "⚡ Run Feature" with loading spinner when running. Disabled state when missing required fields or no client selected.
- **Stop button**: appears when running, replaces Run button, red with stop icon

**Right Column — Output Panel (60% width)**:
- Sticky header bar: "Output" label, word count (live updating), Copy button (with "Copied!" toast feedback), Save button (with "Saved!" feedback), Download as .md button
- **Status indicators**:
  - **Thinking state**: animated skeleton with a pulsing gradient (not just a spinner). Show "AI is researching..." or "Generating content..." with a subtle progress bar
  - **Tool call indicators**: when Firecrawl tools are running, show a collapsible "Research Activity" panel:
    - Each tool call is a row: animated dot (running) or check (done), tool name formatted nicely ("Web Search: [query]" or "Scraping: [url]"), elapsed time
    - Panel auto-collapses when all tools are done
  - **Streaming text**: render with a typing cursor animation at the end while streaming. Text should appear smoothly, not jumpy.
- **Rendered output area**: 
  - Render markdown properly (headings, bold, lists, code blocks, tables) — use a markdown renderer or hand-built CSS for markdown elements
  - Clean typography: 16px body, proper heading hierarchy, good line-height (1.7), adequate paragraph spacing
  - Code blocks with syntax highlighting and copy button
  - Tables with proper styling (striped rows, borders)
- **Empty state**: centered, with the feature's icon (large, muted), "Ready to generate" title, "Fill in the form and hit Run" subtitle
- **Error state**: red-tinted card with error icon, error message, "Try Again" button

### 🔲 Client Form Modal (Redesign)

- Glassmorphism modal with blurred backdrop
- Smooth scale + fade entrance animation
- Clean form layout with proper spacing
- File upload section:
  - Drag-drop zone with dashed border animation on drag-over (border color shifts to accent, background tints)
  - Clear type toggle (Brand Docs / Assets) as a segmented control, not buttons
  - Uploaded files list: each file is a compact row with file type icon, name, size, delete button (with confirmation tooltip)
  - Upload progress indicator (if possible)
  - Supported formats hint text

### 🎨 Design System Enhancements

Enhance the existing CSS custom properties with additional tokens:

```css
/* Suggested additions — feel free to expand */
--bg-glass: rgba(17, 19, 24, 0.75);
--bg-glass-light: rgba(255, 255, 255, 0.03);
--border-glass: rgba(255, 255, 255, 0.06);
--border-glow-strong: rgba(99, 102, 241, 0.4);

/* Shadows */
--shadow-glow-sm: 0 0 10px rgba(99, 102, 241, 0.15);
--shadow-glow-md: 0 0 20px rgba(99, 102, 241, 0.25);
--shadow-glow-lg: 0 4px 40px rgba(99, 102, 241, 0.3);
--shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.5);

/* Spacing scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Typography */
--font-xs: 11px;
--font-sm: 13px;
--font-base: 14px;
--font-md: 16px;
--font-lg: 18px;
--font-xl: 24px;
--font-2xl: 32px;

/* Transitions */
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
```

### 🎞️ Animation Requirements

1. **Page transitions**: fade + slide (direction based on navigation hierarchy)
2. **Card entrance**: staggered fade-up with `animation-delay` on each card
3. **Modal**: scale from 0.95 + fade, backdrop blur transition
4. **Sidebar collapse**: smooth width transition with icon crossfade
5. **Tab indicator**: sliding pill animation using `transform: translateX()`
6. **Buttons**: subtle scale on press (`transform: scale(0.97)`) and glow on hover
7. **Streaming text**: cursor blink animation at the end of text while streaming
8. **Tool call indicators**: spinning animation while running, checkmark morph when done
9. **Skeleton loading**: gradient shimmer animation for loading states
10. **Toast/notifications**: slide-in from top-right with auto-dismiss

### ⚙️ Functional Requirements (Must Preserve)

Do NOT break any of these existing behaviors:
1. Client CRUD (create, read, update, delete)
2. File upload with drag-drop (Brand Docs + Assets types)
3. Feature selection → dynamic form rendering from `feature.fields[]`
4. Client selector in feature launcher
5. Model selector with provider grouping and tier badges
6. Run/Stop feature with SSE streaming
7. Real-time output streaming with tool call indicators
8. Copy output to clipboard
9. Save output to history
10. Output history viewing per client
11. Sidebar navigation between views
12. Auto-scroll output panel during streaming
13. Abort controller for stopping generation
14. Required field validation (disable Run button if required fields empty)

---

## Files You Must Modify / Create

### Must Modify:
| File | What to change |
|------|----------------|
| `src/app/globals.css` | Complete redesign of the entire stylesheet. Rewrite all CSS with enhanced design tokens, new component styles, animations, and responsive breakpoints |
| `src/app/layout.tsx` | Add any new meta tags, font links, or body classes needed |
| `src/app/page.tsx` | Redesign the main page composition, view switching, and rendered content for each view |
| `src/components/Sidebar.tsx` | Redesign with collapsible mode, glow effects, animated nav indicators |
| `src/components/ClientList.tsx` | Redesign cards with gradient borders, staggered entrance animations, hover effects |
| `src/components/ClientForm.tsx` | Redesign modal with glassmorphism, improved layout, animated entrance |
| `src/components/FileUpload.tsx` | Redesign drag-drop zone, file list styling, type toggle as segmented control |
| `src/components/ClientWorkspace.tsx` | Redesign workspace with hero header, sliding tab indicator, improved history view |
| `src/components/FeatureLauncher.tsx` | Major redesign — the core experience. Better form UI, custom dropdowns, markdown rendering, enhanced streaming output, tool call panel |

### May Create (Optional):
| File | Purpose |
|------|---------|
| `src/components/Breadcrumb.tsx` | Breadcrumb navigation component |
| `src/components/CustomSelect.tsx` | Reusable custom dropdown to replace native `<select>` |
| `src/components/MarkdownRenderer.tsx` | Component to render markdown output with proper styling |
| `src/components/Toast.tsx` | Toast notification system for copy/save feedback |
| `src/components/SkeletonLoader.tsx` | Reusable skeleton loading component |
| `src/components/SegmentedControl.tsx` | Reusable tab/toggle component with sliding indicator |

---

## ❌ DO NOT

- Do NOT modify any files in `src/lib/` (features.ts, orchestrator.ts, clients.ts, models.ts, types.ts)
- Do NOT modify any files in `src/app/api/` (all API routes)
- Do NOT change the data types / interfaces
- Do NOT install Tailwind CSS or any CSS framework
- Do NOT install shadcn/ui or any component library
- Do NOT change API call signatures, endpoints, or request/response formats
- Do NOT use inline styles excessively — define proper CSS classes in globals.css
- Do NOT create a light theme — this is dark theme only
- Do NOT use `import Image from 'next/image'` — use standard `<img>` or SVG
- Do NOT add any new npm dependencies except optionally a markdown renderer (e.g., `react-markdown` + `remark-gfm`)

---

## ✅ Quality Checklist

Before you consider the redesign complete, verify:

- [ ] All 4 views render correctly (Dashboard, Clients, Workspace, Features)
- [ ] Client CRUD works (create, edit, delete)
- [ ] File upload works (drag-drop + click, both types, delete files)
- [ ] Feature selection shows all 8 features with correct icons and colors
- [ ] Dynamic form renders all field types (text, textarea, select, number)
- [ ] Model selector shows models grouped by provider with tier badges
- [ ] Run button fires SSE stream and output streams in real-time
- [ ] Tool call indicators appear during Firecrawl-enabled features
- [ ] Stop button aborts the stream
- [ ] Copy and Save buttons work
- [ ] Output history shows saved outputs per client
- [ ] Sidebar navigation works for all views
- [ ] Client selector in feature launcher works
- [ ] Required field validation prevents running with empty required fields
- [ ] Auto-scroll works on the output panel during streaming
- [ ] All animations are smooth (no jank, no layout shifts)
- [ ] Responsive: sidebar collapses at ≤768px, launcher stacks at ≤1024px
- [ ] No console errors or TypeScript errors
- [ ] The design looks **premium, polished, and production-ready** — not like a template or MVP

---

## Final Instruction

Redesign the entire UI. Rewrite every component and the CSS from scratch. Make it look like a **$200/month SaaS product** — not a weekend project. Every pixel matters. Every animation should feel intentional. The user should feel like they're using a professional content studio, not a form-and-output prototype.

Start with `globals.css` (the design foundation), then work through each component file. Provide complete, fully-functional code for every file — no shortcuts, no "...rest of component" placeholders.
