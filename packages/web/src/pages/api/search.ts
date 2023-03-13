import type { NextApiRequest, NextApiResponse } from "next";
import requestIp from "request-ip";

import { LimitChecker } from "@/server/libs/limitChecker";
import { initTechblogMeiliSearchIndex } from "common/io";
import { Lang, PostMeta } from "common";

const limitChecker = LimitChecker();

const index = initTechblogMeiliSearchIndex();

type Data = {
  text: string;
  clientIp: string;
} | PostMeta[];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>): Promise<void> {
  const clientIp = requestIp.getClientIp(req) || "IP_NOT_FOUND";
  try {
    await limitChecker.check(res, process.env.NODE_ENV === "development" ? 1000000 : 500, clientIp);
  } catch (error) {
    console.error(error);

    res.status(429).json({
      text: `Rate Limited`,
      clientIp: clientIp,
    });
    return;
  }

  const q = req.query.q;

  if (typeof q !== "string") {
    res.status(200).json([]);
    return;
  }

  const postMetas: PostMeta[] = await (await index.search(q, {})).hits.map((hit) => {
    const { id: uuid, title, lang, description, tags, category, created_at, updated_at } = hit;

    return {
      uuid,
      title,
      lang: lang as Lang,
      description,
      tags: tags.split(" "),
      category,
      created_at,
      updated_at,
    };
  });

  res.status(200).json(postMetas);
}
