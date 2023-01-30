From denoland/deno:alpine

WORKDIR /app

COPY src/deps.ts src/deps.ts
RUN deno --unstable cache src/deps.ts

ADD . .
RUN deno --unstable cache src/bot.ts

CMD ["task", "start"]