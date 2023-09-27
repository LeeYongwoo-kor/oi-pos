import { qrCodeOpenState } from "@/recoil/state/dashboardState";
import QRCode from "qrcode.react";
import { useRef } from "react";
import { useSetRecoilState } from "recoil";
import Loader from "../Loader";

type QRCodeProps = {
  qrCodeId: string;
};

export default function QRCodeGenerate({ qrCodeId }: QRCodeProps) {
  const setOpenQrCode = useSetRecoilState(qrCodeOpenState);
  const encodedAddress = Buffer.from(qrCodeId).toString("base64");
  const fullAddress = `${process.env.NEXT_PUBLIC_BASE_URL}/access/${encodedAddress}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopyClick = () => {
    if (inputRef.current) {
      inputRef.current.select();
      document.execCommand("copy");
    }
  };

  return (
    <>
      {!qrCodeId || !encodedAddress ? (
        <Loader />
      ) : (
        <div className="flex flex-col items-center h-full px-8 space-y-8 justify-evenly font-archivo">
          <div className="p-4 bg-white rounded-lg shadow-lg">
            <QRCode value={fullAddress} size={360} />
          </div>
          <div className="w-full">
            <label
              htmlFor="address"
              className="block text-lg font-medium text-gray-700"
            >
              Address
            </label>
            <div className="flex items-center justify-center">
              <input
                ref={inputRef}
                className="flex-grow p-2 mt-1 border rounded-md"
                type="text"
                value={fullAddress}
                readOnly
              />
              <button
                onClick={handleCopyClick}
                className="px-4 py-1.5 ml-2 text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end w-full mt-4">
              <button
                onClick={() => setOpenQrCode(false)}
                className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
