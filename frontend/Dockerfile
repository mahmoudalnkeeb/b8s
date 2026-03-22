# Build stage
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json yarn.lock ./

COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked yarn install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN yarn workspace frontend run build

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

RUN printf "server {\n\
    listen 80;\n\
    location / {\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    try_files \$uri \$uri/ /index.html;\n\
    }\n\
    }\n" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
