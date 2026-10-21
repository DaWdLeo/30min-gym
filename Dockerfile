# 30MIN GYM – statische PWA, ausgeliefert mit nginx
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY app/ /usr/share/nginx/html/30min-gym/
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/30min-gym/ >/dev/null || exit 1
