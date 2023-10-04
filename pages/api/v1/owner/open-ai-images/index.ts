import { OWNER_ENDPOINT } from "@/constants/endpoint";
import { EXTERNAL_ENDPOINT } from "@/constants/external";
import withApiHandler from "@/lib/server/withApiHandler";
import { ApiError, UnexpectedError } from "@/lib/shared/error/ApiError";
import isContainedJapanese from "@/utils/validation/isContainedJapanese";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostOpenAiImageBody {
  triggerName: string;
}
interface gerateImageResponse {
  url: string;
}
export interface IPostOpenAiImageResponse {
  created: number;
  data: gerateImageResponse[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { triggerName } = req.body;
  let prompt = `A delicious-looking ${triggerName} that would fit perfectly on a restaurant menu, featuring natural and food-friendly colors, centered in the middle of the picture`;

  if (isContainedJapanese(triggerName)) {
    prompt = `写真のようにリアルで美味しそうな${triggerName}が、レストランのメニューにぴったりな写真を中央に配置する`;
  }

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPEN_AI_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: "512x512",
    }),
  };

  try {
    const response = await fetch(
      EXTERNAL_ENDPOINT.OPEN_AI_CREATE_IMAGE,
      options
    );

    if (!response.ok) {
      let message = "Error occurred while generating image. Please Try again";
      const { error } = await response.json();
      if (error.code === "content_policy_violation") {
        message =
          "You are using inappropriate category name. Please use another category name";
      }

      throw ApiError.builder()
        .setMessage(message)
        .setStatusCode(response.status)
        .setOriginalError(error)
        .setEndpoint(OWNER_ENDPOINT.OPEN_AI_IMAGE)
        .build();
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    // Send error to sentry
    console.error(err);
    if (err instanceof ApiError) {
      throw err;
    }

    throw new UnexpectedError(
      "Error occurred while generating image. Please Try again"
    );
  }
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
