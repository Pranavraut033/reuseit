# 9. Lessons Learned & Reflection

## 9.1 Methodology & Resource Management

### Agile Effectiveness

**What Worked:**
- **2-week sprints** provided clear milestones and prevented scope creep
- **Daily self-standups** (15-minute reflections) kept focus sharp
- **Sprint retrospectives** enabled quick pivots when blockers emerged

**What Didn't Work:**
- **Initial estimates were too optimistic** - Sprint 4 (ML integration) took 40% longer than planned
- **Solo development** meant no peer code reviews, leading to some architectural decisions I later questioned

**Key Insight:**
> For future solo projects, allocate a **25% time buffer** for unexpected technical challenges. The TensorFlow Lite integration alone consumed 60 hours instead of the planned 40.

---

### Time Management

**Actual Time Distribution:**

| Phase | Planned | Actual | Variance |
|-------|---------|--------|----------|
| Planning & Design | 20 hours | 18 hours | -10% |
| Backend Development | 80 hours | 75 hours | -6% |
| Mobile Development | 90 hours | 110 hours | +22% |
| ML Integration | 40 hours | 60 hours | +50% |
| Testing & Documentation | 50 hours | 62 hours | +24% |
| **Total** | **280 hours** | **325 hours** | **+16%** |

**Underestimated Areas:**
1. **TensorFlow Lite Setup** - Native module integration with Expo was poorly documented
2. **MongoDB Replica Set** - Prisma's requirement for transactions added 8 hours of setup
3. **Documentation** - Academic formatting requirements took longer than expected

**Lesson:** Always research framework-specific constraints (e.g., Expo limitations) *before* sprint planning.

---

## 9.2 Technical Challenges & Solutions

### Challenge 1: Android Emulator → Backend Connection

**Problem:**
Mobile app couldn't reach `localhost:4000` from Android emulator.

**Failed Attempts:**
- `http://localhost:4000/graphql` → Connection refused
- `http://127.0.0.1:4000/graphql` → Connection refused

**Solution:**
Android emulators use `10.0.2.2` as an alias for the host machine's localhost.

```env
EXPO_PUBLIC_API_URL="http://10.0.2.2:4000/graphql"
```

**Lesson:** Platform-specific networking quirks should be documented in README *immediately* to help future contributors.

---

### Challenge 2: NativeWind + Babel Configuration Conflict

**Problem:**
NativeWind (Tailwind for React Native) caused cryptic Babel errors during builds.

```
Error: Cannot resolve module 'nativewind/babel' from 'babel.config.js'
```

**Root Cause:**
NativeWind v2 requires specific Babel plugin ordering and Expo SDK version compatibility.

**Solution:**
- Downgraded to NativeWind v2.0.11 (stable with Expo 49)
- Reordered Babel plugins to ensure `nativewind/babel` loads *after* `expo`

**Lesson:** For cross-platform projects, verify library compatibility with framework versions in the *planning* phase, not during implementation.

---

### Challenge 3: Data Preparation for ML Model

**Problem:**
Needed 500+ labeled images of recyclables. Public datasets (TrashNet) had only 2,500 images across 6 categories—insufficient for 20+ material types.

**Initial Plan:** Scrape images from Google Images → **Legal/ethical concerns**

**Final Approach:**
1. Used TrashNet as a base (40% of dataset)
2. Manually photographed 300 items from personal collection
3. Augmented dataset with rotations and lighting variations

**Time Cost:** 24 hours (vs. 8 hours estimated)

**Lesson:** ML projects require **dedicated data preparation sprints**. I should have allocated Sprint 3.5 solely for dataset curation.

---

### Challenge 4: Geospatial Query Performance

**Problem:**
Query to find events within 5km of user location took 850ms (unacceptable for mobile UX).

**Root Cause:**
Missing 2dsphere index on `location` field.

**Solution:**
```javascript
// prisma/scripts/createGeoIndex.js
db.events.createIndex({ location: "2dsphere" });
```

After indexing: **Query time reduced to 95ms** (89% improvement)

**Lesson:** MongoDB geospatial queries *require* proper indexing. This should be part of initial schema design, not an afterthought.

---

## 9.3 Architectural Decisions

### Decision 1: GraphQL vs. REST

**Rationale for GraphQL:**
- Mobile app needs varied data shapes (post list vs. post detail)
- Reduces network requests (single query for nested data)
- Strong typing with TypeScript code generation

**Trade-offs:**
- ✅ Eliminated over-fetching (37% reduction in data transfer vs. REST mock)
- ❌ Learning curve for Apollo Client caching
- ❌ Complex error handling compared to HTTP status codes

**Verdict:** Correct choice for this project. The reduced network overhead significantly improved mobile UX.

---

### Decision 2: Expo Managed Workflow vs. React Native CLI

**Rationale for Expo:**
- Faster iteration (over-the-air updates)
- No need for Xcode/Android Studio for development
- Built-in modules for Camera, Location, Notifications

**Trade-offs:**
- ✅ Development speed increased by ~40%
- ❌ Larger APK size (28MB vs. ~15MB for bare React Native)
- ❌ Limited native module integration (had to eject for TensorFlow Lite)

**Verdict:** Would choose Expo again for prototyping, but consider bare React Native for production apps requiring heavy native customization.

---

### Decision 3: MongoDB vs. PostgreSQL

**Rationale for MongoDB:**
- Flexible schema for evolving post types (donation, request, swap)
- Native geospatial queries (2dsphere indexes)
- Document model aligns with GraphQL resolvers

**Trade-offs:**
- ✅ Faster development (no migrations for schema changes)
- ❌ Prisma support for MongoDB is less mature (no referential integrity)
- ❌ Replica set requirement added deployment complexity

**Verdict:** Mixed. For this project, PostgreSQL with PostGIS would have been equally effective and avoided the replica set overhead.

---

## 9.4 Testing Insights

**What I Got Right:**
- Writing tests *during* development (not after) caught 12 bugs early
- Integration tests for API endpoints provided confidence during refactoring

**What I Got Wrong:**
- E2E tests were an afterthought (added in Sprint 6)
- Didn't test error states thoroughly (e.g., network failures)

**Key Metric:**
Coverage hit 83%, but **critical user flows** (login → post creation → event registration) had only 2 E2E tests. I should have prioritized E2E for these flows in Sprint 3.

**Lesson:** Define E2E test scenarios in sprint planning, not during the polish phase.

---

## 9.5 Tools & Libraries Assessment

### Highly Effective

| Tool | Why It Worked |
|------|---------------|
| **Prisma** | Type-safe queries eliminated runtime errors |
| **Apollo Client** | Normalized cache reduced boilerplate |
| **pnpm Workspaces** | Monorepo dependency management was seamless |
| **Jest** | Fast test execution (average 3.2s for full backend suite) |

### Problematic

| Tool | Issues Encountered |
|------|---------------------|
| **TensorFlow Lite** | Poor Expo integration docs, large bundle size |
| **Detox** | Flaky tests on CI environment |
| **NativeWind** | Version compatibility issues with Expo |

---

## 9.6 Stakeholder Communication

**Context:** While this is an academic project, I treated the course evaluator as a "stakeholder."

**Effective Practices:**
- Documentation-first approach (wrote README before coding)
- Commit messages following Conventional Commits (enabled automatic changelog generation)

**Missed Opportunity:**
- Should have created a project roadmap visualization (Gantt chart) for Phase 2 feedback

---

## 9.7 Personal Growth

### Skills Acquired

**Before This Project:**
- Moderate React knowledge
- Basic GraphQL (queries only)
- No mobile development experience

**After This Project:**
- ✅ Proficient in React Native & Expo
- ✅ Advanced GraphQL (subscriptions, DataLoader, caching)
- ✅ On-device ML with TensorFlow Lite
- ✅ Geospatial data modeling
- ✅ CI/CD pipeline setup

**Most Valuable Learning:**
> Understanding the **full software lifecycle** - from requirements gathering to deployment - is more valuable than mastering any single technology.

---

## 9.8 What I Would Do Differently

### If Starting Over

1. **Prototype ML integration first** (Sprint 1) to validate feasibility
2. **Use PostgreSQL + PostGIS** to avoid MongoDB replica set complexity
3. **Allocate 30% of time to testing** (not 18% as planned)
4. **Set up iOS simulator** earlier to catch cross-platform issues
5. **Create admin dashboard** (even basic) for content moderation

### For Future Projects

1. **Bias toward simplicity** - Chose GraphQL for learning, but REST would suffice for this MVP
2. **Test deployment early** - First Railway deployment in Sprint 6 was too late
3. **Document as you go** - Writing docs in Sprint 6 meant forgetting implementation details

---

## 9.9 Academic Perspective

### Alignment with Course Objectives

**Software Engineering Principles Applied:**

| Principle | How Applied |
|-----------|-------------|
| **Modularity** | NestJS modules, React components |
| **Abstraction** | Prisma ORM, Apollo Client |
| **Separation of Concerns** | 3-layer architecture (presentation, business logic, data) |
| **DRY (Don't Repeat Yourself)** | Shared utilities, GraphQL fragments |
| **SOLID Principles** | Dependency injection (NestJS), single responsibility |

**Most Impactful Concept:**
> **Non-Functional Requirements as First-Class Citizens** - Treating performance, security, and usability with equal weight to features improved overall quality.

---

## 9.10 Conclusion

This project successfully demonstrated that a **solo developer** can deliver a full-stack, production-ready application using modern cloud-native technologies in a **12-week timeline**.

**Critical Success Factors:**
1. **Clear requirements** (FR/NFR) prevented scope creep
2. **Agile methodology** enabled course correction when blockers emerged
3. **Leveraging managed services** (MongoDB Atlas, Firebase) reduced infrastructure overhead

**Key Takeaway:**
> Software engineering is as much about **decision-making under uncertainty** as it is about technical execution. The ability to evaluate trade-offs (e.g., Expo vs. React Native CLI) is what separates good engineers from great ones.

---

**If I could summarize this journey in one sentence:**
*I underestimated the complexity of ML integration, overestimated my initial estimates, but successfully delivered a functional MVP by remaining adaptable and prioritizing ruthlessly.*

---

**Previous:** [← Known Issues](08-known-issues.md) | **Next:** [References →](references.md)
