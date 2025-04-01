import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { Users, Clock, Mail, Calendar, Award, Star } from "lucide-react";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ReportTypes {
  "Total Employees": number;
  "Average Work Hours Per Employee": number;
  "Total Messages Sent": number;
  "Total Emails Sent": number;
  "Total Meetings Attended": number;
  "Total Leaves Taken": number;
  "Onboarding Satisfaction Score": number;
  "Average Performance Rating": number;
  "Top Performer": string;
  "Total Rewards Given": number;
  "Most Common Reward Type": string;
  "Overall Mood Score": number;
  "Frequent Mood Comments": string[];
}

const Card = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-4 flex items-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-neutral-500 text-sm">{title}</p>
        <p className="text-xl font-semibold text-neutral-300">{value}</p>
      </div>
    </div>
  );
};

const CollectiveReport = () => {
  const [reportData, setReportData] = useState<ReportTypes | null>(null);

  const data: ReportTypes = {
    "Total Employees": 50,
    "Average Work Hours Per Employee": 1500,
    "Total Messages Sent": 25000,
    "Total Emails Sent": 10000,
    "Total Meetings Attended": 1200,
    "Total Leaves Taken": 300,
    "Onboarding Satisfaction Score": 4.2,
    "Average Performance Rating": 4.1,
    "Top Performer": "EMP456 - Jane Smith",
    "Total Rewards Given": 75,
    "Most Common Reward Type": "Best Team Player",
    "Overall Mood Score": 7.5,
    "Frequent Mood Comments": [
      "Feeling excited",
      "Workload is manageable",
      "Could use more team bonding",
    ],
  };

  useEffect(() => {
    setReportData(data);
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

  const communicationData = reportData && {
    labels: ["Messages", "Emails", "Meetings"],
    datasets: [
      {
        label: "Communication Metrics",
        data: [
          reportData["Total Messages Sent"] / reportData["Total Employees"],
          reportData["Total Emails Sent"] / reportData["Total Employees"],
          reportData["Total Meetings Attended"] / reportData["Total Employees"],
        ],
        backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.tertiary],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
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
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Per Employee Average",
          color: chartColors.text,
        },
        grid: {
          color: chartColors.accent + "40",
        },
        ticks: {
          color: chartColors.text,
        },
      },
      x: {
        grid: {
          color: chartColors.accent + "40",
        },
        ticks: {
          color: chartColors.text,
        },
      },
    },
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

  return (
    <div className="bg-neutral-950 min-h-screen px-4 pb-4 pt-4 md:px-6 lg:pt-12 xl:px-40 2xl:px-60 text-neutral-300">
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card
              title="Total Employees"
              value={reportData["Total Employees"]}
              icon={<Users size={24} className="text-neutral-950" />}
              color="bg-neutral-500"
            />
            <Card
              title="Avg. Work Hours"
              value={reportData["Average Work Hours Per Employee"]}
              icon={<Clock size={24} className="text-neutral-950" />}
              color="bg-neutral-600"
            />
            <Card
              title="Avg. Performance"
              value={`${reportData["Average Performance Rating"]}/5`}
              icon={<Star size={24} className="text-neutral-950" />}
              color="bg-neutral-500"
            />
            <Card
              title="Total Rewards"
              value={reportData["Total Rewards Given"]}
              icon={<Award size={24} className="text-neutral-950" />}
              color="bg-neutral-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-900 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-neutral-300 mb-4">Overall Mood</h2>
              <div className="h-48 flex items-center justify-center relative">
                {moodData && <Doughnut data={moodData} options={doughnutOptions} />}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-neutral-300">
                    {reportData["Overall Mood Score"]}
                  </span>
                  <span className="text-sm text-neutral-500">out of 10</span>
                </div>
              </div>
              <div className="mt-4">
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
              <h2 className="text-lg font-semibold text-neutral-300 mb-4">Communication Metrics</h2>
              <div className="h-64">
                {communicationData && <Bar data={communicationData} options={barOptions} />}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-neutral-800 p-2 rounded">
                  <Mail size={16} className="mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-500 mt-1">Emails</p>
                  <p className="font-medium text-neutral-400">
                    {reportData["Total Emails Sent"].toLocaleString()}
                  </p>
                </div>
                <div className="bg-neutral-800 p-2 rounded">
                  <Calendar size={16} className="mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-500 mt-1">Meetings</p>
                  <p className="font-medium text-neutral-400">
                    {reportData["Total Meetings Attended"].toLocaleString()}
                  </p>
                </div>
                <div className="bg-neutral-800 p-2 rounded">
                  <Users size={16} className="mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-500 mt-1">Messages</p>
                  <p className="font-medium text-neutral-400">
                    {reportData["Total Messages Sent"].toLocaleString()}
                  </p>
                </div>
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-neutral-500">Onboarding Satisfaction</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neutral-600 to-neutral-500"
                      style={{
                        width: `${(reportData["Onboarding Satisfaction Score"] / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-neutral-500">
                    {reportData["Onboarding Satisfaction Score"]}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollectiveReport;
