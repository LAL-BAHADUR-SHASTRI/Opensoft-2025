import React, { ReactElement } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

// Custom SVG Icons
const CustomIcons = {
  Users: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  TrendingUp: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  LogOut: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  Calendar: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Award: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  ),
  Briefcase: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  ),
  Heart: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-500"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
};

const CollectiveReport = () => {
  // Data is now structured to exactly match the JSON format
  const data = {
    collectiveEmployeeReport: {
      officeOverview: {
        totalEmployees: 150,
        departmentDistribution: {
          Marketing: 25,
          Sales: 40,
          Engineering: 50,
          HR: 10,
          Finance: 15,
          Operations: 10,
        },
        genderDiversityRatio: {
          male: 0.55,
          female: 0.43,
          nonBinary: 0.02,
        },
        ageDemographics: {
          "18-25": 20,
          "26-35": 55,
          "36-45": 45,
          "46-55": 20,
          "56+": 10,
        },
      },
      performanceSummary: {
        averagePerformanceRating: 3.8,
        topPerformersByDepartment: {
          Marketing: ["John Doe", "Jane Smith"],
          Sales: ["Mike Johnson", "Sarah Brown"],
          Engineering: ["Alex Lee", "Emma Davis"],
        },
        overallGoalAchievementRate: 0.85,
      },
      attendanceAndLeaveAnalysis: {
        averageAttendanceRate: 96.5,
        leaveUtilizationTrend: {
          annualLeave: 0.75,
          sickLeave: 0.45,
          personalLeave: 0.6,
        },
        departmentAttendance: {
          highest: "Finance",
          lowest: "Sales",
        },
      },
      compensationAndBenefits: {
        salaryRangesByDepartment: {
          Marketing: { min: 50000, max: 120000 },
          Sales: { min: 45000, max: 150000 },
          Engineering: { min: 70000, max: 180000 },
        },
        totalCompensationExpenditure: 12500000,
        benefitsUtilizationRates: {
          healthInsurance: 0.95,
          "401k": 0.82,
          dentalPlan: 0.78,
        },
      },
      skillsAndTraining: {
        mostCommonSkills: ["Project Management", "Data Analysis", "Communication"],
        trainingProgramParticipationRates: {
          LeadershipTraining: 0.45,
          TechnicalSkillsWorkshop: 0.68,
          SoftSkillsDevelopment: 0.72,
        },
        identifiedSkillGaps: ["Artificial Intelligence", "Cybersecurity"],
      },
      careerDevelopment: {
        internalPromotionRate: 0.15,
        averageTenureInCurrentPosition: 2.5,
        successionPlanningStatus: {
          positionsWithSuccessionPlan: 25,
          totalKeyPositions: 30,
        },
      },
      projectAndProductivityMetrics: {
        activeProjects: 35,
        averageProjectCompletionRate: 0.88,
        productivityIndicatorsByDepartment: {
          Marketing: 0.92,
          Sales: 0.87,
          Engineering: 0.95,
        },
      },
      complianceAndRiskManagement: {
        complianceTrainingCompletionRate: 0.97,
        expiredCertificationsCount: 5,
        identifiedComplianceRisks: ["Data Protection Training Update Required"],
      },
      employeeTurnover: {
        turnoverRate: 0.08,
        topReasonsForLeaving: ["Career Advancement", "Work-Life Balance", "Compensation"],
        retentionStrategiesEffectiveness: {
          flexibleWorkArrangements: "High",
          professionalDevelopmentPrograms: "Medium",
          performanceBasedBonuses: "High",
        },
      },
      employeeEngagement: {
        lastSurveyResults: {
          overallEngagementScore: 4.2,
          participationRate: 0.89,
        },
        companyEventParticipation: {
          annualTeamBuilding: 0.85,
          volunteerPrograms: 0.62,
          wellnessInitiatives: 0.78,
        },
      },
    },
  };

  // Easier to reference specific sections
  const officeOverview = data.collectiveEmployeeReport.officeOverview;
  const performanceSummary = data.collectiveEmployeeReport.performanceSummary;
  const attendanceAnalysis = data.collectiveEmployeeReport.attendanceAndLeaveAnalysis;
  const projectMetrics = data.collectiveEmployeeReport.projectAndProductivityMetrics;
  const turnover = data.collectiveEmployeeReport.employeeTurnover;
  const engagement = data.collectiveEmployeeReport.employeeEngagement;

  // Chart configurations
  const departmentChartData = {
    labels: Object.keys(officeOverview.departmentDistribution),
    datasets: [
      {
        label: "Employees",
        data: Object.values(officeOverview.departmentDistribution),
        backgroundColor: [
          "rgba(163, 163, 163, 0.7)",
          "rgba(138, 138, 138, 0.7)",
          "rgba(115, 115, 115, 0.7)",
          "rgba(82, 82, 82, 0.7)",
          "rgba(64, 64, 64, 0.7)",
          "rgba(38, 38, 38, 0.7)",
        ],
        borderColor: [
          "rgba(212, 212, 212, 1)",
          "rgba(190, 190, 190, 1)",
          "rgba(163, 163, 163, 1)",
          "rgba(115, 115, 115, 1)",
          "rgba(82, 82, 82, 1)",
          "rgba(64, 64, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const ageChartData = {
    labels: Object.keys(officeOverview.ageDemographics),
    datasets: [
      {
        label: "Employees",
        data: Object.values(officeOverview.ageDemographics),
        backgroundColor: "rgba(163, 163, 163, 0.7)",
        borderColor: "rgba(212, 212, 212, 1)",
        borderWidth: 1,
      },
    ],
  };

  const genderChartData = {
    labels: ["Male", "Female", "Non-Binary"],
    datasets: [
      {
        label: "Gender Distribution",
        data: [
          officeOverview.genderDiversityRatio.male * 100,
          officeOverview.genderDiversityRatio.female * 100,
          officeOverview.genderDiversityRatio.nonBinary * 100,
        ],
        backgroundColor: [
          "rgba(163, 163, 163, 0.7)",
          "rgba(115, 115, 115, 0.7)",
          "rgba(82, 82, 82, 0.7)",
        ],
        borderColor: ["rgba(212, 212, 212, 1)", "rgba(163, 163, 163, 1)", "rgba(115, 115, 115, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const productivityChartData = {
    labels: Object.keys(projectMetrics.productivityIndicatorsByDepartment),
    datasets: [
      {
        label: "Productivity Score",
        data: Object.values(projectMetrics.productivityIndicatorsByDepartment),
        backgroundColor: "rgba(163, 163, 163, 0.7)",
        borderColor: "rgba(212, 212, 212, 1)",
        borderWidth: 1,
      },
    ],
  };

  const employeeMetricsData = {
    labels: ["Performance", "Goal Achievement", "Attendance", "Engagement"],
    datasets: [
      {
        label: "Score",
        data: [
          (performanceSummary.averagePerformanceRating / 5) * 100,
          performanceSummary.overallGoalAchievementRate * 100,
          attendanceAnalysis.averageAttendanceRate,
          (engagement.lastSurveyResults.overallEngagementScore / 5) * 100,
        ],
        backgroundColor: "rgba(163, 163, 163, 0.2)",
        borderColor: "rgba(212, 212, 212, 1)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Card Component
  const StatCard = ({ icon, title, value, subtitle, color = "bg-neutral-900" }: {icon: ReactElement; title: string; value: string; subtitle: string; color?: string}) => (
    <div className={`${color} rounded-lg p-4 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <h3 className="text-2xl font-semibold text-neutral-300">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-neutral-600">{subtitle}</p>}
        </div>
        <div className="rounded-full bg-neutral-800 p-3 shadow-sm">{icon}</div>
      </div>
    </div>
  );

  // Chart Card Component
  const ChartCard = ({ title, children } : {title: string; children: ReactElement}) => (
    <div className="rounded-lg bg-neutral-900 p-4 shadow-md">
      <h3 className="mb-4 text-lg font-medium text-neutral-400">{title}</h3>
      {children}
    </div>
  );

  // Section Header Component
  const SectionHeader = ({ title }: {title: string}) => (
    <div className="mb-4 border-b border-neutral-800 pb-2">
      <h2 className="text-xl font-semibold text-neutral-300">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen px-4 md:px-6 pt-4 pb-4 md:pb-6 xl:px-40 2xl:px-60">
      <div className="mx-auto">
        <main>
          <SectionHeader title="Overview" />
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<CustomIcons.Users />}
              title="Total Employees"
              value={officeOverview.totalEmployees.toString()}
              subtitle="Across 6 departments"
            />
            <StatCard
              icon={<CustomIcons.TrendingUp />}
              title="Goal Achievement"
              value={`${(performanceSummary.overallGoalAchievementRate * 100).toFixed(0)}%`}
              subtitle="Overall company performance"
            />
            <StatCard
              icon={<CustomIcons.LogOut />}
              title="Turnover Rate"
              value={`${(turnover.turnoverRate * 100).toFixed(1)}%`}
              subtitle="Annual employee turnover"
            />
            <StatCard
              icon={<CustomIcons.Calendar />}
              title="Attendance Rate"
              value={`${attendanceAnalysis.averageAttendanceRate}%`}
              subtitle="Average daily attendance"
            />
          </div>

          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <ChartCard title="Department Distribution">
              <div className="h-64">
                <Pie
                  data={departmentChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d4d4d8", // neutral-400
                        },
                      },
                    },
                  }}
                />
              </div>
            </ChartCard>
            <ChartCard title="Employee Metrics">
              <div className="h-64">
                <Line
                  data={employeeMetricsData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: "Percentage (%)",
                          color: "#a1a1aa", // neutral-500
                        },
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                      x: {
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d4d4d8", // neutral-400
                        },
                      },
                    },
                  }}
                />
              </div>
            </ChartCard>
          </div>

          {/* Demographics Section */}
          <SectionHeader title="Demographics" />
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <ChartCard title="Gender Diversity">
              <div className="h-64">
                <Pie
                  data={genderChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d4d4d8", // neutral-400
                        },
                      },
                    },
                  }}
                />
              </div>
            </ChartCard>
            <ChartCard title="Age Demographics">
              <div className="h-64">
                <Bar
                  data={ageChartData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Employees",
                          color: "#a1a1aa", // neutral-500
                        },
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                      x: {
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d4d4d8", // neutral-400
                        },
                      },
                    },
                  }}
                />
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Department Breakdown">
            <div className="h-72">
              <Bar
                data={departmentChartData}
                options={{
                  indexAxis: "y",
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Number of Employees",
                        color: "#a1a1aa", // neutral-500
                      },
                      grid: {
                        color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                      },
                      ticks: {
                        color: "#a1a1aa", // neutral-500
                      },
                    },
                    y: {
                      grid: {
                        color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                      },
                      ticks: {
                        color: "#a1a1aa", // neutral-500
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: "#d4d4d8", // neutral-400
                      },
                    },
                  },
                }}
              />
            </div>
          </ChartCard>

          {/* Performance Section */}
          <SectionHeader title="Performance" />
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<CustomIcons.Award />}
              title="Avg. Performance Rating"
              value={performanceSummary.averagePerformanceRating.toString()}
              subtitle="Out of 5.0"
            />
            <StatCard
              icon={<CustomIcons.TrendingUp />}
              title="Goal Achievement"
              value={`${(performanceSummary.overallGoalAchievementRate * 100).toFixed(0)}%`}
              subtitle="Company-wide target attainment"
            />
            <StatCard
              icon={<CustomIcons.Briefcase />}
              title="Active Projects"
              value={projectMetrics.activeProjects.toString()}
              subtitle="Across all departments"
            />
          </div>

          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <ChartCard title="Productivity by Department">
              <div className="h-64">
                <Bar
                  data={productivityChartData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                          display: true,
                          text: "Productivity Score",
                          color: "#a1a1aa", // neutral-500
                        },
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                      x: {
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d4d4d8", // neutral-400
                        },
                      },
                    },
                  }}
                />
              </div>
            </ChartCard>
            <ChartCard title="Top Performers">
              <div className="h-64 overflow-auto">
                <div className="space-y-4">
                  {Object.entries(performanceSummary.topPerformersByDepartment).map(
                    ([dept, performers]) => (
                      <div key={dept}>
                        <h4 className="font-medium text-neutral-400">{dept}</h4>
                        <ul className="ml-4 mt-2 list-disc text-neutral-500">
                          {performers.map((performer, index) => (
                            <li key={index}>{performer}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Engagement Section */}
          <SectionHeader title="Engagement" />
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<CustomIcons.Heart />}
              title="Engagement Score"
              value={engagement.lastSurveyResults.overallEngagementScore.toString()}
              subtitle="Out of 5.0"
            />
            <StatCard
              icon={<CustomIcons.Users />}
              title="Survey Participation"
              value={`${(engagement.lastSurveyResults.participationRate * 100).toFixed(0)}%`}
              subtitle="Last employee survey"
            />
            <StatCard
              icon={<CustomIcons.LogOut />}
              title="Turnover Rate"
              value={`${(turnover.turnoverRate * 100).toFixed(1)}%`}
              subtitle="Annual employee turnover"
            />
          </div>

          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <ChartCard title="Event Participation">
              <div className="h-64">
                <Bar
                  data={{
                    labels: ["Team Building", "Volunteer Programs", "Wellness Initiatives"],
                    datasets: [
                      {
                        label: "Participation Rate",
                        data: [
                          engagement.companyEventParticipation.annualTeamBuilding,
                          engagement.companyEventParticipation.volunteerPrograms,
                          engagement.companyEventParticipation.wellnessInitiatives,
                        ],
                        backgroundColor: "rgba(163, 163, 163, 0.7)",
                        borderColor: "rgba(212, 212, 212, 1)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                          display: true,
                          text: "Participation Rate",
                          color: "#a1a1aa", // neutral-500
                        },
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                      x: {
                        grid: {
                          color: "rgba(113, 113, 122, 0.2)", // neutral-600 with opacity
                        },
                        ticks: {
                          color: "#a1a1aa", // neutral-500
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d4d4d8", // neutral-400
                        },
                      },
                    },
                  }}
                />
              </div>
            </ChartCard>
            <ChartCard title="Top Reasons for Leaving">
              <div className="h-64 flex flex-col justify-center">
                <div className="space-y-4">
                  {turnover.topReasonsForLeaving.map((reason, index) => {
                    // Create a decreasing width percentage based on position in array
                    const widthPercentage = 75 - index * 12.5;

                    return (
                      <div key={index} className="flex flex-col">
                        <span className="text-sm text-neutral-500">{reason}</span>
                        <div className="mt-1 h-2 w-full rounded-full bg-neutral-800">
                          <div
                            className="h-2 rounded-full bg-neutral-500"
                            style={{ width: `${widthPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollectiveReport;
