import Layout from "@/components/Layout";
import { StatusBar } from "@/components/StatusBar";
import { OWNER_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { DASHBOARD_URL, RESTAURANT_URL } from "@/constants/url";
import useLoading from "@/hooks/context/useLoading";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import withSSRHandler, { InitialMessage } from "@/lib/server/withSSRHandler";
import { IPatchUserBody } from "@/pages/api/v1/owner/users";
import { allInfoRegisteredState } from "@/recoil/state/infoState";
import isEmpty from "@/utils/validation/isEmpty";
import { UserStatus } from "@prisma/client";
import { User } from "@sentry/nextjs";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";

type SetupCompleteProps = {
  initMsg: InitialMessage | undefined | null;
};

export default function SetupComplete({ initMsg }: SetupCompleteProps) {
  const [
    updateUserStatus,
    { error: updateUserStatusErr, loading: updateUserStatusLoading },
  ] = useMutation<User, IPatchUserBody>(OWNER_ENDPOINT.USER, Method.PATCH);
  const setIsAllInfoRegistered = useSetRecoilState(allInfoRegisteredState);
  const router = useRouter();
  const { addToast } = useToast();
  const withLoading = useLoading();

  const handlePrevious = () => {
    router.push(RESTAURANT_URL.SETUP.MENUS);
  };

  const handleStart = async () => {
    if (updateUserStatusLoading) {
      return;
    }

    const result = await updateUserStatus({ status: UserStatus.ACTIVE });
    if (result) {
      setIsAllInfoRegistered(true);
      await router.push(DASHBOARD_URL.BASE);
      addToast(
        "success",
        "Your restaurant is ready to go!🎉 Please enjoy Yoshi!"
      );
    }
  };

  useEffect(() => {
    if (initMsg && !isEmpty(initMsg)) {
      addToast(initMsg.type, initMsg.message);
    }
  }, [initMsg?.message, initMsg?.type]);

  useEffect(() => {
    if (updateUserStatusErr) {
      addToast("error", updateUserStatusErr.message);
    }
  }, [updateUserStatusErr]);

  return (
    <Layout>
      <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Complete" />
      <div className="flex flex-col items-center justify-center h-[46rem] bg-gray-100">
        <div className="p-8 bg-white border rounded-lg shadow-lg">
          <div className="flex flex-col items-center">
            <div className="mb-4 text-2xl font-semibold">
              Your Service is Ready!
            </div>
            <div className="mt-4 mb-8 text-lg">
              All information is entered and you&apos;re good to go.
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevious}
                className="px-8 py-2 text-white rounded-full bg-sky-500 hover:bg-sky-600"
              >
                Previous
              </button>
              <button
                onClick={() => withLoading(() => handleStart())}
                className="px-8 py-2 text-lg font-semibold text-white bg-green-600 rounded-full hover:bg-green-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withSSRHandler(ctx);
}
