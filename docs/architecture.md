# Architecture

## System Overview

ReUseIt follows a microservices architecture deployed via Docker Compose, with separate services for data storage, caching, API serving, AI processing, and monitoring.

## Services

### Database Layer
- **MongoDB**: Primary database using Prisma ORM with geospatial indexing for location queries
- **Redis**: Caching layer for improved performance

### Application Layer
- **Backend (NestJS)**: GraphQL API server handling business logic, authentication, and data processing
- **Mobile (Expo React Native)**: Client application with on-device AI for waste classification

### AI/ML Layer
- **Ollama**: Local LLM service for AI-powered features
- **ML Training**: Python utilities for model training (separate from production deployment)

### Monitoring
- **Statping**: Service health monitoring and status dashboard

## Data Flow

1. **Mobile App** captures waste images and sends to on-device TensorFlow Lite model for classification
2. **API Requests** from mobile app are sent to Backend service via GraphQL
3. **Backend** processes requests, queries MongoDB, caches in Redis, and integrates with external services (Firebase, Google Maps)
4. **AI Features** leverage Ollama for enhanced functionality
5. **Notifications** are sent via Firebase Cloud Messaging

## Deployment

- Development: Local services with backend running outside Docker for faster iteration
- Production: Full containerized deployment using Docker Compose profiles

---

**Last Updated**: December 2025
