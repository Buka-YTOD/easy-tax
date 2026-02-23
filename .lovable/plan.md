

# Navigation and Product UX Improvements

After exploring the app thoroughly, here are the key problems and proposed fixes:

## Problems Identified

### 1. No clear "flow" between pages
The sidebar lists 7 items with no visual hierarchy or sequencing. A new user doesn't know whether to go to "Guided Interview" first or "Review" or "Result." The pages ARE sequential (Guided -> Review -> Result -> Filing Pack) but the sidebar doesn't communicate this.

### 2. No breadcrumbs or "where am I" context
When you're on the Result page, there's no way to know what came before or what comes next. Each page is an island.

### 3. Result page is a dead end if no data exists
If a user navigates to Result without having done any income entry, they just see "Ready to compute?" with no guidance on what to do first.

### 4. No "next step" CTAs on most pages
The Home page has CTAs, but once inside the flow, pages like Review don't strongly push you forward. The Result page has a "Generate Filing Pack" link, but other pages lack consistent forward navigation.

### 5. Mobile sidebar has no visual progress indicator
On mobile, users must open a hamburger menu to navigate, with no sense of where they are in the overall tax filing journey.

### 6. Settings is buried
Tax year and profile settings are critical first steps but hidden in the sidebar.

---

## Proposed Changes

### A. Add a persistent "Flow Progress Bar" to the main layout
A horizontal step indicator at the top of the main content area (below the header) showing the user's journey:

```text
[Profile] --> [Income & Gains] --> [Review] --> [Compute] --> [Filing Pack]
```

- Completed steps show a checkmark
- Current step is highlighted
- Clicking a step navigates to that page
- This replaces the need for users to understand the sidebar

### B. Add contextual "Next Step" banners on every page
Each page gets a bottom banner or card that says what to do next:
- **Settings**: "Next: Start the Guided Interview" (link to /app/guided)
- **Guided Interview**: Already has "Go to Review" when stage = review
- **Review**: "Next: Compute your tax" (link to /app/result) -- make it more prominent
- **Result**: "Next: Generate your filing pack" (already exists, keep it)
- **Filing Pack**: "You're done! Download your pack." (celebration state)

### C. Add "empty state with redirect" on Result and Filing Pack
When a user lands on Result with no income data at all, instead of just showing "Ready to compute?", show a message like:
> "You haven't added any income yet. Start with the guided interview to get set up."
> [Go to Guided Interview]

Same for Filing Pack if no computation exists.

### D. Reorganize the sidebar into grouped sections
Group sidebar items into logical sections:

```text
GET STARTED
  Home
  Guided Interview

YOUR DATA
  Review
  Result
  Filing Pack

ADVANCED
  Manual Mode
  Settings
```

### E. Add a mobile bottom navigation bar
Replace the sidebar-only navigation on mobile with a fixed bottom nav bar showing the 4-5 most important items (Home, Guided, Review, Result, More...) so users always know where they are and can navigate without opening the hamburger.

### F. Highlight the active sidebar item (already works) + add completion badges
Add small badges or checkmarks next to sidebar items that have been "completed" (e.g., profile set up, income added, tax computed).

---

## Technical Details

### Files to modify:
1. **`src/components/AppLayout.tsx`** -- Add the flow progress bar component below the header; add mobile bottom nav
2. **`src/components/AppSidebar.tsx`** -- Reorganize into grouped sections with labels; add completion badges
3. **`src/pages/Result.tsx`** -- Improve empty state to check if income exists and redirect/guide accordingly
4. **`src/pages/FilingPack.tsx`** -- Add empty state guidance when no computation exists
5. **`src/pages/Review.tsx`** -- Make the "Compute My Tax" CTA more prominent
6. **`src/pages/Settings.tsx`** -- Add a "Next: Start Interview" CTA at the bottom

### New files:
1. **`src/components/FlowProgressBar.tsx`** -- Horizontal step indicator showing Profile -> Income -> Review -> Compute -> Filing Pack with completion state derived from existing hooks
2. **`src/components/MobileBottomNav.tsx`** -- Fixed bottom navigation bar for mobile with 5 key items

### Data needed for completion tracking:
- Profile complete: `useTaxProfile()` returns data with `stateOfResidence` set
- Income added: `useIncome()` returns non-empty array
- Tax computed: `useComputation()` returns data
- Filing pack generated: `useFilingPack()` returns data

All of these hooks already exist, so no new API work is needed.

