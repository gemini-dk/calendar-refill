import Image from "next/image";
import React from "react";

const heroImage =
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=80";
const studyImage =
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-10">
        <div className="text-lg tracking-tight">Campus Refill</div>
        <nav className="hidden items-center gap-6 text-sm text-[#6B7280] sm:flex">
          <a className="transition-colors hover:text-[#1A1A1A]" href="#features">
            特徴
          </a>
          <a className="transition-colors hover:text-[#1A1A1A]" href="#flow">
            作り方
          </a>
          <a className="transition-colors hover:text-[#1A1A1A]" href="#cta">
            価格
          </a>
        </nav>
        <a
          className="hidden rounded-md bg-[#6B7280] px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 sm:inline-flex"
          href="#cta"
        >
          無料で試す
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-8 pb-24">
        <section className="flex flex-col gap-12 pb-20 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              学生専用リフィル
            </p>
            <h1 className="text-4xl leading-tight tracking-tight">大学別に整う一冊</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[#6B7280]">
              大学ごとの授業日程をもとに、余白のあるミニマルなカレンダーを生成します。
              何も足さず、必要な予定だけが静かに並ぶ一冊です。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#cta"
                className="inline-flex items-center gap-2 rounded-md bg-[#6B7280] px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
              >
                すぐに作成
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="text-sm text-[#6B7280] transition-colors hover:text-[#1A1A1A]"
              >
                詳しく見る
              </a>
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-lg bg-white">
            <Image
              src={heroImage}
              alt="デスクに置かれた静かな手帳"
              width={800}
              height={520}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </section>

        <section id="features" className="flex flex-col gap-12 border-y border-[#E5E7EB] py-16">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">特徴</p>
            <h2 className="text-3xl leading-snug">授業日程に寄り添う設計</h2>
            <p className="text-base leading-relaxed text-[#6B7280]">
              シラバスの開始日や休講日を反映し、曜日ごとのコマ割りを整えます。
              予定を詰め込みすぎず、視線の流れを邪魔しない余白を確保しました。
            </p>
          </div>
          <div className="flex flex-col gap-10">
            <FeatureItem
              icon={<MapPinIcon className="h-4 w-4" />}
              title="大学別テンプレ"
              description="キャンパス固有の祝日や補講日を初期設定に反映。校舎移動が多い日も見やすく整理。"
            />
            <FeatureItem
              icon={<CalendarRangeIcon className="h-4 w-4" />}
              title="週次の見通し"
              description="1限から5限までをシンプルに配置。空きコマがひと目で分かり、アルバイトやサークルも計画しやすく。"
            />
            <FeatureItem
              icon={<FileDownIcon className="h-4 w-4" />}
              title="PDFで配布"
              description="生成したリフィルはすぐにPDFで出力。モノクロ印刷でも読みやすい濃淡で設計しています。"
            />
          </div>
        </section>

        <section id="flow" className="flex flex-col gap-12 py-20 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">作り方</p>
            <h2 className="text-3xl leading-snug">3分で完成</h2>
            <p className="text-base leading-relaxed text-[#6B7280]">
              大学名と学期を選ぶだけ。自動で授業日程を読み込み、週次レイアウトに落とし込みます。
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-[#6B7280]">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB] text-xs text-[#6B7280]">
                  1
                </span>
                <div>
                  <p className="text-base">大学を選択</p>
                  <p className="text-sm text-[#6B7280]">学部・キャンパスを指定して日程を取得します。</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB] text-xs text-[#6B7280]">
                  2
                </span>
                <div>
                  <p className="text-base">フォーマットを選ぶ</p>
                  <p className="text-sm text-[#6B7280]">週単位・月単位の余白量を調整できます。</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB] text-xs text-[#6B7280]">
                  3
                </span>
                <div>
                  <p className="text-base">PDFを受け取る</p>
                  <p className="text-sm text-[#6B7280]">印刷・デジタルどちらでも使いやすい高解像度。</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="flex-1 space-y-6 rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-[0_0_0_1px_rgba(229,231,235,0.6)]">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">週間ビュー</p>
              <h3 className="text-2xl leading-snug">余白で読む時間割</h3>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                授業のない時間帯を薄いラインで表現し、予定の密度を直感的に把握できます。
              </p>
            </div>
            <div className="overflow-hidden rounded-md border border-[#E5E7EB]">
              <div className="grid grid-cols-6 text-xs text-[#6B7280]">
                <div className="border-b border-[#E5E7EB] px-4 py-3">時間</div>
                <div className="border-b border-[#E5E7EB] px-4 py-3">月</div>
                <div className="border-b border-[#E5E7EB] px-4 py-3">火</div>
                <div className="border-b border-[#E5E7EB] px-4 py-3">水</div>
                <div className="border-b border-[#E5E7EB] px-4 py-3">木</div>
                <div className="border-b border-[#E5E7EB] px-4 py-3">金</div>
              </div>
              {["1限", "2限", "3限", "4限", "5限"].map((period) => (
                <div key={period} className="grid grid-cols-6 text-sm text-[#1A1A1A]">
                  <div className="border-b border-[#E5E7EB] px-4 py-4 text-[#6B7280]">{period}</div>
                  <div className="border-b border-[#E5E7EB] px-4 py-4">講義</div>
                  <div className="border-b border-[#E5E7EB] px-4 py-4">ゼミ</div>
                  <div className="border-b border-[#E5E7EB] px-4 py-4">研究</div>
                  <div className="border-b border-[#E5E7EB] px-4 py-4 text-[#6B7280]">空き</div>
                  <div className="border-b border-[#E5E7EB] px-4 py-4">実習</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-12 border-t border-[#E5E7EB] pt-20 lg:flex-row lg:items-center">
          <div className="flex-1 overflow-hidden rounded-lg bg-white">
            <Image
              src={studyImage}
              alt="静かな自習スペース"
              width={800}
              height={520}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">サポート</p>
            <h2 className="text-3xl leading-snug">学期ごとに更新</h2>
            <p className="text-base leading-relaxed text-[#6B7280]">
              祝日移動や補講にも対応し、学期が変わるたびに自動で差し替えます。
              学内配布用のロゴ挿入や色味の微調整もご相談ください。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#cta"
                className="inline-flex items-center gap-2 rounded-md bg-[#6B7280] px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
              >
                学内配布を相談
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <span className="text-sm text-[#6B7280]">返信は1営業日以内</span>
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="mt-20 rounded-lg border border-[#E5E7EB] bg-white px-8 py-12 text-center shadow-[0_0_0_1px_rgba(229,231,235,0.6)]"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">価格</p>
          <h2 className="mt-4 text-3xl leading-snug">学生はずっと無料</h2>
          <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
            個人利用は無料。学科単位の一括配布やカスタムロゴ挿入も、透明な料金で提供します。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md bg-[#6B7280] px-6 py-3 text-sm text-white transition-opacity hover:opacity-90"
            >
              無料で作成
            </a>
            <a className="text-sm text-[#6B7280] transition-colors hover:text-[#1A1A1A]" href="#">
              問い合わせる
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarRangeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 9H3" />
      <path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M17 14h-6" />
      <path d="M13 18H7" />
    </svg>
  );
}

function FileDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </svg>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl leading-snug">{title}</h3>
        <p className="text-sm leading-relaxed text-[#6B7280]">{description}</p>
      </div>
    </div>
  );
}
