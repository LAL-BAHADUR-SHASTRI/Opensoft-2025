import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Users, Mail, Calendar } from "lucide-react";
import { apiClient, routes } from "@/lib/api";
import { useLocation, useNavigate } from "react-router";
import { useReportContext } from "@/context/ReportContext";

import { ProgressBar, BarChart } from "@/components/charts";

ChartJS.register(
  ArcElement,
  Tooltip,
);

interface ReportTypes {
  "Total Employees": number;
  "Average Work Hours Per Employee": number;
  "Total Messages Sent": number;
  "Total Emails Sent": number;
  "Total Meetings Attended": number;
  "Total Leaves Taken": number;
  "Onboarding Moods": {
    Poor: number;
    Average: number;
    Good: number;
    Excellent: number;
    Total: number;
  };
  "Average Performance Rating": number;
  "Top Performer": string;
  "Total Rewards Given": number;
  "Most Common Reward Type": string;
  "Overall Mood Score": number;
  "Frequent Mood Comments": string[];
}

const Card = ({ title, value }: { title: string; value: string | number }) => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-4 flex items-center">
      <div className="flex flex-col gap-2">
        <p className="text-neutral-500 text-sm">{title}</p>
        <p className="text-3xl font-semibold text-neutral-300">{value}</p>
      </div>
    </div>
  );
};

const CollectiveReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { employeeIds } = useReportContext();
  const [reportData, setReportData] = useState<ReportTypes | null>(null);

  useEffect(() => {
    const fetchReportAll = async () => {
      try {
        const response = await apiClient.get(routes.COLLECTIVE_REPORT, { withCredentials: true });

        if (response.status === 200) {
          setReportData(response.data.report);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setReportData(null);
      }
    };

    const fetchReportSelective = async () => {
      try {
        const response = await apiClient.post(
          routes.SELECTIVE_REPORT,
          {
            employee_ids: employeeIds,
          },
          { withCredentials: true }
        );

        if (response.status === 200) {
          setReportData(response.data.report);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setReportData(null);
      }
    };

    if (location.pathname.includes("all")) fetchReportAll();
    else if (employeeIds.length !== 0) fetchReportSelective();
    else navigate("/admin");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartColors = {
    primary: "#A3A3A3",
    secondary: "#737373",
    tertiary: "#525252",
    accent: "#404040",
    background: "#262626",
    text: "#D4D4D4",
    muted: "#737373",
  };

  const moodData = reportData && {
    labels: ["Mood Score", "Remaining"],
    datasets: [
      {
        data: [reportData["Overall Mood Score"], 10 - reportData["Overall Mood Score"]],
        backgroundColor: [chartColors.primary, chartColors.accent],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
  };

  const performanceData = reportData && {
    labels: ["Performance Score", "Remaining"],
    datasets: [
      {
        data: [
          reportData["Average Performance Rating"],
          5 - reportData["Average Performance Rating"],
        ],
        backgroundColor: [chartColors.primary, chartColors.accent],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: chartColors.background,
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.accent,
        borderWidth: 1,
      },
    },
  };

  const communicationData = reportData && [
    {
      key: "Emails",
      value: reportData["Total Emails Sent"],
    },
    {
      key: "Meetings",
      value: reportData["Total Meetings Attended"],
    },
    {
      key: "Messages",
      value: reportData["Total Messages Sent"],
    },
  ];

  return (
    <div className="bg-neutral-950 min-h-screen px-4 pb-10 pt-4 md:px-6 lg:pt-12 xl:px-40 2xl:px-60 text-neutral-300">
      {reportData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card title="Total Employees" value={reportData["Total Employees"]} />
            <Card
              title="Avg. Work Hours"
              value={reportData["Average Work Hours Per Employee"].toFixed(0)}
            />
            <Card title="Total Rewards" value={reportData["Total Rewards Given"]} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-neutral-900 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-neutral-300 mb-4">Overall Mood</h2>
              <div className="h-48 flex items-center justify-center relative">
                {moodData && <Doughnut data={moodData} options={doughnutOptions} />}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-neutral-300">
                    {reportData["Overall Mood Score"].toFixed(1)}
                  </span>
                  <span className="text-sm text-neutral-500">out of 10</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-sm font-medium text-neutral-400 mb-2">Common Comments:</h3>
                <ul className="text-sm text-neutral-500">
                  {reportData["Frequent Mood Comments"].map((comment, index) => (
                    <li key={index} className="mb-1 flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-neutral-500 mt-1.5 mr-2"></span>
                      {comment}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-neutral-300 mb-4">Employee Recognition</h2>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-neutral-500">Top Performer</p>
                  <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded-full">
                    Star Employee
                  </span>
                </div>
                <p className="text-lg font-medium text-neutral-400">
                  {reportData["Top Performer"]}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-neutral-500">Most Common Reward</p>
                  <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded-full">
                    {reportData["Total Rewards Given"]} Awards
                  </span>
                </div>
                <p className="text-lg font-medium text-neutral-400">
                  {reportData["Most Common Reward Type"]}
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">Onboarding Satisfaction</p>
                </div>
                <ProgressBar moodData={reportData["Onboarding Moods"]} />
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 mt-6 gap-6">
            <div className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-neutral-300 mb-4">Communication Metrics</h2>
              <div className="flex flex-col lg:flex-row gap-16">
                {reportData && communicationData && <BarChart chartData={communicationData} />}
                <div className="flex flex-col justify-between gap-3 text-center">
                  <div className="bg-neutral-800 pt-3 pb-2 px-3 rounded-md">
                    <Mail size={20} className="mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-500 mt-1">Emails</p>
                    <p className="font-medium text-neutral-400">
                      {reportData["Total Emails Sent"].toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-neutral-800 pt-3 pb-2 px-3 rounded-md">
                    <Calendar size={20} className="mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-500 mt-1">Meetings</p>
                    <p className="font-medium text-neutral-400">
                      {reportData["Total Meetings Attended"].toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-neutral-800 pt-3 pb-2 px-3 rounded-md">
                    <Users size={20} className="mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-500 mt-1">Messages</p>
                    <p className="font-medium text-neutral-400">
                      {reportData["Total Messages Sent"].toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 bg-neutral-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-neutral-300">Performance</h2>
              <div className="relative flex flex-col items-center justify-center w-full h-full">
                <div className="mx-auto">
                  {performanceData && <Doughnut data={performanceData} options={doughnutOptions} />}
                </div>
                <div className="absolute  top-1/2 left-1/2 -translate-1/2 flex flex-col gap-1 items-center justify-center">
                  <span className="text-5xl font-bold text-neutral-300">
                    {reportData["Average Performance Rating"].toFixed(1)}
                  </span>
                  <span className="text text-neutral-500">out of 5</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 flex-col mt-10">
          <div className="bg-neutral-900 text-xl py-2 px-4 mx-auto w-fit border-2 border-neutral-800 rounded-md">
            Error fetching the report
          </div>
          <div>Please try again after sometime</div>
        </div>
      )}
    </div>
  );
};

export default CollectiveReport;
