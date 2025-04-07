import React, { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";
import { Download } from "lucide-react";
import { apiClient, routes } from "@/lib/api";
import html2canvas from 'html2canvas-pro';
import { useLocation, useNavigate } from "react-router";
import { useReportContext } from "@/context/ReportContext";
import jsPDF from "jspdf";
import { ProgressBar, BarChart } from "@/components/charts";

ChartJS.register(
  ArcElement,
  Tooltip,
);

interface ReportTypes {
  "Total Employees": number;
  "Total Attention Employees": number;
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
  "Employee ID": string; // Added this property
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
  const reportRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { employeeIds } = useReportContext();
  const [reportData, setReportData] = useState<ReportTypes | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const handleDownloadPDF = async () => {
    if (!reportRef.current || !reportData) return;
  
    try {
      setIsGeneratingPDF(true);
  
      const reportElement = reportRef.current;
      const canvas = await html2canvas(reportElement, {
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#171717"
      });
  
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const pxPerMm = canvas.width / imgWidth;
      const pageHeightPx = pageHeight * pxPerMm;
  
      const pdf = new jsPDF('p', 'mm', 'a4');
  
      let renderedHeight = 0;
      let pageNum = 0;
  
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
  
      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
  
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
  
        if (pageCtx) {
          // Fill background color
          pageCtx.fillStyle = "#171717";
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  
          // Draw the sliced part of the original canvas
          pageCtx.drawImage(
            canvas,
            0, renderedHeight, canvas.width, sliceHeight,
            0, 0, canvas.width, sliceHeight
          );
        }
  
        const imgData = pageCanvas.toDataURL('image/png');
  
        if (pageNum > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, sliceHeight / pxPerMm);
  
        renderedHeight += sliceHeight;
        pageNum++;
      }
  
      pdf.save(`Employee_Report_${reportData["Employee ID"]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
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
    primary: "#e0b200",
    accent:  "#e0b20005",
    background: "#171717",
    text: "#D4D4D4",
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
         <div className="flex justify-end">
  <button
    onClick={handleDownloadPDF}
    disabled={isGeneratingPDF}
    className="my-4 cursor-pointer md:mt-0 flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-4 rounded-lg transition-colors duration-200"
  >
    <Download size={18}  />
    {isGeneratingPDF ? "Generating PDF..." : "Download as PDF"}
  </button>
</div>
        <div ref={reportRef}>

        
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card title="Total Employees" value={reportData["Total Employees"]} />
            <Card title="Employees for Attention!!" value={reportData["Total Attention Employees"]} />

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
                {reportData && communicationData && <BarChart chartData={communicationData} />}
            </div>
            <div className="flex flex-col gap-6 bg-neutral-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-neutral-300">Performance</h2>
              <div className="relative grid place-content-center w-full h-full">
                <div className="mx-auto max-w-[75vw]">
                  {performanceData && <Doughnut data={performanceData} options={doughnutOptions} />}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-1/2 flex flex-col gap-1 items-center justify-center">
                  <span className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-neutral-300">
                    {reportData["Average Performance Rating"].toFixed(1)}
                  </span>
                  <span className="text-xs sm:text-base text-neutral-500">out of 5</span>
                </div>
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
