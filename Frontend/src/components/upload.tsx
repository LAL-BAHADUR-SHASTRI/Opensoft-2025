import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import jschardet from "jschardet";
import { apiClient, routes } from "@/lib/api";

import { useNavigate } from "react-router";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function Upload() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [errDesc, setErrDesc] = useState("");

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
    if (files.length != 6) {
      setDragActive(true);
      filePipeline(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (files.length != 6) {
      setDragActive(true);
    }
  };

  // useEffect(() => {
  //   console.log(files);
  // }, [files]);

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
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

    try {
      const response = await apiClient.post(routes.UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (response.status === 201 || response.status === 200) {
        setErrMsg("Files uploaded successfully");
        setErrDesc("Redirecting to dashboard...");
        setTimeout(() => navigate("/admin"), 2000);
      } else {
        setErrDesc("An error occurred while uploading.");
        setErrMsg("Upload failed");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrMsg("Network error");
      setErrDesc("Check your connection and try again.");
    }
    setOpen(true);
  };

  return (
    <div
      className="z-10 fixed top-0 left-0 w-full h-full grid place-content-center bg-neutral-950/60"
      onClick={() => navigate("/admin")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center bg-neutral-950 text-white rounded-lg"
      >
        <Card
          className={`text-white py-6 shadow-lg rounded-lg transition-all bg-neutral-900 border-2 border-neutral-800 ${
            dragActive && "border-neutral-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex gap-10 flex-wrap justify-center">
            <div className="flex flex-col gap-5 max-w-lg min-w-[300px]">
              <h2 className="text-xl font-bold">Upload Files</h2>

              <div className="flex flex-col gap-4">
                <div
                  className={`border border-dashed border-neutral-700 p-6 text-center rounded-md cursor-pointer ${
                    files.length == 6 ? "hidden" : ""
                  }`}
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

                {files.length !== 0 && (
                  <div className="text-muted-foreground text-sm flex flex-col gap-3">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-neutral-300"
                      >
                        {file.name}
                        <Button
                          variant="outline"
                          className="bg-transparent border-neutral-400 text-neutral-400 cursor-pointer"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="disabled:bg-neutral-500 disabled:text-neutral-200 bg-neutral-300 text-neutral-900 hover:bg-neutral-400 hover:text-neutral-900 cursor-pointer"
                onClick={handleUpload}
                disabled={files.length === 0}
              >
                Upload Files
              </Button>
            </div>
            <div className="flex flex-col gap-4 text-white max-w-lg min-w-[300px] bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold">Instructions</h2>
              <h3>Upload 6 CSV files as </h3>
              <ul className="flex flex-col gap-2 text-neutral-400 text-sm list-disc ml-8">
                {nameList.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
              <div className=""></div>
            </div>
          </CardContent>
        </Card>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent className="bg-neutral-900 p-4 text-white border border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">{errMsg}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">{errDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel
                onClick={closeAlert}
                className="bg-white text-black focus:outline-none active:outline-none"
              >
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
