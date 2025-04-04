import { Calendar, Mail, Users } from "lucide-react";
import { useEffect, useState } from "react";

const BarChart = ({
  chartData,
  alwaysCol = false,
}: {
  chartData: {
    key: string;
    value: number;
  }[];
  alwaysCol?: boolean;
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
    <div className={`flex  ${alwaysCol ? "flex-col gap-10" : "flex-col lg:flex-row gap-8 2xl:gap-16"}`}>
      <div className="w-full h-full py-2 px-2 flex flex-col-reverse gap-3">
        <div className={`w-full flex ${alwaysCol ? "gap-2" : "gap-8"} justify-evenly`}>
          {chartData.map((set) => (
            <div key={set.key} className="text-center w-[12%] lg:w-[72px] text-neutral-500">
              {set.key}
            </div>
          ))}
        </div>
        <div className={`h-64 flex items-end ${alwaysCol ? "gap-2" : "gap-8"} justify-evenly`}>
          {chartData.map((set) => (
            <div
              key={set.key}
              className="w-[12%] lg:w-[72px] bg-[#e0b30005] h-full flex flex-col justify-end rounded-md"
            >
              <div
                style={{
                  height: `${((set.value / total) * 256).toFixed(0)}px`,
                }}
                className={`bg-[#e0b200] w-full rounded-md`}
              ></div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 text-center">
        <div className={`bg-neutral-800 flex items-center justify-between py-3 px-4 sm:px-8 rounded-md`}>
          <div className={`flex ${alwaysCol ? "gap-3" : "flex-col gap-2"} items-center`}>
            <Mail size={20} className="mx-auto text-[#e0b200]" />
            <p className="text-sm text-neutral-500 mt-0.5 uppercase tracking-wide font-bold">
              Emails
            </p>
          </div>
          <div>
            <p className="font-semibold text-xl text-neutral-400 mt-0.5">
              {chartData[0].value.toLocaleString()}
            </p>
          </div>
        </div>
        <div className={`bg-neutral-800 flex items-center justify-between py-3 px-4 sm:px-8 rounded-md`}>
          <div className={`flex ${alwaysCol ? "gap-3" : "flex-col gap-2"} items-center`}>
            <Calendar size={20} className="mx-auto text-[#e0b200]" />
            <p className="text-sm text-neutral-500 mt-0.5 uppercase tracking-wide font-bold">
              Meetings
            </p>
          </div>
          <div>
            <p className="font-semibold text-xl text-neutral-400 mt-0.5">
              {chartData[1].value.toLocaleString()}
            </p>
          </div>
        </div>
        <div className={`bg-neutral-800 flex items-center justify-between py-3 px-4 sm:px-8 rounded-md`}>
          <div className={`flex ${alwaysCol ? "gap-3" : "flex-col gap-2"} items-center`}>
            <Users size={20} className="mx-auto text-[#e0b200]" />
            <p className="text-sm text-neutral-500 mt-0.5 uppercase tracking-wide font-bold">
              Messages
            </p>
          </div>
          <div>
            <p className="font-semibold text-xl text-neutral-400 mt-0.5">
              {chartData[2].value.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
