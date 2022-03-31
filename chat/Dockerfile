FROM denoland/deno:1.20.3

WORKDIR /app

# PREFER NOT TO RUN AS ROOT
USER deno

# These steps will be re-run upon each file change in your working directory:
COPY . .

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache app.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "app.ts"]