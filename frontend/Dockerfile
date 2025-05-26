FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production environment
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

# Add custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# Update nginx to run on port 3000 instead of default 80
RUN sed -i 's/listen       80/listen       3000/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
