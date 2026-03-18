"use client";

import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export function DownloadCV() {
  function handleDownloadCV(action: "download" | "open") {
    const link = document.createElement("a");
    link.href = "/wilson-medeiros-cv.pdf";

    if (action === "download") {
      link.download = "wilson-medeiros-cv.pdf";
    } else {
      link.target = "_blank";
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return (
    <span className="flex">
      <Button
        onClick={() => handleDownloadCV("open")}
        className="uppercase bg-primary rounded w-fit p-6 px-15 cursor-pointer font-bold text-sm tracking-wide rounded-br-none rounded-tr-none border-r-2 border-r-primary-foreground"
      >
        Open CV
      </Button>
      <Button
        onClick={() => handleDownloadCV("download")}
        className="uppercase bg-primary rounded w-fit p-6 px-15 cursor-pointer font-bold text-sm tracking-wide rounded-bl-none rounded-tl-none"
      >
        <DownloadIcon />
      </Button>
    </span>
  );
}
