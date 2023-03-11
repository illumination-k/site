import { pagesPath } from "@/lib/$path";
import { HomeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import { Caveat } from "next/font/google";
import TwitterIcon from "@/icons/TwitterIcon";
import GithubIcon from "@/icons/GithubIcon";

const caveat = Caveat({ subsets: ["latin"] });

export default function Nav({}) {
  return (
    <nav className={`flex px-4 md:px-10 py-2 items-center justify-between bg-black `}>
      <Link href={"/"}>
        <span className={`hidden md:block text-(3xl white hover:blue-200) font-black ${caveat.className}`}>
          illumination-k.dev
        </span>
        <HomeIcon aria-hidden="true" className="icon-8 text-white md:hidden" />
      </Link>

      <div className="flex gap-5 items-center py-1">
        <Link href={pagesPath.techblog._page(1).$url()} className="block text-(xl white) font-black">
          Blog
        </Link>

        <a href="https://twitter.com/illuminationK" className="bg-white rounded-full" aria-label="twitter">
          <TwitterIcon aria-hidden="true" className="icon-8" />
        </a>

        <a href="https://www.github.com/illumination-k" aria-label="github">
          <GithubIcon aria-hidden="true" className="icon-8" fill="white" />
        </a>
      </div>
    </nav>
  );
}
