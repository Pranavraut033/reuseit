# ReuseIt Documentation

Welcome to the ReuseIt documentation! This folder contains comprehensive guides and references for the entire monorepo.

## 📚 Table of Contents

### Getting Started
- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in minutes
- **[Quick Reference](./QUICK_REFERENCE.md)** - Common commands and workflows

### Development Setup
- **[VS Code Integration Guide](./VSCODE_GUIDE.md)** - Editor setup and shortcuts
- **[Linting & Formatting](./LINTING_FORMATTING.md)** - ESLint and Prettier configuration

### Feature Documentation
- **[Google Maps Migration](./GOOGLE_MAPS_MIGRATION.md)** - Google Maps API architecture
- **[Post Create Screen - Implementation](./IMPLEMENTATION_SUMMARY.md)** - Detailed feature implementation
- **[Post Create Screen - Architecture](./ARCHITECTURE.md)** - System architecture diagrams

## 🚀 Quick Links

### For New Developers
1. Start with [Quick Start Guide](./QUICK_START.md) to set up your environment
2. Configure your editor with [VS Code Integration Guide](./VSCODE_GUIDE.md)
3. Review [Linting & Formatting](./LINTING_FORMATTING.md) for code quality standards

### For Mobile Development
- [Post Create Screen - Implementation](./IMPLEMENTATION_SUMMARY.md) - Complete feature walkthrough
- [Post Create Screen - Architecture](./ARCHITECTURE.md) - System design and data flow
- [Google Maps Migration](./GOOGLE_MAPS_MIGRATION.md) - Location services integration

### For Backend Development
- [Google Maps Migration](./GOOGLE_MAPS_MIGRATION.md) - API integration details
- [Quick Reference](./QUICK_REFERENCE.md) - Common backend commands

## 📖 Documentation Structure

```
docs/
├── README.md                      # This file - Documentation index
├── QUICK_START.md                 # Getting started guide
├── QUICK_REFERENCE.md             # Command reference
├── VSCODE_GUIDE.md                # Editor setup
├── LINTING_FORMATTING.md          # Code quality tools
├── GOOGLE_MAPS_MIGRATION.md       # Google Maps integration
├── IMPLEMENTATION_SUMMARY.md      # Post create feature details
└── ARCHITECTURE.md                # System architecture diagrams
```

## 🔍 What's in Each Document?

### Quick Start Guide
- Prerequisites and installation
- Environment setup
- Running the backend and mobile app
- Docker configuration

### Quick Reference
- Common pnpm commands
- Development workflows
- Useful shortcuts
- Troubleshooting tips

### VS Code Integration Guide
- Extension recommendations
- Auto-formatting setup
- Keyboard shortcuts
- Troubleshooting VS Code issues

### Linting & Formatting
- ESLint configuration
- Prettier setup
- NPM scripts for linting
- Monorepo structure

### Google Maps Migration
- Backend GraphQL integration
- Mobile client updates
- API key security
- Caching strategy

### Post Create Screen - Implementation
- Component breakdown (5 components + 5 utilities)
- Feature list (image management, ML tags, location)
- Technical stack and dependencies
- Performance metrics
- Localization (English/German)

### Post Create Screen - Architecture
- System architecture diagrams
- Data flow visualization
- Component hierarchy
- Service layer design

## 🛠️ Common Tasks

### Start Development Environment
```bash
# Start backend
pnpm --filter backend run start:dev

# Start mobile app
pnpm --filter mobile run start
```

### Code Quality
```bash
# Format all files
pnpm format

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Database Management
```bash
# Migrate database
pnpm --filter backend prisma:migrate

# Open Prisma Studio
pnpm --filter backend prisma:studio
```

## 🤝 Contributing

When adding new documentation:
1. Place files in the `docs/` folder
2. Update this README.md index
3. Use clear, descriptive filenames
4. Include a table of contents for long documents
5. Add code examples where applicable

## 📝 Documentation Guidelines

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
