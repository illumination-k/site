import type { NextApiRequest, NextApiResponse } from "next";
import requestIp from "request-ip";

import { LimitChecker } from "@/server/libs/limitChecker";

const limitChecker = LimitChecker();

type Data = {
  text: string;
  clientIp: string;
};
export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>): Promise<void> {
  const clientIp = requestIp.getClientIp(req) || "IP_NOT_FOUND";

  try {
    await limitChecker.check(res, 3, clientIp);
  } catch (error) {
    console.error(error);

    res.status(429).json({
      text: `Rate Limited`,
      clientIp: clientIp,
    });
    return;
  }

  res.status(200).json({
    text: `テキスト`,
    clientIp: clientIp,
  });
}
