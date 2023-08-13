interface TitleProps {
    name:string;
    lineDirection: 'left' | 'right'
}

export const Title = ({name, lineDirection}:TitleProps) => {

    return (
    <div className="section-title-container">
        <h3 className="section-title">{name}</h3>
        <div className="line-container">
            <span className={`line ${lineDirection === 'left' && 'border-primary'}`}/>
            <span className={`line ${lineDirection === 'right' && 'border-primary'}`}/>
        </div>

    </div>)
}