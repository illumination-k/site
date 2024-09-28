import React, { Suspense } from "react";

import Loading from "@/components/Loading";

import Search from "./Search";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Search />
    </Suspense>
  );
}
