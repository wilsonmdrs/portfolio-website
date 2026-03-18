import { Card, CardContent } from "@/components/ui/card";

export interface QualificationCardProps extends React.ComponentProps<"div"> {
  date: string;
  title: string;
  description: string;
  institution: string;
}

export function QualificationCard({
  date,
  title,
  description,
  institution,
}: QualificationCardProps) {
  return (
    <Card className="min-w-1/3 lg:max-w-[40%] rounded bg-gray-950 hover:bg-gray-800 transition-all duration-500 hover:scale-105">
      <CardContent className="gap-2 flex flex-col">
        <p className="flex text-sm font-medium text-gray-400">{date}</p>
        <p className="flex text-md font-bold text-primary">{title}</p>
        <p className="text-sm font-bold text-gray-300 flex flex-1 h-full">
          {description}
        </p>
        <p className=" flex not-first:text-sm font-medium text-gray-400">
          {institution}
        </p>
      </CardContent>
    </Card>
  );
}
