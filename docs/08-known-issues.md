# 8. Known Issues & Technical Debt

## 8.1 Overview

This document transparently acknowledges current limitations and planned improvements for future iterations of ReUseIt.

---

## 8.2 Technical Debt

### TD-01: JWT Refresh Token Rotation

**Issue:** JWT tokens expire after 24 hours, requiring manual re-login. Refresh token rotation is not implemented.

**Impact:** User experience degradation (forced logout after 24h)

**Current Workaround:** Users must log in again after token expiration

**Planned Fix:**
- Implement automatic token refresh via Apollo interceptor
- Add refresh token rotation for enhanced security
- Store refresh token in Expo SecureStore

**Priority:** High
**Estimated Effort:** 8 hours

---

### TD-02: TensorFlow Lite Model Size

**Issue:** Bundled ML model adds 15MB to APK size (current total: 28MB).

**Impact:** Larger download size, especially on slow connections

**Current Workaround:** None

**Planned Fix:**
- Apply post-training quantization (float16) → target 8MB
- Explore on-demand model download (download on first use)
- Consider TensorFlow.js as alternative for smaller bundle

**Priority:** Medium
**Estimated Effort:** 12 hours

---

### TD-03: Hardcoded Event Images

**Issue:** Event images are served from static assets folder instead of user uploads.

**Impact:** Limited flexibility for event organizers

**Reason:** S3 bucket integration not completed in Phase 3 timeline

**Planned Fix:**
- Integrate AWS S3 or Cloudinary for image hosting
- Implement signed URL generation for secure uploads
- Add image upload UI to event creation flow

**Priority:** Medium
**Estimated Effort:** 16 hours

---

### TD-04: No Direct Messaging

**Issue:** Users cannot privately message each other about posts/events.

**Impact:** Users must exchange contact info in comments (less secure)

**Current Workaround:** Public comments or external communication

**Planned Fix:**
- Implement WebSocket-based chat (GraphQL subscriptions)
- Add message notification system
- Create chat history UI

**Priority:** Low (out of MVP scope)
**Estimated Effort:** 40 hours

---

### TD-05: Limited Accessibility Testing

**Issue:** While WCAG 2.1 AA compliance was targeted, only basic screen reader testing (TalkBack) was performed.

**Impact:** Potential usability issues for users with disabilities

**Gaps:**
- No VoiceOver (iOS) testing
- Keyboard navigation not fully tested
- Color blindness mode not implemented

**Planned Fix:**
- Comprehensive accessibility audit with real users
- Implement high-contrast mode
- Add voice command support

**Priority:** Medium
**Estimated Effort:** 24 hours

---

### TD-06: Database Query Optimization

**Issue:** Some complex queries (e.g., leaderboard aggregation) are not optimally indexed.

**Impact:** Performance degradation at scale (>10,000 users)

**Current Performance:**
- Leaderboard query: ~180ms (acceptable for current user count)
- Post feed with location filter: ~120ms

**Planned Fix:**
- Add compound indexes for common query patterns
- Implement Redis caching layer for leaderboard
- Use MongoDB aggregation pipeline optimization

**Priority:** Low (premature optimization at current scale)
**Estimated Effort:** 8 hours

---

### TD-07: Test Coverage Gaps

**Issue:** While overall coverage is 83%, certain edge cases are untested.

**Untested Scenarios:**
- Race conditions in concurrent point awards
- WebSocket reconnection logic
- Image upload retry mechanism
- Offline mutation queue edge cases

**Planned Fix:**
- Add integration tests for race conditions
- Implement chaos testing for network failures
- Increase E2E test coverage to 15% (from 10%)

**Priority:** Medium
**Estimated Effort:** 16 hours

---

### TD-08: No Admin Dashboard

**Issue:** Content moderation and user management require direct database access.

**Impact:** Inefficient content moderation workflow

**Current Workaround:** Prisma Studio for manual database edits

**Planned Fix:**
- Build admin web portal (Next.js)
- Implement role-based access control (RBAC)
- Add moderation queue for reported posts

**Priority:** Low (out of MVP scope)
**Estimated Effort:** 60 hours

---

## 8.3 Known Bugs

### BUG-01: Geolocation Timeout on Android Emulator

**Description:** GPS location request times out on Android emulators without manual location set.

**Steps to Reproduce:**
1. Open app on Android emulator (without preset location)
2. Navigate to "Create Post" → "Use Current Location"
3. Permission granted, but location never resolves

**Workaround:** Manually set location in emulator settings

**Root Cause:** Expo Location API timeout (10s) too aggressive for emulator

**Status:** ⚠️ Low priority (works on physical devices)

---

### BUG-02: Expo Image Picker Crashes on iOS 17.2+

**Description:** Selecting >2 images simultaneously causes crash on iOS 17.2+.

**Impact:** Moderate (users can select images one at a time)

**Workaround:** Select images sequentially

**Status:** ⚠️ Tracked in Expo issue #25431

**Expected Fix:** Expo SDK 50 (Q1 2025)

---

### BUG-03: Apollo Cache Inconsistency After Offline Mutations

**Description:** Optimistic updates are not rolled back if mutation fails after reconnection.

**Steps to Reproduce:**
1. Go offline
2. Like a post (optimistic update shows liked state)
3. Go online
4. Mutation fails due to post deletion
5. UI still shows post as liked

**Workaround:** Refresh feed manually

**Status:** 🔧 In Progress

**Planned Fix:** Implement Apollo error link with cache rollback

---

## 8.4 Performance Bottlenecks

### PB-01: Image Compression on Low-End Devices

**Issue:** Image compression (1920x1920, 80% quality) takes 3-5 seconds on devices with <2GB RAM.

**Impact:** Poor UX during post creation

**Current Mitigation:** Loading indicator displayed

**Planned Improvement:**
- Use native compression (expo-image-manipulator with native modules)
- Reduce target resolution to 1280x1280 for low-end devices

---

### PB-02: Initial App Load Time

**Issue:** First app launch takes 3-4 seconds due to TensorFlow model loading.

**Impact:** Poor first impression for new users

**Planned Improvement:**
- Lazy-load ML model (download on first use of camera feature)
- Display engaging onboarding animation during load

---

## 8.5 Security Considerations

### SC-01: No Rate Limiting on File Uploads

**Issue:** File upload endpoint lacks rate limiting, allowing potential abuse.

**Risk:** Medium (could lead to storage exhaustion)

**Planned Fix:** Implement per-user upload limits (10 images/hour)

---

### SC-02: Weak Password Policy

**Issue:** Current policy (8+ chars, 1 uppercase, 1 number) is below NIST guidelines.

**Recommendation:** Enforce 12+ character minimum, optional MFA

**Priority:** Medium

---

### SC-03: No Input Sanitization for Rich Text

**Issue:** Post descriptions allow unsanitized HTML (not currently exploitable, but risky).

**Risk:** Low (React Native auto-escapes, but future risk if web version added)

**Planned Fix:** Implement DOMPurify or markdown-only input

---

## 8.6 Deployment Limitations

### DL-01: No Automated Deployment

**Issue:** Backend deployment requires manual Railway dashboard interaction.

**Impact:** Slower release cycle

**Planned Fix:**
- Implement GitHub Actions workflow for automatic Railway deployment
- Add staging environment

---

### DL-02: No Database Backup Strategy

**Issue:** MongoDB Atlas automatic backups not configured (free tier limitation).

**Risk:** Data loss in case of accidental deletion

**Workaround:** Manual mongodump every 2 weeks

**Planned Fix:** Upgrade to Atlas M2 tier with automated daily backups

---

## 8.7 Planned Features (Out of Scope)

### Future Enhancements

1. **Multi-Language Support**
   - English and German localization
   - Right-to-left (RTL) layout support

2. **iOS Build**
   - Currently Android-only
   - Requires Apple Developer account ($99/year)

3. **Payment Integration**
   - Stripe for marketplace transactions
   - Donation processing

4. **Social Features**
   - User following
   - Activity feed
   - Push notification for followers' posts

5. **Advanced ML**
   - Object detection (bounding boxes)
   - Material composition analysis
   - Recyclability score prediction

---

## 8.8 Lessons Learned

**What worked well:**
- Monorepo structure simplified dependency management
- GraphQL reduced over-fetching compared to REST
- Expo's managed workflow accelerated mobile development

**What didn't work well:**
- TensorFlow Lite integration was more complex than anticipated
- MongoDB replica set requirement for Prisma was unexpected
- Android emulator location issues caused debugging delays

**What to do differently:**
- Allocate 20% more time for ML integration
- Use MongoDB Atlas from the start (avoid local replica set setup)
- Prioritize iOS development earlier (larger user base)

---

## 8.9 Mitigation Strategies

For production deployment, the following issues **must** be addressed:

1. ✅ **Implement refresh token rotation** (TD-01)
2. ✅ **Add rate limiting for uploads** (SC-01)
3. ✅ **Set up automated backups** (DL-02)
4. ⚠️ **Optimize ML model size** (TD-02) - *Nice to have*
5. ⚠️ **Fix Apollo cache rollback** (BUG-03) - *Medium priority*

---

**Previous:** [← API Reference](07-api-reference.md) | **Next:** [Lessons Learned →](09-lessons-learned.md)
