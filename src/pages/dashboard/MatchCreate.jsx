import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Clock, Palette, Shield } from 'lucide-react';
import { PRESET_TEAM_COMBOS } from '../../components/TacticalBoard';
import VenueLocationPicker from '../../components/VenueLocationPicker';

const MatchCreate = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { createMatch } = useData();

    // Custom Date State
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('00');

    // Venue & Location State
    const [venue, setVenue] = useState('');
    const [venueAddress, setVenueAddress] = useState('');
    const [venueMapsUrl, setVenueMapsUrl] = useState('');
    const [venueCoordinates, setVenueCoordinates] = useState(null);

    const [teamAName, setTeamAName] = useState('Takım A');
    const [teamBName, setTeamBName] = useState('Takım B');
    const [teamAColor, setTeamAColor] = useState('#2563eb');
    const [teamBColor, setTeamBColor] = useState('#dc2626');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!day || !month || !year || !hour || !minute || !venue) return;

        // Format: YYYY-MM-DDTHH:mm
        const formattedMonth = month.toString().padStart(2, '0');
        const formattedDay = day.toString().padStart(2, '0');
        const fullDate = `${year}-${formattedMonth}-${formattedDay}T${hour}:${minute}`;

        createMatch(
            groupId,
            fullDate,
            venue,
            [],
            [],
            teamAName || 'Takım A',
            teamBName || 'Takım B',
            teamAColor,
            teamBColor,
            { venueAddress, venueMapsUrl, venueCoordinates }
        );
        navigate(`/dashboard/groups/${groupId}`);
    };

    // Generate options
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { value: 1, label: 'Ocak' }, { value: 2, label: 'Şubat' }, { value: 3, label: 'Mart' },
        { value: 4, label: 'Nisan' }, { value: 5, label: 'Mayıs' }, { value: 6, label: 'Haziran' },
        { value: 7, label: 'Temmuz' }, { value: 8, label: 'Ağustos' }, { value: 9, label: 'Eylül' },
        { value: 10, label: 'Ekim' }, { value: 11, label: 'Kasım' }, { value: 12, label: 'Aralık' }
    ];
    const years = [2024, 2025, 2026];
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Maç Planla</h2>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tarih</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            >
                                <option value="">Gün</option>
                                {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>

                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                required
                                style={{ flex: 2 }}
                            >
                                <option value="">Ay</option>
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>

                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Saat</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Clock size={20} style={{ color: 'var(--text-secondary)' }} />
                            <select
                                value={hour}
                                onChange={(e) => setHour(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            >
                                <option value="">Saat</option>
                                {hours.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span style={{ fontWeight: 'bold' }}>:</span>
                            <select
                                value={minute}
                                onChange={(e) => setMinute(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            >
                                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Venue & Location Picker */}
                    <VenueLocationPicker
                        venue={venue}
                        onVenueChange={setVenue}
                        address={venueAddress}
                        onAddressChange={setVenueAddress}
                        mapsUrl={venueMapsUrl}
                        onMapsUrlChange={setVenueMapsUrl}
                        coordinates={venueCoordinates}
                        onCoordinatesChange={setVenueCoordinates}
                        isEditing={true}
                    />

                    {/* Team Names & Jersey Colors Section */}
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                            <Shield size={18} color="var(--accent-primary)" />
                            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Takımlar ve Forma Renkleri</span>
                        </div>

                        {/* Team A and B Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                            {/* Team A */}
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${teamAColor}44`
                            }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                    1. Takım Adı & Rengi
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={teamAColor}
                                        onChange={(e) => setTeamAColor(e.target.value)}
                                        title="Takım A Forma Rengi"
                                        style={{ width: '36px', height: '36px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                                    />
                                    <input
                                        type="text"
                                        value={teamAName}
                                        onChange={(e) => setTeamAName(e.target.value)}
                                        placeholder="Takım A"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Team B */}
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${teamBColor}44`
                            }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                    2. Takım Adı & Rengi
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={teamBColor}
                                        onChange={(e) => setTeamBColor(e.target.value)}
                                        title="Takım B Forma Rengi"
                                        style={{ width: '36px', height: '36px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                                    />
                                    <input
                                        type="text"
                                        value={teamBName}
                                        onChange={(e) => setTeamBName(e.target.value)}
                                        placeholder="Takım B"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Color Combos */}
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Palette size={13} /> Hızlı Forma Kombinasyonu Seç:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {PRESET_TEAM_COMBOS.slice(0, 6).map((combo, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setTeamAColor(combo.colorA);
                                            setTeamBColor(combo.colorB);
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.72rem',
                                            borderRadius: '4px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: (teamAColor.toLowerCase() === combo.colorA.toLowerCase() && teamBColor.toLowerCase() === combo.colorB.toLowerCase())
                                                ? '1px solid var(--accent-primary)'
                                                : '1px solid rgba(255,255,255,0.1)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ display: 'inline-flex', gap: '2px' }}>
                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: combo.colorA }} />
                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: combo.colorB }} />
                                        </span>
                                        <span>{combo.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" style={{ flex: 1 }}>
                            İptal
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            Planla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MatchCreate;
