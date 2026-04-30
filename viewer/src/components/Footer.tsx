import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[#1a1a1a] bg-black">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#444] text-xs">Powered by</span>
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB"
                width={80}
                height={14}
                unoptimized
              />
            </a>
          </div>

          <p className="text-[#444] text-xs leading-relaxed">
            Images provided by TMDB. Film stills sourced from Film Grab.
            <br />
            All images are property of their respective copyright holders and are used here
            for educational and research purposes under fair use.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/dmca"
              className="text-[#555] text-xs hover:text-[#888] transition-colors"
            >
              DMCA Policy
            </Link>
            <span className="text-[#333] text-xs">·</span>
            <a
              href="mailto:wookjong00@vavaland.co.kr"
              className="text-[#555] text-xs hover:text-[#888] transition-colors"
            >
              Contact
            </a>
            <span className="text-[#333] text-xs">·</span>
            <Link
              href="/about"
              className="text-[#555] text-xs hover:text-[#888] transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
