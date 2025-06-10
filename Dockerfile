FROM node:lts AS dependencies
WORKDIR /site
COPY package.json ./
RUN npm install --frozen-lockfile && npm audit fix || true

FROM node:lts AS builder
WORKDIR /site
COPY . .
COPY --from=dependencies /site/node_modules ./node_modules
RUN npm run build

FROM node:lts AS runner
WORKDIR /site
ENV NODE_ENV production

COPY --from=builder /site/public ./public
COPY --from=builder /site/package.json ./package.json
COPY --from=builder /site/.next ./.next
COPY --from=builder /site/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]