import Loader from "./Loader";

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex items-center justify-center p-6 bg-white rounded">
        <Loader />
      </div>
    </div>
  );
}
