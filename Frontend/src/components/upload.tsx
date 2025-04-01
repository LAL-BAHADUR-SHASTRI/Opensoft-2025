import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jschardet from "jschardet";
import { useNavigate } from "react-router";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [errDesc, setErrDesc] = useState("");
  const navigate = useNavigate();

  const nameList: string[] = [
    "activity_tracker_dataset.csv",
    "leave_dataset.csv",
    "onboarding_dataset.csv",
    "performance_dataset.csv",
    "rewards_dataset.csv",
    "vibemeter_dataset.csv",
  ];

  const closeAlert = () => {
    setOpen(false);
  };

  const filePipeline = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles: File[] = [];
    Array.from(newFiles).forEach((file, index) => {
      if (file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
        setErrDesc(`File ${file.name} is not a CSV file.`);
        setErrMsg("File type error");
        setOpen(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return;
        const uint8Array = new Uint8Array(e.target.result as ArrayBuffer);
        const text = new TextDecoder().decode(uint8Array);
        const result = jschardet.detect(text);

        if (result.encoding === "UTF-8" || result.encoding === "ascii") {
          if (!files.some((existingFile) => existingFile.name === file.name)) {
            validFiles.push(file);
          }
        } else {
          setErrDesc(`File ${file.name} is not UTF-8 encoded.`);
          setErrMsg("Encoding error");
          setOpen(true);
        }

        if (index === newFiles.length - 1) {
          setFiles((prevFiles) => [...prevFiles, ...validFiles]);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    filePipeline(event.target.files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    filePipeline(event.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    try {
      if (files.length < 6) {
        setErrDesc("You need to upload exactly 6 files.");
        setErrMsg("Error");
        setOpen(true);
        return;
      }

      for (const name of nameList) {
        if (!files.some((file) => file.name === name)) {
          setErrDesc(`File ${name} is missing.`);
          setErrMsg("Missing files");
          setOpen(true);
          return;
        }
      }

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`${BASE_URL}/upload-csv/`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setErrMsg("Files uploaded successfully");
        setErrDesc("Redirecting to dashboard...");
        setTimeout(() => navigate("/admin"), 2000);
      } else {
        setErrDesc("An error occurred while uploading.");
        setErrMsg("Upload failed");
      }
    } catch (error) {
      setErrMsg("Network error");
      setErrDesc("Check your connection and try again.");
    }
    setOpen(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
      <Card
        className={`text-white py-6 shadow-lg rounded-lg transition-all bg-neutral-900 border-2 ${
          dragActive ? "border-neutral-400" : "border-neutral-800"
        }`}
      >
        <CardContent className="flex gap-10 flex-wrap justify-center">
          <div className="flex flex-col gap-4 max-w-lg min-w-[300px]">
            <h2 className="text-xl font-bold">Upload Files</h2>
            <div
              className="border border-dashed border-neutral-700 p-6 text-center rounded-md cursor-pointer"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <p>Drag & drop files here or click to select</p>
            </div>
            <Input
              id="fileInput"
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="text/csv"
            />
            {files.length > 0 && (
              <ul className="text-sm text-neutral-300">
                {files.map((file, index) => (
                  <li key={index} className="flex justify-between my-2">
                    {file.name}
                    <Button variant="outline" onClick={() => removeFile(index)}>
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={handleUpload} disabled={files.length !== 6} >
              Upload Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Modal for Alerts */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold">{errMsg}</h3>
            <p className="text-sm text-gray-600 mt-2">{errDesc}</p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={closeAlert}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
