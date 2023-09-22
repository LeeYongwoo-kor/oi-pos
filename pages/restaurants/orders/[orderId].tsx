import Menu from "@/components/menu/Menu";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { ERROR_URL } from "@/constants/url";
import { IOrder, getActiveOrderById } from "@/database";
import { useToast } from "@/hooks/useToast";
import { ApiError, NotFoundError } from "@/lib/shared/error/ApiError";
import { IOrderInfo, orderInfoState } from "@/recoil/state/orderState";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";

type OrderPageProps = {
  order: IOrder | undefined;
  initErrMsg: string | undefined;
  notFound: boolean | undefined;
};

export default function Order({ order, initErrMsg, notFound }: OrderPageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const setOrderInfo = useSetRecoilState(orderInfoState);

  useEffect(() => {
    if (order) {
      const { id, status, table } = order;
      const orderInfo: IOrderInfo = {
        orderId: id,
        orderStatus: status,
        tableId: table.id,
        tableNumber: table.number,
      };
      setOrderInfo(orderInfo);
    }
  }, [order]);

  useEffect(() => {
    const hasErrors = async () => {
      if (initErrMsg) {
        await router.replace(ERROR_URL.SERVER_ERROR);
        addToast("error", initErrMsg);
      }
      if (notFound) {
        await router.replace(ERROR_URL.NOT_FOUND);
        addToast(
          "error",
          "Not found restaurant table. Please contact the staff"
        );
      }
    };
    hasErrors();
  }, [initErrMsg, notFound]);

  return (
    <div className="">
      <div className="flex justify-between text-sm font-light text-white bg-slate-700">
        <span>
          🍔{order?.table?.tableType} No: {order?.table?.number}
        </span>
        <div className="flex space-x-1">
          <span>Open: {order?.table?.restaurant?.startTime}</span>
          <span>~ {order?.table?.restaurant?.endTime}</span>
        </div>
        <span>Last Order: {order?.table?.restaurant?.lastOrder}</span>
      </div>
      <Menu restaurantInfo={order?.table?.restaurant} role={"user"} />
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
    const order = convertDatesToISOString(
      await getActiveOrderById(decodedOrderId)
    );

    console.log("order", order);

    if (!order) {
      return {
        props: {
          notFound: true,
        },
      };
    }

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
