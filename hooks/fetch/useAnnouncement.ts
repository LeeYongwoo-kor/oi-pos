import { ORDER_REQUEST_ENDPOINT } from "@/constants/endpoint";
import { IOrderRequest } from "@/database";
import { OrderRequestStatus } from "@prisma/client";
import { useEffect } from "react";
import useSWR from "swr";
import { useToast } from "../useToast";

export default function useAnnouncement(orderId: string | undefined) {
  const { addToast } = useToast();

  const { data, error, isValidating } = useSWR<IOrderRequest[]>(
    orderId
      ? `${ORDER_REQUEST_ENDPOINT.ORDER_REQUEST_BY_CONDITION(orderId)}?status=${
          OrderRequestStatus.CANCELLED
        }&rejected=true`
      : null
  );

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
