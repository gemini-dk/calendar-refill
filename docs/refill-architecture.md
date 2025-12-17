# 大学生向けリフィル生成サービス 設計書

## 目的と前提
- 自分専用のシステム手帳用リフィルをブラウザ上でデザインし、PDFでダウンロード販売する。
- ランディングページからエディタに遷移し、ログイン不要でデザインは可能。
- Firestore に保存された大学カレンダー（祝日とは別の学事イベント）を取り込み、週／月予定テンプレートへ表示。
- 決済に紐づく注文情報と購入者の個人識別情報（氏名／メール）を取得し、PDF 1 ページ目へ埋め込んで転売抑止。
- 再ダウンロードのため、注文番号とストレージ上の PDF を結びつけて保持する。

## URL とページ構成
- `/`：宣伝用ランディング。CTA から `/refill/edit` へ遷移。
- `/refill`：機能概要・価格・テンプレート例を提示する導線ページ。編集開始ボタンで `/refill/edit` へ。
- `/refill/edit`：リフィルデザインエディタ。
  - ブラウザコンポーネントで匿名認証（Firebase Anonymous）をマウント時に実行。
  - 左ペイン：テンプレート（週／月の複数パターン）、用紙サイズ、色、フォント、大学カレンダー選択。
  - 右ペイン：見開き 2 ページのライブプレビュー（HTML/CSS）。
  - 操作ボタン：保存（認証済のみ Firestore へ）、購入へ進む（ゲスト可）。

## ユースケースフロー
1. **エディタ起動**：匿名ユーザーを発行し、最新の保存デザインを任意で読み込む。プレビュー用カレンダー（例：4 月分のみ）を `GET /api/refill/calendars/preview` で取得。
2. **デザイン編集／保存**：入力内容をリアルタイムプレビュー。認証済みなら `POST /api/refill/designs` で Firestore に保存。
3. **購入準備**：`POST /api/refill/orders/prepare` で注文仮登録（テンプレート設定、カレンダー ID、金額、uid/anonymous uid）。決済プロバイダ（Stripe 想定）へ遷移または Payment Element を表示。
4. **決済完了確認**：Webhook で支払い成功をサーバーが検証し、注文ステータスを `paid` に更新。クライアントは `GET /api/refill/orders/{orderId}` をポーリングまたは SSE で待機。
5. **本番 PDF 生成**：`paid` を確認後、`GET /api/refill/calendars/full?calendarId=...` で全学事予定を取得。`html2canvas` などで各ページをキャプチャし、`pdf-lib` で結合。1 ページ目に購入者氏名／メール、注文番号、購入日時を透かしや QR として埋め込む。
6. **アップロードと配布**：生成 PDF を `POST /api/refill/orders/{orderId}/upload` に送信。サーバー側で注文と匿名 uid を照合し、Firebase Storage へ保存しつつダウンロードトークンを発行。メール通知と画面上でダウンロード URL を返却。
7. **再ダウンロード**：注文番号＋購入メールで検証し、短寿命署名 URL を発行。ログイン済みなら `/users/{uid}/refill_orders/{orderId}` からも取得可能。

## 技術スタックと理由
- **Next.js + Vercel**：ホスティングと Route Handlers による API 実装を簡潔化。
- **クライアント PDF 生成**：Vercel でのヘッドレスブラウザ制約を避け、ブラウザ内で HTML→Canvas→PDF に変換。大量ページ処理は Web Worker で UI ブロックを防止。
- **Firebase（Authentication, Firestore, Storage）**：匿名／既存アカウントでの保存、カレンダーデータ配信、PDF 永続化に利用。
- **決済**：Stripe などの外部決済サービス。Webhook でステータスを確定。

## API スケッチ（Next.js Route Handlers）
- `GET /api/refill/calendars/preview`：プレビュー用の限定学事データを返却（例：4 月分）。
- `GET /api/refill/calendars/full`：支払い済み検証後に全学事予定を返却（`orderId` と uid/anonymous uid を照合）。
- `POST /api/refill/designs`：認証必須。デザイン JSON を Firestore へ保存。
- `POST /api/refill/orders/prepare`：注文仮登録と決済セッション ID 生成。
- `GET /api/refill/orders/{orderId}`：注文ステータス取得（ポーリングまたは SSE）。
- `POST /api/refill/orders/{orderId}/upload`：クライアント生成 PDF を受領しストレージへ保存。

## データモデル
- **デザイン下書き**: `/users/{uid}/refill_designs/{designId}`
  - `templateType`, `calendarId`, `customize`（色・フォント等）, `previewThumb`, `updatedAt`。
- **注文（ユーザー）**: `/users/{uid}/refill_orders/{orderId}`
  - `status`, `amount`, `calendarId`, `designRef`, `buyerName/email`, `storagePath`, `downloadToken`, `createdAt`。
- **注文（ゲスト/匿名）**: `/refill_guest_orders/{orderId}`
  - 上記 + `anonymousUid`, `ownerUid`（後からアカウント連携する場合）。

## セキュリティと運用
- `upload` API では `orderId` と決済ステータス、および anonymous uid を必須照合。異なるクライアントからのアップロードを拒否。
- PDF には購入者情報をメタデータ・透かし・QR に埋め込み、転売を抑止。
- 生成済み PDF のサイズ上限を設定し、超過時はクライアント側で圧縮。
- 再ダウンロード用の短寿命署名 URL を発行し、メールでも案内。

## 開発時メモ
- プレビューと本番 PDF 生成で同一レイアウトコンポーネントを使い、データのみ差し替える。
- 学事予定テンプレートは祝日データと分離し、表示レイヤーでマージする。
- 価格やテンプレートバリエーションは設定ファイルで集中管理（例: `docs/price.md` など）。
