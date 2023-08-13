export interface CertificateProps {
    id:string
    image:string;
    title:string;
    content:string;
}

export const Certificate = ({content, image, title}:CertificateProps) => {


    return (
        <div className="certificate">
            <div className='certificate-image' style={{backgroundImage:`url(${image})`}} />
            <div className="certificate-details">
                <p>{title}</p>
                <p>{content}</p>
            </div>
            
        </div>
    )
}