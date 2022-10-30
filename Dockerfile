From denoland/deno:alpine

WORKDIR /app

COPY src/deps.ts src/deps.ts
RUN deno cache src/deps.ts

ADD . .
RUN deno cache src/bot.ts

CMD ["task", "start"]
