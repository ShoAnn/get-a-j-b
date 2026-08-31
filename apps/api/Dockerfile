# syntax=docker/dockerfile:1.7
FROM golang:1.25-bookworm AS builder

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
