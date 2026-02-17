# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: ee7dfb42-565e-419f-ae99-5719f0809269 -->

**Completed**: Technical specification created at `.zenflow/tasks/new-task-cc5c/spec.md`

**Difficulty Assessment**: Medium - Moderate complexity requiring attention to multiple components and responsive design patterns

**Key Findings**:
- Landing page needs horizontal padding and touch target optimization
- Site header wallet display and dialog need mobile layout improvements
- Dashboard cards, charts need spacing/sizing adjustments
- Data tables require horizontal scroll or mobile-optimized views
- Touch targets must meet 44px minimum size requirement

---

### [x] Step: Header & Landing Page Mobile Optimization

**Objective**: Fix mobile responsiveness issues in the site header and landing page

**Files to Modify**:
- `client/app/page.tsx` - Landing page
- `client/components/site-header.tsx` - Site header

**Implementation Tasks**:
1. **Landing Page** (`client/app/page.tsx`):
   - Add horizontal padding for mobile screens (px-4 sm:px-6)
   - Ensure card image is responsive
   - Optimize button sizes for touch interaction (min 44px)
   - Test on 320px-430px viewports

2. **Site Header** (`client/components/site-header.tsx`):
   - Add text truncation for page titles with ellipsis
   - Optimize wallet balance display for narrow screens
   - Improve top-up dialog layout for mobile (single column on mobile)
   - Ensure proper spacing for touch targets
   - Test dialog usability on mobile screens

**Verification**:
- Test on mobile viewports (320px, 375px, 390px, 430px)
- Verify touch targets meet 44px minimum
- Run `npm run lint` to check for errors
- Verify no layout overflow or horizontal scrolling issues

---

### [x] Step: Dashboard Components Mobile Optimization
<!-- chat-id: 2c2a7140-2021-4b09-ace2-7e6c4b6ea233 -->

**Objective**: Optimize section cards and chart components for mobile devices

**Files to Modify**:
- `client/components/section-cards.tsx` - Dashboard stats cards
- `client/components/chart-area-interactive.tsx` - Analytics chart

**Implementation Tasks**:
1. **Section Cards** (`client/components/section-cards.tsx`):
   - Adjust grid gaps for mobile (gap-3 on mobile, gap-4 on larger screens)
   - Optimize padding (px-3 sm:px-4 lg:px-6)
   - Verify card content readability on small screens
   - Test container query breakpoints

2. **Chart Component** (`client/components/chart-area-interactive.tsx`):
   - Verify chart height works on mobile (adjust if needed)
   - Test time range selector on touch devices
   - Optimize chart padding (px-2 sm:px-4 sm:pt-6)
   - Ensure legend is readable on small screens

**Verification**:
- Test dashboard on various mobile screen sizes
- Verify all cards are visible and readable
- Check chart interactions work on touch devices
- Run `npm run lint`

---

### [x] Step: Data Tables Mobile Optimization

**Objective**: Make data tables usable on mobile devices

**Files to Modify**:
- `client/components/orders-data-table.tsx` - Orders table
- `client/components/transactions-data-table.tsx` - Transactions table

**Implementation Tasks**:
1. **Table Responsiveness**:
   - Implement horizontal scroll with proper overflow handling
   - Add visual scroll indicators (shadows or gradients)
   - Optimize filter controls layout for mobile (stack vertically)
   - Improve pagination controls spacing and touch targets

2. **Mobile-Specific Adjustments**:
   - Ensure table wrapper has proper overflow-x-auto
   - Add rounded corners and proper borders
   - Test filter dropdowns on mobile devices
   - Verify pagination works on touch devices

**Verification**:
- Test tables with various amounts of data
- Verify horizontal scrolling works smoothly
- Check filter controls are usable on mobile
- Test pagination on touch devices
- Run `npm run lint`

---

### [x] Step: Global Polish & Testing
<!-- chat-id: c9c1e32d-f942-4b34-b373-8447e79403c9 -->

**Objective**: Final mobile responsiveness improvements and comprehensive testing

**Files to Review**:
- All modified components
- `client/app/globals.css` (if needed for global utilities)

**Implementation Tasks**:
1. **Typography & Spacing Review**:
   - Verify font sizes are readable on mobile
   - Ensure consistent spacing across pages
   - Check line-height for readability

2. **Touch Targets Audit**:
   - Verify all buttons/links meet 44px minimum
   - Add proper spacing between clickable elements
   - Test all interactive elements on touch devices

3. **Comprehensive Testing**:
   - Test all pages on mobile viewports (320px-430px)
   - Test landscape and portrait orientations
   - Verify no layout shifts or overlapping elements
   - Check performance on mobile devices

**Verification**:
- Complete manual testing checklist on mobile sizes
- Run `npm run build` to verify production build
- Run `npm run lint` for final verification
- Document any remaining issues or recommendations

---

### [x] Step: Final Report

**Objective**: Document the implementation and create completion report

**Tasks**:
- Write `{@artifacts_path}/report.md` with:
  - Summary of all changes made
  - Mobile testing results
  - Before/after comparisons (if applicable)
  - Any remaining recommendations or future improvements
  - Build and lint verification results
