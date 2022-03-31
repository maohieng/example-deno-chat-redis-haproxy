#!/bin/bash
docker compose down && \
docker build -t mydenoapp . && \
docker compose up
