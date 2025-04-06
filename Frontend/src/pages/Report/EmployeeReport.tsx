import React, { ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router";

import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Radar } from "react-chartjs-2";

import { User, Calendar, Award, Briefcase, Star, Smile } from "lucide-react";

import { apiClient, routes } from "@/lib/api";

import { BarChart } from "@/components/charts";
import moment from "moment";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface ReportTypes {
  "Employee ID": string;
  Name: string;
  Department: string;
  Position: string;
  "Manager ID": string;
  "Joining Date": string;
  "Last Chat Date": string;
  "Current Mood": string;
  "Hr Escalation": boolean;
  "Escalation Reason": string;
  "Total Messages Sent": number;
  "Total Emails Sent": number;
  "Total Meetings Attended": number;
  "Total Work Hours": number;
  "Total Leaves Taken": number;
  "Onboarding Feedback": string;
  "Initial Training Completed": string;
  "Last Performance Rating": number;
  "Manager Feedback": string;
  "Total Rewards Earned": number;
  "Recent Reward": {
    Date: string;
    Type: string;
    Points: number;
  };
  "Recent Mood Score": number;
  "Mood Comment": string;
}

const StatCard = ({ title, value }: { title: string; value: number }) => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-4">
      <div className="flex items-center mb-2">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
      </div>
      <p className="text-3xl font-semibold text-neutral-300">{value.toFixed(0)}</p>
    </div>
  );
};

const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-neutral-300 mb-4 border-b border-neutral-800 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
};

const userStatusColors: Record<string, string> = {
  okay: "bg-green-700/50 text-green-100",
  frustrated: "bg-red-700/50 text-red-100",
  sad: "bg-blue-800/50 text-blue-100",
  happy: "bg-green-800/50 text-green-100",
  excited: "bg-yellow-700/50 text-yellow-100",
};

const EmployeeReport: React.FC = () => {
  const { employeeId } = useParams();

  const [reportData, setReportData] = useState<ReportTypes | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await apiClient.post(
          routes.EMPLOYEE_REPORT,
          {
            employee_id: employeeId,
          },
          { withCredentials: true }
        );

        if (response.status === 200) {
          if (response.data.report.error) {
            setReportData(null);
            setErrorMsg("No data found for employee");
          } else {
            setReportData(response.data.report);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setErrorMsg("Error fetching the report");
        setReportData(null);
      }
    };

    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const chartColors = {
    primary: "#e0b200",
    secondary: "#e0b200dd",
    accent: "#e0b20020",
    background: "#171717",
    text: "#D4D4D4",
  };

  const moodData = reportData && {
    labels: ["Mood Score", "Remaining"],
    datasets: [
      {
        data: [reportData["Recent Mood Score"], 10 - reportData["Recent Mood Score"]],
        backgroundColor: [chartColors.primary, chartColors.accent],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
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

  const performanceData = reportData && {
    labels: ["Performance", "Communication", "Rewards", "Mood", "Attendance"],
    datasets: [
      {
        label: "Employee Metrics",
        data: [
          reportData["Last Performance Rating"] * 20,
          (reportData["Total Messages Sent"] + reportData["Total Emails Sent"]) / 100, // Normalized communication
          reportData["Total Rewards Earned"] * 33.3,
          reportData["Recent Mood Score"] * 10,
          100 - (reportData["Total Leaves Taken"] / 24) * 100,
        ],
        backgroundColor: `${chartColors.primary}40`,
        borderColor: chartColors.primary,
        pointBackgroundColor: chartColors.secondary,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartColors.background,
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.accent,
        borderWidth: 1,
      },
    },
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false,
        },
        pointLabels: {
          color: chartColors.text,
          font: {
            size: 11,
          },
        },
        grid: { color: `${chartColors.accent}` },
        angleLines: { color: `${chartColors.accent}` },
      },
    },
    plugins: {
      legend: { display: false },
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
    <div className="bg-neutral-950 min-h-screen px-4 pb-4 pt-4 xl:px-40 2xl:px-60 lg:pt-12 text-neutral-300">
      {reportData ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="bg-neutral-900 rounded-lg px-6 py-2 flex items-center">
              <div className="bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                <User className="text-[#e0b200]" size={20} />
              </div>
              <div className="text-neutral-300 font-medium">{reportData["Employee ID"]}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <SectionCard title="Employee Information">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Current Mood:</span>
                    <span
                      className={`py-0.5 px-2 text-sm font-medium ${
                        reportData["Current Mood"]
                          ? userStatusColors[reportData["Current Mood"].toLowerCase()]
                          : "bg-neutral-800"
                      } rounded-md`}
                    >
                      {reportData["Current Mood"] ?? "Unknown"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-500">Department:</span>
                    <span className="text-neutral-400 font-medium">{reportData.Department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Position:</span>
                    <span className="text-neutral-400 font-medium">
                      {reportData.Position ?? "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Manager ID:</span>
                    <span className="text-neutral-400 font-medium">
                      {reportData["Manager ID"] ?? "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Join Date:</span>
                    <span className="text-neutral-400 font-medium">
                      {reportData["Joining Date"] !== "N/A"
                        ? moment(reportData["Joining Date"]).format("DD MMM YYYY")
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Last Chat Date:</span>
                    <span className="text-neutral-400 font-medium">
                      {reportData["Last Chat Date"]
                        ? moment(reportData["Last Chat Date"]).format("DD MMM YYYY")
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Attention Needed:</span>
                    <span
                      className={`py-0.5 px-2 text-sm rounded-md ${
                        reportData["Hr Escalation"] ? "bg-red-700" : "bg-green-700"
                      } w-fit`}
                    >
                      {`${reportData["Hr Escalation"] ? "Yes!" : "No"}`}
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Performance">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-neutral-400 text-sm mb-1">Last Performance Rating</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-neutral-300 mr-2">
                        {reportData["Last Performance Rating"]}
                      </span>
                      <span className="text-neutral-500 text-sm">/ 5.0</span>
                    </div>
                  </div>
                  <div className="bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center">
                    <Star className="text-[#e0b200]" size={18} />
                  </div>
                </div>
                <p className="text-neutral-500 text-sm mb-3">Manager Feedback:</p>
                <p className="text-neutral-400 p-3 bg-neutral-800 rounded-md italic">
                  "{reportData["Manager Feedback"]}"
                </p>
              </SectionCard>

              <SectionCard title="Onboarding Information">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-500">Training Completed:</span>
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full ${
                        reportData["Initial Training Completed"] === "Yes"
                          ? "bg-neutral-800 text-neutral-300"
                          : "bg-neutral-900 text-neutral-500"
                      }`}
                    >
                      {reportData["Initial Training Completed"]}
                    </span>
                  </div>
                </div>
                <p className="text-neutral-500 text-sm mb-3">Onboarding Feedback:</p>
                <p className="text-neutral-400 p-3 bg-neutral-800 rounded-md">
                  {reportData["Onboarding Feedback"]}
                </p>
              </SectionCard>

              <SectionCard title="Meeting Activity">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-neutral-400 text-sm mb-1">Total Meetings Attended</p>
                    <p className="text-2xl font-bold text-neutral-300">
                      {reportData["Total Meetings Attended"]}
                    </p>
                  </div>
                  <div className="bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center">
                    <Calendar className="text-[#e0b200]" size={18} />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-neutral-500 text-sm mb-2">Meeting Participation Rate</p>
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-primary/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e0b200]" style={{ width: "85%" }}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-neutral-500">85%</span>
                  </div>
                  <p className="text-neutral-500 text-xs mt-2">
                    Based on expected department meeting attendance
                  </p>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Work Hours" value={reportData["Total Work Hours"]} />
                <StatCard title="Leaves Taken" value={reportData["Total Leaves Taken"]} />
                <StatCard title="Messages Sent" value={reportData["Total Messages Sent"]} />
                <StatCard title="Emails Sent" value={reportData["Total Emails Sent"]} />
              </div>

              {reportData["Escalation Reason"] && reportData["Hr Escalation"] && (
                <SectionCard title="Reason For Attention">
                  <div className="text-lg">{reportData["Escalation Reason"]}</div>
                </SectionCard>
              )}

              <SectionCard title="Communication Activity">
                {reportData && communicationData && (
                  <BarChart chartData={communicationData} alwaysCol={true} />
                )}
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard title="Current Mood">
                <div className="h-40 flex items-center justify-center relative mb-5">
                  {moodData && <Doughnut data={moodData} options={doughnutOptions} />}
                  <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
                    <span className="text-3xl font-bold text-neutral-300">
                      {reportData["Recent Mood Score"]}
                    </span>
                    <span className="text-sm text-neutral-500">out of 10</span>
                  </div>
                </div>
                <div className="bg-neutral-800 p-3 rounded-md flex items-start">
                  <Smile className="text-[#e0b200] mr-2 mt-0.5" size={18} />
                  <p className="text-neutral-400 italic">"{reportData["Mood Comment"]}"</p>
                </div>
              </SectionCard>

              <SectionCard title="Rewards & Recognition">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-neutral-400 text-sm mb-1">Total Rewards</p>
                    <p className="text-2xl font-bold text-neutral-300">
                      {reportData["Total Rewards Earned"]}
                    </p>
                  </div>
                  <div className="bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center">
                    <Award className="text-[#e0b200]" size={18} />
                  </div>
                </div>

                <p className="text-neutral-500 text-sm mb-3">Recent Recognition:</p>
                <div className="bg-neutral-800 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-neutral-400">
                      {reportData["Recent Reward"].Type}
                    </p>
                    <span className="text-xs bg-neutral-700 text-neutral-400 px-2 py-0.5 rounded-full">
                      {formatDate(reportData["Recent Reward"].Date)}
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    <Briefcase className="text-[#e0b200] mr-2" size={16} />
                    <p className="text-neutral-500 text-sm">
                      {reportData["Recent Reward"].Points} points awarded
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Performance Overview">
                <div className="grid place-content-center">
                  <div className="h-64">
                    {performanceData && <Radar data={performanceData} options={radarOptions} />}
                  </div>
                </div>
                <div className="mt-4 grid 2xl:grid-cols-3 gap-2 text-sm text-center">
                  <div className="flex justify-between 2xl:flex-col gap-1 items-center bg-neutral-800 py-2 px-4 rounded">
                    <p className="text-neutral-500">Performance</p>
                    <p className="font-medium text-neutral-400 text-lg">
                      {reportData["Last Performance Rating"]}/5
                    </p>
                  </div>
                  <div className="flex justify-between 2xl:flex-col gap-1 items-center bg-neutral-800 py-2 px-4 rounded">
                    <p className="text-neutral-500">Rewards</p>
                    <p className="font-medium text-neutral-400 text-lg">
                      {reportData["Total Rewards Earned"]}
                    </p>
                  </div>
                  <div className="flex justify-between 2xl:flex-col gap-1 items-center bg-neutral-800 py-2 px-4 rounded">
                    <p className="text-neutral-500">Attendance</p>
                    <p className="font-medium text-neutral-400 text-lg">
                      {100 - Math.round((reportData["Total Leaves Taken"] / 24) * 100)}%
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 flex-col mt-10">
          <div className="bg-neutral-900 text-xl py-2 px-4 mx-auto w-fit border-2 border-neutral-800 rounded-md">
            {errorMsg}
          </div>
          <div>Please try again after sometime</div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;
