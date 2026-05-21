# Manual Testing Checklist

## Core Features
- [ ] Add kid - verify kid appears in list
- [ ] Edit kid - verify changes save
- [ ] Delete kid - verify confirmation modal, kid removed
- [ ] Add activity - verify activity appears with correct date/time
- [ ] Edit activity - verify changes save
- [ ] Delete activity - verify confirmation modal, activity removed

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

## Dark Mode
- [ ] Toggle dark mode (Cmd+Shift+D)
- [ ] Verify all components have dark styles
- [ ] Verify theme persists on reload

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
