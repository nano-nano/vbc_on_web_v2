FROM node:lts-alpine

WORKDIR /app

# Yarnのインストール
RUN apk update && \
    apk add --no-cache git curl && \
    curl -o- -L https://yarnpkg.com/install.sh | sh

ENV PATH $HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH

# HotReload用設定
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 8080

CMD ["/bin/sh"]