import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import OrderPayment from "@/components/order/OrderPayment";
import QRCodeGenerate from "@/components/order/QRCodeGenerate";
import Modal from "@/components/ui/Modal";
import { RESTAURANT_TABLE_ENDPOINT } from "@/constants/endpoint";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { MULTIPLICATION_SYMBOL } from "@/constants/unicode";
import { AUTH_URL, DASHBOARD_URL } from "@/constants/url";
import {
  IRestaurantTableForDashboard,
  getRestaurantTablesByRestaurantId,
} from "@/database";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/shared/error/ApiError";
import { qrCodeOpenState } from "@/recoil/state/dashboardState";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import convertDatesToIntlString from "@/utils/converter/convertDatesToIntlString";
import convertNumberToOrderNumber from "@/utils/converter/convertNumberToOrderNumber";
import isEmpty from "@/utils/validation/isEmpty";
import {
  faBellConcierge,
  faCircleInfo,
  faMoneyBill1,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  OrderRequestStatus,
  OrderStatus,
  TableStatus,
  TableType,
} from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
import { authOptions } from "../api/auth/[...nextauth]";
import {
  showAlarmState,
  sortRequestedOrderState,
  tableNumberState,
  tableTypeState,
} from "@/recoil/state/alarmState";

type DashboardProps = {
  fallbackData: IRestaurantTableForDashboard[];
  initErrMsg: string;
};

type ModalAction = "payment" | "detail";

const statusToBgColor = {
  [TableStatus.AVAILABLE]: "bg-slate-700",
  [TableStatus.UNAVAILABLE]: "from-slate-700 to-black",
  [TableStatus.OCCUPIED]: "from-green-600 to-green-900",
  [TableStatus.RESERVED]: "from-sky-600 to-sky-900",
};

const statusToText = {
  [TableStatus.AVAILABLE]: "EMPTY",
  [TableStatus.UNAVAILABLE]: "UNAVAILABLE",
  [TableStatus.OCCUPIED]: "ACTIVE",
  [TableStatus.RESERVED]: "RESERVED",
};

const statusToTextColor = {
  [TableStatus.AVAILABLE]: "text-gray-300",
  [TableStatus.UNAVAILABLE]: "text-red-500",
  [TableStatus.OCCUPIED]: "text-green-300",
  [TableStatus.RESERVED]: "text-blue-300",
};

const statusToButtonColor = {
  [TableStatus.AVAILABLE]: "bg-gray-500 hover:bg-gray-600",
  [TableStatus.UNAVAILABLE]: "bg-gray-500 hover:bg-gray-600",
  [TableStatus.OCCUPIED]: "bg-green-500 hover:bg-green-600",
  [TableStatus.RESERVED]: "bg-blue-500 hover:bg-blue-600",
};

const getStatusToBgColor = (
  tableStatus: TableStatus,
  orderStatus: OrderStatus
): string => {
  if (orderStatus === OrderStatus.PENDING) {
    return "from-yellow-600 to-yellow-900";
  } else if (orderStatus === OrderStatus.PAYMENT_REQUESTED) {
    return "from-indigo-600 to-indigo-900";
  }

  return statusToBgColor[tableStatus];
};

const getStatusToText = (
  tableStatus: TableStatus,
  orderStatus: OrderStatus
): string => {
  if (orderStatus === OrderStatus.PENDING) {
    return OrderStatus.PENDING;
  } else if (orderStatus === OrderStatus.PAYMENT_REQUESTED) {
    return "PAYMENT";
  }

  return statusToText[tableStatus];
};

const getStatusToTextColor = (
  tableStatus: TableStatus,
  orderStatus: OrderStatus
): string => {
  if (orderStatus === OrderStatus.PENDING) {
    return "text-yellow-500";
  } else if (orderStatus === OrderStatus.PAYMENT_REQUESTED) {
    return "text-indigo-500";
  }

  return statusToTextColor[tableStatus];
};

const getStatusToButtonColor = (
  tableStatus: TableStatus,
  orderStatus: OrderStatus
): string => {
  if (orderStatus === OrderStatus.PENDING) {
    return "bg-amber-500 hover:bg-amber-600";
  } else if (orderStatus === OrderStatus.PAYMENT_REQUESTED) {
    return "bg-indigo-500 hover:bg-indigo-600";
  }

  return statusToButtonColor[tableStatus];
};

function Dashboard({ fallbackData, initErrMsg }: DashboardProps) {
  const [isOpenQrCode, setOpenQrCode] = useRecoilState(qrCodeOpenState);
  const openAlarm = useSetRecoilState(showAlarmState);
  const setOrderRequestSort = useSetRecoilState(sortRequestedOrderState);
  const setAlarmTableType = useSetRecoilState(tableTypeState);
  const setAlarmTableNumber = useSetRecoilState(tableNumberState);
  const { data, error, isLoading } = useSWR<IRestaurantTableForDashboard[]>(
    RESTAURANT_TABLE_ENDPOINT.BASE,
    { fallbackData }
  );
  const [currentQrCodeId, setCurrentQrCodeId] = useState("");
  const { addToast } = useToast();
  const router = useRouter();
  const { modal, tableType, tableNumber, orderNumber } = router.query;

  console.log("data", data);

  const handleOpenPayment = async (newQuery: {
    modal: ModalAction;
    tableType: string;
    tableNumber: number;
    orderNumber: number;
  }) => {
    const { modal, tableType, tableNumber, orderNumber } = newQuery;
    if (!modal || !tableType || !tableNumber || !orderNumber) {
      return null;
    }

    const formattedOrderNumber = convertNumberToOrderNumber(orderNumber);

    await router.push({
      pathname: DASHBOARD_URL.BASE,
      query: {
        ...router.query,
        modal,
        tableType,
        tableNumber: String(tableNumber),
        orderNumber: formattedOrderNumber,
      },
    }),
      undefined,
      { shallow: true };
  };

  const handleClickBell = (tableType: TableType, tableNumber: number) => {
    openAlarm(true);
    setOrderRequestSort(true);
    setAlarmTableType(tableType);
    setAlarmTableNumber(String(tableNumber));
  };

  useEffect(() => {
    if (initErrMsg) {
      addToast("error", initErrMsg);
    }
  }, [initErrMsg]);

  useEffect(() => {
    if (error) {
      addToast("error", error.message);
    }
  }, [error]);

  console.log("modal", modal);

  return (
    <Layout>
      {isLoading && <LoadingOverlay />}
      {isOpenQrCode && (
        <Modal width={40} height={40}>
          <QRCodeGenerate qrCodeId={currentQrCodeId} />
        </Modal>
      )}
      {tableNumber &&
        orderNumber &&
        typeof tableNumber === "string" &&
        typeof orderNumber === "string" &&
        typeof tableType === "string" && (
          <Modal width={64} height={40}>
            <OrderPayment
              tableType={tableType}
              tableNumber={tableNumber}
              orderNumber={orderNumber}
            />
          </Modal>
        )}
      <div className="grid min-h-full grid-cols-2 gap-3 p-3 select-none lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 font-archivo overscroll-y-auto">
        {data &&
          data.map((table, index) => {
            const placedOrderCount =
              table.orders[0]?.orderRequests?.filter(
                (orderRequest) =>
                  orderRequest.status === OrderRequestStatus.PLACED
              ).length ?? 0;

            const bgColor = `bg-gradient-to-tl ${getStatusToBgColor(
              table.status,
              table.orders[0]?.status
            )}`;

            return (
              <div
                key={index}
                className={`min-h-[18rem] h-full p-3 rounded-md shadow-lg flex flex-col items-center justify-between ${bgColor} text-white transition-all ease-in-out duration-300`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col items-start">
                    <div className="flex space-x-2">
                      <span className="text-xl font-bold whitespace-nowrap">
                        No. {table.number}
                      </span>
                      <span
                        className={`self-center px-1.5 text-xs rounded-xl bg-slate-800 ${getStatusToTextColor(
                          table.status,
                          table.orders[0]?.status
                        )}`}
                      >
                        {getStatusToText(table.status, table.orders[0]?.status)}
                      </span>
                    </div>
                    <span
                      className={`text-sm ${
                        table.tableType === TableType.COUNTER
                          ? "text-red-300"
                          : "text-blue-300"
                      }`}
                    >
                      {table.tableType}
                    </span>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <button
                      onClick={() => {
                        setCurrentQrCodeId(table.qrCodeId);
                        setOpenQrCode(true);
                      }}
                    >
                      <FontAwesomeIcon
                        className="text-white hover:text-yellow-300"
                        size="xl"
                        icon={faQrcode}
                      />
                    </button>
                    {!isEmpty(table.orders) && (
                      <div className="self-end text-xs">
                        {convertDatesToIntlString(table.orders[0].createdAt, {
                          hideSecond: true,
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full h-full px-2 py-1 mt-1 border rounded-md border-slate-400">
                  {!isEmpty(table.orders) && (
                    <div className="relative max-h-[10rem] text-sm overflow-y-auto scrollbar-hide">
                      {placedOrderCount > 0 && (
                        <div className="absolute top-0.5 right-0 text-slate-100">
                          <button
                            onClick={() =>
                              handleClickBell(table.tableType, table.number)
                            }
                            className="p-1.5 bg-red-800 hover:bg-red-900 rounded-xl"
                          >
                            <FontAwesomeIcon
                              className="animate-ring"
                              size="1x"
                              icon={faBellConcierge}
                            />
                            <span className="px-1 ml-1 text-sm font-semibold">
                              New ({placedOrderCount})
                            </span>
                          </button>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-red-300">
                          Order No.{" "}
                          {convertNumberToOrderNumber(
                            table.orders[0].orderNumber
                          )}
                        </p>
                        <p className="font-medium text-yellow-300">
                          [ Recently Order ]
                        </p>
                        {table.orders[0].orderRequests
                          .filter(
                            (orderRequest) =>
                              orderRequest.status !==
                                OrderRequestStatus.CANCELLED &&
                              orderRequest.status !== OrderRequestStatus.PLACED
                          )
                          .slice(0, 3)
                          .map((orderRequest, orderRequestIndex) => (
                            <div
                              key={orderRequest.id + orderRequestIndex}
                              className="text-slate-200 indent-1"
                            >
                              <span>
                                {convertDatesToIntlString(
                                  orderRequest.createdAt
                                )}
                              </span>
                              <div className="mb-2">
                                {orderRequest.orderItems.map(
                                  (orderItem, orderItemIndex) => (
                                    <div
                                      key={orderItem.id + orderItemIndex}
                                      className="flex items-center space-x-1 indent-3"
                                    >
                                      <span className="text-xs truncate">
                                        {orderItemIndex + 1}
                                      </span>
                                      <span className="text-xs">
                                        {orderItem.name} (
                                        {MULTIPLICATION_SYMBOL}
                                        {orderItem.quantity})
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        {table.orders[0].orderRequests.filter(
                          (orderRequest) =>
                            orderRequest.status !==
                              OrderRequestStatus.CANCELLED &&
                            orderRequest.status !== OrderRequestStatus.PLACED
                        ).length > 3 && (
                          <div className="text-sm font-bold text-slate-100">
                            ... and more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex w-full mt-1.5">
                  {table.status === TableStatus.OCCUPIED && (
                    <button
                      onClick={() =>
                        handleOpenPayment({
                          modal: "payment",
                          tableType: table.tableType,
                          tableNumber: table.number,
                          orderNumber: table.orders[0].orderNumber,
                        })
                      }
                      className={`w-full px-3 py-0.5 rounded mr-2 bg-blue-500 hover:bg-blue-600`}
                    >
                      <span>
                        <FontAwesomeIcon
                          className="text-white"
                          icon={faMoneyBill1}
                        />
                      </span>
                      <span className="ml-1.5 text-sm">Payment</span>
                    </button>
                  )}
                  <button
                    className={`w-full px-3 py-0.5 rounded ${getStatusToButtonColor(
                      table.status,
                      table.orders[0]?.status
                    )}`}
                  >
                    <span>
                      <FontAwesomeIcon
                        className="text-white"
                        icon={faCircleInfo}
                      />
                    </span>
                    <span className="ml-1.5">
                      {table.status !== TableStatus.OCCUPIED && "Show "}Detail
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </Layout>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const session: Session | null = await getServerSession(
      ctx.req,
      ctx.res,
      authOptions
    );

    if (!session) {
      return {
        redirect: {
          destination: `${AUTH_URL.LOGIN}?${AUTH_QUERY_PARAMS.ERROR}=${AUTH_EXPECTED_ERROR.UNAUTHORIZED}`,
          permanent: false,
        },
      };
    }

    if (!session.restaurantId) {
      return {
        props: {
          initErrMsg:
            "Not Found Restaurant Info. Please register your info or try again later",
        },
      };
    }

    const restaurantTableInfo = convertDatesToISOString(
      await getRestaurantTablesByRestaurantId(session.restaurantId)
    );

    if (!restaurantTableInfo) {
      return {
        props: {
          initErrMsg:
            "Not Found Restaurant Table Info. Please register your info or try again later",
        },
      };
    }

    return {
      props: {
        fallback: {
          [RESTAURANT_TABLE_ENDPOINT.BASE]: restaurantTableInfo,
        },
      },
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

export default function Page({ fallback, initErrMsg }: any) {
  const fallbackData = fallback[RESTAURANT_TABLE_ENDPOINT.BASE];
  return (
    <SWRConfig value={{ fallback }}>
      <Dashboard fallbackData={fallbackData} initErrMsg={initErrMsg} />
    </SWRConfig>
  );
}
