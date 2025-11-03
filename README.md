# PeaceHub Frontend

피스허브 프론트엔드 레포지토리입니다.

## プロジェクト概要

- **フレームワーク**: Next.js 15
- **ライブラリ**: React 19
- **スタイリング**: Tailwind CSS
- **リンティング**: ESLint (eslint-config-next)
- **パッケージマネージャー**: npm

## ファイル構造

```
/home/juhwan/front/
├───app/
│   ├───(auth)/
│   ├───(main)/
│   └───onboarding/
├───components/
│   ├───assign/
│   ├───auth/
│   ├───dashboard/
│   ├───layout/
│   ├───schedule/
│   └───ui/
├───lib/
│   ├───api/
│   └───utils/
├───public/
│   └───images/
└───types/
```

## 依存関係の管理

### 主要な依存関係

- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `next`: ^15.1.4

### 依存関係の更新

現在、いくつかの依存関係を更新する必要があります。以下のコマンドで更新できます。

```bash
npm install @types/node@latest eslint-config-next@latest next@latest tailwindcss@latest
```

## デプロイガイド

### ビルド

以下のコマンドでプロジェクトをビルドします。

```bash
npm run build
```

### 起動

ビルド後、以下のコマンドでサーバーを起動します。

```bash
npm run start
```

### Vercelへのデプロイ

Next.jsプロジェクトはVercelに簡単にデプロイできます。GitHubリポジトリをVercelに接続すると、自動的にデプロイされます。
