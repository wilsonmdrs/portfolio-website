interface BackgroundProps {
  children: React.ReactNode;
  backgroundDesign: number[][];
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
}

const Background = ({
  children,
  backgroundDesign = [],
  direction = "row",
}: BackgroundProps) => {
  return (
    <div className="background ">
      <div className="background-content" style={{ flexDirection: direction }}>
        {children}
      </div>
      <div className="background-style">
        {backgroundDesign.map((line: number[], lineIndex: number) => (
          <div key={lineIndex} className={"line"}>
            {line.map((column: number, columnIndex: number) => (
              <div
                key={`line${lineIndex}-column${columnIndex}`}
                className={`column ${column !== 0 && "background-color"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Background;
