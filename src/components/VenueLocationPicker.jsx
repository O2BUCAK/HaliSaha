import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Compass, Search, Check, AlertCircle, ChevronDown, ChevronUp, Edit3, Save } from 'lucide-react';

// Sanitize URL for security against XSS (no javascript: schemes)
export const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return '';
};

export const getGoogleMapsUrl = ({ venue, address, mapsUrl, coordinates }) => {
    if (mapsUrl && mapsUrl.trim()) return sanitizeUrl(mapsUrl);
    if (coordinates?.lat && coordinates?.lng) {
        return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    }
    const query = [venue, address].filter(Boolean).join(' ');
    if (query.trim()) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
    }
    return '';
};

export const getGoogleMapsDirectionsUrl = ({ venue, address, mapsUrl, coordinates }) => {
    if (coordinates?.lat && coordinates?.lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    }
    const query = [venue, address].filter(Boolean).join(' ');
    if (query.trim()) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query.trim())}`;
    }
    if (mapsUrl && mapsUrl.trim()) {
        return sanitizeUrl(mapsUrl);
    }
    return '';
};

// Yandex Maps (Free, widely used in Turkey for navigation)
export const getYandexMapsUrl = ({ venue, address, coordinates }) => {
    if (coordinates?.lat && coordinates?.lng) {
        return `https://yandex.com.tr/haritalar/?ll=${coordinates.lng},${coordinates.lat}&z=16&pt=${coordinates.lng},${coordinates.lat}`;
    }
    const query = [venue, address].filter(Boolean).join(' ');
    if (query.trim()) {
        return `https://yandex.com.tr/haritalar/?text=${encodeURIComponent(query.trim())}`;
    }
    return '';
};

export const getGoogleMapsEmbedUrl = ({ venue, address, coordinates, mapsUrl }) => {
    if (coordinates?.lat && coordinates?.lng) {
        return `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`;
    }
    const query = [venue, address].filter(Boolean).join(' ');
    if (query.trim()) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(query.trim())}&z=15&output=embed`;
    }
    if (mapsUrl && mapsUrl.trim() && !mapsUrl.includes('goo.gl')) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(mapsUrl.trim())}&z=15&output=embed`;
    }
    return '';
};

const VenueLocationPicker = ({
    venue = '',
    onVenueChange,
    address = '',
    onAddressChange,
    mapsUrl = '',
    onMapsUrlChange,
    coordinates = null,
    onCoordinatesChange,
    isEditing = false,
    canEdit = false,
    onSaveVenue = null,
    className = ''
}) => {
    const [localEditing, setLocalEditing] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locateError, setLocateError] = useState('');
    const [locateSuccess, setLocateSuccess] = useState(false);
    const [showMapPreview, setShowMapPreview] = useState(true);
    const [isSavingVenue, setIsSavingVenue] = useState(false);

    const activeEditing = isEditing || localEditing;

    const embedUrl = getGoogleMapsEmbedUrl({ venue, address, coordinates, mapsUrl });
    const directionsUrl = getGoogleMapsDirectionsUrl({ venue, address, coordinates, mapsUrl });
    const viewMapsUrl = getGoogleMapsUrl({ venue, address, coordinates, mapsUrl });

    // HTML5 Geolocation to get current device GPS
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocateError('Tarayıcınız konum servisini desteklemiyor.');
            return;
        }

        setIsLocating(true);
        setLocateError('');
        setLocateSuccess(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = parseFloat(pos.coords.latitude.toFixed(6));
                const lng = parseFloat(pos.coords.longitude.toFixed(6));
                const coordsObj = { lat, lng };

                if (onCoordinatesChange) onCoordinatesChange(coordsObj);
                const generatedUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                if (onMapsUrlChange) onMapsUrlChange(generatedUrl);

                setIsLocating(false);
                setLocateSuccess(true);
                setTimeout(() => setLocateSuccess(false), 4000);
            },
            (err) => {
                setIsLocating(false);
                let msg = 'Konum alınamadı.';
                if (err.code === 1) msg = 'Konum izni verilmedi.';
                else if (err.code === 2) msg = 'Konum tespit edilemedi.';
                else if (err.code === 3) msg = 'Konum zaman aşımına uğradı.';
                setLocateError(msg);
                setTimeout(() => setLocateError(''), 5000);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
        );
    };

    // Open Google Maps search in new tab (Free web search link)
    const handleSearchOnGoogleMaps = () => {
        const query = [venue, address].filter(Boolean).join(' ') || 'Halı Saha';
        const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
    };

    const yandexUrl = getYandexMapsUrl({ venue, address, coordinates });

    if (!activeEditing) {
        // Read-only / View Mode
        if (!venue && !address && !mapsUrl) return null;

        return (
            <div className={`venue-card ${className}`} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                margin: '1.25rem 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <MapPin size={22} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {venue || 'Halı Saha Tesisi'}
                            </h4>
                            {address && (
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    {address}
                                </p>
                            )}
                            {coordinates && (
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                                    📍 Koordinat: {coordinates.lat}, {coordinates.lng}
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {directionsUrl && (
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.5rem 0.9rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none'
                                }}
                                title="Google Haritalar ile Yol Tarifi Al"
                            >
                                <Navigation size={15} /> Yol Tarifi Al
                            </a>
                        )}

                        {yandexUrl && (
                            <a
                                href={yandexUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.5rem 0.8rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none'
                                }}
                                title="Yandex Navigasyon ile Aç"
                            >
                                <Compass size={14} color="#ef4444" /> Yandex Harita
                            </a>
                        )}

                        {viewMapsUrl && (
                            <a
                                href={viewMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.5rem 0.85rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none'
                                }}
                                title="Google Haritalar'da Aç"
                            >
                                <ExternalLink size={14} /> Haritada Aç
                            </a>
                        )}

                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => setLocalEditing(true)}
                                className="btn btn-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.85rem'
                                }}
                                title="Konum Bilgilerini Düzenle"
                            >
                                <Edit3 size={14} /> Düzenle
                            </button>
                        )}

                        {embedUrl && (
                            <button
                                type="button"
                                onClick={() => setShowMapPreview(prev => !prev)}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 0.65rem', fontSize: '0.85rem' }}
                                title={showMapPreview ? 'Haritayı Gizle' : 'Haritayı Göster'}
                            >
                                {showMapPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Map Embed Preview */}
                {embedUrl && showMapPreview && (
                    <div style={{
                        marginTop: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        height: '220px',
                        position: 'relative'
                    }}>
                        <iframe
                            title="Halısaha Konumu"
                            src={embedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                )}
            </div>
        );
    }

    // Edit Mode
    return (
        <div className={`venue-picker-card ${className}`} style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={20} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>
                        Halısaha Adı ve Konumu
                    </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleSearchOnGoogleMaps}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Google Haritalar'da bu tesisi ara"
                    >
                        <Search size={13} /> Haritalar'da Ara
                    </button>

                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Cihazınızın GPS konumuyla bu halısahanın koordinatlarını ekleyin"
                    >
                        <Compass size={13} color="var(--accent-primary)" />
                        {isLocating ? 'Konum Alınıyor...' : 'Mevcut Konumumu Al'}
                    </button>

                    {onSaveVenue && (
                        <button
                            type="button"
                            disabled={isSavingVenue}
                            onClick={async () => {
                                setIsSavingVenue(true);
                                try {
                                    await onSaveVenue();
                                    setLocalEditing(false);
                                } finally {
                                    setIsSavingVenue(false);
                                }
                            }}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Konum bilgilerini doğrudan kaydet"
                        >
                            <Save size={13} /> {isSavingVenue ? 'Kaydediliyor...' : 'Konumu Kaydet'}
                        </button>
                    )}

                    {localEditing && (
                        <button
                            type="button"
                            onClick={() => setLocalEditing(false)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        >
                            Kapat
                        </button>
                    )}
                </div>
            </div>

            {locateSuccess && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid #22c55e',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#86efac',
                    marginBottom: '0.85rem'
                }}>
                    <Check size={14} /> Mevcut GPS konumunuz başarıyla alındı ve harita bağlantısı oluşturuldu!
                </div>
            )}

            {locateError && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#fca5a5',
                    marginBottom: '0.85rem'
                }}>
                    <AlertCircle size={14} /> {locateError}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Venue Name Input */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '500' }}>
                        Halısaha / Tesis Adı <span style={{ color: 'var(--accent-primary)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <MapPin size={17} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            required
                            placeholder="Örn: Yıldız Halı Saha & Spor Tesisleri"
                            value={venue}
                            onChange={(e) => onVenueChange && onVenueChange(e.target.value)}
                            style={{ paddingLeft: '2.3rem', width: '100%' }}
                        />
                    </div>
                </div>

                {/* Address / District Input */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '500' }}>
                        Adres / İlçe & Semt
                    </label>
                    <input
                        type="text"
                        placeholder="Örn: Kadıköy / Caferağa Mah. Moda Cad."
                        value={address}
                        onChange={(e) => onAddressChange && onAddressChange(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Google Maps Link / Share URL Input */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                        Google Haritalar Konum Linki
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        (Google Maps uygulamasından paylaşılan bağlantıyı yapıştırabilirsiniz)
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="url"
                        placeholder="Örn: https://maps.app.goo.gl/... veya https://www.google.com/maps/..."
                        value={mapsUrl}
                        onChange={(e) => onMapsUrlChange && onMapsUrlChange(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    {mapsUrl && (
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Bağlantıyı Haritada Test Et"
                        >
                            <ExternalLink size={14} /> Aç
                        </a>
                    )}
                </div>
            </div>

            {/* Live Interactive Map Preview (Zero API Key, free embed) */}
            {embedUrl && (
                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Compass size={13} color="var(--accent-primary)" />
                            Canlı Harita Önizlemesi:
                        </span>
                        {directionsUrl && (
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                            >
                                <Navigation size={12} /> Yol Tarifini Gör ➔
                            </a>
                        )}
                    </div>
                    <div style={{
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        height: '180px'
                    }}>
                        <iframe
                            title="Harita Önizlemesi"
                            src={embedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VenueLocationPicker;
