# Security

## Authentication

- **JWT Tokens**: Bearer token authentication for API requests
- **Firebase Auth**: Google Sign-In and phone verification integration
- **Email/Password**: Standard authentication with hashed passwords

## Secrets Management

- **Environment Variables**: All sensitive configuration stored in `.env` files
- **Firebase Credentials**: Service account keys stored securely
- **API Keys**: Google Maps API key and other external service keys via environment

## Database Security

- **MongoDB Authentication**: Username/password authentication with replica set
- **Redis**: Basic authentication via connection URL

## Network Security

- **Container Networking**: Isolated Docker network for inter-service communication
- **Port Exposure**: Controlled port mapping for external access
- **Health Checks**: Automated service health monitoring

---

**Last Updated**: December 2025
