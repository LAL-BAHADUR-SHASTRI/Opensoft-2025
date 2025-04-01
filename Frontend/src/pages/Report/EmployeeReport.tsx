import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar, Radar } from "react-chartjs-2";
import {
  User,
  Calendar,
  Mail,
  MessageSquare,
  Clock,
  Award,
  Briefcase,
  Star,
  Smile,
} from "lucide-react";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-4">
      <div className="flex items-center mb-2">
        <div className="text-neutral-500 mr-2">{icon}</div>
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
      </div>
      <p className="text-xl font-semibold text-neutral-300">{value}</p>
    </div>
  );
};

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-neutral-300 mb-4 border-b border-neutral-800 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
};

const IndividualReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportTypes | null>(null);

  const data: ReportTypes = {
    "Employee ID": "EMP123",
    Name: "John Doe",
    Department: "IT",
    Position: "Software Engineer",
    "Manager ID": "MGR456",
    "Joining Date": "2022-03-01",
    "Total Messages Sent": 500,
    "Total Emails Sent": 200,
    "Total Meetings Attended": 30,
    "Total Work Hours": 1600,
    "Total Leaves Taken": 12,
    "Onboarding Feedback": "Smooth onboarding, mentor was helpful",
    "Initial Training Completed": "Yes",
    "Last Performance Rating": 4.5,
    "Manager Feedback": "Great work ethic, potential for leadership",
    "Total Rewards Earned": 3,
    "Recent Reward": {
      Date: "2024-02-10",
      Type: "Employee of the Month",
      Points: 500,
    },
    "Recent Mood Score": 8.2,
    "Mood Comment": "Feeling productive and motivated",
  };

  useEffect(() => {
    setReportData(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const calculateDaysSinceJoining = (): number => {
    const joinDate = new Date(reportData ? reportData["Joining Date"] : "");
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

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
        data: [reportData["Recent Mood Score"], 10 - reportData["Recent Mood Score"]],
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
        label: "Communication Activity",
        data: [
          reportData["Total Messages Sent"],
          reportData["Total Emails Sent"],
          reportData["Total Meetings Attended"] * 10,
        ],
        backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.tertiary],
      },
    ],
  };

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

  const barOptions = {
    responsive: true,
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
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: `${chartColors.accent}40` },
        ticks: { color: chartColors.text },
      },
      x: {
        grid: { color: `${chartColors.accent}40` },
        ticks: { color: chartColors.text },
      },
    },
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
        grid: { color: `${chartColors.accent}40` },
        angleLines: { color: `${chartColors.accent}40` },
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
      {reportData && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="bg-neutral-900 rounded-lg px-4 py-2 flex items-center">
              <div className="bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                <User className="text-neutral-400" size={20} />
              </div>
              <div>
                <p className="text-neutral-300 font-medium">{data.Name}</p>
                <p className="text-neutral-500 text-sm">
                  {data.Department} — {data.Position}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <SectionCard title="Employee Information">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Employee ID:</span>
                    <span className="text-neutral-400 font-medium">
                      {reportData["Employee ID"]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Department:</span>
                    <span className="text-neutral-400 font-medium">{data.Department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Position:</span>
                    <span className="text-neutral-400 font-medium">{data.Position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Manager ID:</span>
                    <span className="text-neutral-400 font-medium">{reportData["Manager ID"]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Join Date:</span>
                    <span className="text-neutral-400 font-medium">
                      {formatDate(reportData["Joining Date"])}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Days at Company:</span>
                    <span className="text-neutral-400 font-medium">
                      {calculateDaysSinceJoining()} days
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
                    <Star className="text-neutral-400" size={18} />
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
                <p className="text-neutral-500 text-sm mb-2">Onboarding Feedback:</p>
                <p className="text-neutral-400 p-3 bg-neutral-800 rounded-md">
                  {reportData["Onboarding Feedback"]}
                </p>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Work Hours"
                  value={reportData["Total Work Hours"]}
                  icon={<Clock size={18} />}
                />
                <StatCard
                  title="Leaves Taken"
                  value={reportData["Total Leaves Taken"]}
                  icon={<Calendar size={18} />}
                />
                <StatCard
                  title="Messages Sent"
                  value={reportData["Total Messages Sent"]}
                  icon={<MessageSquare size={18} />}
                />
                <StatCard
                  title="Emails Sent"
                  value={reportData["Total Emails Sent"]}
                  icon={<Mail size={18} />}
                />
              </div>

              <SectionCard title="Communication Activity">
                <div className="h-64">
                  {communicationData && <Bar data={communicationData} options={barOptions} />}
                </div>
              </SectionCard>

              <SectionCard title="Performance Overview">
                <div className="h-64">
                  {performanceData && <Radar data={performanceData} options={radarOptions} />}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-center">
                  <div className="bg-neutral-800 p-2 rounded">
                    <p className="text-neutral-500">Performance</p>
                    <p className="font-medium text-neutral-400">
                      {reportData["Last Performance Rating"]}/5
                    </p>
                  </div>
                  <div className="bg-neutral-800 p-2 rounded">
                    <p className="text-neutral-500">Rewards</p>
                    <p className="font-medium text-neutral-400">
                      {reportData["Total Rewards Earned"]}
                    </p>
                  </div>
                  <div className="bg-neutral-800 p-2 rounded">
                    <p className="text-neutral-500">Attendance</p>
                    <p className="font-medium text-neutral-400">
                      {100 - Math.round((reportData["Total Leaves Taken"] / 24) * 100)}%
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard title="Current Mood">
                <div className="h-40 flex items-center justify-center relative mb-3">
                  {moodData && <Doughnut data={moodData} options={doughnutOptions} />}
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-neutral-300">
                      {reportData["Recent Mood Score"]}
                    </span>
                    <span className="text-sm text-neutral-500">out of 10</span>
                  </div>
                </div>
                <div className="bg-neutral-800 p-3 rounded-md flex items-start">
                  <Smile className="text-neutral-500 mr-2 mt-0.5" size={18} />
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
                    <Award className="text-neutral-400" size={18} />
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
                    <Briefcase className="text-neutral-500 mr-2" size={16} />
                    <p className="text-neutral-500 text-sm">
                      {reportData["Recent Reward"].Points} points awarded
                    </p>
                  </div>
                </div>
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
                    <Calendar className="text-neutral-400" size={18} />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-neutral-500 text-sm mb-2">Meeting Participation Rate</p>
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neutral-700 to-neutral-500"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-neutral-500">85%</span>
                  </div>
                  <p className="text-neutral-600 text-xs mt-2">
                    Based on expected department meeting attendance
                  </p>
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IndividualReport;
