FROM node:20-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app/frontend

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NODE_ENV=development

CMD ["npm", "run", "dev"]
