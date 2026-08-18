import ArrowDown from "@/assets/icons/arrow-down.svg";
import Image from "next/image";
import Link from "next/link";
export const ScrollDown = () => {
  return (
    <Link
      className="absolute w-fit flex-col gap-4 justify-center items-center z-50"
      href={"#footer"}
    >
      <p className="[writing-mode:vertical-rl] text-primary">Scroll Down</p>
      <Image src={ArrowDown} alt={"arrow down icon"} />
    </Link>
  );
};
