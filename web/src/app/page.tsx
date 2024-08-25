import type { NextPage } from "next";
import Adsense from "@/components/Adsense";

const Home: NextPage = ({}) => {
  return (
    <div>
      <Adsense />
      <p className="bg-red-100">test</p>
    </div>
  );
};

export default Home;
