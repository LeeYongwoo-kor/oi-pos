import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { getActiveOrderById } from "@/database";
import { ApiError, NotFoundError } from "@/lib/shared/error/ApiError";
import { GetServerSidePropsContext } from "next";

export default function Order({ order }: any) {
  console.log(order);
  return (
    <div>
      <h1>This is Order Page</h1>
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const orderId = ctx.params?.orderId;
    if (!orderId || typeof orderId !== "string") {
      throw new NotFoundError("Not found restaurant table");
    }

    const decodedOrderId = Buffer.from(orderId, "base64").toString("utf-8");
    const order = await getActiveOrderById(decodedOrderId);

    return {
      props: { order },
    };
  } catch (err) {
    // TODO: Send error to Sentry
    const errMessage =
      err instanceof ApiError ? err.message : COMMON_ERROR.UNEXPECTED;
    console.error(err);
    return {
      props: {
        initErrMsg: errMessage,
      },
    };
  }
}
