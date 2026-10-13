import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { stripSenSuffix, toTitleCase } from '../utils';
import {
    Save,
    RotateCcw,
    Eye,
    EyeOff,
    Layers,
    Move,
    Check,
    Maximize2,
    Minimize2,
    Sparkles,
    Hash,
    Palette,
    ArrowRightLeft,
    ChevronDown,
    X
} from 'lucide-react';

// Formation templates defined as: [defendersCount, midfieldersCount, forwardsCount]
const FORMATION_OPTIONS = {
    5: [
        { label: '1 - 2 - 1 - 1 (Elmas)', lines: [2, 1, 1] },
        { label: '1 - 1 - 2 - 1 (Piramit)', lines: [1, 2, 1] },
        { label: '1 - 2 - 2 (Kare)', lines: [2, 0, 2] }
    ],
    6: [
        { label: '1 - 2 - 2 - 1 (Dengeli)', lines: [2, 2, 1] },
        { label: '1 - 3 - 1 - 1 (Defansif)', lines: [3, 1, 1] },
        { label: '1 - 2 - 1 - 2 (Hücumcu)', lines: [2, 1, 2] }
    ],
    7: [
        { label: '1 - 2 - 3 - 1 (Klasik 7)', lines: [2, 3, 1] },
        { label: '1 - 3 - 2 - 1 (Dengeli)', lines: [3, 2, 1] },
        { label: '1 - 2 - 2 - 2 (Ofansif)', lines: [2, 2, 2] },
        { label: '1 - 3 - 1 - 2 (Kanatlı)', lines: [3, 1, 2] }
    ],
    8: [
        { label: '1 - 3 - 3 - 1 (Standart 8)', lines: [3, 3, 1] },
        { label: '1 - 2 - 4 - 1 (Orta Saha)', lines: [2, 4, 1] },
        { label: '1 - 3 - 2 - 2 (Çift Forvet)', lines: [3, 2, 2] }
    ],
    11: [
        { label: '4 - 3 - 3 (Klasik)', lines: [4, 3, 3] },
        { label: '4 - 4 - 2 (Geleneksel)', lines: [4, 4, 2] },
        { label: '3 - 5 - 2 (Kanatlı)', lines: [3, 5, 2] }
    ]
};

const THEMES = [
    { id: 'classic', label: 'Halı Saha Çimi', icon: '🌱' },
    { id: 'stadium', label: 'Stadyum Projektörü', icon: '💡' },
    { id: 'tactical', label: 'Taktik Tahtası', icon: '📋' }
];

export const PRESET_JERSEY_COLORS = [
    { name: 'Kraliyet Mavisi', hex: '#2563eb' },
    { name: 'Ateş Kırmızısı', hex: '#dc2626' },
    { name: 'Canarya Sarısı', hex: '#eab308' },
    { name: 'Zümrüt Yeşili', hex: '#16a34a' },
    { name: 'Neon / Yelek Yeşili', hex: '#84cc16' },
    { name: 'Gece Siyahı', hex: '#18181b' },
    { name: 'Kar Beyazı', hex: '#f8fafc' },
    { name: 'Koyu Lacivert', hex: '#1e3a8a' },
    { name: 'Bordo', hex: '#881337' },
    { name: 'Turuncu Yelek', hex: '#ea580c' },
    { name: 'Gökyüzü Turkuazı', hex: '#06b6d4' },
    { name: 'Asil Mor', hex: '#9333ea' },
    { name: 'Altın Kehribar', hex: '#d97706' },
    { name: 'Fuşya Pembe', hex: '#db2777' }
];

export const PRESET_TEAM_COMBOS = [
    { label: 'Mavi & Kırmızı', colorA: '#2563eb', colorB: '#dc2626' },
    { label: 'Sarı & Kırmızı (GS)', colorA: '#eab308', colorB: '#dc2626' },
    { label: 'Sarı & Lacivert (FB)', colorA: '#eab308', colorB: '#1e3a8a' },
    { label: 'Siyah & Beyaz (BJK)', colorA: '#18181b', colorB: '#f8fafc' },
    { label: 'Bordo & Mavi (TS)', colorA: '#881337', colorB: '#0284c7' },
    { label: 'Yeşil & Beyaz', colorA: '#16a34a', colorB: '#f8fafc' },
    { label: 'Neon Yelek & Kırmızı', colorA: '#84cc16', colorB: '#dc2626' },
    { label: 'Turuncu & Turkuaz', colorA: '#ea580c', colorB: '#06b6d4' },
    { label: 'Mor & Beyaz', colorA: '#9333ea', colorB: '#f8fafc' }
];

export const getContrastTextColor = (hex) => {
    if (!hex) return '#ffffff';
    const cleanHex = String(hex).replace('#', '');
    if (cleanHex.length !== 6) return '#ffffff';
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 155 ? '#0f172a' : '#ffffff';
};

// Helper: Calculate positions based on formation lines and team side
const calculateFormationPositions = (teamPlayers, lines, isTeamA) => {
    if (!teamPlayers || teamPlayers.length === 0) return [];

    const result = [];
    const playersList = [...teamPlayers];

    // Identify Goalkeeper: explicitly marked GK or first player
    let gkIndex = playersList.findIndex(p => p.isGoalkeeper);
    if (gkIndex === -1) gkIndex = 0;
    const gk = playersList.splice(gkIndex, 1)[0];

    // Goalkeeper position
    result.push({
        ...gk,
        isGoalkeeper: true,
        x: isTeamA ? 7 : 93,
        y: 50
    });

    // Outfield players distributed by lines
    const totalOutfield = playersList.length;
    const activeLines = lines && lines.length > 0 ? lines : [Math.ceil(totalOutfield / 2), Math.floor(totalOutfield / 2)];

    // Target X coordinates for lines (from defense to attack)
    // Team A: 18% (defense) -> 31% (midfield) -> 43% (forwards)
    // Team B: 82% (defense) -> 69% (midfield) -> 57% (forwards)
    const xPositionsTeamA = [18, 30, 42];
    const xPositionsTeamB = [82, 70, 58];
    const xBase = isTeamA ? xPositionsTeamA : xPositionsTeamB;

    let playerCursor = 0;
    activeLines.forEach((countInLine, lineIndex) => {
        if (countInLine <= 0) return;
        const lineX = xBase[Math.min(lineIndex, xBase.length - 1)];

        // Calculate Y positions evenly spread
        for (let i = 0; i < countInLine; i++) {
            if (playerCursor >= playersList.length) break;
            const p = playersList[playerCursor];

            // Spread Y between 18% and 82%
            let yPos = 50;
            if (countInLine === 1) {
                yPos = 50;
            } else if (countInLine === 2) {
                yPos = i === 0 ? 30 : 70;
            } else if (countInLine === 3) {
                yPos = i === 0 ? 22 : i === 1 ? 50 : 78;
            } else if (countInLine === 4) {
                yPos = 16 + i * 22; // 16, 38, 60, 82
            } else {
                yPos = 15 + (i / (countInLine - 1)) * 70;
            }

            result.push({
                ...p,
                isGoalkeeper: false,
                x: lineX,
                y: yPos
            });
            playerCursor++;
        }
    });

    // Any remaining players if squad was bigger than formation
    while (playerCursor < playersList.length) {
        const p = playersList[playerCursor];
        const extraX = isTeamA ? 35 : 65;
        const extraY = 20 + (playerCursor % 4) * 20;
        result.push({
            ...p,
            isGoalkeeper: false,
            x: extraX,
            y: extraY
        });
        playerCursor++;
    }

    return result;
};

// Mini Soccer Jersey SVG Component
const SoccerJersey = ({ color, number, isGoalkeeper, isSelected, size = 42 }) => {
    const mainColor = isGoalkeeper ? '#f59e0b' : (color || '#2563eb');
    const contrastText = getContrastTextColor(mainColor);
    const accentColor = isGoalkeeper ? '#78350f' : contrastText;
    const isBrightJersey = contrastText === '#0f172a';
    const outlineStroke = isBrightJersey ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
    const gradId = `grad-${String(mainColor).replace(/[^a-zA-Z0-9]/g, '')}`;

    return (
        <div style={{
            position: 'relative',
            width: size,
            height: size,
            filter: isSelected
                ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.9)) drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                : 'drop-shadow(0 3px 5px rgba(0,0,0,0.45))',
            transition: 'transform 0.15s ease, filter 0.15s ease',
            transform: isSelected ? 'scale(1.15)' : 'scale(1)'
        }}>
            <svg viewBox="0 0 100 100" width={size} height={size}>
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={mainColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={isGoalkeeper ? '#d97706' : mainColor} stopOpacity="0.85" />
                    </linearGradient>
                </defs>

                {/* Jersey Body & Sleeves */}
                <path
                    d="M 28 22 
                       L 10 36 
                       L 22 50 
                       L 30 42 
                       L 30 84 
                       Q 50 88 70 84 
                       L 70 42 
                       L 78 50 
                       L 90 36 
                       L 72 22 
                       Q 62 30 50 30 
                       Q 38 30 28 22 Z"
                    fill={`url(#${gradId})`}
                    stroke={outlineStroke}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />

                {/* Collar Trim */}
                <path
                    d="M 38 24 Q 50 34 62 24"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                />

                {/* Sleeve Trim */}
                <line x1="12" y1="38" x2="20" y2="48" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
                <line x1="88" y1="38" x2="80" y2="48" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

                {/* Goalkeeper Gloves or Number */}
                {isGoalkeeper ? (
                    <text
                        x="50"
                        y="62"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="20"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                    >
                        KL
                    </text>
                ) : (
                    <text
                        x="50"
                        y="63"
                        textAnchor="middle"
                        fill={accentColor}
                        fontSize={String(number || '').length > 1 ? '22' : '26'}
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                    >
                        {number || '•'}
                    </text>
                )}
            </svg>

            {/* Goalkeeper Glove Badge */}
            {isGoalkeeper && (
                <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    fontSize: '11px',
                    lineHeight: '1',
                    background: '#18181b',
                    borderRadius: '50%',
                    padding: '2px',
                    border: '1px solid #f59e0b',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                }}>
                    🧤
                </div>
            )}
        </div>
    );
};

// SVG Football Pitch with authentic markings and grass themes
const FootballPitchSvg = ({ theme = 'classic' }) => {
    return (
        <svg
            viewBox="0 0 1000 625"
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                userSelect: 'none'
            }}
        >
            <defs>
                {/* Stripe Pattern for Halı Saha Grass */}
                <pattern id="turf-stripes" width="100" height="625" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="50" height="625" fill="#1b6e2d" />
                    <rect x="50" y="0" width="50" height="625" fill="#228035" />
                </pattern>

                {/* Stadium Night Lighting Radial Gradient */}
                <radialGradient id="floodlight-glow" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.32" />
                    <stop offset="50%" stopColor="#15803d" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#052e16" stopOpacity="0" />
                </radialGradient>

                {/* Dark Tactical Slate Pattern */}
                <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>

                {/* Goal Net Pattern */}
                <pattern id="goal-net" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 0 0 L 8 8 M 8 0 L 0 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                </pattern>

                {/* Subtle Pitch Vignette */}
                <radialGradient id="pitch-vignette" cx="50%" cy="50%" r="65%">
                    <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
                </radialGradient>
            </defs>

            {/* Base Grass Fill */}
            {theme === 'classic' && (
                <>
                    <rect width="1000" height="625" fill="#1b6e2d" />
                    <rect width="1000" height="625" fill="url(#turf-stripes)" opacity="0.65" />
                    <rect width="1000" height="625" fill="url(#pitch-vignette)" />
                </>
            )}

            {theme === 'stadium' && (
                <>
                    <rect width="1000" height="625" fill="#092813" />
                    <rect width="1000" height="625" fill="url(#turf-stripes)" opacity="0.3" />
                    <rect width="1000" height="625" fill="url(#floodlight-glow)" />
                    <rect width="1000" height="625" fill="url(#pitch-vignette)" opacity="0.7" />
                </>
            )}

            {theme === 'tactical' && (
                <>
                    <rect width="1000" height="625" fill="#0f172a" />
                    <rect width="1000" height="625" fill="url(#tactical-grid)" />
                </>
            )}

            {/* Outer Pitch Surround Padding */}
            <rect x="0" y="0" width="1000" height="625" fill="none" stroke={theme === 'tactical' ? '#334155' : 'rgba(255,255,255,0.2)'} strokeWidth="2" />

            {/* Field Regulation Markings Group */}
            <g
                stroke={theme === 'tactical' ? '#38bdf8' : 'rgba(255,255,255,0.85)'}
                strokeWidth={theme === 'tactical' ? '2.2' : '2.6'}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* 1. Main Boundary Line (Touchlines & Goal lines) */}
                <rect x="40" y="30" width="920" height="565" rx="3" />

                {/* 2. Halfway Line */}
                <line x1="500" y1="30" x2="500" y2="595" />

                {/* 3. Center Circle & Center Spot */}
                <circle cx="500" cy="312.5" r="75" />
                <circle cx="500" cy="312.5" r="4.5" fill={theme === 'tactical' ? '#38bdf8' : '#ffffff'} stroke="none" />

                {/* 4. Left Penalty Box (Ceza Sahası) */}
                <rect x="40" y="162.5" width="145" height="300" />

                {/* 5. Left Goal Area (Altıpas) */}
                <rect x="40" y="232.5" width="55" height="160" />

                {/* 6. Left Penalty Spot */}
                <circle cx="145" cy="312.5" r="4" fill={theme === 'tactical' ? '#38bdf8' : '#ffffff'} stroke="none" />

                {/* 7. Left Penalty Arc (Ceza yayı) */}
                <path d="M 185 252 A 75 75 0 0 1 185 373" />

                {/* 8. Left Goal (Kale & File) */}
                <rect x="22" y="262.5" width="18" height="100" fill="url(#goal-net)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />

                {/* 9. Right Penalty Box (Ceza Sahası) */}
                <rect x="815" y="162.5" width="145" height="300" />

                {/* 10. Right Goal Area (Altıpas) */}
                <rect x="905" y="232.5" width="55" height="160" />

                {/* 11. Right Penalty Spot */}
                <circle cx="855" cy="312.5" r="4" fill={theme === 'tactical' ? '#38bdf8' : '#ffffff'} stroke="none" />

                {/* 12. Right Penalty Arc (Ceza yayı) */}
                <path d="M 815 252 A 75 75 0 0 0 815 373" />

                {/* 13. Right Goal (Kale & File) */}
                <rect x="960" y="262.5" width="18" height="100" fill="url(#goal-net)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />

                {/* 14. Corner Arcs */}
                <path d="M 40 48 A 18 18 0 0 0 58 30" />
                <path d="M 58 595 A 18 18 0 0 0 40 577" />
                <path d="M 942 30 A 18 18 0 0 0 960 48" />
                <path d="M 960 577 A 18 18 0 0 0 942 595" />
            </g>

            {/* Dugout / Bench Area Indicators */}
            <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none">
                <rect x="200" y="8" width="160" height="14" rx="2" strokeDasharray="3 3" />
                <rect x="640" y="8" width="160" height="14" rx="2" strokeDasharray="3 3" />
            </g>
        </svg>
    );
};

const TacticalBoard = ({ match, group, onSave, readOnly = false }) => {
    const [players, setPlayers] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [theme, setTheme] = useState('classic'); // classic | stadium | tactical
    const [teamAColor, setTeamAColor] = useState(match?.teamAColor || '#2563eb');
    const [teamBColor, setTeamBColor] = useState(match?.teamBColor || '#dc2626');
    const [activeColorModal, setActiveColorModal] = useState(null); // 'A' | 'B' | 'combos' | null
    const [showNames, setShowNames] = useState(true);
    const [showNumbers, setShowNumbers] = useState(true);
    const [showTacticalLines, setShowTacticalLines] = useState(false);
    const [showAttackArrows, setShowAttackArrows] = useState(true);
    const [activeDraggingId, setActiveDraggingId] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedFormationA, setSelectedFormationA] = useState('');
    const [selectedFormationB, setSelectedFormationB] = useState('');

    const pitchRef = useRef(null);
    const draggingPlayerIdRef = useRef(null);

    const teamAName = match?.teamAName || 'Takım A';
    const teamBName = match?.teamBName || 'Takım B';

    // Sync team colors from match if updated externally
    useEffect(() => {
        if (match?.teamAColor) setTeamAColor(match.teamAColor);
        if (match?.teamBColor) setTeamBColor(match.teamBColor);
    }, [match?.teamAColor, match?.teamBColor]);

    const handleSwapColors = () => {
        setTeamAColor(prevA => {
            const nextA = teamBColor;
            setTeamBColor(prevA);
            return nextA;
        });
    };

    const handleApplyCombo = (combo) => {
        setTeamAColor(combo.colorA);
        setTeamBColor(combo.colorB);
        setActiveColorModal(null);
    };

    // Initialize or load players with smart default positions
    useEffect(() => {
        if (!match) return;

        const rawTeamA = match.teamA || [];
        const rawTeamB = match.teamB || [];

        // Check if players have custom coordinates saved (not default center-clumped)
        const hasCustomPosA = rawTeamA.some(p => p.x !== undefined && p.x !== null && (p.x !== 20 || p.y !== 50));
        const hasCustomPosB = rawTeamB.some(p => p.x !== undefined && p.x !== null && (p.x !== 80 || p.y !== 50));

        let processedTeamA = [];
        if (hasCustomPosA) {
            processedTeamA = rawTeamA.map(p => ({
                ...p,
                name: toTitleCase(stripSenSuffix(p.name)),
                team: 'teamA',
                x: typeof p.x === 'number' ? Math.max(5, Math.min(48, p.x)) : 20,
                y: typeof p.y === 'number' ? Math.max(8, Math.min(92, p.y)) : 50,
                number: group?.jerseyNumbers?.[p.id] || p.number || null
            }));
        } else {
            // Apply default formation for squad size
            const count = rawTeamA.length;
            const presets = FORMATION_OPTIONS[count] || FORMATION_OPTIONS[7] || FORMATION_OPTIONS[6];
            const defaultLines = presets[0]?.lines || [2, 3, 1];
            processedTeamA = calculateFormationPositions(rawTeamA, defaultLines, true).map(p => ({
                ...p,
                name: toTitleCase(stripSenSuffix(p.name)),
                team: 'teamA',
                number: group?.jerseyNumbers?.[p.id] || p.number || null
            }));
        }

        let processedTeamB = [];
        if (hasCustomPosB) {
            processedTeamB = rawTeamB.map(p => ({
                ...p,
                name: toTitleCase(stripSenSuffix(p.name)),
                team: 'teamB',
                x: typeof p.x === 'number' ? Math.max(52, Math.min(95, p.x)) : 80,
                y: typeof p.y === 'number' ? Math.max(8, Math.min(92, p.y)) : 50,
                number: group?.jerseyNumbers?.[p.id] || p.number || null
            }));
        } else {
            const count = rawTeamB.length;
            const presets = FORMATION_OPTIONS[count] || FORMATION_OPTIONS[7] || FORMATION_OPTIONS[6];
            const defaultLines = presets[0]?.lines || [2, 3, 1];
            processedTeamB = calculateFormationPositions(rawTeamB, defaultLines, false).map(p => ({
                ...p,
                name: toTitleCase(stripSenSuffix(p.name)),
                team: 'teamB',
                number: group?.jerseyNumbers?.[p.id] || p.number || null
            }));
        }

        setPlayers([...processedTeamA, ...processedTeamB]);
    }, [match, group?.jerseyNumbers]);

    // Apply selected formation preset to Team A or Team B
    const handleApplyFormation = (teamKey, lines) => {
        setPlayers(prev => {
            const teamA = prev.filter(p => p.team === 'teamA');
            const teamB = prev.filter(p => p.team === 'teamB');

            if (teamKey === 'teamA') {
                const repositioned = calculateFormationPositions(teamA, lines, true);
                return [...repositioned, ...teamB];
            } else {
                const repositioned = calculateFormationPositions(teamB, lines, false);
                return [...teamA, ...repositioned];
            }
        });
    };

    // Reset both teams to default formations
    const handleResetPositions = () => {
        const teamA = players.filter(p => p.team === 'teamA');
        const teamB = players.filter(p => p.team === 'teamB');

        const presetA = (FORMATION_OPTIONS[teamA.length] || FORMATION_OPTIONS[7])[0].lines;
        const presetB = (FORMATION_OPTIONS[teamB.length] || FORMATION_OPTIONS[7])[0].lines;

        const newA = calculateFormationPositions(teamA, presetA, true);
        const newB = calculateFormationPositions(teamB, presetB, false);

        setPlayers([...newA, ...newB]);
        setSelectedPlayerId(null);
    };

    // Calculate (x, y) percent coords relative to pitch container
    const getCoordinatesFromEvent = useCallback((clientX, clientY) => {
        if (!pitchRef.current) return null;
        const rect = pitchRef.current.getBoundingClientRect();
        const rawX = ((clientX - rect.left) / rect.width) * 100;
        const rawY = ((clientY - rect.top) / rect.height) * 100;

        // Clamp inside pitch boundaries (5% to 95%)
        return {
            x: Math.max(5, Math.min(95, parseFloat(rawX.toFixed(1)))),
            y: Math.max(8, Math.min(92, parseFloat(rawY.toFixed(1))))
        };
    }, []);

    // Desktop Drag & Drop Handlers
    const handleDragStart = (e, playerId) => {
        if (readOnly) return;
        draggingPlayerIdRef.current = playerId;
        setActiveDraggingId(playerId);
        setSelectedPlayerId(playerId);
        e.dataTransfer.setData('text/plain', playerId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        if (readOnly) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        if (readOnly) return;
        e.preventDefault();
        const playerId = e.dataTransfer.getData('text/plain') || draggingPlayerIdRef.current;
        if (!playerId) {
            setActiveDraggingId(null);
            return;
        }

        const coords = getCoordinatesFromEvent(e.clientX, e.clientY);
        if (coords) {
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...coords } : p));
        }
        draggingPlayerIdRef.current = null;
        setActiveDraggingId(null);
    };

    // Touch Support for Mobile & Tablets
    const handleTouchStart = (e, playerId) => {
        if (readOnly) return;
        draggingPlayerIdRef.current = playerId;
        setActiveDraggingId(playerId);
        setSelectedPlayerId(playerId);
    };

    const handleTouchMove = (e) => {
        if (readOnly || !draggingPlayerIdRef.current) return;
        // Prevent default screen scrolling while dragging player token on tactical board
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const coords = getCoordinatesFromEvent(touch.clientX, touch.clientY);
        if (coords) {
            setPlayers(prev => prev.map(p =>
                p.id === draggingPlayerIdRef.current ? { ...p, ...coords } : p
            ));
        }
    };

    const handleTouchEnd = () => {
        draggingPlayerIdRef.current = null;
        setActiveDraggingId(null);
    };

    // Tap-to-Move (Click Pitch to place currently selected player)
    const handlePitchClick = (e) => {
        if (readOnly || !selectedPlayerId) return;
        // Don't trigger if clicked directly on another player
        if (e.target.closest('[data-player-token]')) return;

        const coords = getCoordinatesFromEvent(e.clientX, e.clientY);
        if (coords) {
            setPlayers(prev => prev.map(p =>
                p.id === selectedPlayerId ? { ...p, ...coords } : p
            ));
        }
    };

    // Save positions & team colors
    const handleSave = async () => {
        if (!onSave || readOnly) return;
        setIsSaving(true);
        const teamAUpdates = players.filter(p => p.team === 'teamA');
        const teamBUpdates = players.filter(p => p.team === 'teamB');

        try {
            await onSave(teamAUpdates, teamBUpdates, { teamAColor, teamBColor });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Tactical board save error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Tactical Lines Calculation (Connect players of same team in lines)
    const tacticalLines = useMemo(() => {
        if (!showTacticalLines) return [];

        const linesList = [];
        ['teamA', 'teamB'].forEach(teamKey => {
            const teamList = players.filter(p => p.team === teamKey && !p.isGoalkeeper);
            if (teamList.length < 2) return;

            // Sort outfield players by X (defenders -> midfielders -> forwards)
            const sortedByX = [...teamList].sort((a, b) => a.x - b.x);

            // Group players into 2 or 3 lines based on X proximity
            const lineThreshold = 10;
            const groups = [];
            sortedByX.forEach(player => {
                const existingGroup = groups.find(g => Math.abs(g[0].x - player.x) < lineThreshold);
                if (existingGroup) {
                    existingGroup.push(player);
                } else {
                    groups.push([player]);
                }
            });

            // For each group with 2+ players, connect them by sorted Y
            groups.forEach(g => {
                if (g.length >= 2) {
                    const sortedY = [...g].sort((a, b) => a.y - b.y);
                    for (let i = 0; i < sortedY.length - 1; i++) {
                        linesList.push({
                            x1: sortedY[i].x,
                            y1: sortedY[i].y,
                            x2: sortedY[i + 1].x,
                            y2: sortedY[i + 1].y,
                            team: teamKey
                        });
                    }
                }
            });
        });

        return linesList;
    }, [players, showTacticalLines]);

    const teamACount = players.filter(p => p.team === 'teamA').length;
    const teamBCount = players.filter(p => p.team === 'teamB').length;

    const availablePresetsA = FORMATION_OPTIONS[teamACount] || FORMATION_OPTIONS[7];
    const availablePresetsB = FORMATION_OPTIONS[teamBCount] || FORMATION_OPTIONS[7];

    return (
        <div className={`card ${isFullscreen ? 'tactical-fullscreen' : ''}`} style={{
            position: 'relative',
            padding: '1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            ...(isFullscreen ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                borderRadius: 0,
                overflowY: 'auto',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-primary)'
            } : {})
        }}>
            {/* Header: Title, Team Names & Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: 'var(--accent-primary)',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                        <Layers size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Taktik Tahtası & Saha Dizilimi
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {teamAName} ({teamACount}) vs {teamBName} ({teamBCount})
                        </p>
                    </div>
                </div>

                {/* Action Buttons: Save, Reset, Fullscreen */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!readOnly && (
                        <>
                            <button
                                type="button"
                                onClick={handleResetPositions}
                                className="btn btn-secondary"
                                title="Varsayılan dizilime sıfırla"
                                style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem' }}
                            >
                                <RotateCcw size={15} /> Sıfırla
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn btn-primary"
                                style={{
                                    padding: '0.5rem 1.1rem',
                                    fontSize: '0.85rem',
                                    gap: '0.4rem',
                                    background: saveSuccess ? '#16a34a' : undefined
                                }}
                            >
                                {saveSuccess ? (
                                    <>
                                        <Check size={16} /> Kaydedildi!
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} /> {isSaving ? 'Kaydediliyor...' : 'Taktikleri Kaydet'}
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsFullscreen(prev => !prev)}
                        className="btn btn-secondary"
                        title={isFullscreen ? 'Küçült' : 'Tam Ekran'}
                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Tactical Toolbar: Theme, Palette, Formations, Toggles */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem',
                background: 'rgba(255,255,255,0.02)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem'
            }}>
                {/* Left Side: Formations */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {!readOnly && (
                        <>
                            {/* Team A Formation */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: teamAColor
                                }} />
                                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{teamAName}:</span>
                                <select
                                    value={selectedFormationA}
                                    onChange={(e) => {
                                        setSelectedFormationA(e.target.value);
                                        const opt = availablePresetsA.find(p => p.label === e.target.value);
                                        if (opt) handleApplyFormation('teamA', opt.lines);
                                    }}
                                    style={{
                                        padding: '0.3rem 0.5rem',
                                        fontSize: '0.78rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Formasyon Seç...</option>
                                    {availablePresetsA.map(p => (
                                        <option key={p.label} value={p.label}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Team B Formation */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: teamBColor
                                }} />
                                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{teamBName}:</span>
                                <select
                                    value={selectedFormationB}
                                    onChange={(e) => {
                                        setSelectedFormationB(e.target.value);
                                        const opt = availablePresetsB.find(p => p.label === e.target.value);
                                        if (opt) handleApplyFormation('teamB', opt.lines);
                                    }}
                                    style={{
                                        padding: '0.3rem 0.5rem',
                                        fontSize: '0.78rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Formasyon Seç...</option>
                                    {availablePresetsB.map(p => (
                                        <option key={p.label} value={p.label}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Side: Visual Toggles, Team Colors & Theme */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Theme Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {THEMES.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTheme(t.id)}
                                title={t.label}
                                style={{
                                    padding: '0.3rem 0.55rem',
                                    fontSize: '0.78rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: theme === t.id ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                                    border: theme === t.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                    color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <span>{t.icon}</span>
                                <span style={{ display: isFullscreen ? 'inline' : 'none' }}>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Team Color Pickers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        {/* Team A Color Button */}
                        <button
                            type="button"
                            onClick={() => setActiveColorModal(prev => prev === 'A' ? null : 'A')}
                            title={`${teamAName} rengini seç`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.78rem',
                                borderRadius: '4px',
                                background: activeColorModal === 'A' ? 'rgba(255,255,255,0.12)' : 'transparent',
                                border: activeColorModal === 'A' ? `1px solid ${teamAColor}` : '1px solid transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{
                                width: '13px',
                                height: '13px',
                                borderRadius: '50%',
                                backgroundColor: teamAColor,
                                border: '1.5px solid rgba(255,255,255,0.8)',
                                display: 'inline-block'
                            }} />
                            <span style={{ fontWeight: '600' }}>{teamAName}</span>
                            <ChevronDown size={12} style={{ opacity: 0.7 }} />
                        </button>

                        {/* Swap Colors Button */}
                        <button
                            type="button"
                            onClick={handleSwapColors}
                            title="Takım Renklerini Değiş-Tokuş Et (A ⇄ B)"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.25rem 0.35rem',
                                borderRadius: '4px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowRightLeft size={13} />
                        </button>

                        {/* Team B Color Button */}
                        <button
                            type="button"
                            onClick={() => setActiveColorModal(prev => prev === 'B' ? null : 'B')}
                            title={`${teamBName} rengini seç`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.78rem',
                                borderRadius: '4px',
                                background: activeColorModal === 'B' ? 'rgba(255,255,255,0.12)' : 'transparent',
                                border: activeColorModal === 'B' ? `1px solid ${teamBColor}` : '1px solid transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{
                                width: '13px',
                                height: '13px',
                                borderRadius: '50%',
                                backgroundColor: teamBColor,
                                border: '1.5px solid rgba(255,255,255,0.8)',
                                display: 'inline-block'
                            }} />
                            <span style={{ fontWeight: '600' }}>{teamBName}</span>
                            <ChevronDown size={12} style={{ opacity: 0.7 }} />
                        </button>

                        {/* Combos Button */}
                        <button
                            type="button"
                            onClick={() => setActiveColorModal(prev => prev === 'combos' ? null : 'combos')}
                            title="Hazır Takım Renk Kombinasyonları (GS, FB, BJK, TS vb.)"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.45rem',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                background: activeColorModal === 'combos' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                border: activeColorModal === 'combos' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                color: activeColorModal === 'combos' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <Palette size={13} />
                        </button>
                    </div>

                    {/* Tactical Lines Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowTacticalLines(prev => !prev)}
                        title="Taktik Hatları Göster / Gizle"
                        style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.78rem',
                            borderRadius: 'var(--radius-sm)',
                            background: showTacticalLines ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                            border: showTacticalLines ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                            color: showTacticalLines ? '#38bdf8' : 'var(--text-secondary)'
                        }}
                    >
                        Hatlar
                    </button>

                    {/* Attack Arrows Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAttackArrows(prev => !prev)}
                        title="Hücum Yönü Oklarını Göster / Gizle"
                        style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.78rem',
                            borderRadius: 'var(--radius-sm)',
                            background: showAttackArrows ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                            border: showAttackArrows ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            color: showAttackArrows ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        Oklar
                    </button>

                    {/* Numbers Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowNumbers(prev => !prev)}
                        title={showNumbers ? 'Numaraları Gizle' : 'Numaraları Göster'}
                        style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.78rem',
                            borderRadius: 'var(--radius-sm)',
                            background: showNumbers ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: '1px solid var(--border-color)',
                            color: showNumbers ? 'var(--text-primary)' : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <Hash size={13} />
                        <span>Numaralar</span>
                    </button>

                    {/* Names Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowNames(prev => !prev)}
                        title={showNames ? 'İsimleri Gizle' : 'İsimleri Göster'}
                        style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.78rem',
                            borderRadius: 'var(--radius-sm)',
                            background: showNames ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: '1px solid var(--border-color)',
                            color: showNames ? 'var(--text-primary)' : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        {showNames ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>İsimler</span>
                    </button>
                </div>
            </div>

            {/* Expandable Color Selection Drawer / Modal */}
            {activeColorModal && (
                <div style={{
                    marginTop: '-0.35rem',
                    marginBottom: '1rem',
                    padding: '0.85rem 1rem',
                    background: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                    {activeColorModal === 'combos' ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Palette size={15} color="var(--accent-primary)" />
                                    Hazır Takım & Halı Saha Renk Kombinasyonları
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveColorModal(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
                                {PRESET_TEAM_COMBOS.map((combo, idx) => {
                                    const isSelectedCombo = teamAColor.toLowerCase() === combo.colorA.toLowerCase() && teamBColor.toLowerCase() === combo.colorB.toLowerCase();
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleApplyCombo(combo)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.45rem 0.65rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: isSelectedCombo ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
                                                border: isSelectedCombo ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: combo.colorA, border: '1px solid rgba(255,255,255,0.6)' }} />
                                                <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: combo.colorB, border: '1px solid rgba(255,255,255,0.6)' }} />
                                            </span>
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{combo.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: activeColorModal === 'A' ? teamAColor : teamBColor,
                                        border: '1.5px solid white'
                                    }} />
                                    <span>{activeColorModal === 'A' ? teamAName : teamBName} İçin Forma Rengi</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveColorModal(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Swatches Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '0.45rem',
                                marginBottom: '0.75rem'
                            }}>
                                {PRESET_JERSEY_COLORS.map(c => {
                                    const isCurrent = (activeColorModal === 'A' ? teamAColor : teamBColor).toLowerCase() === c.hex.toLowerCase();
                                    const isLight = getContrastTextColor(c.hex) === '#0f172a';
                                    return (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            onClick={() => {
                                                if (activeColorModal === 'A') setTeamAColor(c.hex);
                                                else setTeamBColor(c.hex);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.45rem',
                                                padding: '0.35rem 0.55rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: isCurrent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                                                border: isCurrent ? '1.5px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.76rem',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <span style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                backgroundColor: c.hex,
                                                border: isLight ? '1px solid rgba(0,0,0,0.3)' : '1px solid rgba(255,255,255,0.7)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {isCurrent && <Check size={11} color={isLight ? '#0f172a' : '#ffffff'} />}
                                            </span>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Color Native Picker */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '0.78rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Özel Renk Seç (HEX):</span>
                                    <input
                                        type="color"
                                        value={activeColorModal === 'A' ? teamAColor : teamBColor}
                                        onChange={(e) => {
                                            if (activeColorModal === 'A') setTeamAColor(e.target.value);
                                            else setTeamBColor(e.target.value);
                                        }}
                                        style={{
                                            width: '28px',
                                            height: '24px',
                                            padding: 0,
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            background: 'transparent'
                                        }}
                                    />
                                    <code style={{
                                        padding: '2px 6px',
                                        background: 'rgba(255,255,255,0.06)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.75rem'
                                    }}>
                                        {activeColorModal === 'A' ? teamAColor : teamBColor}
                                    </code>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveColorModal(null)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                                >
                                    Tamam
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Team Scoreboard / Header over Pitch */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.4rem 0.8rem',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: '1px solid rgba(255,255,255,0.1)',
                borderBottom: 'none',
                fontSize: '0.85rem',
                fontWeight: '600'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        background: teamAColor,
                        border: '1px solid white'
                    }} />
                    <span>{teamAName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'normal' }}>
                        (Sol Yarı Saha ➔)
                    </span>
                </div>

                <div style={{
                    fontSize: '0.78rem',
                    color: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                }}>
                    <Sparkles size={14} color="var(--accent-primary)" />
                    <span>Gerçekçi Halı Saha Taktik Tahtası</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'normal' }}>
                        (⬅ Sağ Yarı Saha)
                    </span>
                    <span>{teamBName}</span>
                    <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        background: teamBColor,
                        border: '1px solid white'
                    }} />
                </div>
            </div>

            {/* THE FOOTBALL PITCH CONTAINER */}
            <div
                ref={pitchRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handlePitchClick}
                style={{
                    width: '100%',
                    aspectRatio: isFullscreen ? '1.7' : '1.6',
                    minHeight: '360px',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6), 0 10px 25px -5px rgba(0,0,0,0.5)',
                    cursor: readOnly ? 'default' : selectedPlayerId ? 'crosshair' : 'default',
                    userSelect: 'none',
                    touchAction: 'none'
                }}
            >
                {/* SVG Pitch Graphic Markings and Turf */}
                <FootballPitchSvg theme={theme} />

                {/* Tactical Connecting Lines (Defense, Midfield, Attack) */}
                {showTacticalLines && (
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 4
                        }}
                    >
                        {tacticalLines.map((line, idx) => (
                            <line
                                key={idx}
                                x1={`${line.x1}%`}
                                y1={`${line.y1}%`}
                                x2={`${line.x2}%`}
                                y2={`${line.y2}%`}
                                stroke={line.team === 'teamA' ? teamAColor : teamBColor}
                                strokeWidth="0.6"
                                strokeDasharray="1.5 1"
                                strokeOpacity="0.8"
                            />
                        ))}
                    </svg>
                )}

                {/* Team Attack Direction Arrows */}
                {showAttackArrows && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2.5rem',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.65)',
                        textShadow: '0 1px 3px black',
                        pointerEvents: 'none',
                        zIndex: 3
                    }}>
                        <span style={{ color: teamAColor }}>
                            {teamAName} Hücum Yönü ➔
                        </span>
                        <span style={{ color: teamBColor }}>
                            ⬅ {teamBName} Hücum Yönü
                        </span>
                    </div>
                )}

                {/* Tap-to-move Banner when a player is selected */}
                {selectedPlayerId && !readOnly && (
                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid var(--accent-primary)',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                        zIndex: 20,
                        pointerEvents: 'none',
                        animation: 'fadeIn 0.2s ease'
                    }}>
                        <Move size={13} color="var(--accent-primary)" />
                        <span>Sahada istediğiniz yere dokunarak veya sürükleyerek taşıyın</span>
                    </div>
                )}

                {/* Player Tokens */}
                {players.map((p) => {
                    const isSelected = selectedPlayerId === p.id;
                    const isTeamA = p.team === 'teamA';
                    const teamColor = isTeamA ? teamAColor : teamBColor;

                    return (
                        <div
                            key={p.id}
                            data-player-token="true"
                            draggable={!readOnly}
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            onTouchStart={(e) => handleTouchStart(e, p.id)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!readOnly) {
                                    setSelectedPlayerId(prev => prev === p.id ? null : p.id);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                transform: 'translate(-50%, -50%)',
                                cursor: readOnly ? 'default' : 'grab',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: isSelected ? 30 : 10,
                                transition: activeDraggingId === p.id ? 'none' : 'transform 0.15s ease, left 0.2s ease, top 0.2s ease',
                                touchAction: 'none'
                            }}
                        >
                            {/* Selected Pulsing Halo */}
                            {isSelected && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    border: '2px dashed var(--accent-primary)',
                                    animation: 'spin 4s linear infinite',
                                    pointerEvents: 'none'
                                }} />
                            )}

                            {/* Soccer Jersey Icon */}
                            <SoccerJersey
                                color={teamColor}
                                number={showNumbers ? p.number : null}
                                isGoalkeeper={p.isGoalkeeper}
                                isSelected={isSelected}
                                size={40}
                            />

                            {/* Player Name Pill */}
                            {showNames && (
                                <div style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    background: isSelected
                                        ? 'rgba(34, 197, 94, 0.95)'
                                        : 'rgba(10, 10, 10, 0.78)',
                                    border: `1px solid ${isSelected ? '#22c55e' : 'rgba(255,255,255,0.25)'}`,
                                    padding: '2px 7px',
                                    borderRadius: '12px',
                                    marginTop: '2px',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '85px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    lineHeight: '1.2'
                                }}>
                                    {p.name}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Instructional Help */}
            <div style={{
                marginTop: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Move size={14} color="var(--accent-primary)" />
                    {readOnly ? (
                        <span>Taktik dizilimini yalnızca grup yöneticisi değiştirebilir.</span>
                    ) : (
                        <span>
                            Oyuncuları sürükleyip bırakabilir veya bir oyuncuya dokunduktan sonra sahada gitmesini istediğiniz yere tıklayabilirsiniz.
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                        Kaleci (🧤 KL)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: teamAColor }} />
                        {teamAName}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: teamBColor }} />
                        {teamBName}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TacticalBoard;
