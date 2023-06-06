import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { useToast } from "@/providers/ToastContext";

export default function Tests() {
  const { addToast } = useToast();

  const handlePreserveToast = () => {
    addToast("preserve", "This is a preserve toast!");
  };

  const handleErrorToast = () => {
    addToast("error", "This is an error toast!");
  };

  const handleSuccessToast = () => {
    addToast("success", "This is a success toast!");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="container py-16 mx-auto">
          <button
            onClick={handlePreserveToast}
            className="px-4 py-2 mr-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Show Preserve Toast
          </button>
          <button
            onClick={handleErrorToast}
            className="px-4 py-2 mr-4 text-white bg-red-500 rounded hover:bg-red-600"
          >
            Show Error Toast
          </button>
          <button
            onClick={handleSuccessToast}
            className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
          >
            Show Success Toast
          </button>
        </div>
        <Loader />
      </div>
    </Layout>
  );
}
