'use client'

import {useEffect, useState} from 'react'
import {Kural} from "@/app/domain/kurals-db";
import Image from "next/image";

export default function Home() {
    const [mounted] = useState(true)

    const primaryColor = 'rgb(52, 89, 230)'
    const primaryLight = 'rgb(133, 159, 247)'
    const primaryDark = 'rgb(26, 45, 115)'
    const textColor = 'rgb(33, 33, 33)'
    const backgroundColor = 'rgb(240, 242, 255)'

    const [kural, setKural] = useState<Kural | null>(null);


    useEffect(() => {
        const fetchKuralOfTheDay = async () => {
            try {
                const response = await fetch('/api/daily');
                if (!response.ok) {
                    return;
                }
                const data: Kural = await response.json();
                setKural(data);
            } catch (error) {
                console.error('Error fetching Kural of the Day:', error);
            }
        };

        fetchKuralOfTheDay().then(_ => console.log('kural fetched..!', _));
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: backgroundColor,
            color: textColor,
            padding: '20px',
        }}>
            <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}, ${primaryLight}, ${primaryColor})`,
                backgroundSize: '300% 300%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
                padding: '5px 20px',
                borderRadius: '15px',
                animation: mounted ? 'gradientShift 8s ease infinite' : 'none',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.5s ease-in',
            }}>
                Thirukkural API
            </h1>
            <a href={'/openapi/swagger-ui.html#Kural'} target={"_blank"} style={{
                color: `${primaryColor}`,
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                textDecoration: "none",
                fontWeight: "bold"
            }}>
                <Image src={'/images/api/swagger-logo.png'} alt={'Swagger UI OpenAPI Doc'} width={'50'}
                       height={'50'}/>
                View API Documentation (Swagger UI)
            </a>
            <style jsx>{`
                @keyframes gradientShift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
            `}</style>
            <p className={'content-wrapper'} style={{
                fontSize: '0.9rem',
                color: `${primaryColor}`,
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: '1.6',
                marginBottom: '30px',
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '10px',
                boxShadow: `0 4px 6px ${primaryLight}`,
            }}>
                Explore the ancient wisdom of Thirukkural, a classic Tamil text consisting of 1,330 couplets or Kurals,
                dealing with various aspects of life and morality.
            </p>
            <div className={'content-wrapper'} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: `0 6px 12px ${primaryLight}`,
                width: '100%',
                border: `2px solid ${primaryColor}`,
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    color: primaryDark,
                    marginBottom: '15px',
                    textAlign: 'center',
                }}>
                    Thirukkural of the Day
                </h2>
                <p style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: primaryColor,
                    marginBottom: '15px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    lineHeight: '1.6',
                }}>
                    {kural?.kural[0]}<br/>
                    {kural?.kural[1]}<br/>
                </p>
                <p style={{
                    fontSize: '0.75rem',
                    color: `${primaryColor}`,
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'row',
                    flexBasis: 'content',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                }}>
                    <span>குறள்/Couplet: {kural?.number}</span>
                    <span>பால்/Section: {kural?.section}</span>
                    <span>அதிகாரம்/Chapter: {kural?.chapter}</span>
                </p>
                <p style={{
                    fontSize: '1rem',
                    color: textColor,
                    lineHeight: '1.5',
                    textAlign: 'center',
                    backgroundColor: backgroundColor,
                    padding: '10px',
                    borderRadius: '8px',
                }}>
                    {kural?.meaning['ta_mu_va']}
                </p>
                <p style={{
                    marginTop: '1rem',
                    fontSize: '1rem',
                    color: textColor,
                    lineHeight: '1.5',
                    textAlign: 'center',
                    backgroundColor: backgroundColor,
                    padding: '10px',
                    borderRadius: '8px',
                }}>
                    {kural?.meaning['en']}
                </p>
            </div>

            <hr/>

            <section className={'content-wrapper'} style={{
                padding: '2rem',
                marginTop: '1rem',
                marginBottom: '2rem',
                overflowX: 'auto',
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: `0 6px 12px ${primaryLight}`,
                width: '100%',
                border: `2px solid ${primaryColor}`
            }}>
                <h2 style={{
                    fontSize: '1.5em',
                    color: `${primaryColor}`,
                    marginBottom: '10px',
                    borderBottom: `2px solid ${primaryColor}`,
                    paddingBottom: '5px',
                }}>API Information</h2>
                <div>
                    <p>Please refer <a style={{color: `${primaryColor}`}}
                                       href={'./openapi/swagger-ui.html#Kural'} target={'_blank'}>OpenAPI
                        Specification with Swagger UI</a> for detailed information. </p>
                </div>

                <div className={'api-spec'}>
                    <p style={{color: `${primaryColor}`}}>Use the following API to get kural of the day:</p>
                    <code
                        style={{backgroundColor: `${backgroundColor}`,}}>https://tamil-kural-api.vercel.app/api/daily</code>
                </div>

                <div className={'api-spec'}>
                    <p style={{color: `${primaryColor}`}}>Use the following API to get specific kural by id:</p>
                    <code
                        style={{backgroundColor: `${backgroundColor}`,}}>https://tamil-kural-api.vercel.app/api/kural/:id</code>
                </div>

                <div className={'api-spec'}>
                    <p style={{color: `${primaryColor}`}}>Use the following API to get random kural:</p>
                    <code
                        style={{backgroundColor: `${backgroundColor}`,}}>https://tamil-kural-api.vercel.app/api/random</code>
                </div>

                <h3 style={{
                    fontSize: '0.9em',
                    color: `${primaryColor}`,
                    marginBottom: '10px',
                }}>Response</h3>
                <pre style={{
                    backgroundColor: `${backgroundColor}`,
                    padding: '1rem',
                    borderRadius: '5px',
                    fontSize: '0.9em',
                    overflowX: 'auto',
                    color: '#333',
                }}>
                    {JSON.stringify(kural, null, 2)}
                </pre>
            </section>
        </div>
    )
}