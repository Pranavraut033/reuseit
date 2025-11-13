# Deployment options for ReuseIt backend

This file lists recommended hosting options for the backend and short steps to deploy. The backend is a NestJS app packaged with Docker and uses MongoDB (Prisma).

Core recommendation (simplest, robust):
- Build and push Docker image to a container registry (GitHub Container Registry, Docker Hub, or a cloud registry).
- Use a managed platform that runs containers and set the `DATABASE_URL` to a MongoDB instance (MongoDB Atlas is recommended for production).

Recommended platforms


1) Render (detailed)

- Pros: Easy GitHub integration, auto-deploy from branches, quick to set up. Good for container-based apps.
- Cons: Render does not offer a first-party managed MongoDB service; you'll typically use MongoDB Atlas, Railway, or another hosted Mongo provider for production.

Quick steps (recommended: GitHub integration)

1. Create a Render account and connect your GitHub repository.
2. In Render, create a new "Web Service" and select "Docker" as the environment. Point it to the `backend` folder (or the repository root) and the branch you want to auto-deploy (usually `main`). Render will use the `Dockerfile` present in the `backend` folder to build the image.
3. Set Environment settings:
  - `DATABASE_URL` — set to your MongoDB connection string (see Database section below).
  - `JWT_SECRET` — set your JWT secret value.
  - `NODE_ENV=production` (optional)
  - If you need custom ports, Render passes an assigned `$PORT` environment variable. The app already reads `process.env.PORT` so no extra change is needed.
4. Health check (optional): configure an HTTP health check path such as `/graphql` or a dedicated `/health` endpoint if you add one. If you use `/graphql`, Render will expect a 200 response for the GET request.
5. Deploy: Render will build the Dockerfile, run the image, and serve it. Subsequent pushes to the configured branch will auto-deploy by default.

Optional: Deploy by pushing a built image

If you prefer CI to build and push a container image and then let Render pull that image from a registry, you can:

- Build & push the image in GitHub Actions to GHCR (we already build/push an image on `main`).
- In Render, create a "Private Service" that uses a Docker image from a registry and provide credentials (or use Render's GitHub integration to point at the repo).

Optional automation: Trigger a Render deploy from GitHub Actions

If you want to trigger a deploy on Render after the CI build, add a GitHub secret `RENDER_API_KEY` and `RENDER_SERVICE_ID` and use a step like this (example job snippet):

```yaml
# Example GitHub Actions step (add to your CI workflow)
- name: Trigger Render deploy
  if: github.ref == 'refs/heads/main'
  run: |
   curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
    -H "Content-Type: application/json" \
    -d '{}'
```

Replace `RENDER_SERVICE_ID` with the service id you get from Render's dashboard and create `RENDER_API_KEY` from your Render account settings.

Render tips
- When using the Dockerfile approach, Render builds your image inside their build infrastructure — make sure the Dockerfile is self-contained (our `backend/Dockerfile` runs `prisma generate` and builds the app).
- Use Render environment secrets (not checked into code) to store `DATABASE_URL`, `JWT_SECRET`, and other credentials.
- If you expect heavy load, consider using multiple instances and horizontal autoscaling in Render's service settings.

Database: where to host MongoDB
--------------------------------

Production-grade choices (recommended order):

1. MongoDB Atlas (recommended)
  - Fully-managed, supports replica sets out of the box (required for Prisma transactions), automated backups, monitoring, and easy scaling.
  - Steps:
    1. Create an Atlas cluster (free / M0 for small testing, larger clusters for production).
    2. Create a database user (username + password) and copy the connection string.
    3. Make sure network access allows connections from Render — preferred: use VPC peering or add Render's outbound IPs to Atlas IP access list (or allow access from anywhere for quick tests but not production).
    4. Set `DATABASE_URL` in Render to the Atlas connection string (example):

      mongodb+srv://<USER>:<PASS>@cluster0.abcde.mongodb.net/reuseit?retryWrites=true&w=majority

    5. Prisma requires MongoDB to be replica set enabled for transactions — Atlas clusters already satisfy this.

2. Railway / Aiven / Other DB-as-a-Service
  - Railway offers a hosted MongoDB addon (easy for prototyping). It provides a connection string you can add to Render.
  - These services can be convenient for staging / prototypes but check SLA/backups for production usage.

3. Self-managed MongoDB (not recommended for production unless you manage it)
  - You can run MongoDB on a VM or container, but you are responsible for replica set configuration, backups, monitoring and security.

Local dev vs production
- For local development, the Compose file we added runs a single-node Mongo instance which is suitable for quick testing but does NOT provide a replica set unless you init one. For full Prisma transaction support, use Atlas (or init a replica set manually).

Prisma notes
- `prisma generate` only needs the Prisma schema and runs during your image build; it does not require DB connectivity.
- Database migrations / schema pushes: for MongoDB you can use `prisma db push` to ensure schema is applied; be careful running `migrate dev` on production.


2) Fly.io
- Pros: Great for low-latency regional apps, good Docker support, simple CLI.
- Cons: You still need an external managed MongoDB for production (e.g., Atlas).
- Quick steps:
  - Install flyctl and run `fly launch` in the `backend` folder (choose Dockerfile).
  - Set secrets with `fly secrets set DATABASE_URL=<your-uri> JWT_SECRET=<secret>`.
  - `fly deploy` to push and run the container.

3) Railway / Railway.app
- Pros: Rapid prototyping, has a managed MongoDB plugin, easy to wire to GitHub.
- Cons: Limits on free tier; less control at scale.
- Quick steps:
  - Create a new project and connect your GitHub repo.
  - Add the MongoDB plugin (or connect to Atlas) and set `DATABASE_URL` from the plugin.
  - Configure build command (use Dockerfile or use `yarn build` + `yarn start:prod`).

4) Google Cloud Run / AWS App Runner
- Pros: Serverless containers, autoscaling, first-class cloud integrations.
- Cons: Slightly more cloud knowledge required. Use managed MongoDB Atlas for DB.
- Quick steps for Cloud Run:
  - Build and push an image to Google Artifact Registry or Container Registry (CI can push to ghcr or GCR).
  - `gcloud run deploy` with the image and set env vars.

5) Amazon ECS / Fargate or Kubernetes (EKS / GKE)
- Pros: Full control, good for production at scale.
- Cons: More complex to operate; consider if you need advanced control.

Database choices
- MongoDB Atlas (recommended for production): managed, highly-available, and supports replica sets necessary for Prisma transactions.
- Self-hosted MongoDB (not recommended for production unless you manage replica sets and backups).

CI integration pattern (recommended)
1. GitHub Actions builds + tests (we added `.github/workflows/backend-ci.yml`).
2. On `main` branch, build and push Docker image to a registry (GHCR or Docker Hub).
3. Trigger deploy on the target platform either via webhook, platform GitHub integration, or via CLI in the workflow.

Example: Deploy to Render automatically
1. Configure Render to auto-deploy from `main` and set build to use Dockerfile.
2. Add environment variables on Render's dashboard (DATABASE_URL, JWT_SECRET).
3. Push to `main` — Render will pull new commits and rebuild the image.

Security & operational notes
- Never store credentials in the repository. Use platform secrets or GitHub Secrets.
- Use MongoDB Atlas for production and enable IP whitelisting / VPC peering if needed.
- Set up backups for your MongoDB deployment.

If you tell me which provider you prefer (Fly, Render, Railway, Cloud Run, AWS, or DigitalOcean), I can:
- add a sample deploy job to the GitHub Actions workflow that builds and deploys the image, and
- create quick environment variable/config templates specific to that provider.
