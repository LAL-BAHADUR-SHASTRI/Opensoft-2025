import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

  const closeAlert = () => {
    setOpen(false);
  };

  const filePipeline = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    const validFiles: File[] = [];

    filesArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (!e.target?.result) return;

        const uint8Array = new Uint8Array(e.target.result as ArrayBuffer);
        const text = new TextDecoder().decode(uint8Array);
        const result = jschardet.detect(text);

        console.log(result);
        if (result.encoding === "UTF-8" || result.encoding === "ascii") {
          if (!files.some((existingFile) => existingFile.name === file.name)) {
            validFiles.push(file);
          } else {
            console.log(`Duplicate file skipped: ${file.name}`);
          }
        } else {
          setErrMsg(`File ${file.name} is not UTF-8 encoded. Please upload a UTF-8 encoded file.`);
          setOpen(true);
          setDragActive(false);
        }

        if (index === filesArray.length - 1) {
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

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (files.length < 6) {
      setErrMsg("You need to upload at least 6 files");
      setErrDesc("");
      setOpen(true);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch(`${BASE_URL}/upload-csv/`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setErrMsg("Files uploaded successfully");
        setErrDesc("Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/admin");
        });
        setOpen(true);
      } else {
        setErrMsg("An error occurred while uploading files. Please try again.");
        setErrDesc("");
        setOpen(true);
        setDragActive(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrMsg("An error occurred while uploading files. Please try again.");
      setOpen(true);
      setDragActive(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
      <Card
        className={`text-white py-6 shadow-lg rounded-lg transition-all bg-neutral-900 border-2 border-neutral-800 ${dragActive && "border-neutral-400"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex gap-10 flex-wrap justify-center">
          <div className="flex flex-col gap-4 max-w-lg min-w-[300px]">
            <h2 className="text-xl font-bold">Upload Files</h2>

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
            />

            {files.length > 0 && (
              <ul className="text-muted-foreground text-sm">
                {files.map((file, index) => (
                  <li key={index} className="flex justify-between items-center my-2">
                    {file.name}
                    <Button variant="outline" size="icon" onClick={() => removeFile(index)}>
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              className="disabled:bg-neutral-500 disabled:text-neutral-200"
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              Upload Files
            </Button>
          </div>
          <div className="flex flex-col gap-4 text-white max-w-lg min-w-[300px] bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold">Instructions</h2>
            <h3>Upload 6 CSV files as </h3>
            <ul className="flex flex-col gap-2 text-neutral-500 text-sm list-disc ml-8">
              <li>leave_dataset.csv</li>
              <li>onboarding_dataset.csv</li>
              <li>performance_dataset.csv</li>
              <li>rewards_dataset.csv</li>
              <li>vibemeter_dataset.csv</li>
            </ul>
            <div className=""></div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-neutral-900 p-4 text-white border border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">Error</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">{errMsg}</AlertDialogDescription>
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
  );
}
