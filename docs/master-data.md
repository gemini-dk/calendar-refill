# Firestore マスターデータ仕様

Firestore 上で共通配信される学務カレンダー系マスターデータのフィールドをまとめます。

## `/universities/{universityId}`

大学ごとの基本情報を保持するドキュメントです。`code` をキーに年度別カレンダー（`calendars_{YYYY}` コレクション）と紐づけます。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `name` | string | 大学名。必須。 |
| `webId` | string | 公開 URL で利用するスラッグ。必須。 |
| `code` | string | 大学コード。`calendars_{YYYY}` の `universityCode` と一致させます。 |
| `capacity` | number | 学生数など規模の目安。 |
| `homepageUrl` | string | 大学公式サイトの URL。 |
| `shortName` | string | 省略名。 |
| `prefecture` | string | 所在地（都道府県）。 |
| `type` | string | 国公私立区分などの種別。 |
| `faculties` | string[] | 学部名の一覧。 |
| `campuses` | string[] | キャンパス名の一覧。 |
| `calendars` | object[] | 任意。大学ドキュメント直下に格納されたカレンダーの配列。各要素は下記「年度別カレンダー」と同じフィールドを持ちます。 |
| `fiscalYears.{year}.calendars` | object[] | 任意。年度キーごとのカレンダー配列。構造は上記 `calendars` と同様です。 |

## `/calendars_{YYYY}/{calendarId}`（年度別カレンダー）

年度ごとに公開される学務カレンダーのメタデータです。`universityCode` により `/universities` とジョインします。サブコレクションとして学期情報と日付情報を持ちます。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `name` | string | カレンダー表示名。必須。 |
| `calendarId` | string | 学務カレンダー ID。必須。 |
| `fiscalYear` | string | 会計年度（例: "2024"）。コレクション名と一致させます。 |
| `universityCode` | string | 紐づく大学コード。`/universities/{id}.code` と一致。 |
| `isPublishable` | boolean | 公開可否フラグ。`true` のものだけを配信します。 |
| `hasSaturdayClasses` | boolean | 土曜授業の有無。 |
| `order` | number | 表示順。小さいほど優先。 |
| `note` | string | 補足メモ。 |

### サブコレクション
- `/calendars_{YYYY}/{calendarId}/calendar_terms`: 学期区分の一覧。
- `/calendars_{YYYY}/{calendarId}/calendar_days`: 授業日・休日を含む日付データ。

## `/calendars_{YYYY}/{calendarId}/calendar_terms/{termId}`

学期（前期・後期・集中など）の定義を保持します。`calendar_days.termId` で参照されます。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `name` | string | 学期名称。必須。 |
| `shortName` | string | 学期の短縮名。 |
| `holidayFlag` | number | 祝日等を示すフラグ値。 |
| `order` | number | 学期の表示順。小さいほど先に並びます。 |
| `classCount` | number | 学期内の授業回数など集計値。 |
| `isHoliday` | boolean | 学期全体が休日扱いの場合のフラグ。 |
| `updatedAt` | timestamp | 最終更新タイムスタンプ。 |

## `/calendars_{YYYY}/{calendarId}/calendar_days/{dayId}`

授業日・休講日など日付単位の情報を保持します。`termId` により `calendar_terms` とジョインできます。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `date` | string | ISO 形式 (`YYYY-MM-DD`) の日付。指定がない場合はドキュメント ID を使用。 |
| `type` | string | 日付の種別（授業日・休講日など）。 |
| `classWeekday` | number | 授業扱いとする曜日（1=Mon〜7=Sun）。 |
| `termName` | string | 所属する学期名。 |
| `termShortName` | string | 学期の短縮名。 |
| `classOrder` | number | 授業順や補講振替の並び替え用番号。 |
| `description` | string | 備考・説明。 |
| `termId` | string | 紐づく学期ドキュメント ID（`calendar_terms/{termId}`）。 |
| `nationalHolidayName` | string | 該当する祝日名。 |
| `isHoliday` | boolean | 休日フラグ。 |
| `notificationReasons` | string[] | 通知理由の一覧。文字列または単一文字列フィールドを配列化して保持。 |
| `isDeleted` | boolean | 非表示・削除扱いフラグ。 |
| `syncedAt` | timestamp | 同期済み時刻。 |
| `updatedAt` | timestamp | 最終更新時刻。 |
