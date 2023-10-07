import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import LoadingOverlay from "@/components/LoadingOverlay";
import PlanDetail from "@/components/plan/PlanDetail";
import { OWNER_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { PLAN_ID } from "@/constants/plan";
import { RESTAURANT_URL } from "@/constants/url";
import { getAllPlans, getSubscription } from "@/database";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import withSSRHandler, { InitialMessage } from "@/lib/server/withSSRHandler";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import getPreferredLanguage from "@/utils/getPreferredLanguage";
import isEmpty from "@/utils/validation/isEmpty";
import { Plan, Subscription, SubscriptionStatus } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import useSWR, { SWRConfig } from "swr";

type PlanRegisterProps = {
  locale: Locale;
  initMsg: InitialMessage | undefined | null;
};

type PageProps = PlanRegisterProps & {
  fallback: any;
};

const Checkout = dynamic(() => import("@/components/Checkout"), {
  loading: () => <Loader />,
  ssr: false,
});

function PlanRegister({ locale, initMsg }: PlanRegisterProps) {
  const { data: subscription, error: subscriptionErr } = useSWR<Subscription>(
    isEmpty(initMsg) ? OWNER_ENDPOINT.SUBSCRIPTION : null
  );
  const {
    data: plans,
    isLoading: isLoadingPlans,
    isValidating: isValidatingPlans,
  } = useSWR<Plan[]>(OWNER_ENDPOINT.PLAN.BASE);

  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const [createSubscription, { error: createSubscriptionErr }] = useMutation<
    Subscription,
    { planId: "10001" }
  >(OWNER_ENDPOINT.SUBSCRIPTION, Method.POST);
  const router = useRouter();

  const [isModalOpen, setModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | Record<string, never>>(
    {}
  );

  const openCheckoutModal = (planId: PlanType) => {
    const selectPlan = plans?.find((plan: Plan) => plan.id === planId);
    if (!selectPlan) {
      addToast("error", "Failed to load plans. Please try again later.");
      return;
    }
    if (selectPlan.id === PLAN_ID.TRIAL_PLAN) {
      handleTrialRegistration();
      return;
    }
    setCurrentPlan(selectPlan);
    setModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setModalOpen(false);
    router.reload();
  };

  const handleConfirm = async () => {
    if (subscription) {
      await router.replace(RESTAURANT_URL.SETUP.INFO);
      addToast("info", "You already have a subscription");
      return;
    }

    const resultData = await createSubscription({ planId: PLAN_ID.TRIAL_PLAN });
    if (!resultData) {
      return;
    }

    await router.replace(RESTAURANT_URL.SETUP.INFO);
    addToast("success", "You have successfully registered!");
  };

  const handleTrialRegistration = async () => {
    showConfirm({
      title: "トライアル版の登録",
      message: "トライアル版を登録します。よろしいでしょうか？",
      confirmText: "登録する",
      cancelText: "キャンセル",
      onConfirm: handleConfirm,
    });
  };

  useEffect(() => {
    if (subscription?.planId) {
      if (subscription.planId === PLAN_ID.YEARLY_PLAN) {
        addToast("info", "You're already subscribed to a one-year plan!");
      }
    }
    if (subscription?.status) {
      if (subscription.planId === PLAN_ID.TRIAL_PLAN) {
        if (subscription.status === SubscriptionStatus.EXPIRED) {
          addToast(
            "preserve",
            "Your trial plan has expired.. Please subscribe to a plan"
          );
        }
      }
    }
  }, [subscription?.planId, subscription?.status]);

  useEffect(() => {
    if (subscriptionErr) {
      addToast("error", subscriptionErr.message);
    }
  }, [subscriptionErr]);

  useEffect(() => {
    if (createSubscriptionErr) {
      addToast("error", createSubscriptionErr.message);
    }
  }, [createSubscriptionErr]);

  useEffect(() => {
    if (initMsg && !isEmpty(initMsg)) {
      addToast(initMsg.type, initMsg.message);
    }
  }, [initMsg?.message, initMsg?.type]);

  return (
    <Layout>
      {!plans ||
        isEmpty(plans) ||
        isValidatingPlans ||
        (isLoadingPlans && <LoadingOverlay />)}
      <div className="container flex px-4 py-12 mx-auto h-5/6">
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeCheckoutModal}
          contentLabel="Checkout Modal"
          className="ReactModal__Content"
          overlayClassName="ReactModal__Overlay"
        >
          <div className="max-w-2xl p-6 mx-auto overflow-y-auto bg-white rounded-lg shadow-md max-h-160 w-160 dark:bg-gray-800">
            <Checkout plan={currentPlan} />
            <button
              onClick={closeCheckoutModal}
              className="w-full px-4 py-2 mt-4 font-bold text-white transition duration-150 ease-in-out bg-red-500 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </Modal>
        <div className="flex flex-col items-center justify-center w-full">
          <h1 className="mb-12 text-4xl font-bold text-center text-sky-900">
            Choose Your Plan
          </h1>
          {plans && !isEmpty(plans) && (
            <PlanDetail
              plans={plans}
              subscription={subscription}
              locale={locale}
              openCheckoutModal={openCheckoutModal}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withSSRHandler(ctx, {
    fetchers: {
      [OWNER_ENDPOINT.PLAN.BASE]: async () => getAllPlans(),
      [OWNER_ENDPOINT.SUBSCRIPTION]: async (session) =>
        convertDatesToISOString(await getSubscription(session?.id)),
    },
    callback: async () => {
      const acceptLanguage = ctx.req.headers["accept-language"];
      const locale = getPreferredLanguage(acceptLanguage);
      return { locale };
    },
  });
}

export default function Page({ fallback, locale, initMsg }: PageProps) {
  return (
    <SWRConfig value={{ fallback }}>
      <PlanRegister locale={locale} initMsg={initMsg} />
    </SWRConfig>
  );
}
