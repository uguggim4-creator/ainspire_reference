import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DMCA Policy — Reference Library',
}

export default function DmcaPage() {
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
          DMCA Policy &amp; Copyright Notice
        </h1>

        <div className="flex flex-col gap-10 text-sm text-[#aaa] leading-relaxed">
          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Purpose
            </h2>
            <p>
              This website is an educational reference library for studying cinematography,
              composition, color grading, and visual storytelling. All film stills and images
              displayed on this site are used solely for educational and research purposes
              under the fair use doctrine.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Image Sources
            </h2>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc list-outside">
                Promotional images are sourced via the TMDB API, which provides press materials
                originally distributed by studios and distributors for promotional purposes.
              </li>
              <li className="list-disc list-outside">
                Film frame references are sourced from publicly available archives such as
                Film Grab, used under educational fair use.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Copyright Ownership
            </h2>
            <p>
              All images remain the property of their respective copyright holders, including
              but not limited to film studios, production companies, and distributors. This
              website does not claim ownership of any copyrighted material.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              DMCA Takedown Requests
            </h2>
            <p className="mb-4">
              If you are a copyright holder or authorized agent and believe that content on
              this site infringes your copyright, please send a DMCA takedown notice to:
            </p>
            <p className="mb-4">
              <span className="text-white font-medium">Email: </span>
              <a
                href="mailto:wookjong00@vavaland.co.kr"
                className="text-[#6b8cff] hover:text-[#8aa4ff] transition-colors"
              >
                wookjong00@vavaland.co.kr
              </a>
              <span className="text-[#555] text-xs ml-2">{/* TODO: replace with actual email */}</span>
            </p>
            <p className="mb-3">Your notice must include:</p>
            <ol className="flex flex-col gap-2 pl-4">
              {[
                'Identification of the copyrighted work claimed to have been infringed',
                'Identification of the material to be removed, with enough detail to locate it',
                'Your contact information (name, address, phone, email)',
                'A statement that you have a good faith belief that the use is not authorized',
                'A statement under penalty of perjury that the information is accurate',
                'Your physical or electronic signature',
              ].map((item, i) => (
                <li key={i} className="list-decimal list-outside">
                  {item}
                </li>
              ))}
            </ol>
            <p className="mt-4">
              We will respond to valid DMCA notices within 48 hours and remove the identified
              content promptly.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Counter-Notification
            </h2>
            <p>
              If you believe content was removed in error, you may file a counter-notification
              with the same contact address above.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xs font-medium tracking-[0.15em] uppercase mb-3">
              Fair Use Notice
            </h2>
            <p className="mb-3">
              This site contains copyrighted material the use of which has not always been
              specifically authorized by the copyright owner. We are making such material
              available for educational purposes. We believe this constitutes a &ldquo;fair
              use&rdquo; of any such copyrighted material as provided for in Section 107 of
              the US Copyright Law.
            </p>
            <p>
              If you wish to use copyrighted material from this site for purposes that go
              beyond fair use, you must obtain permission from the copyright owner.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
