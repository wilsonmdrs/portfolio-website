interface CarouselProps {
    children: React.ReactNode
}

export const Carousel = ({ children }: CarouselProps) => {

    return (
        <div className="carousel">
            {children}
        </div>
    )
}

interface CarouselHeaderProps {
    children: React.ReactNode
}

export const CarouselHeader = ({ children }: CarouselHeaderProps) => {
    return (
        <div className="carousel-header">
            {children}
        </div>
    )
}

interface CarouselBodyProps<TOption> {
    children: React.ReactNode
    data: TOption[];
    getOptionId?: (option: TOption) => string;
}

export const CarouselBody = <TOption,>({ children, data = [], getOptionId = (opt:any) => opt.id }: CarouselBodyProps<TOption>) => {
    return (
        <div className="carousel-body">
            {children}
        </div>
    )
}


interface CarouselFooterProps {
    children: React.ReactNode
}
export const CarouselFooter = ({ children }: CarouselFooterProps) => {
    return (
        <div className="carousel-footer">
            {children}
        </div>
    )
}