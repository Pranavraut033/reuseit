# Deployment

## Docker Compose Setup

The application uses Docker Compose for containerized deployment with multiple services.

### Services
- **MongoDB**: Database with replica set configuration
- **Redis**: Caching service
- **Backend**: NestJS application (production profile only)
- **Ollama**: AI model serving
- **Statping**: Monitoring dashboard

## Cloud Server

The production server is hosted on Hetzner Cloud:

- **Provider**: Hetzner Cloud
- **Server Type**: CX23
- **Location**: Nuremberg (nbg1)
- **OS**: Ubuntu 22.04
- **IPv4**: 91.98.231.10
- **IPv6**: 2a01:4f8:1c1b:8be7::/64
- **Status Page**: http://91.98.231.10/status/

### Production Deployment

```bash
# Deploy all services including backend
docker-compose --profile production up -d

# View service status
docker-compose ps

# Check logs
docker-compose logs backend
```

### Development Deployment

```bash
# Deploy infrastructure services only (MongoDB, Redis, Ollama, Statping)
docker-compose up -d

# Run backend locally for development
cd apps/backend && pnpm run start:dev
```

### Mobile Deployment

Mobile app uses Expo Application Services (EAS) for builds:

```bash
# Development build
pnpm --filter mobile run build:dev

# Production build
pnpm --filter mobile run build:prod
```

---

**Last Updated**: December 2025
