export default function VerifyRequest() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="mb-4 text-2xl font-semibold text-center">
          Email Verification
        </h1>
        <p className="text-center text-gray-700">
          Please check your email to verify your account.
        </p>
      </div>
    </div>
  );
}
