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
            className="bg-neutral-400 rounded-md"
          ></div>
          <div
            style={{
              width: `${(moodData["Average"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-neutral-500 rounded-md"
          ></div>

          <div
            style={{
              width: `${(moodData["Good"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-neutral-600 rounded-md"
          ></div>

          <div
            style={{
              width: `${(moodData["Excellent"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-neutral-700 rounded-md"
          ></div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5 cursor-default">
        <div className="w-full py-2 px-4 flex flex-col gap-0.4 items-center bg-neutral-400 rounded-md text-black">
          <span>Poor</span>
          <span>{moodData["Poor"]}</span>
        </div>
        <div className="w-full py-2 px-4 flex flex-col gap-0.4 items-center bg-neutral-500 rounded-md text-neutral-300">
          <span>Average</span>
          <span>{moodData["Average"]}</span>
        </div>
        <div className="w-full py-2 px-4 flex flex-col gap-0.4 items-center bg-neutral-600 rounded-md">
          <span>Good</span>
          <span>{moodData["Good"]}</span>
        </div>
        <div className="w-full py-2 px-4 flex flex-col gap-0.4 items-center bg-neutral-700 rounded-md">
          <span>Excellent</span>
          <span>{moodData["Excellent"]}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
