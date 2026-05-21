# Manual Testing Checklist

## Core Features
- [ ] Add kid - verify kid appears in list
- [ ] Upload kid profile photo - verify avatar displays in list and activity form
- [ ] Edit kid - verify changes save
- [ ] Delete kid - verify confirmation modal, kid removed
- [ ] Parent profile - open from header avatar, upload photo and display name
- [ ] Add activity - verify activity appears with correct date/time
- [ ] Add activity location - verify location shows on card and calendar export
- [ ] Edit activity - verify changes save
- [ ] Delete activity - verify confirmation modal, activity removed
- [ ] Share kid activities - invite parent by email, verify invitees listed on activities
- [ ] Invited parent - sign in and see shared activities with "Shared with you" badge

## Notifications
- [ ] Request notification permission on first load
- [ ] Verify FCM token is stored
- [ ] Test notification display (if FCM configured)

## Recurring Activities
- [ ] Create recurring activity (daily/weekly/monthly)
- [ ] Verify recurrence pattern works
- [ ] Edit recurring activity
- [ ] Delete recurring activity

## Templates
- [ ] Create activity template
- [ ] Use template to create activity
- [ ] Verify template fields populate correctly

## Search & Filtering
- [ ] Search by activity title
- [ ] Filter by kid
- [ ] Filter by date range
- [ ] Combine multiple filters

## History & Archive
- [ ] Archive completed activity
- [ ] View archived activities
- [ ] Restore archived activity

## Bulk Operations
- [ ] Assign same activity to multiple kids
- [ ] Verify each kid gets separate activity

## PostHog Theme (light only)
- [ ] Page background is Canvas Sand (#eeefe9)
- [ ] Primary buttons are Marigold Yellow with black text
- [ ] Active tabs use Sky Blue underline
- [ ] Brand gradient bar visible under header
- [ ] No dark mode toggle (PostHog Workshop is light-only)

## Keyboard Shortcuts
- [ ] Cmd+K - Open add activity
- [ ] Cmd+Shift+D - Toggle theme
- [ ] Cmd+F - Open search
- [ ] Cmd+E - Export data
- [ ] Cmd+A - Archive activity

## Export/Import
- [ ] Export data to JSON
- [ ] Import data from JSON
- [ ] Verify imported data matches exported

## Offline Support
- [ ] Go offline (DevTools → Network → Offline)
- [ ] Verify app still loads
- [ ] Verify cached data displays
- [ ] Go online - verify sync

## Loading States
- [ ] Add activity - verify "Saving..." state
- [ ] Delete activity - verify "Deleting..." state
- [ ] Verify buttons disabled during operations
- [ ] Verify no duplicate actions on rapid clicks

## Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify all buttons/inputs accessible

## Performance
- [ ] Check Lighthouse score (target: 90+)
- [ ] Verify no console errors
- [ ] Check bundle size < 200KB
- [ ] Verify smooth animations (60fps)

## Accessibility
- [ ] Tab through all interactive elements
- [ ] Verify focus states visible
- [ ] Test with screen reader (VoiceOver on Mac)
- [ ] Verify color contrast meets WCAG AA

## Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
