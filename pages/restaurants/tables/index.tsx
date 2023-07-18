import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import isEmpty from "@/utils/validation/isEmpty";
import { useForm } from "react-hook-form";

export default function RestaurantsTables() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const handlePrevious = () => {};
  const handleNext = () => {};

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
            <label className="block mb-2">Number of Tables</label>
            <input
              className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
              type="number"
              min={0}
              max={200}
              maxLength={3}
              {...register("tableNumber", {
                validate: (value) =>
                  value > 0 || "Number of tables must be greater than zero",
              })}
              onInput={(e) => {
                if (e.target.value.length > 3) {
                  e.target.value = e.target.value.slice(0, 3);
                }
              }}
            />
            {errors.tableNumber && (
              <p className="text-red-600">{errors.tableNumber.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2">Number of Counters</label>
            <input
              className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
              type="number"
              min={0}
              max={200}
              maxLength={3}
              {...register("counterNumber", {
                validate: (value) =>
                  value > 0 || "Number of counters must be greater than zero",
              })}
              onInput={(e) => {
                if (e.target.value.length > 3) {
                  e.target.value = e.target.value.slice(0, 3);
                }
              }}
            />
            {errors.counterNumber && (
              <p className="text-red-600">{errors.counterNumber.message}</p>
            )}
          </div>

          <button
            type="button"
            className="p-2 mr-4 text-white rounded bg-sky-600 hover:bg-sky-700"
            onClick={handleSubmit(handlePrevious)}
          >
            Previous
          </button>
          <button
            className={`p-2 text-white bg-green-600 rounded ${
              isEmpty(errors) && !isSubmitting
                ? "hover:bg-green-700"
                : "opacity-60 cursor-not-allowed"
            }`}
            type="button"
            disabled={!isEmpty(errors) || isSubmitting}
            onClick={handleSubmit(handleNext)}
          >
            Next
          </button>
        </form>
      </div>
    </Layout>
  );
}
