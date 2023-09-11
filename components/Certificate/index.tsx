import Image from "next/image";

export interface CertificateProps {
    id:string
    image:string;
    title:string;
    content:string;
}

export const Certificate = ({content, image, title}:CertificateProps) => {


    return (
        <div className="certificate">
            <Image className='certificate-image' src={require('../../assets/img/unisul.jpeg')} alt={title} />
            <div className="certificate-details">
                <p className="certificate-title">{title}</p>
                <p  className="certificate-description">{content}</p>
            </div>
            
        </div>
    )
}