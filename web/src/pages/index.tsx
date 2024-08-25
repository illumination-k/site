import Layout from "@/components/Layout";
import GithubIcon from "@/icons/GithubIcon";
import TwitterIcon from "@/icons/TwitterIcon";
import { pagesPath } from "@/lib/$path";
import { DocumentIcon } from "@heroicons/react/24/outline";
import type { NextPage } from "next";
import Link from "next/link";

import { Link as Scroll } from "react-scroll";

const Home: NextPage = ({}) => {
  return (
    <Layout
      title="illumination-k.dev"
      description="Top page of illumination-k.dev"
      footerProps={{ className: "bg-blue-100" }}
    >
      <div className="h-screen bg-sky-100 flex justify-center items-center">
        <div id="home" className="text-center">
          <p className="text-4xl font-bold py-2">About this site</p>
          <p>illumination-kのプロフィール、ポートフォリオ(工事中)をまとめたページです。</p>

          <div className="my-4 flex justify-center items-center gap-5">
            <button className="text-lg hover:text-blue-400">
              <Scroll to="profile" smooth={true}>Profile</Scroll>
            </button>
          </div>
        </div>
      </div>
      <div id="profile" className="h-screen bg-blue-100 flex items-center">
        <div className="grid grid-cols-1 place-items-center gap-4">
          <p className="text-4xl font-bold">About me</p>
          <p className="w-8/12 text-lg font-semibold">
            Hi, I am a Ph.D. student majoring in plant molecular biology in Laboratory of Plant Molecular Biology,
            Graduate School of Biostudies, Kyoto University. My research themes are to develop the expression database
            and elucidate the gibberellin system and develop genome database in the basal land plant, the liverwort
            <i>Marchantia polymorpha</i>. I love both biology and programing, especially bioinformatics. In biology, I
            am interested in the evolution, development, and omics analysis. In programming, I am interested in machine
            learning and web development.
          </p>
          <div className="flex">
          </div>
          <ul>
            <li className="flex gap-2 items-center my-2">
              <DocumentIcon className="icon-8" />
              <Link className="text-lg hover:text-blue-400" href={pagesPath.techblog._page(1).$url()}>Blog</Link>
            </li>
            <li className="flex gap-2 items-center my-2">
              <GithubIcon className="icon-8" />
              <a href="https://www.github.com/illumination-k" className="text-lg hover:text-blue-400">
                illumination-k
              </a>
            </li>
            <li className="flex gap-2 items-center my-2">
              <TwitterIcon className="icon-8" />
              <a href="https://twitter.com/illuminationK" className="text-lg hover:text-blue-400">
                @illuminationK
              </a>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
