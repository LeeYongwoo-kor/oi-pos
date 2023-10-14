import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { useAlert } from "@/hooks/useAlert";
import { useConfirm } from "@/hooks/useConfirm";
import { usePrompt } from "@/hooks/usePrompt";
import { useToast } from "@/hooks/useToast";
import { useWebSocket } from "@/providers/WebSocketContext";
import { useEffect, useState } from "react";

export default function Tests() {
  const [count, setCount] = useState(1);
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();
  const { showPrompt } = usePrompt();
  const socket = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.addEventListener("message", (event) => {
        console.log("Received:", event.data);
      });
    }
  }, [socket]);

  const handlePreserveToast = () => {
    addToast(
      "preserve",
      `This is a preserve toast! This is a preserve toast! count: ${count}`
    );
    setCount((prev) => prev + 1);
  };

  const handleErrorToast = () => {
    addToast(
      "error",
      "This is an error toast! This is an error toast! This is an error toast!"
    );
  };

  const handleSuccessToast = () => {
    addToast("success", "This is a success toast!");
  };

  const handleSuccessBigToast = () => {
    addToast(
      "success",
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eos placeat veniam eligendi libero nihil, quae possimus aspernatur a pariatur ullam repellat ea magni laborum fugit tempore, deserunt sint harum. Necessitatibus?",
      "big"
    );
  };

  const openConfirm = () => {
    showConfirm({
      title: "Hello World!",
      message: "Hello! Confirm!",
      onConfirm: () => alert("confirm"),
    });
  };

  const openAlert = () => {
    showAlert({
      title: "Hello World!",
      message: "Hello! Alert!",
    });
  };

  const openPrompt = () => {
    showPrompt({
      title: "Hello World!",
      message: "Hello! Prompt!",
      onConfirm: (value) => alert(value),
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="container flex justify-start py-16 space-x-4">
          <button
            onClick={handlePreserveToast}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Show Preserve Toast
          </button>
          <button
            onClick={handleErrorToast}
            className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
          >
            Show Error Toast
          </button>
          <button
            onClick={handleSuccessToast}
            className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
          >
            Show Success Toast
          </button>
          <button
            onClick={handleSuccessBigToast}
            className="px-4 py-2 text-white bg-green-700 rounded hover:bg-green-800"
          >
            Show Success Big Toast
          </button>
        </div>
        <div className="container flex justify-start space-x-4">
          <button
            onClick={openConfirm}
            className="px-4 py-2 text-white rounded bg-slate-600 hover:bg-slate-700"
          >
            Open Confirm
          </button>
          <button
            onClick={openAlert}
            className="px-4 py-2 text-white rounded bg-zinc-500 hover:bg-zinc-600"
          >
            Open Alert
          </button>
          <button
            onClick={openPrompt}
            className="px-4 py-2 text-white rounded bg-stone-600 hover:bg-stone-700"
          >
            Open Prompt
          </button>
        </div>
        <Loader />
      </div>
    </Layout>
  );
}
