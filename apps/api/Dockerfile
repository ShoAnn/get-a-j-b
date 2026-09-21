# syntax=docker/dockerfile:1.7

# ---------- dev (local, hot reload via air) ----------
FROM golang:1.25-bookworm AS dev

ARG TARGETARCH=amd64
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl tar ca-certificates && rm -rf /var/lib/apt/lists/*
ARG AIR_VERSION=1.65.3
RUN curl -fsSL -o /tmp/air.tar.gz \
    "https://github.com/air-verse/air/releases/download/v${AIR_VERSION}/air_${AIR_VERSION}_linux_${TARGETARCH}.tar.gz" \
    && tar -C /usr/local/bin -xzf /tmp/air.tar.gz air \
    && chmod +x /usr/local/bin/air \
    && rm /tmp/air.tar.gz

COPY go.mod go.sum ./
RUN go mod download -x

COPY . .

EXPOSE 8080

CMD ["air"]

# ---------- builder (prod compile) ----------
FROM golang:1.25-bookworm AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/bin/api ./cmd/api

# ---------- prod (minimal, non-root) ----------
FROM alpine:3.21 AS prod

RUN apk add --no-cache ca-certificates tzdata wget \
    && addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder /app/bin/api /app/api
# Migrations must ship with the image so `m.Up()` works in prod.
COPY --from=builder /app/internal/db/migrations /app/internal/db/migrations

ENV PORT=8080 \
    MIGRATIONS_PATH=/app/internal/db/migrations \
    GIN_MODE=release

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health | grep -q ok

ENTRYPOINT ["/app/api"]
