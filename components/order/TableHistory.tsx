import { ME_ENDPOINT, OWNER_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { PROMPT_DIALOG_MESSAGE } from "@/constants/message/prompt";
import { DASHBOARD_URL } from "@/constants/url";
import { IOrderForOrderDetail } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import { usePrompt } from "@/hooks/usePrompt";
import { useToast } from "@/hooks/useToast";
import useMutation, { ApiErrorState } from "@/lib/client/useMutation";
import { IPatchRestaurantTableBody } from "@/pages/api/v1/owner/restaurants/tables/[restaurantTableId]";
import { IPostRestaurantTableReserveBody } from "@/pages/api/v1/owner/restaurants/tables/[restaurantTableId]/reserve";
import buildEndpointWithQuery from "@/utils/converter/buildEndpointWithQuery";
import { getTokyoTime } from "@/utils/getTime";
import isEmpty from "@/utils/validation/isEmpty";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { Order, RestaurantTable, TableStatus } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { SetStateAction, useEffect, useState } from "react";
import useSWR from "swr";
import OrderDetail from "./OrderDetail";

type TableHistoryProps = {
  tableType: string | undefined;
  tableNumber: string | undefined;
};

const minDate = dayjs("2023-01-01");

export default function TableHistory({
  tableType,
  tableNumber,
}: TableHistoryProps) {
  const {
    data: tableInfo,
    error: tableInfoErr,
    isValidating: tableInfoLoading,
  } = useSWR<RestaurantTable>(
    tableType && tableNumber
      ? buildEndpointWithQuery(ME_ENDPOINT.TABLE_NUMBER(tableNumber), {
          tableType,
        })
      : null
  );
  const [
    updateTableStatus,
    { error: updateTableStatusErr, loading: updateTableStatusLoading },
  ] = useMutation<RestaurantTable, IPatchRestaurantTableBody>(
    tableInfo ? OWNER_ENDPOINT.RESTAURANT.TABLE.BASE(tableInfo.id) : null,
    Method.PATCH
  );
  const [
    reserveTable,
    { error: reserveTableErr, loading: reserveTableLoading },
  ] = useMutation<Order, IPostRestaurantTableReserveBody>(
    tableInfo ? OWNER_ENDPOINT.RESTAURANT.TABLE.RESERVE(tableInfo.id) : null,
    Method.POST
  );
  const [startDate, setStartDate] = useState<dayjs.Dayjs>(
    getTokyoTime().subtract(1, "week")
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs>(getTokyoTime());
  const [activateOrderData, setActivateOrderData] =
    useState<IOrderForOrderDetail | null>(null);
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const { showPrompt } = usePrompt();
  const router = useRouter();
  const withLoading = useLoading();

  const isDisabled =
    !tableInfo ||
    isEmpty(tableInfo) ||
    tableInfoLoading ||
    updateTableStatusLoading;

  const handleCloseTableHistory = async () => {
    router.push(
      {
        pathname: DASHBOARD_URL.BASE,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleActivateOrderChange = (
    newData: SetStateAction<IOrderForOrderDetail | null>
  ) => {
    setActivateOrderData(newData);
  };

  const handleConfirmUpdateStatus = async (tableStatus: TableStatus) => {
    if (updateTableStatusLoading) {
      return;
    }

    const result = await updateTableStatus(
      {
        updateTableInfo: {
          status: tableStatus,
        },
      },
      {
        additionalKeys: [ME_ENDPOINT.TABLE, ME_ENDPOINT.ORDER_REQUEST],
      }
    );

    if (result) {
      addToast("success", "Table Status Change Successfully!");
      handleCloseTableHistory();
    }
  };

  const handleConfirmReserveOrder = async (customerName: string) => {
    if (reserveTableLoading) {
      return;
    }

    const result = await reserveTable(
      {
        customerName,
      },
      {
        isMutate: false,
        additionalKeys: [ME_ENDPOINT.TABLE, ME_ENDPOINT.ORDER_REQUEST],
      }
    );
    if (result) {
      addToast("success", "Table Reservation Successfully!");
      handleCloseTableHistory();
    }
  };

  const handleReserveTable = () => {
    showPrompt({
      title: PROMPT_DIALOG_MESSAGE.BOOKING_TABLE.TITLE,
      message: PROMPT_DIALOG_MESSAGE.BOOKING_TABLE.MESSAGE,
      confirmText: PROMPT_DIALOG_MESSAGE.BOOKING_TABLE.CONFIRM_TEXT,
      cancelText: PROMPT_DIALOG_MESSAGE.BOOKING_TABLE.CANCEL_TEXT,
      placeholder: PROMPT_DIALOG_MESSAGE.BOOKING_TABLE.PLACEHOLDER,
      buttonType: "info",
      onConfirm: async (customerName: string | undefined) => {
        if (!customerName?.trim()) {
          addToast("error", "Please enter customer name!");
          return;
        }

        await withLoading(() => handleConfirmReserveOrder(customerName));
      },
    });
  };

  const handleUpdateStatus = (tableStatus: TableStatus) => {
    if (
      !tableInfo ||
      isEmpty(tableInfo) ||
      !tableStatus ||
      updateTableStatusLoading
    ) {
      return;
    }

    if (tableStatus === TableStatus.RESERVED) {
      handleReserveTable();
    } else {
      const message =
        CONFIRM_DIALOG_MESSAGE.CHANGE_TABLE_UNAVAILABLE.MESSAGE.replace(
          "{0}",
          tableStatus === TableStatus.UNAVAILABLE
            ? "使用不可"
            : tableStatus === TableStatus.AVAILABLE
            ? "使用可能"
            : tableStatus
        );

      showConfirm({
        title: CONFIRM_DIALOG_MESSAGE.CHANGE_TABLE_UNAVAILABLE.TITLE,
        message: message,
        confirmText:
          CONFIRM_DIALOG_MESSAGE.CHANGE_TABLE_UNAVAILABLE.CONFIRM_TEXT,
        cancelText: CONFIRM_DIALOG_MESSAGE.CHANGE_TABLE_UNAVAILABLE.CANCEL_TEXT,
        buttonType: "info",
        onConfirm: async () => {
          await withLoading(() => handleConfirmUpdateStatus(tableStatus));
        },
      });
    }
  };

  const handleErrors = (error: ApiErrorState | null | undefined) => {
    if (error) {
      addToast("error", error.message);
    }
  };

  useEffect(() => {
    handleErrors(tableInfoErr);
    handleErrors(updateTableStatusErr);
    handleErrors(reserveTableErr);
  }, [tableInfoErr, updateTableStatusErr, reserveTableErr]);

  return (
    <div className="flex select-none font-archivo flex-col w-full max-h-[100vh] h-full p-4 bg-slate-700">
      <div className="relative flex items-center justify-center w-full h-16 pb-3 mb-4 border-b border-dashed border-slate-500">
        <div className="absolute left-0">
          <button
            onClick={handleCloseTableHistory}
            className="p-2 font-semibold rounded-xl w-28 bg-slate-400 hover:bg-slate-500"
          >
            Close
          </button>
        </div>
        <div className="flex items-center justify-center space-x-3 text-xl font-semibold text-red-400">
          <span>
            {tableType} {tableNumber}
          </span>
        </div>
        <div className="absolute right-0 flex space-x-2">
          <div className="flex flex-col text-xs">
            <label className="text-white indent-1">startDate</label>
            <DesktopDatePicker
              className="rounded-md w-36 bg-slate-200"
              slotProps={{ textField: { size: "small" } }}
              defaultValue={startDate}
              minDate={minDate}
              maxDate={endDate}
              onError={() => {
                addToast("error", "Invalid date. Please choose another date");
              }}
              onChange={(dateObj) => {
                if (dateObj) {
                  setStartDate(dateObj);
                }
              }}
            />
          </div>
          <div className="flex flex-col text-xs">
            <label className="text-white indent-1">endDate</label>
            <DesktopDatePicker
              className="rounded-md bg-slate-200 w-36"
              slotProps={{ textField: { size: "small" } }}
              defaultValue={endDate}
              minDate={startDate}
              disableFuture
              onError={() => {
                addToast("error", "Invalid date. Please choose another date");
              }}
              onChange={(dateObj) => {
                if (dateObj) {
                  setEndDate(dateObj);
                }
              }}
            />
          </div>
        </div>
      </div>
      <OrderDetail
        tableId={tableInfo?.id}
        queries={{
          startDate: startDate.toDate(),
          endDate: endDate.toDate(),
        }}
        hasActiveOrder={handleActivateOrderChange}
      />
      <div className="flex self-end justify-between w-full p-2 mt-4 rounded-md bg-zinc-500">
        <div className="flex items-center justify-center ml-2 space-x-2">
          <span className="text-lg text-yellow-300">Table Edit: </span>
        </div>
        {activateOrderData && !isEmpty(activateOrderData) ? (
          <span className="flex items-center justify-center flex-grow text-zinc-100">
            Currently, there are customers who are using this table. Please try
            again after the customer has finished using the table.
          </span>
        ) : (
          <div className="flex items-center space-x-2">
            {tableInfo?.status !== TableStatus.RESERVED && (
              <button
                onClick={() => handleUpdateStatus(TableStatus.RESERVED)}
                disabled={isDisabled}
                className={`px-10 py-2 font-semibold bg-blue-600 text-white rounded-full  ${
                  isDisabled
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                Table Reservation
              </button>
            )}
            {tableInfo?.status === TableStatus.UNAVAILABLE ? (
              <button
                onClick={() => handleUpdateStatus(TableStatus.AVAILABLE)}
                disabled={isDisabled}
                className={`px-10 py-2 font-semibold bg-green-600 text-white rounded-full  ${
                  isDisabled
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:bg-green-700"
                }`}
              >
                Change to Available
              </button>
            ) : (
              <button
                onClick={() => handleUpdateStatus(TableStatus.UNAVAILABLE)}
                disabled={isDisabled}
                className={`px-10 py-2 font-semibold bg-red-600 text-white rounded-full  ${
                  isDisabled
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:bg-red-700"
                }`}
              >
                Change to Not Available
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
