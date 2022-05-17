FROM node:16.15.0-alpine as dev

WORKDIR /app

COPY package.json .

RUN npm install --force

COPY . .

ENTRYPOINT npm run dev

# prod

FROM node:16.15.0-alpine as prod

WORKDIR /app

COPY --from=dev /app /app

RUN npm run build

ENTRYPOINT npm run start