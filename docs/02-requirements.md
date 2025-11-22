# 2. Requirements Specification

This section defines the **Functional Requirements (FR)** and **Non-Functional Requirements (NFR)** for the ReUseIt application.

---

## 2.1 Functional Requirements (FR)

### FR1: User Authentication & Profile Management

**Description:** Users must be able to create accounts, log in securely, and manage their profiles.

**Acceptance Criteria:**
- Email/password registration with validation
- Google OAuth integration
- JWT token-based session management
- Profile editing (name, avatar, bio)
- Password recovery via email
- Account deletion

**Priority:** High
**Status:** ✅ Implemented

---

### FR2: Educational Content

**Description:** Provide curated articles and guides on recycling and sustainability.

**Acceptance Criteria:**
- Browse articles by category (plastic, glass, metal, etc.)
- Search functionality with keyword matching
- Bookmark articles for offline access
- Display rich media (images, videos)
- Admin content management (backend only)

**Priority:** High
**Status:** ✅ Implemented

---

### FR3: AI-Powered Item Identification

**Description:** Classify waste items using on-device machine learning.

**Acceptance Criteria:**
- Capture image via camera
- Select image from gallery
- TensorFlow Lite model inference (<3s processing time)
- Display confidence score and material type
- Provide recycling instructions based on result
- Optional: Save result to user history

**Priority:** High
**Status:** ✅ Implemented

---

### FR4: Community Marketplace (Posts)

**Description:** Enable users to post items for donation, trade, or request.

**Acceptance Criteria:**
- Create posts with title, description, images, category
- View feed of community posts
- Like and comment on posts
- Filter by category, location, date
- Delete own posts
- Report inappropriate content

**Priority:** High
**Status:** ✅ Implemented

---

### FR5: Event Management

**Description:** Allow users to discover and register for recycling events.

**Acceptance Criteria:**
- View events on interactive map
- Browse events in list/calendar view
- Register for events (with participant limit enforcement)
- QR code check-in at events
- Receive event reminders via push notifications
- View event details (date, location, description)

**Priority:** Medium
**Status:** ✅ Implemented

---

### FR6: Gamification System

**Description:** Incentivize user engagement through points and badges.

**Acceptance Criteria:**
- Earn points for actions (posting, recycling, events)
- Unlock badges for achievements
- View leaderboard (daily, weekly, all-time)
- Display user rank and total points
- Points calculation rules documented

**Priority:** Medium
**Status:** ✅ Implemented

**Point Awards:**
- Post creation: +10 points
- Event check-in: +25 points
- Item identification: +5 points
- Post like received: +2 points

---

### FR7: Location Services

**Description:** Help users find nearby recycling centers.

**Acceptance Criteria:**
- Display recycling centers on Google Maps
- Filter by accepted materials
- View center details (hours, contact, materials)
- Get directions to selected center
- Search by address or current location

**Priority:** High
**Status:** ✅ Implemented

---

### FR8: Push Notifications

**Description:** Notify users of relevant events and interactions.

**Acceptance Criteria:**
- Event reminders (1 day before, 1 hour before)
- Post interaction notifications (likes, comments)
- Badge unlock notifications
- Leaderboard position changes (optional)
- User-configurable notification preferences

**Priority:** Low
**Status:** ✅ Implemented

---

## 2.2 Non-Functional Requirements (NFR)

### NFR1: Performance - Application Launch Time

**Requirement:** The application must achieve Time-to-Interactive (TTI) under 2 seconds on standard 4G networks.

**Measurement:**
- Tested on Samsung Galaxy S21 with 4G connection
- Average TTI: **1.8 seconds**

**Status:** ✅ Met

---

### NFR2: Performance - Image Recognition Speed

**Requirement:** ML model inference must complete within 3 seconds per image.

**Measurement:**
- Tested with 100 sample images
- Average inference time: **2.1 seconds**
- 95th percentile: **2.8 seconds**

**Status:** ✅ Met

---

### NFR3: Usability - Accessibility

**Requirement:** Interface must adhere to WCAG 2.1 AA standards for contrast and font scaling.

**Compliance:**
- Minimum contrast ratio: 4.5:1 for normal text
- Dynamic font scaling support (system preferences)
- Screen reader compatibility tested with TalkBack (Android)

**Status:** ✅ Met

---

### NFR4: Security - Data Protection

**Requirement:** All data in transit must be encrypted. User passwords must never be stored in plain text.

**Implementation:**
- HTTPS/TLS 1.3 for all API communication
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire after 24 hours
- Refresh tokens expire after 30 days

**Status:** ✅ Met

---

### NFR5: Reliability - Offline Functionality

**Requirement:** Application must provide basic functionality (viewing cached articles) when offline. Target uptime: 99.5%.

**Implementation:**
- Apollo Client caching for offline read access
- Queued mutations retry on reconnection
- Service unavailability gracefully handled

**Measured Uptime (last 30 days):** 99.7%

**Status:** ✅ Met

---

### NFR6: Scalability - Concurrent Request Handling

**Requirement:** Backend must support at least 500 concurrent requests without degradation.

**Load Test Results:**
- Tested with Artillery.io
- 500 concurrent users: Avg response time **240ms**
- 1000 concurrent users: Avg response time **580ms** (acceptable)
- No failed requests at 500 concurrent load

**Status:** ✅ Met

---

## 2.3 Requirement Traceability Matrix

| Requirement ID | Feature | Test Coverage | Status |
|---------------|---------|---------------|--------|
| FR1 | Authentication | 95% | ✅ |
| FR2 | Educational Content | 88% | ✅ |
| FR3 | AI Identification | 82% | ✅ |
| FR4 | Community Posts | 91% | ✅ |
| FR5 | Events | 86% | ✅ |
| FR6 | Gamification | 79% | ✅ |
| FR7 | Location | 84% | ✅ |
| FR8 | Notifications | 77% | ✅ |
| NFR1 | Launch Performance | Validated | ✅ |
| NFR2 | ML Performance | Validated | ✅ |
| NFR3 | Accessibility | Audited | ✅ |
| NFR4 | Security | Penetration Tested | ✅ |
| NFR5 | Offline Mode | Tested | ✅ |
| NFR6 | Scalability | Load Tested | ✅ |

---

**Previous:** [← Introduction](01-introduction.md) | **Next:** [Architecture →](03-architecture.md)
