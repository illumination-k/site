import Layout from "@/components/Layout";
import PostCard from "@/features/techblog/components/PostCard";
import { MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline";
import { PostMeta, postMetasSchema } from "common";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";

type Props = {
  postMetas: PostMeta[];
};

type SearchProps = {
  query: string | undefined | null;
};

const fetcher = async (url: string) => {
  const data: unknown = await (await fetch(url, { method: "GET" })).json();
  const parse = postMetasSchema.safeParse(data);
  if (!parse.success) {
    throw parse.error;
  }

  return parse.data;
};

function makeSearchApiURL(query: string | undefined | null) {
  let url = "/api/search";

  if (query) {
    url += `?q=${query}`;
  }

  return url.toString();
}

const Search = ({ query }: SearchProps) => {
  const url = makeSearchApiURL(query);
  const { data, isLoading, error } = useSWR<PostMeta[]>(url, fetcher);

  if (!data) {
    return <>Loading...</>;
  }

  if (error) {
    return <>{JSON.stringify(error)}</>;
  }

  return (
    <div>
      {data.map((meta, i) => <PostCard meta={meta} key={i} />)}
    </div>
  );
};

const SearchPage: NextPage = ({}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => setQuery(router.query.q as string), [setQuery, router]);

  return (
    <Layout title="Search" description="search page">
      <div className="grid grid-cols-10">
        <div></div>
        <div className="col-span-8">
          <div className="flex justify-center items-center">
            <h2 className="text-center text-4xl font-bold">Query: {query}</h2>
            <form
              className="flex w-96 bg-gray-50 border-1 items-center mx-10 my-5 rounded-xl"
              onSubmit={(e) => {
                e.preventDefault();
                // @ts-ignore
                setQuery(e.target.query.value as string);
              }}
            >
              <input
                className="w-full px-3 bg-gray-50 focus:outline-none"
                type="text"
                id="query"
                name="query"
                required
              />
              <button>
                <MagnifyingGlassCircleIcon className="icon-10 text-blue-500" />
              </button>
            </form>
          </div>

          <Search query={query as string} />
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
