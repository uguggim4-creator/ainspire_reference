import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Reference Library',
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
              Built for Education
            </h2>
            <p>
              This library exists to help creators study and reference the visual language
              of cinema. All images belong to their respective copyright holders.
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
