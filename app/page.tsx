'use client'

import { useState } from 'react'

export default function Home() {
  const [mounted] = useState(true)

  const primaryColor = 'rgb(52, 89, 230)'
  const primaryLight = 'rgb(133, 159, 247)'
  const primaryDark = 'rgb(26, 45, 115)'
  const textColor = 'rgb(33, 33, 33)'
  const backgroundColor = 'rgb(240, 242, 255)'

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
          marginBottom: '20px',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '15px',
          animation: mounted ? 'gradientShift 8s ease infinite' : 'none',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
        }}>
          Welcome to Tamil Thirukkural App
        </h1>
        <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
        <p style={{
          fontSize: '0.9rem',
          color: `${primaryColor}`,
          fontWeight: 'bold',
          maxWidth: '600px',
          textAlign: 'center',
          lineHeight: '1.6',
          marginBottom: '30px',
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: `0 4px 6px ${primaryLight}`,
        }}>
          Explore the ancient wisdom of Thirukkural, a classic Tamil text consisting of 1,330 couplets or Kurals, dealing with various aspects of life and morality.
        </p>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: `0 6px 12px ${primaryLight}`,
          maxWidth: '400px',
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
            fontWeight:'bold',
            color: primaryColor,
            marginBottom: '15px',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: '1.6',
          }}>
            அகர முதல எழுத்தெல்லாம் ஆதி<br />
            பகவன் முதற்றே உலகு
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
            As all letters have the letter A for their first, so the world has the eternal God for its first.
          </p>
        </div>
      </div>
  )
}