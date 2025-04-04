const ProgressBar = ({
  moodData,
}: {
  moodData: {
    Poor: number;
    Average: number;
    Good: number;
    Excellent: number;
    Total: number;
  };
}) => {
  return (
    <div>
      <div className="flex items-center">
        <div className="w-full flex gap-2 h-4 rounded-md overflow-hidden">
          <div
            style={{
              width: `${(moodData["Poor"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-[#e0b30028] rounded-md"
          ></div>
          <div
            style={{
              width: `${(moodData["Average"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-[#e0b30080] rounded-md"
          ></div>

          <div
            style={{
              width: `${(moodData["Good"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-[#e0b300b6] rounded-md"
          ></div>

          <div
            style={{
              width: `${(moodData["Excellent"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-[#e0b200] rounded-md"
          ></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mt-5 cursor-default">
        <div className="w-full py-3 px-4 flex flex-col gap-0.4 items-center bg-[#e0b30028] rounded-md">
          <span className="opacity-80 uppercase text-xs font-bold tracking-wide">Poor</span>
          <span className="font-semibold">{moodData["Poor"]}</span>
        </div>
        <div className="w-full py-3 px-4 flex flex-col gap-0.4 items-center bg-[#e0b30080] rounded-md">
          <span className="opacity-80 uppercase text-xs font-bold tracking-wide">Average</span>
          <span className="font-semibold">{moodData["Average"]}</span>
        </div>
        <div className="w-full py-3 px-4 flex flex-col gap-0.4 items-center bg-[#e0b300b6] rounded-md text-black">
          <span className="opacity-80 uppercase text-xs font-bold tracking-wide">Good</span>
          <span className="font-semibold">{moodData["Good"]}</span>
        </div>
        <div className="w-full py-3 px-4 flex flex-col gap-0.4 items-center bg-[#e0b200] rounded-md text-black">
          <span className="opacity-80 uppercase text-xs font-bold tracking-wide">Excellent</span>
          <span className="font-semibold">{moodData["Excellent"]}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
