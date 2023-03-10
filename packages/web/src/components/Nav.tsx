import { pagesPath } from "@/lib/$path";
import { HomeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"] });

export default function Nav({}) {
  return (
    <nav className={`flex px-4 md:px-10 py-2 justify-between bg-black text-white`}>
      <Link href={"/"}>
        <span className={`text-3xl font-black hidden md:block ${caveat.className}`}>illumination-k.dev</span>
        <HomeIcon aria-hidden="true" className="h6 w-6 md:hidden" />
      </Link>

      <div>
        <Link href={pagesPath.techblog._page(1).$url()} className="hidden md:block text-xl font-black">
          Blog
        </Link>
      </div>
    </nav>
  );
}
