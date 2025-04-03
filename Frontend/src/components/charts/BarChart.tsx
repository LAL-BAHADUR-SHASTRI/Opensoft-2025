import { useEffect, useState } from "react";

const BarChart = ({
  chartData,
}: {
  chartData: {
    key: string;
    value: number;
  }[];
}) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let tempTotal = 0;

    for (const set of chartData) {
      tempTotal += set.value;
    }

    setTotal(tempTotal);
  }, [chartData]);

  return (
    <div className="w-full h-full py-2 px-2 flex flex-col-reverse gap-2">
      <div className="w-full flex justify-evenly">
        {chartData.map((set) => (
            <div key={set.key} className="text-center w-[12%] lg:w-[72px] text-neutral-500">{set.key}</div>
        ))}
      </div>
      <div className="h-64 flex items-end justify-evenly">
        {chartData.map((set) => (
          <div key={set.key} className="w-[12%] lg:w-[72px] bg-neutral-950/20 h-full flex flex-col justify-end rounded-md">
            <div
              style={{
                height: `${((set.value / total) * 256).toFixed(0)}px`,
              }}
              className={`bg-neutral-600 w-full rounded-md`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
