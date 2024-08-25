import { NextSeo, NextSeoProps } from "next-seo";
import Head from "next/head";
import { PropsWithChildren } from "react";
import FooterBase, { FooterBaseProps } from "./FooterBase";
import Nav from "./Nav";

type HeaderProps = {} & PropsWithChildren;

export type LayoutProps = {
  className?: string;
  title: string;
  description: string;
  nextSeoProps?: NextSeoProps;
  headerProps?: HeaderProps;
  footerProps?: FooterBaseProps;
} & PropsWithChildren;

export default function Layout({
  className,
  title,
  description,
  nextSeoProps,
  headerProps,
  children,
  footerProps,
}: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <Head {...headerProps}>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NextSeo title={title} description={description} {...nextSeoProps} />
      <Nav />
      <main className={className}>{children}</main>
      <FooterBase {...footerProps} />
    </div>
  );
}
