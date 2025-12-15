# 8. Known Issues & Technical Debt

## 8.1 Overview

This document transparently acknowledges current limitations and planned improvements for future iterations of ReUseIt.

---

## 8.2 Technical Debt

---

## 8.7 Planned Features (Out of Scope)

### Future Enhancements

1. **Multi-Language Support**
   - English and German localization
   - Right-to-left (RTL) layout support

2. **iOS Build**
   - Currently Android-only
   - Requires Apple Developer account ($99/year)

3. **Social Features**
   - User following
   - Activity feed
   - Push notification for followers' posts

4. **Advanced ML**
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

---

**Previous:** [← API Reference](07-api-reference.md) | **Next:** [Lessons Learned →](09-lessons-learned.md)
