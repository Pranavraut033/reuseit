# ReUseIt

ReUseIt is a mobile-first platform for recycling, reuse, and community coordination.

## Purpose

The project helps people identify waste, locate recycling points, share reusable items, organize local events, and track contribution points and badges.

## Implemented features (verified)

- Mobile client (Expo React Native) with an on-device TensorFlow Lite model for waste analysis
- Backend API (NestJS + GraphQL) providing authentication, users, posts, events, locations, points, and badges
- Location and Google Maps integration for managing and discovering recycling locations
- Community features: posts for sharing items and event management (create/RSVP)
- Reward system implemented via backend points and badges
- ML training and dataset utilities in `apps/ml-training`

## 🚀 Deployment

Production server hosted on Hetzner Cloud (Ubuntu, Docker Compose).
**Status Page**: http://91.98.231.10/status/

See the [documentation](docs/) for details and the API reference.

## 📄 Documentation

- **Local**: `/docs` folder in this repository
- **Online**: [GitHub Pages](https://pranavraut033.github.io/reuseit/)
