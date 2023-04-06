import Modal from "react-modal";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/router";

const Checkout = dynamic(() => import("@/components/checkout"), { ssr: false });

export default function Plan() {
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    router.reload();
  };

  return (
    <div className="container px-4 py-12 mx-auto">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Checkout Modal"
        // Add additional modal configuration if needed
      >
        <Checkout />
        <button onClick={closeModal}>Close</button>
      </Modal>
      <h1 className="mb-6 text-4xl font-bold text-center">Choose Your Plan</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/** Section 1: 90-Day Free Tria */}
        <div className="p-6 bg-white rounded shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-center">
            90-Day Free Trial
          </h2>
          <ul className="pl-6 mb-6 list-disc">
            <li>Limited to 30 menus</li>
            <li>Up to 10 registered tables</li>
            <li>Basic menu design template</li>
          </ul>
          <Link
            href="/checkout"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-800"
            onClick={(e) => {
              e.preventDefault();
              openModal();
            }}
          >
            Choose this option
          </Link>
        </div>
        {/** Section 2: Monthly Paid */}
        <div className="p-6 bg-white rounded shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-center">
            Monthly Paid - $4.99 (excl. VAT)
          </h2>
          <ul className="pl-6 mb-6 list-disc">
            <li>Limited to 500 menus</li>
            <li>No limit on registered tables</li>
            <li>Various menu design templates</li>
            <li>Real-time chat with customers</li>
          </ul>
          <button className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-800">
            Choose this option
          </button>
        </div>
        {/** Section 3: 1 Year Paid */}
        <div className="p-6 bg-white rounded shadow-lg">
          <div className="flex justify-between">
            <h2 className="mb-4 text-2xl font-bold text-center">1 Year Paid</h2>
            <span className="inline-block px-2 py-1 text-sm text-white bg-red-600 rounded">
              Sale
            </span>
          </div>
          <p className="mb-4 text-xl text-center">
            <del className="text-gray-500">$59.99</del>{" "}
            <span className="text-green-600">$49.99 (excl. VAT)</span>
          </p>
          <ul className="pl-6 mb-6 list-disc">
            <li>Limited to 500 menus</li>
            <li>No limit on registered tables</li>
            <li>Various menu design templates</li>
            <li>Real-time chat with customers</li>
          </ul>
          <button className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-800">
            Choose this option
          </button>
        </div>
      </div>
    </div>
  );
}
