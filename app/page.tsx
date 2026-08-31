'use client';

import {useEffect, useState} from 'react';
import {Kural} from '@/app/domain/kurals-db';

export default function Home() {
    const primaryColor = 'rgb(52, 89, 230)';
    const primaryLight = 'rgb(133, 159, 247)';
    const primaryDark = 'rgb(26, 45, 115)';
    const textColor = 'rgb(33, 33, 33)';
    const backgroundColor = 'rgb(240, 242, 255)';

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

        fetchKuralOfTheDay().then((_) => console.log('kural fetched..!', _));
    }, []);

    return (
        <main>
            <div className={'flex flex-col items-center justify-center font-sans p-4'}>
                <p
                    className={'content-wrapper'}
                    style={{
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
                    }}
                >
                    Explore the ancient wisdom of Thirukkural, a classic Tamil text consisting of 1,330 couplets or
                    Kurals, dealing with various aspects of life and
                    morality.
                </p>
                <div
                    className={'content-wrapper'}
                    style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '15px',
                        boxShadow: `0 6px 12px ${primaryLight}`,
                        width: '100%',
                        border: `2px solid ${primaryColor}`,
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            color: primaryDark,
                            marginBottom: '15px',
                            textAlign: 'center',
                        }}
                    >
                        Thirukkural of the Day
                    </h2>
                    <p
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: primaryColor,
                            marginBottom: '15px',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            lineHeight: '1.6',
                        }}
                    >
                        {kural?.kural[0]}
                        <br/>
                        {kural?.kural[1]}
                        <br/>
                    </p>
                    <p
                        style={{
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
                        }}
                    >
                        <span>குறள்/Couplet: {kural?.number}</span>
                        <span>பால்/Section: {kural?.section}</span>
                        <span>அதிகாரம்/Chapter: {kural?.chapter}</span>
                    </p>
                    <p
                        style={{
                            fontSize: '1rem',
                            color: textColor,
                            lineHeight: '1.5',
                            textAlign: 'center',
                            backgroundColor: backgroundColor,
                            padding: '10px',
                            borderRadius: '8px',
                        }}
                    >
                        {kural?.meaning['ta_mu_va']}
                    </p>
                    <p
                        style={{
                            marginTop: '1rem',
                            fontSize: '1rem',
                            color: textColor,
                            lineHeight: '1.5',
                            textAlign: 'center',
                            backgroundColor: backgroundColor,
                            padding: '10px',
                            borderRadius: '8px',
                        }}
                    >
                        {kural?.meaning['en']}
                    </p>
                </div>

                <hr/>


            </div>

        </main>
    );
}
