type AlarmProps = {
  onToggle: () => void;
};

export default function Alarm({ onToggle }: AlarmProps) {
  return (
    <div className="w-64 h-full pt-16 bg-white">
      <div className="relative h-full p-4 shadow-md">
        <button
          onClick={onToggle}
          className="absolute right-0 p-2 bg-white border border-gray-300 rounded-l-md"
        >
          &raquo;
        </button>
        <h2 className="mb-4 text-xl font-semibold">Incoming Orders</h2>
        <div className="divide-y divide-gray-200">
          <div className="py-5">
            <h3 className="font-semibold">Table 1</h3>
            <p>2 x Burger, 1 x Fries</p>
          </div>
          <div className="py-5">
            <h3 className="font-semibold">Table 3</h3>
            <p>3 x Pizza, 2 x Salad</p>
          </div>
        </div>
      </div>
    </div>
  );
}
