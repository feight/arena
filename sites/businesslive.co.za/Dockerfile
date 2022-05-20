#FROM node:16.15.0-alpine as dev
FROM shared as dev

WORKDIR /newsteam/www/app

COPY package.json .

RUN npm install --force

COPY . .

ENTRYPOINT npm run dev

# prod

FROM shared as prod

WORKDIR /newsteam/www/app

COPY --from=dev /newsteam/www/app .

RUN npm run build

ENTRYPOINT npm run start