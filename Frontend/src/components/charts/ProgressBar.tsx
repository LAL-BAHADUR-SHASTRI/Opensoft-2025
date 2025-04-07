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
            className="bg-primary/25 rounded-md"
          ></div>
          <div
            style={{
              width: `${(moodData["Average"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-primary/50 rounded-md"
          ></div>

          <div
            style={{
              width: `${(moodData["Good"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-primary/75 rounded-md"
          ></div>

          <div
            style={{
              width: `${(moodData["Excellent"] / moodData["Total"]) * 100}%`,
            }}
            className="bg-primary rounded-md"
          ></div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-10 cursor-default">
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 bg-primary/25 rounded-sm"></div>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">Poor</span>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">
            ({moodData.Poor})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 bg-primary/50 rounded-sm"></div>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">Average</span>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">
            ({moodData.Average})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 bg-primary/75 rounded-sm"></div>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">Good</span>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">
            ({moodData.Good})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 bg-primary rounded-sm"></div>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">Excellent</span>
          <span className="opacity-80 uppercase text-sm font-bold tracking-wide">
            ({moodData.Excellent})
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
