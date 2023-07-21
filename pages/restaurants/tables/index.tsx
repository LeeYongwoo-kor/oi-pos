import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import { useForm } from "react-hook-form";

export default function RestaurantsTables() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      tableNumber: 1,
      counterNumber: 0,
    },
  });

  const tableNumber = watch("tableNumber");
  const counterNumber = watch("counterNumber");

  const handlePrevious = () => {};
  const handleNext = () => {};

  const isValid =
    (Number(tableNumber) > 0 || Number(counterNumber) > 0) &&
    tableNumber !== undefined &&
    counterNumber !== undefined;

  return (
    <Layout>
      <StatusBar
        steps={["Info", "Hours", "Tables", "Menus", "Complete"]}
        currentStep="Tables"
      />
      {isSubmitting && <LoadingOverlay />}
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-4 text-2xl font-semibold">
          Enter the number of tables and counters
        </h1>
        <p className="mb-6">
          This page helps you enter the number of tables and counters at your
          restaurant.
        </p>
        <form>
          <div className="mb-4">
            <label className="block mb-2">Number of Tables (1-200)</label>
            <input
              className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
              type="number"
              min={0}
              max={200}
              {...register("tableNumber", {
                pattern: {
                  value: /^[1-9][0-9]{0,2}$/,
                  message:
                    "Number of tables must be a number between 1 and 200",
                },
              })}
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                if (input.value.length > 3) {
                  input.value = input.value.slice(0, 3);
                }
                if (Number(input.value) > 200) {
                  setValue("tableNumber", 200);
                }
              }}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Number of Counters (1-100)</label>
            <input
              className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
              type="number"
              min={0}
              max={100}
              maxLength={3}
              {...register("counterNumber", {
                pattern: {
                  value: /^[1-9][0-9]{0,2}$/,
                  message:
                    "Number of counters must be a number between 1 and 100",
                },
              })}
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                if (input.value.length > 3) {
                  input.value = input.value.slice(0, 3);
                }
                if (Number(input.value) > 100) {
                  setValue("counterNumber", 100);
                }
              }}
            />
          </div>
          {!isValid && (
            <div className="mb-3">
              <p className="text-red-600">
                At least one of table or counter number must be greater than
                zero
              </p>
            </div>
          )}
          <button
            type="button"
            className="p-2 mr-4 text-white rounded bg-sky-600 hover:bg-sky-700"
            onClick={handleSubmit(handlePrevious)}
          >
            Previous
          </button>
          <button
            className={`p-2 text-white bg-green-600 rounded ${
              isValid && !isSubmitting
                ? "hover:bg-green-700"
                : "opacity-60 cursor-not-allowed"
            }`}
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit(handleNext)}
          >
            Next
          </button>
        </form>
      </div>
    </Layout>
  );
}
