import Layout from "@/components/Layout";
import { useState } from "react";

export default function RestaurantHours() {
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [days, setDays] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
    noHolidays: false,
  });
  const [lastOrder, setLastOrder] = useState("");
  const [unspecified, setUnspecified] = useState(false);

  const handleCheckBox = (day: any) => {
    setDays({ ...days, [day]: !days[day] });
  };

  const handleUnspecified = () => {
    setUnspecified(!unspecified);
  };

  const handleSubmit = () => {
    // Implement your submit logic here
  };

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-4 text-2xl font-semibold">
          Enter the restaurant&apos;s business hours and holidays
        </h1>
        <p className="mb-6">
          This page helps you enter your restaurant&apos;s business hours and
          holidays.
        </p>
        <form>
          <div className="mb-4">
            <label className="block mb-2">Business Hours</label>
            <input
              className="p-2 border border-gray-300 rounded"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <span className="mx-2">to</span>
            <input
              className="p-2 border border-gray-300 rounded"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Regular Holidays</label>
            {Object.keys(days).map((day) => (
              <span key={day} className="mr-4">
                <input
                  type="checkbox"
                  checked={days[day]}
                  onChange={() => handleCheckBox(day)}
                  disabled={day !== "noHolidays" && days.noHolidays}
                />
                <span className="ml-1">{day}</span>
              </span>
            ))}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Last Order</label>
            <input
              className="p-2 border border-gray-300 rounded"
              type="time"
              value={lastOrder}
              onChange={(e) => setLastOrder(e.target.value)}
              disabled={unspecified}
            />
            <span className="ml-2">
              <input
                type="checkbox"
                checked={unspecified}
                onChange={handleUnspecified}
              />
              <span className="ml-1">Unspecified</span>
            </span>
          </div>
          <button
            className="p-2 text-white bg-green-500 rounded"
            onClick={handleSubmit}
          >
            Complete
          </button>
        </form>
      </div>
    </Layout>
  );
}
