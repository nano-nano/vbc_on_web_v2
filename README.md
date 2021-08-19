# vbc_on_web_v2

[![Netlify Status](https://api.netlify.com/api/v1/badges/18e4b68e-09db-4166-b0d0-efec7edba51a/deploy-status)](https://app.netlify.com/sites/vbc-on-web/deploys)

## これはなに？

バーチャルにクイズ大会「abc」を再現できるPython3向けツール「vbc」にインスパイアを受け、  
同等の処理をWeb上で行えるように取り組んだWebアプリです。

以下のサイトで公開中です。  
[https://vbc-on-web.netlify.app/](https://vbc-on-web.netlify.app/)

※[旧バージョン](https://github.com/nano-nano/vbc_on_web)はアーカイブとなりました  
※本家のvbcについては[こちら](https://github.com/NMLibrary/vbc)  
※クイズ大会「abc」については[こちら](http://abc-dive.com/)  

## ライセンス

本リポジトリで公開されているコードはMITライセンスの元、利用可能です。

著作権表示については
```
Copyright (c) 2020 Banno Takuya/Nano-Nano
```
とします。

## 作成者/問い合わせ先

[Banno Takuya/なのなの(@nano2_aloerina)](https://twitter.com/nano2_aloerina)

## 開発者向け情報

### Dockerを使った開発環境構築

ビルド環境を構築するための`Dockerfile`と`docker-compose.yml`を用意しています。

#### 事前準備

- Dockerをインストールし、Docker Composeが使えるようにしておく
- ルートディレクトリで`Dockerfile`からイメージを作成する
  - `$ docker build -t node-yarn .`

#### 起動

- `docker-compose.yml`でビルド環境を起動する
  - `$ docker-compose up -d`
- 起動したビルド環境へ接続する
  - `$ docker exec -it vbc_on_web_v2 /bin/sh`

#### 終了

- `docker-compose.yml`でビルド環境を始末する
  - `$ docker-compose down`

### 各種コマンド

#### プロジェクトセットアップ
```
$ yarn install
```

#### 開発サーバ起動
```
$ yarn serve
```

#### プロダクションビルド
```
$ yarn build
```

#### Lint
```
$ yarn lint
```
