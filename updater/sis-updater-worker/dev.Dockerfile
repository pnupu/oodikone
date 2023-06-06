FROM node:10-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["npm", "run", "dev"]
