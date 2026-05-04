import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — AINSPIRE REF',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#555] text-xs hover:text-[#888] transition-colors mb-12"
        >
          ← Back to Library
        </Link>

        <h1 className="text-xl font-medium tracking-wide mb-12">
          About This Library
        </h1>

        <div className="flex flex-col gap-10 text-sm text-[#aaa] leading-relaxed">
          <section>
            <p>
              A curated reference library of film and drama stills, designed for filmmakers,
              video creators, and students of visual storytelling.
            </p>
            <p className="mt-3">
              Browse by camera angle, composition, color palette, lighting, mood, and more —
              find the perfect visual reference for your next project.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              How It Works
            </h2>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc list-outside">
                Images are tagged with detailed metadata: angle, shot size, composition,
                color mood, lighting, setting, and more
              </li>
              <li className="list-disc list-outside">
                Filter and search by any combination of visual attributes
              </li>
              <li className="list-disc list-outside">
                Download references for your moodboards and pre-production decks
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Sources
            </h2>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc list-outside">
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6b8cff] hover:text-[#8aa4ff] transition-colors"
                >
                  TMDB API
                </a>
                {' '}— official promotional stills and backdrops
              </li>
              <li className="list-disc list-outside">
                <a
                  href="https://film-grab.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6b8cff] hover:text-[#8aa4ff] transition-colors"
                >
                  Film Grab
                </a>
                {' '}— curated film frame archive
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Purpose & Disclaimer
            </h2>
            <p>
              본 사이트는 영상 제작자, 촬영 감독, 영화 전공 학생 등 영상 창작자를 위한
              촬영 레퍼런스 용도로 운영됩니다. 무드보드 제작, 프리프로덕션, 촬영 기법 연구 등
              교육적·창작적 목적에 한하여 활용할 수 있습니다.
            </p>
            <p className="mt-3">
              모든 이미지의 저작권은 해당 영화 및 드라마의 제작사·배급사에 있으며,
              본 사이트는 상업적 이용을 목적으로 하지 않습니다.
              권리자의 요청이 있을 경우 즉시 해당 콘텐츠를 삭제합니다.
            </p>
            <p className="mt-3">
              <Link
                href="/dmca"
                className="text-[#6b8cff] hover:text-[#8aa4ff] transition-colors"
              >
                DMCA Policy
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
