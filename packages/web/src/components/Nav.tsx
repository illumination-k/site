import { pagesPath } from "@/lib/$path";
import { HomeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"] });

export default function Nav({}) {
  return (
    <nav className={`flex px-4 md:px-10 py-2 justify-between bg-black `}>
      <Link href={"/"}>
        <span className={`hidden md:block text-(3xl white hover:blue-200) font-black ${caveat.className}`}>
          illumination-k.dev
        </span>
        <HomeIcon aria-hidden="true" className="h6 w-6 md:hidden" />
      </Link>

      <div>
        <Link href={pagesPath.techblog._page(1).$url()} className="hidden md:block text-(xl white) font-black">
          Blog
        </Link>
      </div>
    </nav>
  );
}
