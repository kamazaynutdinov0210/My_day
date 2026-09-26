# Placeholder Dockerfile — owned by AI #8 (QA/DevOps).
# Built here only as an infrastructure stub referenced by docker-compose.yml
# so Phase 2 (Foundation) has a known target to implement.
FROM node:20-alpine
WORKDIR /app
# TODO(QA/DevOps AI): implement multi-stage pnpm build for apps/api
CMD ["echo", "apps/api image not yet implemented — see docs/DEVELOPMENT.md"]
