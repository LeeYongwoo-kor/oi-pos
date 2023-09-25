import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import Menu from "@/components/menu/Menu";
import Modal from "@/components/ui/Modal";
import {
  RESTAURANT_ENDPOINT,
  RESTAURANT_MENU_ENDPOINT,
} from "@/constants/endpoint";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { Method } from "@/constants/fetch";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { AUTH_URL, RESTAURANT_URL } from "@/constants/url";
import {
  IMenuCategory,
  IRestaurant,
  getAllCategoriesByRestaurantId,
  getRestaurant,
} from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/error/ApiError";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { IPostDemoMenuCategoryBody } from "@/pages/api/v1/restaurants/[restaurantId]/demo/menu-categories";
import { menuOpenState, mobileState } from "@/recoil/state/menuState";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import isEmpty from "@/utils/validation/isEmpty";
import { Prisma } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import useSWR, { SWRConfig } from "swr";

type RestaurantMenusProps = {
  restaurantInfo: IRestaurant | undefined;
  initErrMsg: string;
};

function RestaurantsMenus({
  restaurantInfo,
  initErrMsg,
}: RestaurantMenusProps) {
  const [isMenuOpen, setIsMenuOpen] = useRecoilState(menuOpenState);
  const isMobile = useRecoilValue(mobileState);
  const {
    data: categoriesData,
    error: categoriesError,
    isValidating,
  } = useSWR<IMenuCategory[]>(
    restaurantInfo?.id
      ? RESTAURANT_MENU_ENDPOINT.MENU_CATEGORY(restaurantInfo.id)
      : null
  );
  const [createDemoMenuItems, { error: createDemoMenuItemsErr }] = useMutation<
    Prisma.BatchPayload,
    IPostDemoMenuCategoryBody
  >(
    restaurantInfo?.id
      ? RESTAURANT_ENDPOINT.DEMO_MENU_CATEGORY(restaurantInfo.id)
      : null,
    Method.POST
  );
  const { addToast } = useToast();
  const router = useRouter();
  const withLoading = useLoading();
  const widthSize = isMobile ? 36 : 56;

  const handleOpenMenu = async () => {
    if (restaurantInfo?.id) {
      if (isEmpty(categoriesData)) {
        const result = await createDemoMenuItems({
          restaurantId: restaurantInfo.id,
        });
        if (result) {
          addToast(
            "success",
            "Demo menu items created successfully! Let's edit menus now🍕"
          );
        }
        setIsMenuOpen(true);
      } else {
        setIsMenuOpen(true);
      }
    }
  };

  const handlePrevious = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    router.push(RESTAURANT_URL.SETUP.TABLES);
  };

  const handleNext = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    router.push(RESTAURANT_URL.SETUP.COMPLETE);
  };

  useEffect(() => {
    if (initErrMsg) {
      addToast("error", initErrMsg);
    }
  }, [initErrMsg]);

  useEffect(() => {
    if (categoriesError) {
      addToast("error", categoriesError.message);
    }
  }, [categoriesError]);

  useEffect(() => {
    if (createDemoMenuItemsErr) {
      addToast("error", createDemoMenuItemsErr.message);
    }
  }, [createDemoMenuItemsErr]);

  return (
    <Layout>
      <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Menus" />
      {isValidating ? (
        <LoadingOverlay />
      ) : (
        <div className="flex flex-col items-center justify-center h-[47rem]">
          <div className="relative h-96 w-144">
            <Image
              src="/images/platter.jpg"
              alt="Platter"
              fill
              className={`object-cover w-full rounded-lg ${
                isEmpty(categoriesData) ? "grayscale opacity-80" : ""
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  await withLoading(handleOpenMenu);
                }}
                className="h-12 px-4 py-2 font-semibold text-black transition duration-150 rounded-full bg-slate-200 hover:bg-green-400"
              >
                {`${
                  isEmpty(categoriesData)
                    ? "Create And Edit Menus"
                    : "Edit Menus"
                }`}
              </button>
            </div>
          </div>
          <div className="mt-8">
            <button
              type="button"
              className="w-20 p-2 mr-4 text-white rounded bg-sky-600 hover:bg-sky-700"
              onClick={handlePrevious}
            >
              Previous
            </button>
            <button
              className={`w-20 p-2 text-white bg-green-600 rounded ${
                isEmpty(categoriesData)
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-green-700"
              }`}
              type="button"
              disabled={isEmpty(categoriesData)}
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {isMenuOpen && (
        <Modal width={widthSize}>
          <Menu restaurantInfo={restaurantInfo} role={"owner"} />
        </Modal>
      )}
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

    const restaurantInfo = convertDatesToISOString(
      await getRestaurant(session.id)
    );

    if (!restaurantInfo) {
      return {
        redirect: {
          destination: RESTAURANT_URL.SETUP.INFO,
          permanent: false,
        },
      };
    }

    const categoryInfo = convertDatesToISOString(
      await getAllCategoriesByRestaurantId(restaurantInfo.id)
    );

    return {
      props: {
        fallback: {
          [RESTAURANT_MENU_ENDPOINT.MENU_CATEGORY(restaurantInfo.id)]:
            categoryInfo,
        },
        restaurantInfo: restaurantInfo ?? null,
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

export default function Page({ fallback, restaurantInfo, initErrMsg }: any) {
  return (
    <SWRConfig value={{ fallback }}>
      <RestaurantsMenus
        restaurantInfo={restaurantInfo}
        initErrMsg={initErrMsg}
      />
    </SWRConfig>
  );
}
