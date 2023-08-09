import LoadingOverlay from "@/components/LoadingOverlay";
import {
  ACCESS_QR_CODE_ERROR,
  COMMON_ERROR,
} from "@/constants/errorMessage/client";
import { RESTAURANT_URL } from "@/constants/url";
import {
  activateOrder,
  getActiveOrderByTableId,
  getRestaurantTableByQrCodeId,
} from "@/database";
import {
  ApiError,
  ForbiddenError,
  NotFoundError,
  UnexpectedError,
} from "@/lib/shared/error/ApiError";
import { TableStatus } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type QrCodeAccessProps = {
  initErrMsg: string;
};

export default function QrCodeAccess({ initErrMsg }: QrCodeAccessProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleRetry = () => {
    router.reload();
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    initErrMsg && (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-3/4 p-8 bg-white rounded-lg shadow-lg md:w-1/2 lg:w-1/3">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Error</h2>
          <p className="text-gray-600">{initErrMsg}</p>
          <div className="flex items-center mt-6">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-2 text-white transition duration-200 bg-blue-600 rounded-full hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const qrCodeId = ctx.params?.qrCodeId;
    if (!qrCodeId || typeof qrCodeId !== "string") {
      throw new NotFoundError(ACCESS_QR_CODE_ERROR.INVALID_QR_CODE);
    }

    const decodedQrCodeId = Buffer.from(qrCodeId, "base64").toString("utf-8");
    const restaurantTable = await getRestaurantTableByQrCodeId(decodedQrCodeId);
    if (!restaurantTable) {
      throw new NotFoundError(ACCESS_QR_CODE_ERROR.INVALID_QR_CODE);
    }

    if (restaurantTable.status === TableStatus.UNAVAILABLE) {
      throw new ForbiddenError(ACCESS_QR_CODE_ERROR.UNAVAILABLE_TABLE);
    }

    const order = await getActiveOrderByTableId(restaurantTable.id);
    if (!order) {
      if (restaurantTable.status !== TableStatus.AVAILABLE) {
        throw new UnexpectedError(COMMON_ERROR.SYSTEM_BUSY);
      }

      const activatedOrder = await activateOrder(restaurantTable.id);
      const encodedOrderId = Buffer.from(activatedOrder.id).toString("base64");
      return {
        redirect: {
          destination: `${RESTAURANT_URL.ORDER}/${encodedOrderId}`,
          permanent: true,
        },
      };
    }

    const encodedOrderId = Buffer.from(order.id).toString("base64");
    return {
      redirect: {
        destination: `${RESTAURANT_URL.ORDER}/${encodedOrderId}`,
        permanent: true,
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
