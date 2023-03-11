import Layout from "@/components/Layout";
import GithubIcon from "@/icons/GithubIcon";
import TwitterIcon from "@/icons/TwitterIcon";
import type { NextPage } from "next";

const Home: NextPage = ({}) => {
  return (
    <Layout
      title="illumination-k.dev"
      description="Top page of illumination-k.dev"
    >
      <div className="h-screen">
        <div className="sticky top-10">
          <div className="flex gap-4 justify-center items-center px-10 py-4">
            <div className="flex gap-4">
              <a href="https://twitter.com/illuminationK" aria-label="twitter">
                <TwitterIcon className="icon-10" />
              </a>

              <a href="https://www.github.com/illumination-k" aria-label="github">
                <GithubIcon className="icon-10" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
