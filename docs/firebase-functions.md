# PDF 生成のための Firebase Functions（Firestore トリガー）

このプロジェクトは、外部キューを使わずに Firestore トリガー経由で PDF を非同期生成できます。

## 何をするものか

- Stripe の Webhook が購入状態を次に書き込みます:
  - `stripe_sessions/{sessionId}`
  - `stripe/{userId}`
- Firestore トリガー（`functions/src/index.ts`）が `stripe_sessions/{sessionId}` を監視します。
- `status` が `paid_processing` になったら、次を実行します:
  - `status` を `generating_pdf` に更新
  - PDF を生成
  - Cloud Storage に保存（`system-notebook/{userId}/...pdf`）
  - `stripe/{userId}.downloadUrl` を書き込み
  - `status` を `completed` に更新（エラー時は `failed`）

### BUCKET フィールド

Functions 側では環境変数を使わず、`stripe_sessions/{sessionId}` の `BUCKET` フィールドに書かれた
バケット名へ PDF を出力します（フォントの取得も同じバケットを参照します）。

## 必要な環境変数

Firebase Functions の環境で設定します:

- （なし）

### フォント

PDFKit で日本語を正しく表示するには、日本語フォントが必要です。

必要な `.ttf` ファイルを、Storage バケット内の次のパスにアップロードしてください（固定: `resources/fonts`）:

- `resources/fonts/Noto_Sans_JP/NotoSansJP-Medium.ttf`
- `resources/fonts/Noto_Serif_JP/NotoSerifJP-Medium.ttf`
- `resources/fonts/Montserrat/Montserrat-Medium.ttf`
- `resources/fonts/Playfair_Display/PlayfairDisplay-Medium.ttf`

フォントが無い場合でも関数自体は動作しますが、PDF 内の日本語が正しく描画されない可能性があります。

## ビルド / デプロイ

初回はfirebaseコマンドをインストールする必要があります。
cd functions
npm i -D firebase-tools
npx firebase login
npx firebase projects:list
npx firebase use campuscalendar-dev

リポジトリのルートで実行します:

- `cd functions && npm i`
- `npm run build`
- `npm run deploy`
