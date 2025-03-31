import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";

import {
  CheckCircle,
  AlertCircle,
  Award,
  Book,
  Calendar,
  DollarSign,
  Briefcase,
} from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
);

const EmployeeReport = () => {
  const employeeData = {
    personalInformation: {
      fullName: "John Doe",
      employeeId: "EMP001",
      dateOfBirth: "1985-05-15",
      contactDetails: {
        phone: "+1234567890",
        email: "john.doe@company.com",
      },
      department: "Marketing",
      position: "Senior Marketing Specialist",
      dateOfJoining: "2018-03-01",
    },
    performanceMetrics: {
      kpis: [
        {
          name: "Sales Leads Generated",
          value: 150,
          target: 120,
        },
        {
          name: "Customer Satisfaction Score",
          value: 4.8,
          target: 4.5,
        },
      ],
      goalsAchieved: 5,
      goalsSet: 6,
      lastPerformanceRating: 4.2,
    },
    attendanceAndLeave: {
      attendanceRate: 98.5,
      leaveBalance: {
        annual: 10,
        sick: 5,
        personal: 2,
      },
      sickDaysTaken: 3,
    },
    compensationAndBenefits: {
      currentSalary: 75000,
      lastBonus: 5000,
      benefitsEnrolled: ["Health Insurance", "401(k)", "Dental Plan"],
    },
    skillsAndTraining: {
      skills: ["Digital Marketing", "SEO", "Content Strategy", "Data Analysis"],
      completedTrainings: [
        {
          name: "Advanced SEO Techniques",
          date: "2024-11-10",
        },
        {
          name: "Leadership Skills 101",
          date: "2025-01-15",
        },
      ],
      certifications: ["Google Analytics Certified", "HubSpot Inbound Marketing"],
    },
    careerDevelopment: {
      careerPath: "Marketing Manager",
      promotionsHistory: [
        {
          fromPosition: "Marketing Specialist",
          toPosition: "Senior Marketing Specialist",
          date: "2022-04-01",
        },
      ],
      areasForImprovement: ["Project Management", "Team Leadership"],
    },
    projectsAndContributions: {
      currentProjects: [
        {
          name: "Q2 Marketing Campaign",
          role: "Project Lead",
        },
        {
          name: "Website Redesign",
          role: "Content Strategist",
        },
      ],
      keyAchievements: [
        "Increased organic traffic by 25% through SEO optimization",
        "Led successful product launch campaign resulting in 10,000 new customers",
      ],
    },
    complianceAndDocumentation: {
      requiredDocuments: [
        {
          name: "Annual Compliance Training",
          status: "Completed",
          expirationDate: "2026-03-15",
        },
        {
          name: "Data Protection Certification",
          status: "Pending",
          dueDate: "2025-05-01",
        },
      ],
    },
  };

  // Calculate years of service
  const calculateYearsOfService = () => {
    const joinDate = new Date(employeeData.personalInformation.dateOfJoining);
    const currentDate = new Date();
    return Math.floor((currentDate - joinDate) / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Format date from ISO to readable format
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Calculate age
  const calculateAge = () => {
    const birthDate = new Date(employeeData.personalInformation.dateOfBirth);
    const currentDate = new Date();
    return Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  };

  // KPI performance data for bar chart
  const kpiChartData = {
    labels: employeeData.performanceMetrics.kpis.map((kpi) => kpi.name),
    datasets: [
      {
        label: "Actual",
        data: employeeData.performanceMetrics.kpis.map((kpi) => kpi.value),
        backgroundColor: "rgba(115, 115, 115, 0.7)",
        borderWidth: 1,
        borderColor: "rgba(163, 163, 163, 1)",
      },
      {
        label: "Target",
        data: employeeData.performanceMetrics.kpis.map((kpi) => kpi.target),
        backgroundColor: "rgba(82, 82, 82, 0.7)",
        borderWidth: 1,
        borderColor: "rgba(115, 115, 115, 1)",
      },
    ],
  };

  // Goals chart data
  const goalsChartData = {
    labels: ["Achieved", "Remaining"],
    datasets: [
      {
        data: [
          employeeData.performanceMetrics.goalsAchieved,
          employeeData.performanceMetrics.goalsSet - employeeData.performanceMetrics.goalsAchieved,
        ],
        backgroundColor: ["rgba(64, 64, 64, 0.7)", "rgba(38, 38, 38, 0.7)"],
        borderColor: ["rgba(82, 82, 82, 1)", "rgba(64, 64, 64, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Leave balance chart data
  const leaveChartData = {
    labels: ["Annual", "Sick", "Personal"],
    datasets: [
      {
        label: "Days",
        data: [
          employeeData.attendanceAndLeave.leaveBalance.annual,
          employeeData.attendanceAndLeave.leaveBalance.sick,
          employeeData.attendanceAndLeave.leaveBalance.personal,
        ],
        backgroundColor: [
          "rgba(138, 138, 138, 0.7)",
          "rgba(115, 115, 115, 0.7)",
          "rgba(82, 82, 82, 0.7)",
        ],
        borderColor: ["rgba(190, 190, 190, 1)", "rgba(163, 163, 163, 1)", "rgba(115, 115, 115, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Skills radar chart data
  const skillsChartData = {
    labels: employeeData.skillsAndTraining.skills,
    datasets: [
      {
        label: "Skills Proficiency",
        data: [4.5, 4.2, 4.0, 3.8],
        backgroundColor: "rgba(115, 115, 115, 0.7)",

        borderColor: "rgba(163, 163, 163, 1)",

        pointBackgroundColor: "rgba(82, 82, 82, 0.7)",
        pointBorderColor: "rgba(115, 115, 115, 1)",
        pointHoverBackgroundColor: "rgba(138, 138, 138, 0.7)",
        pointHoverBorderColor: "rgba(190, 190, 190, 1)",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <main className="mx-auto px-4 md:px-6 pb-4 pt-4 md:pb-6 xl:px-40 2xl:px-60">
        {/* Personal Information Card */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center text-4xl font-bold text-neutral-600">
                    {employeeData.personalInformation.fullName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center">
                  {employeeData.personalInformation.fullName}
                </h3>
                <p className="text-neutral-500 text-center">
                  {employeeData.personalInformation.employeeId}
                </p>
              </div>

              <div>
                <div className="mb-4">
                  <p className="text-neutral-500">Email</p>
                  <p>{employeeData.personalInformation.contactDetails.email}</p>
                </div>
                <div className="mb-4">
                  <p className="text-neutral-500">Phone</p>
                  <p>{employeeData.personalInformation.contactDetails.phone}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Date of Birth</p>
                  <p>
                    {formatDate(employeeData.personalInformation.dateOfBirth)} ({calculateAge()}{" "}
                    years)
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <p className="text-neutral-500">Department</p>
                  <p>{employeeData.personalInformation.department}</p>
                </div>
                <div className="mb-4">
                  <p className="text-neutral-500">Position</p>
                  <p>{employeeData.personalInformation.position}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Date of Joining</p>
                  <p>
                    {formatDate(employeeData.personalInformation.dateOfJoining)} (
                    {calculateYearsOfService()} years)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Performance Metrics
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">KPI Performance</h3>
                <div className="h-64">
                  <Bar
                    data={kpiChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            color: "#f3f4f6",
                          },
                        },
                      },
                      scales: {
                        y: {
                          ticks: { color: "#f3f4f6" },
                          grid: { color: "rgba(255, 255, 255, 0.05)" },
                        },
                        x: {
                          ticks: { color: "#f3f4f6" },
                          grid: { color: "rgba(255, 255, 255, 0.05)" },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Goals Progress</h3>
                <div className="flex flex-col items-center">
                  <div className="h-64 w-64">
                    <Doughnut
                      data={goalsChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              color: "#f3f4f6",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold">
                      {employeeData.performanceMetrics.goalsAchieved}
                    </span>
                    <span className="text-neutral-500">
                      {" "}
                      / {employeeData.performanceMetrics.goalsSet} goals achieved
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Rating</h3>
              <div className="flex items-center">
                <div className="w-full bg-neutral-900 rounded-full h-4">
                  <div
                    className="bg-neutral-300 h-4 rounded-full"
                    style={{
                      width: `${
                        (employeeData.performanceMetrics.lastPerformanceRating / 5) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="ml-4 font-bold text-xl">
                  {employeeData.performanceMetrics.lastPerformanceRating}/5
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Attendance and Leave */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Attendance & Leave
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Attendance Rate</h3>
                <div className="flex items-center">
                  <div className="w-full bg-neutral-900 rounded-full h-4">
                    <div
                      className="bg-neutral-200 h-4 rounded-full"
                      style={{ width: `${employeeData.attendanceAndLeave.attendanceRate}%` }}
                    ></div>
                  </div>
                  <span className="ml-4 font-bold text-xl">
                    {employeeData.attendanceAndLeave.attendanceRate}%
                  </span>
                </div>
                <div className="bg-neutral-800 rounded-lg mt-4">
                  <h3 className="text-lg font-semibold mb-2">Sick Days</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-neutral-900 rounded-full h-4">
                      <div
                        className="bg-neutral-200 h-4 rounded-full"
                        style={{
                          width: `${
                            (employeeData.attendanceAndLeave.sickDaysTaken /
                              employeeData.attendanceAndLeave.leaveBalance.sick) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="ml-4 font-bold text-xl">
                      {employeeData.attendanceAndLeave.sickDaysTaken}/
                      {employeeData.attendanceAndLeave.leaveBalance.sick}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Leave Balance</h3>
                <div className="h-64">
                  <Bar
                    data={leaveChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          ticks: { color: "#f3f4f6" },
                          grid: { color: "rgba(255, 255, 255, 0.1)" },
                        },
                        x: {
                          ticks: { color: "#f3f4f6" },
                          grid: { color: "rgba(255, 255, 255, 0.1)" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compensation and Benefits */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Compensation & Benefits
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <DollarSign className="text-neutral-300 mr-2" size={24} />
                  <h3 className="text-lg font-semibold">Financial</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-neutral-500">Current Salary</p>
                    <p className="text-2xl font-bold">
                      ${employeeData.compensationAndBenefits.currentSalary.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Last Bonus</p>
                    <p className="text-xl font-semibold">
                      ${employeeData.compensationAndBenefits.lastBonus.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="text-neutral-300 mr-2" size={24} />
                  <h3 className="text-lg font-semibold">Benefits Enrolled</h3>
                </div>
                <ul className="space-y-2">
                  {employeeData.compensationAndBenefits.benefitsEnrolled.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-neutral-500 rounded-full mr-2"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Skills and Training */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Skills & Training
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Skills Profile</h3>
                <div className="h-96 w-full grid place-content-center">
                  <Radar
                    className="h-full w-full"
                    data={skillsChartData}
                    options={{
                      responsive: true,
                      scales: {
                        r: {
                          angleLines: {
                            color: "rgba(255, 255, 255, 0.05)",
                          },
                          grid: {
                            color: "rgba(255, 255, 255, 0.05)",
                          },
                          pointLabels: {
                            color: "#f3f4f6",
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: "#f3f4f6",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-neutral-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Book className="text-neutral-300 mr-2" size={24} />
                    <h3 className="text-lg font-semibold">Completed Trainings</h3>
                  </div>
                  <ul className="space-y-4">
                    {employeeData.skillsAndTraining.completedTrainings.map((training, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center border-b border-neutral-700 pb-2"
                      >
                        <span>{training.name}</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDate(training.date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Award className="text-neutral-300 mr-2" size={24} />
                    <h3 className="text-lg font-semibold">Certifications</h3>
                  </div>
                  <ul className="space-y-2">
                    {employeeData.skillsAndTraining.certifications.map((cert, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-neutral-500 rounded-full mr-2"></div>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Career Development */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Career Development
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Briefcase className="text-neutral-300 mr-2" size={24} />
                  <h3 className="text-lg font-semibold">Career Path</h3>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 h-2 bg-neutral-700 rounded-full relative">
                    <div className="absolute -mt-1 ml-24 h-4 w-4 bg-neutral-300 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between text-sm">
                  <div>
                    <div className="font-semibold">{employeeData.personalInformation.position}</div>
                    <div className="text-neutral-500">Current</div>
                  </div>
                  <div>
                    <div className="font-semibold">{employeeData.careerDevelopment.careerPath}</div>
                    <div className="text-neutral-500">Next</div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="text-neutral-300 mr-2" size={24} />
                  <h3 className="text-lg font-semibold">Promotion History</h3>
                </div>
                <ul className="space-y-4">
                  {employeeData.careerDevelopment.promotionsHistory.map((promotion, index) => (
                    <li key={index} className="border-l-2 border-neutral-300 pl-4 pb-4">
                      <div className="text-sm text-neutral-500">{formatDate(promotion.date)}</div>
                      <div className="font-semibold">
                        {promotion.fromPosition} → {promotion.toPosition}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-neutral-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="text-neutral-300 mr-2" size={24} />
                <h3 className="text-lg font-semibold">Areas for Improvement</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employeeData.careerDevelopment.areasForImprovement.map((area, index) => (
                  <div key={index} className="bg-neutral-900 p-4 rounded-lg">
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Projects and Contributions */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Projects & Contributions
            </h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Current Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employeeData.projectsAndContributions.currentProjects.map((project, index) => (
                  <div key={index} className="bg-neutral-800 p-6 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{project.name}</h4>
                    <p className="text-neutral-500">Role: {project.role}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="w-2/3 h-2 bg-neutral-900 rounded-full">
                        <div
                          className="bg-neutral-200 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-500">In Progress</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Key Achievements</h3>
              <ul className="space-y-4">
                {employeeData.projectsAndContributions.keyAchievements.map((achievement, index) => (
                  <li key={index} className="bg-neutral-800 p-4 rounded-lg flex items-center gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle size={16} />
                    </div>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Compliance and Documentation */}
        <section className="mb-8 bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-2">
              Compliance & Documentation
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-800">
                    <th className="p-4 text-left">Document</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Due/Expiration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeData.complianceAndDocumentation.requiredDocuments.map((doc, index) => (
                    <tr key={index} className="border-b border-neutral-800">
                      <td className="p-4">{doc.name}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            doc.status === "Completed"
                              ? "bg-green-900 text-green-300"
                              : "bg-yellow-900 text-yellow-300"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {doc.expirationDate
                          ? formatDate(doc.expirationDate)
                          : formatDate(doc.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 p-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto text-center text-neutral-500">
          <p>Last Updated: March 31, 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default EmployeeReport;
