import { ORDER_REQUEST_ENDPOINT } from "@/constants/endpoint";
import { IOrderRequest } from "@/database";
import { OrderRequestStatus } from "@prisma/client";
import { useEffect } from "react";
import useSWR from "swr";
import { useToast } from "../useToast";
import buildEndpointWithQuery from "@/utils/converter/buildEndpointWithQuery";
import { IGetOrderRequestQuery } from "@/pages/api/v1/orders/[orderId]/requests";

export default function useAnnouncement(orderId: string | undefined) {
  const { data, error, isValidating } = useSWR<IOrderRequest[]>(
    orderId
      ? buildEndpointWithQuery<IGetOrderRequestQuery>(
          ORDER_REQUEST_ENDPOINT.BASE(orderId),
          {
            status: OrderRequestStatus.CANCELLED,
            rejected: true,
          }
        )
      : null
  );
  const { addToast } = useToast();

  useEffect(() => {
    if (error) {
      addToast("error", error.message);
    }
  }, [error]);

  return {
    announcements: data,
    announcementsErr: error,
    announcementsLoading: isValidating,
  };
}
