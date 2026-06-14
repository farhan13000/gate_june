# UI Theme Guide

Last updated: 2026-06-14

This document defines the visual theme, layout structure, typography, UI rules, and constraints for the Gate DA platform. Treat it as the source of truth when creating new pages, updating existing screens, or reviewing UI changes.

The current UI follows a restrained academic/problem-solving style inspired by competitive programming platforms: a neutral gray page background, a centered white work area, strong borders, compact controls, serif headings, readable sans-serif body text, and small-radius components.

## 1. Design Direction

The product is an academic learning and problem-solving platform. The interface should feel:

- Focused: the question, editorial, inventory, bank, submissions, and admin data should remain the center of attention.
- Dense but readable: operational pages should show useful information without feeling decorative or empty.
- Stable: layouts should not jump, overlap, clip, or visually drift across screen sizes.
- Trustworthy: use simple borders, clear states, and predictable controls instead of flashy effects.
- Academic: headings can feel editorial and book-like, while body content remains practical and legible.

The UI should not feel like a marketing landing page unless a landing page is explicitly being built. Most screens are work screens, so the first viewport should show the usable tool, table, form, problem, editor, or dashboard.

## 2. Source Files

The theme is mainly defined in these files:

```txt
frontend/src/index.css
frontend/tailwind.config.ts
frontend/src/components/layout/SiteContainer.tsx
frontend/src/components/layout/PageContainer.tsx
frontend/src/components/layout/MainPanel.tsx
frontend/src/components/layout/PageSection.tsx
```

Use semantic classes and CSS variables from these files before introducing new raw colors or new layout primitives.

## 3. Theme Tokens

All main colors are exposed through CSS variables in `frontend/src/index.css` and mapped into Tailwind in `frontend/tailwind.config.ts`.

Prefer these semantic tokens:

```css
background
foreground
card
card-foreground
popover
popover-foreground
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
accent
accent-foreground
destructive
destructive-foreground
border
input
ring
```

Use Tailwind semantic utilities where possible:

```tsx
className="bg-background text-foreground border-border"
className="bg-card text-card-foreground"
className="text-muted-foreground"
className="bg-primary text-primary-foreground"
className="text-destructive"
```

Avoid hard-coded color utilities such as `bg-blue-500`, `text-slate-700`, `border-gray-300`, or custom hex colors unless the component has a documented reason and no semantic token fits.

## 4. Light Theme Colors

The default light theme is the primary UI mode.

| Token | HSL | Approx usage |
| --- | --- | --- |
| `--background` | `0 0% 93%` | Outer page shell, app background |
| `--foreground` | `0 0% 13%` | Main readable text |
| `--card` | `0 0% 100%` | White panels, cards, tables, form surfaces |
| `--primary` | `210 85% 45%` | Primary action blue |
| `--secondary` | `0 0% 88%` | Secondary surfaces |
| `--muted` | `0 0% 88%` | Muted blocks and inactive surfaces |
| `--muted-foreground` | `0 0% 42%` | Secondary text |
| `--destructive` | `0 74% 42%` | Error and destructive states |
| `--border` | `0 0% 78%` | Main structural border |
| `--border-subtle` | `0 0% 86%` | Softer internal border |
| `--border-faint` | `0 0% 92%` | Very light dividers |
| `--navbar-bg` | `0 0% 20%` | Top navigation background |
| `--navbar-fg` | `0 0% 90%` | Top navigation text |

The primary color is an AtCoder-style blue in light mode. Use it for:

- Main calls to action.
- Active tab or selected navigation state.
- Focus rings.
- Important links.
- Final answer or successful generated output emphasis when blue is already the local pattern.

Do not use primary blue for every label or decoration. It should signal action, selection, or importance.

## 5. Dark Theme Colors

Dark mode is defined through `.dark` variables. It currently changes the primary color to a red tone:

| Token | HSL | Approx usage |
| --- | --- | --- |
| `--background` | `0 0% 11%` | Dark app shell |
| `--foreground` | `0 0% 90%` | Main readable text |
| `--card` | `0 0% 16%` | Dark panel/card surface |
| `--primary` | `0 79% 59%` | Primary action red in dark mode |
| `--secondary` | `0 0% 23%` | Secondary dark surface |
| `--muted` | `0 0% 23%` | Muted dark surface |
| `--muted-foreground` | `0 0% 64%` | Secondary dark text |
| `--border` | `0 0% 28%` | Main dark border |

Dark mode rules:

- Use semantic tokens only. Do not add light-only hard-coded colors.
- Check hover states in dark mode. A light hover color can make text unreadable.
- Check disabled controls and muted labels for contrast.
- Do not assume primary is blue in all themes.

## 6. Background Structure

The app has a layered structure:

1. Browser/body background: neutral gray from `bg-background`.
2. Site width shell: centered `site-container`.
3. Main page shell: `page-container` spacing.
4. Primary content panel: white `site-main-panel`.
5. Internal sections: `page-section`, tables, forms, rows, editorial blocks, and cards.

The standard page structure should be:

```tsx
<PageContainer>
  <PageSection>
    {/* page header, filters, table, form, problem content, etc. */}
  </PageSection>
</PageContainer>
```

For auth screens:

```tsx
<PageContainer panelVariant="auth">
  {/* login/register form */}
</PageContainer>
```

For admin sub-layouts or pages that already have their own shell:

```tsx
<PageContainer bare>
  {/* custom layout */}
</PageContainer>
```

Use `bare` carefully. Most normal pages should keep the middle white panel.

## 7. Layout Tokens

The layout is controlled by CSS variables:

```css
--layout-max-width: 85rem;
--layout-padding-x: 1rem;
--layout-section-gap: 1.5rem;
--layout-page-py: 1.5rem;
--layout-panel-padding: 1.25rem;
```

Responsive changes:

| Breakpoint | Horizontal padding | Section gap | Page vertical padding | Panel padding |
| --- | --- | --- | --- | --- |
| Base | `1rem` | `1.5rem` | `1.5rem` | `1.25rem` |
| `640px+` | `1.25rem` | `1.75rem` | `2rem` | `1.5rem` |
| `1024px+` | `1.5rem` | `2rem` | `2.5rem` | `1.75rem` |

Rules:

- Use `site-container` for consistent max width and horizontal padding.
- Do not create unrelated max-width wrappers inside standard pages.
- Avoid full-width floating cards inside the main panel.
- Use `page-section` for vertical rhythm between major blocks.
- Use `gap` utilities for internal component spacing, but keep them aligned with the density of the page.

## 8. Primary Layout Components

### `SiteContainer`

Use for navbar, footer, and page-level content width.

Purpose:

- Sets `max-width: var(--layout-max-width)`.
- Centers content.
- Applies responsive horizontal padding.

### `PageContainer`

Use for most pages.

Purpose:

- Combines `SiteContainer` and `MainPanel`.
- Applies responsive page vertical padding unless `flush` is used.
- Can render a `bare` layout when a page has a custom shell.

### `MainPanel`

Use as the main work area.

Purpose:

- White or theme-card middle surface.
- Border around the work area.
- Small subtle shadow.
- Minimum height based on viewport.
- Responsive padding.

### `PageSection`

Use between major page blocks.

Purpose:

- Keeps vertical rhythm consistent.
- Prevents random margin stacks.

## 9. Typography

Fonts are imported in `frontend/src/index.css`:

```css
Libre Baskerville
IBM Plex Sans
JetBrains Mono
```

Font roles:

| Font | CSS variable | Use |
| --- | --- | --- |
| Libre Baskerville | `--font-serif` | Headings and academic titles |
| IBM Plex Sans | `--font-sans` | Body text, controls, tables, forms |
| JetBrains Mono | `--font-mono` | Code, IDs, JSON, math-adjacent technical text, metrics |

Base rules:

- Body font: IBM Plex Sans.
- Body size: `15px`.
- Body line height: `1.6`.
- Heading font: Libre Baskerville.
- Heading line height: `1.3`.
- Code font: JetBrains Mono.
- Do not use negative letter spacing.

Recommended type usage:

| Element | Recommended style |
| --- | --- |
| Page title | Serif, strong weight, compact line-height |
| Section title | Sans or serif depending on context, usually small and strong |
| Table text | Sans, compact, clear |
| Metadata labels | Uppercase sans, small, moderate tracking |
| Code/JSON/prompt text | Mono |
| Problem statement | Sans body with math rendering support |
| Editorial title | Sans label plus structured content blocks |

Do not make dashboard titles or panel headings hero-sized. Hero-scale text belongs only on true landing pages.

## 10. Borders, Radius, and Shadows

The UI relies on borders more than shadows.

Current radius:

```css
--radius: 0.25rem;
```

Rules:

- Use small radii: `rounded-sm`, `rounded`, or token-based radius.
- Cards and controls should generally stay at `4px` radius.
- Avoid large pill-like cards unless the component is intentionally a tag or chip.
- Prefer `border border-border` for structure.
- Use `border-subtle` or `border-faint` for internal dividers.
- Shadows should be subtle and rare.
- Do not use glassmorphism, heavy blur, decorative glow, or floating orb effects.

## 11. Card Rules

Use cards for:

- Repeated inventory/problem bank rows in mobile card view.
- Form containers inside a larger workflow.
- Modals or dialogs.
- Focused stats or summary blocks.
- Editorial callouts.

Avoid:

- Nested cards inside cards.
- Making every page section a separate floating card.
- Heavy shadows around normal content.
- Large rounded marketing cards in operational screens.

Use the existing helper where appropriate:

```tsx
className="academic-card"
```

`academic-card` means:

- `bg-card`
- `border border-border`
- `rounded-sm`

## 12. Buttons and Actions

Primary button:

```tsx
className="btn-primary"
```

Use for the main action on a screen or form:

- Save.
- Submit.
- Generate.
- Approve.
- Send for approval.
- Start quiz when it is the main action.

Outline button:

```tsx
className="btn-outline"
```

Use for secondary actions:

- Cancel.
- Preview.
- Copy.
- Reset filters.
- View details.

Button rules:

- Each view should have a clear primary action.
- Avoid multiple primary buttons in the same visual group.
- Destructive actions must use destructive color or clear destructive copy.
- Icon-only buttons need accessible labels and tooltip/title text.
- Disabled buttons must explain why when the reason is not obvious.
- Loading buttons should keep width stable where possible.

## 13. Navigation

Top navigation uses:

```css
--navbar-bg
--navbar-fg
```

Rules:

- Keep nav compact and predictable.
- Use active state for the current section.
- Use `nav-link` patterns where possible.
- Do not use page-specific colors in global navigation.
- Do not place large marketing copy in the app navigation.

## 14. Tables, Lists, and Inventory Screens

Inventory and problem bank screens should prioritize scanning and filtering.

Rules:

- Put filters above the table/list.
- Use compact controls for Difficulty, status, subject, topic, tags, and search.
- Use status labels consistently: Approved, Pending, Rejected.
- Use table view on desktop when comparison matters.
- Use card/list view on mobile when tables become cramped.
- Preserve readable column widths.
- Use horizontal overflow for dense tables instead of clipping content.
- Important row actions should remain visible or easy to access.

Current responsive pattern:

- `.problems-table-view` is hidden below wide desktop sizes.
- `.problems-card-list` is used for smaller screens.

Filtering UI should:

- Show selected filters clearly.
- Provide reset/clear action.
- Avoid hiding the user in a dead-end state when no results match.
- Include empty-state text for no matching results.

## 15. Forms and Inputs

Form rules:

- Every input must have a visible label or an accessible label.
- Required fields should be clearly marked.
- Validation errors should appear near the field.
- Use `border-input`, `bg-card`, and semantic focus rings.
- Placeholder text is not a replacement for labels.
- Use helper text for format requirements, not long paragraphs.
- Keep advanced configuration in collapsible sections when it is not always needed.

Prompt and JSON input areas:

- Use mono font.
- Preserve whitespace.
- Use enough height for editing.
- Provide copy actions for generated prompts.
- Validate JSON before submission where possible.

## 16. Status and Feedback

Use consistent status language:

```txt
Approved
Pending
Rejected
Draft
Correct
Incorrect
Submitted
Generated
```

Color intent:

| Intent | Preferred treatment |
| --- | --- |
| Success | Green text/border/background, used sparingly |
| Warning | Amber/yellow callout |
| Error/destructive | `destructive` token |
| Info/active | `primary` token |
| Neutral | muted/background/border tokens |

Rules:

- Do not use color alone to communicate state. Include text or icon labels.
- Keep banners compact.
- Error messages should say what happened and what the user can do next.
- Success messages should not block continued work.

## 17. Problem Page Rules

The problem page should support focused solving.

Expected areas:

- Problem header.
- Metadata strip.
- Statement tab.
- Editorial tab.
- Submissions tab.
- Answer/solution panel.
- Timer controls.
- Status/result feedback.

Rules:

- The statement and editorial should be readable without horizontal scrolling except for math/code blocks.
- The answer panel should stay usable on desktop and stack cleanly on mobile.
- Timer should be user-controlled. Do not auto-start unless the user chooses.
- A solved problem should count only one correct submission per user for scoring/tracking.
- Multiple correct resubmissions can be recorded as attempts if needed, but must not increase solved count more than once.
- Hover notice for timer controls should recommend using the timer for learning tracking.

## 18. Editorial Section Rules

The editorial is a learning surface, not just a text dump. It should feel structured, calm, and useful.

Expected editorial structure:

```txt
Overview
Step-by-step solution
Key equations
Why this works
Common traps
Final answer
```

Recommended visual hierarchy:

- Compact editorial header with icon and title.
- Overview callout with muted border.
- Numbered or clearly separated solution steps.
- Equation blocks with centered math and subtle border.
- Key insight callout.
- Optional "Why this works" explanation.
- Optional "Common traps" list.
- Final answer block with primary emphasis.

Rules:

- Keep the editorial inside the same theme: white/card surface, small radius, subtle borders.
- Do not introduce a separate colorful theme just for editorials.
- Math blocks should have enough padding and horizontal overflow handling.
- Explanation text should use normal body size and line height.
- Final answer should be easy to locate.
- Generated solutions should match the UI structure so rendering does not depend on guessing.

## 19. Math and LaTeX Rendering Rules

Questions, theory, and editorials may include mathematical content. Generated content must be valid JSON and use renderer-safe LaTeX.

General rules:

- Use inline math for short expressions.
- Use display math for important equations.
- Keep LaTeX syntactically simple and renderer-friendly.
- Escape backslashes correctly inside JSON strings.
- Do not include raw newlines inside JSON strings unless the schema explicitly allows them.
- Do not mix Markdown table syntax with complex display math unless the renderer supports it.
- Avoid unsupported LaTeX packages or custom macros.

Preferred math notation in generated JSON strings:

```json
{
  "statement": "Find the value of \\(k+n\\) if \\((3!)! = k \\cdot n!\\).",
  "solution": "Since \\((3!)! = 6!\\), we compare it with \\(720!\\)."
}
```

For display equations:

```json
{
  "equations": [
    "\\[\\frac{((3!)!)}{3!} = \\frac{6!}{6} = 120 = 120 \\cdot 1!\\]",
    "\\[k = 120,\\quad n = 719\\]"
  ]
}
```

JSON escaping reminders:

| Desired rendered LaTeX | JSON string must contain |
| --- | --- |
| `\(` | `\\(` |
| `\)` | `\\)` |
| `\[` | `\\[` |
| `\]` | `\\]` |
| `\frac{a}{b}` | `\\frac{a}{b}` |
| `\sqrt{x}` | `\\sqrt{x}` |
| `\le` | `\\le` |
| `\ge` | `\\ge` |
| `\cdot` | `\\cdot` |
| `\times` | `\\times` |

Use these common renderer-safe constructs:

```txt
\\frac{}{}
\\sqrt{}
\\sum
\\prod
\\int
\\lim
\\log
\\ln
\\sin
\\cos
\\tan
\\le
\\ge
\\neq
\\approx
\\cdot
\\times
\\in
\\subseteq
\\mathbb{}
\\mathbf{}
\\text{}
```

Avoid these unless the renderer has been verified:

```txt
Custom macros
Package-specific commands
Complex alignment environments
TikZ
Raw HTML inside math
Unescaped backslashes in JSON
```

## 20. Prompt Generation UI Rules

Bulk Problem Generation and Theory Prompt screens should make prompts easy to select, customize, and copy.

Rules:

- Prompts should be generated per subject taxonomy.
- The user should be able to select subject, topic, subtopic, difficulty, count, and output type where applicable.
- Each generated prompt should be copyable.
- Prompt previews should use mono font.
- Prompt sections should be visually separated but not over-carded.
- The prompt should include JSON schema requirements.
- The prompt should include LaTeX escaping rules.
- The prompt should include rendering expectations for question, options, solution, explanation, and editorial.

Recommended prompt content sections:

```txt
Role and subject taxonomy
Question generation constraints
Difficulty target
Output JSON schema
LaTeX and rendering rules
Validation checklist
Examples
```

Prompt copy blocks should:

- Preserve indentation.
- Avoid hidden truncation.
- Show copy success feedback.
- Work on mobile.

## 21. Subject Taxonomy Prompt Rules

Bulk generation must be dynamic by subject. A generic prompt should not be reused unchanged for every subject.

Subject-based prompt should include:

- Subject name.
- Topic path.
- Expected concepts.
- Excluded concepts if needed.
- Question style.
- Difficulty behavior.
- Common traps.
- Required answer format.
- Solution/editorial format.

Example structure:

```txt
Generate problems for:
Subject: Discrete Mathematics
Unit: Combinatorics
Topic: Permutations and combinations
Subtopic: Inclusion-exclusion
Difficulty: Medium

The generated problem must test inclusion-exclusion directly.
Avoid probability-only framing unless counting is the main operation.
Return valid JSON only.
Use escaped LaTeX delimiters inside JSON strings.
```

## 22. Approval and Rejection Flow Rules

Problem review status should be clear and reversible where the workflow allows it.

Rules:

- A rejected problem should remain visible in rejected filters.
- If a rejected problem is corrected, it should be possible to send it back for approval.
- Approval actions should not disappear permanently after rejection.
- Status transitions should be explicit and traceable.
- The user should be able to review the problem before approving again.
- Inventory and problem bank filters should include at least Approved, Pending, and Rejected states.

Recommended state model:

```txt
Draft -> Pending Approval -> Approved
Pending Approval -> Rejected
Rejected -> Pending Approval
Approved -> Needs Review, only if edited after approval
```

## 23. Accessibility Rules

Minimum requirements:

- Use semantic HTML for headings, buttons, forms, tables, and navigation.
- Buttons must be buttons, not clickable divs.
- Inputs must have labels.
- Icon-only controls must have `aria-label` and tooltip/title.
- Keyboard focus must be visible.
- Focus rings should use `ring`.
- Do not remove outlines without replacing them.
- Color cannot be the only state indicator.
- Text should remain readable at browser zoom.
- Tables should remain navigable with keyboard and screen readers where possible.

## 24. Responsive Rules

The UI must work cleanly on mobile, tablet, and desktop.

Rules:

- Mobile layouts should stack vertically.
- Desktop layouts can use split panes where the content benefits from comparison.
- Avoid fixed widths that break below `360px`.
- Use `minmax(0, 1fr)` in grid/flex layouts when text can overflow.
- Use `overflow-x-auto` for equations, code, JSON, and dense tables.
- Use stable aspect ratios for media or charts.
- Do not allow sidebars to cover primary content.
- Avoid layout shift when filters open, data loads, or tabs change.

Problem detail layout:

- Desktop can use a two-column solve layout.
- Mobile should stack statement/editorial above answer tools.
- Sticky panels should not trap content or overlap footers.

Admin layout:

- Sidebar and content should have clear boundaries.
- On smaller screens, sidebar navigation should collapse or stack without horizontal overflow.

## 25. Motion and Interaction

Motion should be functional and subtle.

Use animation for:

- Loading indicators.
- Small transitions on hover/focus.
- Expand/collapse sections.
- Toast appearance/disappearance.

Avoid:

- Decorative continuous animation.
- Large page transitions.
- Motion that delays form or table usage.
- Hover-only functionality without keyboard/touch alternative.

## 26. Empty, Loading, and Error States

Every data-driven view should define these states:

| State | Required behavior |
| --- | --- |
| Loading | Show spinner/skeleton or compact loading text |
| Empty | Explain that no items exist or no filters match |
| Error | Explain the failure and provide retry/back action when possible |
| Partial data | Show available data and mark missing pieces clearly |

Empty states should be helpful but brief. Do not fill operational pages with large illustration-only empty states.

## 27. Icons

Use the existing icon set where available, preferably Lucide-style icons if the project already uses them.

Rules:

- Icons support labels; they should not replace clarity.
- Icon-only controls require accessible labels.
- Use consistent stroke width and size.
- Do not introduce large custom SVG illustrations for normal app states.
- Use icons for repeated actions such as copy, edit, delete, approve, reject, timer, filters, and tabs.

## 28. Content Density

This product benefits from compact, readable density.

Use:

- Tight metadata rows.
- Compact badges.
- Tables for comparison.
- Clear filters.
- Collapsible advanced sections.

Avoid:

- Excessive whitespace in admin and inventory screens.
- Oversized cards for single rows of data.
- Marketing-style feature sections inside work pages.
- Large hero copy on problem, bank, inventory, or admin pages.

## 29. Color and Decoration Constraints

Do not introduce unrelated visual themes.

Avoid:

- Purple gradient themes.
- Beige/tan editorial themes.
- Dark blue/slate-only dashboards.
- Brown/orange dominant palettes.
- Decorative orbs, blobs, bokeh, or glass effects.
- Large abstract SVGs as primary visuals.
- Random brand colors for one-off states.

Allowed:

- Semantic primary, destructive, muted, border, background, and card colors.
- Small status colors for success/warning/error.
- Generated or real images only when the screen genuinely needs inspectable imagery.
- SVG/icons for functional UI controls.

## 30. Component Implementation Checklist

Before merging a UI change, check:

- Uses `PageContainer` or an intentional custom shell.
- Uses `site-container`, `site-main-panel`, and `page-section` patterns where appropriate.
- Uses semantic color tokens instead of random hard-coded colors.
- Preserves light and dark mode readability.
- Uses IBM Plex Sans for body and Libre Baskerville for headings.
- Uses JetBrains Mono for code, JSON, IDs, and prompt blocks.
- Keeps radius small.
- Uses borders instead of heavy shadows.
- Has responsive behavior for mobile and desktop.
- Handles loading, empty, and error states.
- Has accessible labels and focus states.
- Does not clip long text, math, JSON, or table content.
- Does not create nested card stacks.
- Keeps actions clear and status labels consistent.

## 31. Code Examples

Standard page:

```tsx
import { PageContainer, PageSection } from "@/components/layout";

export function ProblemBankPage() {
  return (
    <PageContainer>
      <PageSection>
        <header className="flex flex-col gap-2 border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Problem Bank
          </p>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Manage Problems
          </h1>
        </header>
      </PageSection>

      <PageSection>
        {/* filters, table, cards, pagination */}
      </PageSection>
    </PageContainer>
  );
}
```

Academic card:

```tsx
<section className="academic-card p-4">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    Filters
  </h2>
  {/* controls */}
</section>
```

Prompt preview:

```tsx
<pre className="overflow-x-auto rounded-sm border border-border bg-muted/40 p-4 font-mono text-sm leading-6">
  {promptText}
</pre>
```

Status badge:

```tsx
<span className="tag-pill">
  Pending Approval
</span>
```

Primary action:

```tsx
<button type="button" className="btn-primary">
  Send for approval
</button>
```

Secondary action:

```tsx
<button type="button" className="btn-outline">
  Copy prompt
</button>
```

## 32. Review Standard

A UI change is considered theme-compliant when it:

- Looks like it belongs inside the existing academic app shell.
- Uses existing tokens and layout primitives.
- Makes the main workflow easier to complete.
- Keeps dense screens scannable.
- Renders correctly on mobile and desktop.
- Preserves accessible interaction states.
- Does not add decorative styling that competes with learning or review work.

When in doubt, choose the simpler, more structured option: neutral background, white work panel, border, compact spacing, readable type, and clear action states.
