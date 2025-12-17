import Image from "next/image";

const heroImage =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80&sat=-35";

const studyImage =
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1600&q=80&sat=-35";

export default function Home() {
  return (
    <div className="bg-white text-[#1A1A1A]">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-24 px-6 py-16 md:py-24">
        <header className="grid items-center gap-12 md:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.16em] text-[#6B7280]">
              for university life
            </p>
            <h1 className="text-4xl font-medium leading-tight md:text-5xl">
              大学の時間割に合わせた静かなリフィル
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#6B7280]">
              学期ごとに変わる授業日程を自動で反映。あなたの大学カレンダーが
              そのままリフィルになり、予定管理に余白と整然さをもたらします。
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/purchase"
                className="inline-flex items-center justify-center rounded-md bg-[#1A1A1A] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1A1A1A]"
              >
                リフィルを作る
              </a>
              <a
                href="#flow"
                className="inline-flex items-center justify-center rounded-md border border-[rgba(107,114,128,0.35)] px-5 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[rgba(107,114,128,0.5)]"
              >
                仕組みを見る
              </a>
            </div>
            <div className="space-y-1 text-sm text-[#6B7280]">
              <p>主要大学の授業日程を網羅し、祝日や補講も反映。</p>
              <p>PDF と紙のどちらでも見やすい余白設計。</p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#f5f5f5]">
            <Image
              src={heroImage}
              alt="静かなデスクに置かれた紙のカレンダーとノート"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </header>

        <section className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-medium">大学別リフィルの特長</h2>
            <p className="max-w-3xl text-base leading-relaxed text-[#6B7280]">
              学期の開始・終了日、補講や試験期間など、大学ごとのカレンダーを精緻に反映。
              余白を広く確保したレイアウトで、書き込むたびに整理された感覚を得られます。
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">日程を自動反映</h3>
              <p className="text-base leading-relaxed text-[#6B7280]">
                在籍大学を選ぶだけで、授業週や祝日調整を反映したリフィルを生成。
                自分で調整する手間を省き、予定管理に集中できます。
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">書き込みやすい余白</h3>
              <p className="text-base leading-relaxed text-[#6B7280]">
                1 日あたりのスペースを広く取り、線や装飾を減らしたシンプルな設計。
                重要な予定だけが自然と目に入る視認性です。
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">PDF と紙に最適化</h3>
              <p className="text-base leading-relaxed text-[#6B7280]">
                A5 バインダーにもそのまま差し込める寸法で書き出し。PDF でも印刷でも、
                余白の美しさを損なわず活用できます。
              </p>
            </div>
          </div>
        </section>

        <section id="flow" className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-medium">作成ステップ</h2>
            <p className="max-w-3xl text-base leading-relaxed text-[#6B7280]">
              シンプルな 3 ステップで、あなた専用のカレンダーリフィルが完成します。
              余計な入力は不要。学期が変わってもすぐに更新できます。
            </p>
          </div>
          <div className="space-y-5 rounded-lg border border-[rgba(107,114,128,0.35)] bg-white px-8 py-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-6">
              <div className="text-sm font-medium text-[#6B7280]">Step 01</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">大学と学期を選択</h3>
                <p className="text-base leading-relaxed text-[#6B7280]">
                  在籍大学と学期を選ぶだけで、授業週・休講日・補講日を含むベースカレンダーを設定します。
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-6">
              <div className="text-sm font-medium text-[#6B7280]">Step 02</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">時間割と予定を入力</h3>
                <p className="text-base leading-relaxed text-[#6B7280]">
                  授業名や課題締切、サークルの予定など、必要な項目だけを加えます。無駄な装飾はありません。
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-6">
              <div className="text-sm font-medium text-[#6B7280]">Step 03</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">PDF を受け取り印刷</h3>
                <p className="text-base leading-relaxed text-[#6B7280]">
                  生成された PDF をそのまま印刷。A5 バインダー用にトンボを含めた版も用意しています。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-10 md:grid-cols-[0.9fr,1.1fr] md:items-center">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg bg-[#f5f5f5]">
            <Image
              src={studyImage}
              alt="落ち着いた雰囲気の自習スペース"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 45vw"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-medium">学びのリズムを整える設計</h2>
            <p className="max-w-2xl text-base leading-relaxed text-[#6B7280]">
              授業と自習、休息のバランスを俯瞰できるよう、視線の流れを縦軸中心に整えたレイアウト。
              予定が詰まりすぎず、空白が安心感を生みます。
            </p>
            <div className="space-y-2 text-sm text-[#6B7280]">
              <p>・週次ビューと月次ビューを切り替え可能</p>
              <p>・課題、試験、実習の各期に合わせたテンプレート</p>
              <p>・紙に書く前提で行間と余白を最適化</p>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-lg border border-[rgba(107,114,128,0.35)] bg-white px-8 py-10">
          <div className="space-y-3">
            <h2 className="text-2xl font-medium">安心して使える理由</h2>
            <p className="text-base leading-relaxed text-[#6B7280]">
              教務日程の更新に合わせてリフィルも自動でアップデート。シンプルで視認性の高いデザインが、
              忙しい大学生活に静かな余白をつくります。
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">最新データを維持</h3>
              <p className="text-base leading-relaxed text-[#6B7280]">
                休講や補講の変更にも随時対応し、再ダウンロードで最新のリフィルを受け取れます。
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">余白重視の紙質提案</h3>
              <p className="text-base leading-relaxed text-[#6B7280]">
                印刷時は淡いグレーの罫線のみ。文字が主役になるよう彩度を抑え、集中を妨げません。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
