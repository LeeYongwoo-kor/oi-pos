import Layout from "@/components/Layout";
import { StatusBar } from "@/components/StatusBar";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { RESTAURANT_URL } from "@/constants/url";
import { useRouter } from "next/router";

export default function SetupComplete() {
  const router = useRouter();

  const handlePrevious = () => {
    router.push(RESTAURANT_URL.SETUP.MENUS);
  };
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
              <button className="px-8 py-2 text-lg font-semibold text-white bg-green-600 rounded-full hover:bg-green-600">
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
