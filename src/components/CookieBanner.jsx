import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, Settings, X } from 'lucide-react';

const COOKIE_STORAGE_KEY = 'halisaha_cookie_preferences';

export const getStoredCookiePreferences = () => {
    try {
        const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch {
        // ignore
    }
    return null;
};

const CookieBanner = () => {
    const [_preferences, setPreferences] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [analyticsAllowed, setAnalyticsAllowed] = useState(true);

    useEffect(() => {
        const stored = getStoredCookiePreferences();
        if (!stored) {
            setShowBanner(true);
        } else {
            setPreferences(stored);
        }
    }, []);

    const savePreferences = (essentialOnly = false) => {
        const payload = {
            essential: true,
            analytics: essentialOnly ? false : analyticsAllowed,
            timestamp: new Date().toISOString()
        };
        try {
            localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore
        }
        setPreferences(payload);
        setShowBanner(false);
        setShowSettings(false);
    };

    const handleAcceptAll = () => {
        setAnalyticsAllowed(true);
        savePreferences(false);
    };

    const handleRejectNonEssential = () => {
        setAnalyticsAllowed(false);
        savePreferences(true);
    };

    if (!showBanner && !showSettings) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            right: '1rem',
            maxWidth: '680px',
            margin: '0 auto',
            zIndex: 9998,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
            padding: '1.25rem',
            backdropFilter: 'blur(8px)'
        }}>
            {!showSettings ? (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                        <Cookie size={22} color="var(--accent-primary)" />
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                            Çerez (Cookie) Kullanımı ve Tercihleriniz
                        </h3>
                    </div>
                    <p style={{
                        fontSize: '0.85rem',
                        lineHeight: '1.5',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem'
                    }}>
                        Halı Saha İstatistik Platformu olarak, 6698 sayılı KVKK ve ilgili mevzuat uyarınca; temel fonksiyonların çalışması için <strong>zorunlu teknik çerezler</strong> ile kullanıcı deneyimini iyileştiren <strong>analitik ve performans çerezleri</strong> kullanıyoruz. Tercihlerinizi özelleştirebilir veya tümünü kabul edebilirsiniz.
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '0.6rem'
                    }}>
                        <button
                            type="button"
                            onClick={() => setShowSettings(true)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                            <Settings size={14} /> Tercihleri Yönet
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectNonEssential}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                        >
                            Yalnızca Zorunlular
                        </button>
                        <button
                            type="button"
                            onClick={handleAcceptAll}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                            <Check size={14} /> Tümünü Kabul Et
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={20} color="var(--accent-primary)" />
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Çerez Tercihleri Yönetimi</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSettings(false)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Zorunlu Çerezler</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Oturum açma, form güvenliği ve kimlik doğrulama için şarttır. Devre dışı bırakılamaz.
                                </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                                Her Zaman Aktif
                            </span>
                        </div>

                        <div style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ paddingRight: '1rem' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Analitik ve Reklam Çerezleri</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Ziyaret istatistikleri ve Google reklam performansını optimize etmek amacıyla kullanılır.
                                </div>
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={analyticsAllowed}
                                    onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                                />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => savePreferences(false)}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                        >
                            Tercihleri Kaydet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CookieBanner;
