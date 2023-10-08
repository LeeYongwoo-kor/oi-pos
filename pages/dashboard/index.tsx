import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import Menu from "@/components/menu/Menu";
import OrderPayment from "@/components/order/OrderPayment";
import QRCodeGenerate from "@/components/order/QRCodeGenerate";
import TableHistory from "@/components/order/TableHistory";
import Modal from "@/components/ui/Modal";
import { ME_ENDPOINT } from "@/constants/endpoint";
import { MULTIPLICATION_SYMBOL } from "@/constants/unicode";
import { DASHBOARD_URL } from "@/constants/url";
import {
  IRestaurant,
  IRestaurantTableForDashboard,
  getRestaurant,
  getRestaurantTablesByRestaurantId,
} from "@/database";
import { useToast } from "@/hooks/useToast";
import withSSRHandler, { InitialMessage } from "@/lib/server/withSSRHandler";
import {
  showAlarmState,
  sortRequestedOrderState,
  tableNumberState,
  tableTypeState,
} from "@/recoil/state/alarmState";
import { qrCodeOpenState } from "@/recoil/state/dashboardState";
import { menuOpenState, mobileState } from "@/recoil/state/menuState";
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
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";

type DashboardProps = {
  restaurantInfo: IRestaurant | undefined;
  initMsg: InitialMessage | undefined | null;
};

type PageProps = DashboardProps & {
  fallback: any;
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
    return "PAYMENT_REQ";
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

function Dashboard({ restaurantInfo, initMsg }: DashboardProps) {
  const [isOpenQrCode, setOpenQrCode] = useRecoilState(qrCodeOpenState);
  const isMobile = useRecoilValue(mobileState);
  const isMenuOpen = useRecoilValue(menuOpenState);
  const openAlarm = useSetRecoilState(showAlarmState);
  const setOrderRequestSort = useSetRecoilState(sortRequestedOrderState);
  const setAlarmTableType = useSetRecoilState(tableTypeState);
  const setAlarmTableNumber = useSetRecoilState(tableNumberState);
  const { data, error, isLoading } = useSWR<IRestaurantTableForDashboard[]>(
    ME_ENDPOINT.TABLE
  );
  const [currentQrCodeId, setCurrentQrCodeId] = useState("");
  const { addToast } = useToast();
  const router = useRouter();
  const widthSize = isMobile ? 36 : 56;
  const { modal, tableType, tableNumber, orderNumber } = router.query;

  const handleOpenTableHistory = async (newQuery: {
    modal: ModalAction;
    tableType: string;
    tableNumber: number;
  }) => {
    const { modal, tableType, tableNumber } = newQuery;
    if (!modal || !tableType || !tableNumber) {
      return;
    }

    await router.push({
      pathname: DASHBOARD_URL.BASE,
      query: {
        ...router.query,
        modal,
        tableType,
        tableNumber: String(tableNumber),
      },
    }),
      undefined,
      { shallow: true };
  };

  const handleOpenPayment = async (newQuery: {
    modal: ModalAction;
    tableType: string;
    tableNumber: number;
    orderNumber: number;
  }) => {
    const { modal, tableType, tableNumber, orderNumber } = newQuery;
    if (!modal || !tableType || !tableNumber || !orderNumber) {
      return;
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
    if (initMsg && !isEmpty(initMsg)) {
      addToast(initMsg.type, initMsg.message);
    }
  }, [initMsg?.message, initMsg?.type]);

  useEffect(() => {
    if (error) {
      addToast("error", error.message);
    }
  }, [error]);

  return (
    <Layout>
      {isLoading && <LoadingOverlay />}
      {isMenuOpen && (
        <Modal width={widthSize}>
          <Menu restaurantInfo={restaurantInfo} role={"owner"} />
        </Modal>
      )}
      {isOpenQrCode && (
        <Modal width={40} height={40}>
          <QRCodeGenerate qrCodeId={currentQrCodeId} />
        </Modal>
      )}
      {modal === "detail" &&
        tableNumber &&
        tableType &&
        typeof tableNumber === "string" &&
        typeof tableType === "string" && (
          <Modal width={72} height={40}>
            <TableHistory tableType={tableType} tableNumber={tableNumber} />
          </Modal>
        )}
      {modal === "payment" &&
        tableNumber &&
        tableType &&
        orderNumber &&
        typeof tableNumber === "string" &&
        typeof tableType === "string" &&
        typeof orderNumber === "string" && (
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
                        {table.status === TableStatus.RESERVED ? (
                          <p className="flex flex-col items-center justify-center mt-8 text-lg">
                            <span className="mr-1">Name: </span>
                            <span className="text-2xl font-bold text-yellow-300">
                              {table.orders[0].customerName}
                            </span>
                          </p>
                        ) : (
                          <>
                            <p className="font-medium text-yellow-300">
                              [ Recently Order ]
                            </p>
                            {table.orders[0].orderRequests
                              .filter(
                                (orderRequest) =>
                                  orderRequest.status !==
                                    OrderRequestStatus.CANCELLED &&
                                  orderRequest.status !==
                                    OrderRequestStatus.PLACED
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
                                orderRequest.status !==
                                  OrderRequestStatus.PLACED
                            ).length > 3 && (
                              <div className="text-sm font-bold text-slate-100">
                                ... and more
                              </div>
                            )}
                          </>
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
                    onClick={() =>
                      handleOpenTableHistory({
                        modal: "detail",
                        tableType: table.tableType,
                        tableNumber: table.number,
                      })
                    }
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
  return await withSSRHandler(ctx, {
    fetchers: {
      [ME_ENDPOINT.TABLE]: async (session) => {
        return convertDatesToISOString(
          await getRestaurantTablesByRestaurantId(session?.restaurantId)
        );
      },
    },
    callback: async (session) => {
      const restaurantInfo = convertDatesToISOString(
        await getRestaurant(session?.id)
      );
      return { restaurantInfo };
    },
  });
}

export default function Page({ fallback, restaurantInfo, initMsg }: PageProps) {
  return (
    <SWRConfig value={{ fallback }}>
      <Dashboard restaurantInfo={restaurantInfo} initMsg={initMsg} />
    </SWRConfig>
  );
}
