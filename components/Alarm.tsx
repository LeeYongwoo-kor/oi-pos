function Alarm() {
  return (
    <div className="w-64 h-full p-4 bg-white shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Incoming Orders</h2>
      <div className="divide-y divide-gray-200">
        <div className="py-2">
          <h3 className="font-semibold">Table 1</h3>
          <p>2 x Burger, 1 x Fries</p>
        </div>
        <div className="py-2">
          <h3 className="font-semibold">Table 3</h3>
          <p>3 x Pizza, 2 x Salad</p>
        </div>
      </div>
    </div>
  );
}

export default Alarm;
