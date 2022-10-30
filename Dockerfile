From denoland/deno:alpine

WORKDIR /app

COPY src/deps.ts src/.
RUN deno cache src/deps.ts

ADD . .
RUN deno cache src/bot.ts

RUN deno task start