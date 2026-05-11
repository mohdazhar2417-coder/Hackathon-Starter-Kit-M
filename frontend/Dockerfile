# Stage 1: Build
FROM node:20-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter "./frontend" run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /usr/src/app/frontend/dist /usr/share/nginx/html
# Custom Nginx config to handle React Router
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
