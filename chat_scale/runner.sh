#!/bin/bash
docker compose down && \
docker build -t myifchat . && \
docker compose up
