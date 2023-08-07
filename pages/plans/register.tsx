import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { PLAN_ENDPOINT, SUBSCRIPTION_ENDPOINT } from "@/constants/endpoint";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { PLAN_ID } from "@/constants/plan";
import { AUTH_URL, RESTAURANT_URL } from "@/constants/url";
import { getAllPlans, getSubscription } from "@/database";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { Plan, Subscription } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import useSWR, { SWRConfig } from "swr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Method } from "@/constants/fetch";

const Checkout = dynamic(() => import("@/components/Checkout"), {
  loading: () => <Loader />,
  ssr: false,
});

const PlanRegister = () => {
  // TODO: Remove this condition after testing
  const [isClientRender, setIsClientRender] = useState(false);
  useEffect(() => {
    setIsClientRender(true);
  }, []);

  const { data: subscription } = useSWR<Subscription>(
    SUBSCRIPTION_ENDPOINT.BASE
  );
  const {
    data: plans,
    isLoading: isLoadingPlans,
    isValidating: isValidatingPlans,
  } = useSWR<Plan[]>(PLAN_ENDPOINT.BASE);

  // The following condition will be true only in the initial render after SSR
  // TODO: Remove this condition after testing
  if (!isClientRender && plans) {
    console.log("Plans data is from SSR", plans);
  }

  // The following condition will be true in subsequent renders after SSR
  // TODO: Remove this condition after testing
  if (isClientRender && plans) {
    console.log("Plans data is from useSWR", plans);
  }

  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const [createSubscription, { error: createSubscriptionErr }] = useMutation<
    Subscription,
    { planId: "10001" }
  >(SUBSCRIPTION_ENDPOINT.BASE, Method.POST);
  const router = useRouter();

  const [isModalOpen, setModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | Record<string, never>>(
    {}
  );

  useEffect(() => {
    if (createSubscriptionErr) {
      addToast("error", createSubscriptionErr.message);
    }
  }, [createSubscriptionErr]);

  const openCheckoutModal = (planId: PlanType) => {
    const selectPlan = plans?.find((plan: Plan) => plan.id === planId);
    if (!selectPlan) {
      // alert("Failed to load plan. Please try again later.");
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
    // showToastMessage("success", "You have successfully registered!");
    addToast("success", "You have successfully registered!");
  };

  const handleTrialRegistration = () => {
    showConfirm({
      title: "トライアル版の登録",
      message: "トライアル版を登録します。よろしいでしょうか？",
      onConfirm: handleConfirm,
    });
  };

  return (
    <Layout>
      {!plans && (isValidatingPlans || isLoadingPlans) ? (
        <Loader />
      ) : (
        <div className="container px-4 py-12 mx-auto">
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
          <h1 className="mb-12 text-4xl font-bold text-center">
            Choose Your Plan
          </h1>
          <div className="grid grid-cols-1 gap-4 min-h-[24rem] sm:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan: Plan) => {
              return (
                <div
                  key={plan.id}
                  className="flex flex-col p-6 bg-white rounded shadow-lg"
                >
                  <h2 className="mb-1 text-2xl font-bold text-center text-green-700">
                    {plan.name}
                  </h2>
                  <h3 className="mb-4 text-center text-gray-500">
                    {plan.description}
                  </h3>
                  <ul className="pl-6 mb-6 list-disc">
                    <li>Limited to {plan.maxMenus} menus</li>
                    <li>Up to {plan.maxTables} registered tables</li>
                    {plan.id === PLAN_ID.TRIAL_PLAN && (
                      <li>Basic menu design template</li>
                    )}
                    {plan.id !== PLAN_ID.TRIAL_PLAN && (
                      <>
                        <li>Various menu design templates</li>
                        <li>Real-time chat with customers</li>
                        <li>AI image generation</li>
                      </>
                    )}
                  </ul>
                  <button
                    className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-800"
                    onClick={(e) => {
                      e.preventDefault();
                      openCheckoutModal(plan.id as PlanType);
                    }}
                  >
                    Choose this option
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
};

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

    const [plans, subscription] = await Promise.all([
      getAllPlans(),
      getSubscription(session.id),
    ]);

    return {
      props: {
        fallback: {
          [PLAN_ENDPOINT.BASE]: plans,
          [SUBSCRIPTION_ENDPOINT.BASE]: subscription,
        },
      },
    };
  } catch (err) {
    //TODO: send error to Sentry
    console.error(err);
    return {
      props: {
        fallback: { error: err },
      },
    };
  }
}

export default function Page({ fallback }: any) {
  return (
    <SWRConfig value={{ fallback }}>
      <PlanRegister />
    </SWRConfig>
  );
}
