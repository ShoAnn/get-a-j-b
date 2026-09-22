# syntax=docker/dockerfile:1.7

# Production API image.
#
# DELIBERATELY single-stage. Railway does not support `--target` and builds
# the first (here: only) stage of a Dockerfile, so any multi-stage layout
# risks shipping the dev/builder stage. A single stage leaves no ambiguity
# about what gets deployed. (Slimmer Alpine multi-stage variant rejected:
# `COPY --from` requires the source stage to be defined first, which
# conflicts with the first-stage-must-be-prod constraint.)
# Build context: ./apps/api (see docker-compose.prod.yaml / Railway root dir).

FROM golang:1.25-bookworm

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/bin/api ./cmd/api \
    && rm -rf /root/.cache/go-build

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser \
    && chown -R appuser:appgroup /app

ENV PORT=8080 \
    MIGRATIONS_PATH=/app/internal/db/migrations \
    GIN_MODE=release

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD sh -c 'wget -qO- http://127.0.0.1:${PORT:-8080}/api/health | grep -q ok'

ENTRYPOINT ["/app/bin/api"]
