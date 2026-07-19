import React, { useEffect } from 'react';

const AdSenseBanner = ({ 
    adClient = "ca-pub-1046887903835726", 
    adSlot = "3103142227", 
    adFormat = "auto", 
    responsive = "true",
    style = {},
    layout = ""
}) => {
    // Check if running on localhost or development environments
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('run.app');

    useEffect(() => {
        if (!isDev) {
            try {
                if (typeof window !== 'undefined') {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (e) {
                console.warn("AdSense could not load advertisement slot:", e);
            }
        }
    }, [isDev, adSlot]);

    if (isDev) {
        return (
            <div 
                id="adsense-dev-placeholder"
                style={{
                    margin: '1.5rem 0',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md, 8px)',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontFamily: 'var(--font-sans, sans-serif)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: '100px',
                    ...style
                }}
            >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--accent-primary, #4ade80)', fontWeight: '600' }}>
                    Google AdSense Reklam Alanı
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    Slot ID: <span style={{ fontFamily: 'monospace' }}>{adSlot}</span> • Format: <span style={{ fontFamily: 'monospace' }}>{adFormat}</span>
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    (Bu alan canlı yayında (Vercel'de) aktif Google AdSense reklamı olarak görüntülenecektir)
                </div>
            </div>
        );
    }

    return (
        <div className="adsense-container" style={{ margin: '1.5rem 0', textAlign: 'center', overflow: 'hidden', ...style }}>
            <ins className="adsbygoogle"
                style={{ display: 'block', minHeight: '90px', ...style }}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={responsive}
                {...(layout ? { 'data-ad-layout': layout } : {})}
            ></ins>
        </div>
    );
};

export default AdSenseBanner;
