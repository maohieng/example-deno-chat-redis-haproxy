#!/bin/bash
docker compose down && \
docker build -t simplechat . && \
docker compose up
