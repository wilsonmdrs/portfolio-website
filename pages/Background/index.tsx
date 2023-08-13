
interface BackgroundProps {
    children:React.ReactNode;
    backgroundDesign: number[][];
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
}

const Background = ({children, backgroundDesign = [], direction = 'row'}:BackgroundProps) => {
    
    return (
        <div className="background " >
            <div className="background-content" style={{flexDirection: direction}}>
                {children}
            </div>
            <div className="background-style">
                {backgroundDesign.map((line:number[], index:number) => (
                        <div key={index} className={"line"}>
                            {line.map((column:number, index:number) => (
                                <div key={index} className={`column ${column !== 0 && 'background-color' }`}/>
                            ))}
                        </div>
                    )
                )}
            
            </div>
        </div>
    )
}

export default Background

