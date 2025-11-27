# ReUseIt Documentation

**Cross-platform mobile application for recycling gamification and community engagement**

---

## 📖 Documentation Index

Follow the documentation in order for a complete understanding:

1. **[Introduction](01-introduction.md)** - Project overview and Phase 3 objectives
2. **[Requirements](02-requirements.md)** - Functional and non-functional requirements
3. **[Architecture](03-architecture.md)** - System design and component breakdown
4. **[Implementation](04-implementation.md)** - Development methodology and tech stack
5. **[Testing](05-testing.md)** - Testing strategy and execution results
6. **[Installation](06-installation.md)** - Setup and operation manual
7. **[API Reference](07-api-reference.md)** - GraphQL API documentation
8. **[Known Issues](08-known-issues.md)** - Technical debt and limitations
9. **[Lessons Learned](09-lessons-learned.md)** - Reflections and insights
10. **[References](references.md)** - Citations and resources

---

## 🚀 Quick Start

**For Evaluators (Docker Setup):**
```bash
# 1. Clone repository
git clone https://github.com/Pranavraut033/reuseit.git
cd reuseit-mono

# 2. Configure environment
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Run database migrations
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate:dev

# 5. Start mobile app
pnpm --filter mobile run start
```

**Detailed instructions:** See [Installation Guide](06-installation.md)

---

## 🎯 Key Features

- **AI-Powered Identification** - TensorFlow Lite for on-device waste classification
- **Gamification** - Points, badges, and leaderboards
- **Community Marketplace** - Post items for donation/trade
- **Event Management** - Register and check-in to recycling events
- **Location Services** - Find nearby recycling centers
- **Educational Content** - Guides and articles on sustainable practices

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile Client | React Native (Expo) |
| Backend API | NestJS + GraphQL |
| Database | MongoDB Atlas + Prisma ORM |
| AI/ML | TensorFlow Lite |
| Authentication | Firebase Auth + JWT |
| Maps | Google Maps API |

---

## 📱 Deployment Artifacts

- **Android APK:** Available in `/builds` folder
- **Source Code:** Complete monorepo structure
- **GitHub Repository:** [github.com/Pranavraut033/reuseit](https://github.com/Pranavraut033/reuseit)

---

## 📊 Project Metadata

- **Course:** Software Engineering (DLMCSPSE01)
- **Author:** Pranav Virendra Raut
- **Matriculation No:** 4243687
- **Phase:** 3 - Finalization
- **Date:** November 2024

---

## 🔗 External Links

- **GitHub Pages:** [Documentation Site](https://pranavraut033.github.io/reuseit/)
- **GraphQL Playground:** `http://localhost:4000/graphql` (when running locally)
- **Expo Dev:** Launch via Expo Go mobile app

---

## 📄 License

This project is submitted as academic coursework for IU International University of Applied Sciences.


- **Use Markdown** for all documentation
- **Keep it updated** - Update docs when code changes
- **Be specific** - Include examples and commands
- **Link related docs** - Cross-reference other documentation
- **Include screenshots** - Visual aids help understanding

## 🔗 External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [GraphQL Documentation](https://graphql.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Native Documentation](https://reactnative.dev/)

## 📮 Need Help?

- Check [Quick Reference](./QUICK_REFERENCE.md) for common commands
- Review [Quick Start Guide](./QUICK_START.md) for setup issues
- See [VS Code Integration Guide](./VSCODE_GUIDE.md) for editor problems

---

**Last Updated**: November 2025
