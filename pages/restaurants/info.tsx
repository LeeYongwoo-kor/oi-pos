import Layout from "@/components/Layout";
import { useState } from "react";

export default function RestaurantInfo() {
  const [restaurantName, setRestaurantName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [phone, setPhone] = useState("");
  const [postCode, setPostCode] = useState("");
  const [address, setAddress] = useState("");
  const [restAddress, setRestAddress] = useState("");

  const handlePostCodeSearch = () => {
    // Call your postcode API here and set the address
  };

  const handleNext = () => {
    // Implement your next logic here
  };

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-4 text-2xl font-semibold">
          Enter basic information about the restaurant
        </h1>
        <p className="mb-6">
          This page helps you enter basic information about your restaurant.
        </p>
        <form>
          <div className="mb-4">
            <label className="block mb-2">Restaurant Name (Required)</label>
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Branch Name (Required)</label>
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">
              Restaurant Phone Number (Not required)
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">POST CODE (Required)</label>
            <input
              className="p-2 border border-gray-300 rounded"
              type="text"
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
              required
            />
            <button
              className="p-2 ml-2 text-white bg-blue-500 rounded"
              onClick={handlePostCodeSearch}
            >
              Search
            </button>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Address</label>
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Rest of the Address</label>
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="text"
              value={restAddress}
              onChange={(e) => setRestAddress(e.target.value)}
            />
          </div>
          <button
            className="p-2 text-white bg-green-500 rounded"
            onClick={handleNext}
          >
            NEXT
          </button>
        </form>
      </div>
    </Layout>
  );
}
