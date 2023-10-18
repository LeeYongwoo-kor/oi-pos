import {
  ACCESS_QR_CODE_ERROR,
  COMMON_ERROR,
} from "@/constants/errorMessage/client";
import { RESTAURANT_URL } from "@/constants/url";
import {
  IRestaurantTableForAccess,
  createAndActivateOrder,
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
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type QrCodeAccessProps = {
  initErrMsg: string;
};

/**
 * QrCodeAccessPage Component
 *
 * @prop initErrMsg エラーメッセージ
 * @returns エラーメッセージが存在する場合、エラー画面を表示
 *
 * @description
 * エラーメッセージが存在する場合、エラー画面を表示する。
 * それ以外の場合は、テーブル情報と基にオーダー情報を確認し、オーダーページにリダイレクトを行う。
 */
export default function QrCodeAccess({ initErrMsg }: QrCodeAccessProps) {
  const router = useRouter();

  const handleRetry = () => {
    // ページを再読み込みする
    router.reload();
  };

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
    // QRコードで有効なテーブル情報を取得できない場合
    if (!restaurantTable) {
      throw new NotFoundError(ACCESS_QR_CODE_ERROR.INVALID_QR_CODE);
    }

    // テーブルが利用不可の場合
    if (restaurantTable.status === TableStatus.UNAVAILABLE) {
      throw new ForbiddenError(ACCESS_QR_CODE_ERROR.UNAVAILABLE_TABLE);
    }

    const order = await getActiveOrderByTableId(restaurantTable.id);
    // 有効なオーダー情報が存在しない場合
    if (!order) {
      // テーブルが利用可能ではない場合
      if (restaurantTable.status !== TableStatus.AVAILABLE) {
        throw new UnexpectedError(COMMON_ERROR.SYSTEM_BUSY);
      }

      // 営業時間・休日のチェック
      const errorMessage = checkBusinessHoursAndHolidays(restaurantTable);
      if (errorMessage) {
        throw new ForbiddenError(errorMessage);
      }

      // 新規オーダー情報を作成する
      const activatedOrder = await createAndActivateOrder(restaurantTable.id);
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

/**
 * 休日・営業時間をチェックする
 *
 * @param restaurantTable テーブル情報
 * @returns エラーメッセージ
 *
 * @description 休日・営業時間をチェックする、休日か営業時間外の場合、エラーメッセージを返す
 */
const checkBusinessHoursAndHolidays = (
  restaurantTable: IRestaurantTableForAccess
): string | null => {
  const now = dayjs(); // 現在時刻
  const currentDay = now.format("dddd"); // 現在の曜日
  const currentDate = dayjs().format("YYYY-MM-DD"); // 現在の日付
  const startTime = dayjs(
    `${currentDate}T${restaurantTable.restaurant.startTime}:00`
  ); // 営業開始時間
  const lastOrder = dayjs(
    `${currentDate}T${restaurantTable.restaurant.lastOrder}:00`
  ); // ラストオーダー
  const holidays = restaurantTable?.restaurant?.holidays; // 休日

  // ラストオーダーが当日の場合
  if (startTime.isSameOrBefore(lastOrder)) {
    // 当日が休日の場合
    if (Array.isArray(holidays) && holidays.includes(currentDay)) {
      return ACCESS_QR_CODE_ERROR.TODAY_IS_NOT_OPENING_DAY;
    }

    // 営業時間外の場合
    if (now.isAfter(lastOrder)) {
      return ACCESS_QR_CODE_ERROR.OUT_OF_BUSINESS_HOURS;
    }
  } else {
    // ラストオーダーが翌日にまたがる場合
    const previousDay = now.subtract(1, "day").format("dddd"); // 前日の曜日
    // 前日が休日の場合
    if (Array.isArray(holidays) && holidays.includes(previousDay)) {
      return ACCESS_QR_CODE_ERROR.TODAY_IS_NOT_OPENING_DAY;
    }

    // 営業時間外の場合
    if (now.isAfter(lastOrder.add(1, "day"))) {
      return ACCESS_QR_CODE_ERROR.OUT_OF_BUSINESS_HOURS;
    }
  }

  return null;
};
