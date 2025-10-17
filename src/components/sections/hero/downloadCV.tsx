"use client";

import { Button } from "@/components/ui/button";

export function DownloadCV() {
  function handleDownloadCV() {
    const link = document.createElement("a");
    link.href = "/wilson-medeiros-cv.pdf";
    link.download = "wilson-medeiros-cv.pdf"; // Optional: customize the download filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return (
    <Button
      onClick={handleDownloadCV}
      className="uppercase bg-primary rounded w-fit p-6 px-15 cursor-pointer font-bold text-sm tracking-wide "
    >
      Download cv
    </Button>
  );
}
