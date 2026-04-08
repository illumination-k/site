import React, { Suspense } from "react";

import Loading from "@/components/Loading";

import Search from "./Search";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <Search locale={locale} />
    </Suspense>
  );
}
