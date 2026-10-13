import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from 'recharts';
import {
    TrendingUp,
    Target,
    Award,
    ShieldAlert,
    Eye,
    EyeOff,
    Calendar,
    Flame,
    BarChart3,
    Activity,
    Trophy,
    ExternalLink
} from 'lucide-react';

/**
 * Custom dark-themed tooltip for match performance chart
 */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                background: 'rgba(20, 24, 33, 0.96)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minWidth: '200px'
            }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.35rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label} {data.fullDate ? `(${data.fullDate})` : ''}</span>
                    {data.score && (
                        <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: data.resultColor || 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }}>
                            {data.score} {data.result ? `(${data.result})` : ''}
                        </span>
                    )}
                </div>
                {data.venue && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                        📍 {data.venue}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚽ Gol:
                    </span>
                    <strong style={{ color: '#10b981' }}>{data.goals}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        👟 Asist:
                    </span>
                    <strong style={{ color: '#06b6d4' }}>{data.assists}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                    <span style={{ color: '#f59e0b' }}>🔥 Maç Katkısı:</span>
                    <strong style={{ color: '#f59e0b' }}>{data.total}</strong>
                </div>
                {data.cumulativeTotal !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span>📈 Kümülatif Katkı:</span>
                        <strong style={{ color: '#a78bfa' }}>{data.cumulativeTotal}</strong>
                    </div>
                )}
                {data.matchId && (
                    <div style={{
                        marginTop: '0.5rem',
                        paddingTop: '0.4rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: 'var(--accent-primary)',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                    }}>
                        <span>Maç detayını görmek için tıklayın</span>
                        <ExternalLink size={12} />
                    </div>
                )}
            </div>
        );
    }
    return null;
};

/**
 * Pure helper function to format and compute cumulative performance data
 */
const formatPlayerMatches = (playerMatches, targetIdStr) => {
    let cumulativeGoalsCounter = 0;
    let cumulativeAssistsCounter = 0;
    let cumulativeTotalCounter = 0;

    return (playerMatches || []).map((match, idx) => {
        const stats = match.stats?.[targetIdStr] ||
            (match.stats && Object.entries(match.stats).find(([k]) => String(k) === targetIdStr)?.[1]) ||
            {};
        const goals = parseInt(stats.goals, 10) || 0;
        const assists = parseInt(stats.assists, 10) || 0;
        const total = goals + assists;

        cumulativeGoalsCounter += goals;
        cumulativeAssistsCounter += assists;
        cumulativeTotalCounter += total;

        let dateLabel = `Maç ${idx + 1}`;
        if (match.date) {
            try {
                const parts = match.date.split('-');
                if (parts.length === 3) {
                    dateLabel = `${parts[2]}.${parts[1]}`;
                } else {
                    dateLabel = match.date;
                }
            } catch {
                dateLabel = match.date;
            }
        }

        const scoreA = Number(match.score?.a);
        const scoreB = Number(match.score?.b);
        const hasScore = !isNaN(scoreA) && !isNaN(scoreB);
        const scoreStr = hasScore ? `${scoreA}-${scoreB}` : '';

        // Determine player team and win/loss/draw outcome
        const inTeamA = (match.teamA || []).some(p => String(p.id || p.uid || '') === targetIdStr);
        const inTeamB = (match.teamB || []).some(p => String(p.id || p.uid || '') === targetIdStr);

        let result = null;
        let resultColor = 'rgba(255,255,255,0.1)';
        if (hasScore && (inTeamA || inTeamB)) {
            if (scoreA === scoreB) {
                result = 'B'; // Beraberlik
                resultColor = '#eab308';
            } else if (inTeamA) {
                if (scoreA > scoreB) {
                    result = 'G'; // Galibiyet
                    resultColor = '#10b981';
                } else {
                    result = 'M'; // Mağlubiyet
                    resultColor = '#ef4444';
                }
            } else if (inTeamB) {
                if (scoreB > scoreA) {
                    result = 'G';
                    resultColor = '#10b981';
                } else {
                    result = 'M';
                    resultColor = '#ef4444';
                }
            }
        }

        return {
            name: dateLabel,
            index: idx + 1,
            fullDate: match.date || '',
            venue: match.venue || '',
            goals,
            assists,
            total,
            cumulativeGoals: cumulativeGoalsCounter,
            cumulativeAssists: cumulativeAssistsCounter,
            cumulativeTotal: cumulativeTotalCounter,
            score: scoreStr,
            result,
            resultColor,
            matchId: match.id,
            team: inTeamA ? 'A Takımı' : (inTeamB ? 'B Takımı' : '')
        };
    });
};

const PlayerPerformanceChart = ({
    playerId,
    matches = [],
    isOwner = false,
    showPerformanceChart = true,
    onTogglePrivacy = null,
    isUpdatingPrivacy = false
}) => {
    const navigate = useNavigate();

    // Range tab: 'recent5' (Son 5 Maç) | 'all' (Tüm Maçlar)
    const [rangeMode, setRangeMode] = useState('recent5');
    // Chart type in 'all' mode: 'matchByMatch' | 'cumulative'
    const [chartType, setChartType] = useState('matchByMatch');
    // Show match history list toggle
    const [showMatchHistory, setShowMatchHistory] = useState(false);

    const handleMatchClick = (matchId) => {
        if (matchId) {
            navigate(`/dashboard/matches/${matchId}`);
        }
    };

    // 1. Filter played matches where this player participated
    const targetIdStr = String(playerId || '').trim();
    const playerMatches = (matches || [])
        .filter(m => {
            if (m.status !== 'played' || m.isDeleted) return false;
            const inTeamA = (m.teamA || []).some(p => String(p.id || p.uid || '') === targetIdStr);
            const inTeamB = (m.teamB || []).some(p => String(p.id || p.uid || '') === targetIdStr);
            const hasStat = Boolean(
                m.stats && (
                    m.stats[targetIdStr] !== undefined ||
                    Object.keys(m.stats).some(k => String(k) === targetIdStr)
                )
            );
            return inTeamA || inTeamB || hasStat;
        })
        .sort((a, b) => {
            // Sort chronological: oldest to newest
            const dateA = a.date || a.createdAt || '';
            const dateB = b.date || b.createdAt || '';
            return String(dateA).localeCompare(String(dateB));
        });

    // 2. Format all matches with cumulative counters & results
    const allFormattedMatches = useMemo(() => {
        return formatPlayerMatches(playerMatches, targetIdStr);
    }, [playerMatches, targetIdStr]);

    // 3. Slice recent 5 matches (last 5 chronological)
    const recent5Formatted = allFormattedMatches.slice(-5);

    // Active dataset based on selected range
    const activeChartData = rangeMode === 'recent5' ? recent5Formatted : allFormattedMatches;

    // Summary calculations for active dataset
    const totalGoals = activeChartData.reduce((acc, curr) => acc + curr.goals, 0);
    const totalAssists = activeChartData.reduce((acc, curr) => acc + curr.assists, 0);
    const totalContribution = totalGoals + totalAssists;
    const avgPerMatch = activeChartData.length > 0 ? (totalContribution / activeChartData.length).toFixed(1) : '0';
    const avgGoalsPerMatch = activeChartData.length > 0 ? (totalGoals / activeChartData.length).toFixed(1) : '0';
    const bestMatchScore = activeChartData.length > 0 ? Math.max(...activeChartData.map(d => d.total)) : 0;

    // Career-wide win stats
    const totalWins = allFormattedMatches.filter(d => d.result === 'G').length;
    const totalDraws = allFormattedMatches.filter(d => d.result === 'B').length;
    const totalLosses = allFormattedMatches.filter(d => d.result === 'M').length;
    const winRate = allFormattedMatches.length > 0
        ? Math.round((totalWins / allFormattedMatches.length) * 100)
        : 0;

    // Check privacy preference
    const isHiddenForViewer = !showPerformanceChart && !isOwner;

    // Determine min width for chart when many matches to maintain readability
    const minChartWidth = rangeMode === 'all' && activeChartData.length > 8
        ? Math.max(activeChartData.length * 48, 500)
        : '100%';

    return (
        <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
            {/* Header & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Performans & İstatistik Trendi
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {rangeMode === 'recent5' ? 'Son 5 maçtaki gol ve asist grafiği' : `Kariyerindeki toplam ${playerMatches.length} maçın detaylı analizi`}
                        </p>
                    </div>
                </div>

                {/* Right controls: Segmented Range Switcher & Privacy Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Range Mode Switcher: Son 5 Maç vs Tüm Maçlar */}
                    {!isHiddenForViewer && playerMatches.length > 0 && (
                        <div style={{
                            display: 'inline-flex',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setRangeMode('recent5')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: rangeMode === 'recent5' ? 'var(--accent-primary)' : 'transparent',
                                    color: rangeMode === 'recent5' ? '#000' : 'var(--text-secondary)',
                                    fontWeight: rangeMode === 'recent5' ? 'bold' : 'normal',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Son 5 Maç
                            </button>
                            <button
                                type="button"
                                onClick={() => setRangeMode('all')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: rangeMode === 'all' ? 'var(--accent-primary)' : 'transparent',
                                    color: rangeMode === 'all' ? '#000' : 'var(--text-secondary)',
                                    fontWeight: rangeMode === 'all' ? 'bold' : 'normal',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Tüm Maçlar ({playerMatches.length})
                            </button>
                        </div>
                    )}

                    {/* Privacy Toggle / Status for Owner */}
                    {isOwner && onTogglePrivacy && (
                        <button
                            type="button"
                            onClick={onTogglePrivacy}
                            disabled={isUpdatingPrivacy}
                            className="btn btn-secondary"
                            style={{
                                fontSize: '0.8rem',
                                padding: '0.4rem 0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                borderColor: showPerformanceChart ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                color: showPerformanceChart ? 'var(--accent-primary)' : '#ef4444'
                            }}
                            title={showPerformanceChart ? "Grafiği diğer kullanıcılara gizle" : "Grafiği diğer kullanıcılara görünür yap"}
                        >
                            {showPerformanceChart ? (
                                <>
                                    <Eye size={15} /> Herkese Görünür
                                </>
                            ) : (
                                <>
                                    <EyeOff size={15} /> Yalnızca Siz Görüyorsunuz
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Privacy Shield Notice (when non-owner visits a profile with hidden chart) */}
            {isHiddenForViewer ? (
                <div style={{
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-color)'
                }}>
                    <ShieldAlert size={38} color="var(--text-secondary)" style={{ margin: '0 auto 0.75rem' }} />
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Performans Grafiği Gizli
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
                        Bu kullanıcı, 6698 Sayılı KVKK ve gizlilik tercihleri kapsamında maç performans grafiğini gizli tutmayı tercih etmiştir.
                    </p>
                </div>
            ) : activeChartData.length === 0 ? (
                /* Empty state when player has no matches yet */
                <div style={{
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-color)'
                }}>
                    <Calendar size={36} color="var(--text-secondary)" style={{ margin: '0 auto 0.75rem' }} />
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                        Henüz Maç Verisi Yok
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Bu oyuncu henüz tamamlanmış bir maçta yer almadı. Maçlar oynandıkça performans grafiği burada otomatik belirecektir.
                    </p>
                </div>
            ) : (
                /* Chart and Performance KPIs */
                <>
                    {/* Owner-only hidden notice banner */}
                    {isOwner && !showPerformanceChart && (
                        <div style={{
                            padding: '0.5rem 0.75rem',
                            marginBottom: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 'var(--radius-md)',
                            color: '#fca5a5',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <EyeOff size={16} />
                            <span><strong>Gizli Mod:</strong> Bu grafiği yalnızca siz görebilirsiniz. Diğer üyeler profilinizi ziyaret ettiğinde grafik gizlenir.</span>
                        </div>
                    )}

                    {/* KPI Quick Badges */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1.25rem'
                    }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Target size={13} color="#10b981" /> Toplam Gol
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.2rem' }}>
                                {totalGoals}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>
                                    ({avgGoalsPerMatch}/maç)
                                </span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Flame size={13} color="#06b6d4" /> Toplam Asist
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#06b6d4', marginTop: '0.2rem' }}>
                                {totalAssists}
                            </div>
                        </div>

                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Award size={13} color="#f59e0b" /> Maç Başı Katkı
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.2rem' }}>
                                {avgPerMatch}
                            </div>
                        </div>

                        {rangeMode === 'all' ? (
                            <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Trophy size={13} color="#a855f7" /> Kazanma Oranı
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#c084fc', marginTop: '0.2rem' }}>
                                    %{winRate}
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>
                                        ({totalWins}G {totalDraws}B {totalLosses}M)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    En Skorer Maç
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                    {bestMatchScore} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>skor</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Secondary Chart Type Selector (When 'all' mode is active) */}
                    {rangeMode === 'all' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Activity size={15} color="var(--accent-primary)" />
                                <span>Toplam <strong>{activeChartData.length}</strong> maç görselleştiriliyor</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setChartType('matchByMatch')}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.55rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-color)',
                                        background: chartType === 'matchByMatch' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: chartType === 'matchByMatch' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                    }}
                                >
                                    <BarChart3 size={13} /> Maç Maç Dağılım
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartType('cumulative')}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.55rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-color)',
                                        background: chartType === 'cumulative' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: chartType === 'cumulative' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                    }}
                                >
                                    <TrendingUp size={13} /> Kümülatif Yükseliş
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Click-to-view Match Banner */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.85rem',
                        marginBottom: '0.75rem',
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <ExternalLink size={14} color="var(--accent-primary)" />
                            <span>Grafikteki sütunlara veya aşağıdaki maç kutularına tıklayarak doğrudan o maçın detay sayfasına gidebilirsiniz.</span>
                        </span>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            Maça Git ↗
                        </span>
                    </div>

                    {/* Recharts Visualization Container */}
                    <div style={{
                        width: '100%',
                        overflowX: activeChartData.length > 10 ? 'auto' : 'hidden',
                        paddingBottom: '0.5rem'
                    }}>
                        <div style={{ width: minChartWidth, height: '270px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={activeChartData}
                                    margin={{ top: 12, right: 12, left: -20, bottom: 5 }}
                                    style={{ cursor: 'pointer' }}
                                    onClick={(state) => {
                                        if (state && state.activePayload && state.activePayload.length > 0) {
                                            const clicked = state.activePayload[0].payload;
                                            if (clicked && clicked.matchId) {
                                                handleMatchClick(clicked.matchId);
                                            }
                                        }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="goalBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.25} />
                                        </linearGradient>
                                        <linearGradient id="assistBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.85} />
                                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.25} />
                                        </linearGradient>
                                        <linearGradient id="cumulativeArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--text-secondary)"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        fontSize={11}
                                        allowDecimals={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '8px', fontSize: '0.8rem' }}
                                        formatter={(value) => {
                                            if (value === 'goals') return <span style={{ color: '#10b981' }}>Goller</span>;
                                            if (value === 'assists') return <span style={{ color: '#06b6d4' }}>Asistler</span>;
                                            if (value === 'total') return <span style={{ color: '#f59e0b' }}>Toplam Katkı Trendi</span>;
                                            if (value === 'cumulativeTotal') return <span style={{ color: '#a855f7' }}>Kümülatif Skor Eğrisi</span>;
                                            return value;
                                        }}
                                    />

                                    {chartType === 'cumulative' && rangeMode === 'all' ? (
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey="cumulativeTotal"
                                                name="cumulativeTotal"
                                                stroke="#a855f7"
                                                fill="url(#cumulativeArea)"
                                                strokeWidth={2.5}
                                                cursor="pointer"
                                                onClick={(entry) => {
                                                    if (entry && entry.matchId) handleMatchClick(entry.matchId);
                                                }}
                                            />
                                            <Bar
                                                dataKey="goals"
                                                name="goals"
                                                fill="url(#goalBar)"
                                                radius={[3, 3, 0, 0]}
                                                barSize={14}
                                                cursor="pointer"
                                                onClick={(entry) => {
                                                    if (entry && entry.matchId) handleMatchClick(entry.matchId);
                                                }}
                                            />
                                            <Bar
                                                dataKey="assists"
                                                name="assists"
                                                fill="url(#assistBar)"
                                                radius={[3, 3, 0, 0]}
                                                barSize={14}
                                                cursor="pointer"
                                                onClick={(entry) => {
                                                    if (entry && entry.matchId) handleMatchClick(entry.matchId);
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {/* Average Reference Line */}
                                            {Number(avgPerMatch) > 0 && (
                                                <ReferenceLine
                                                    y={Number(avgPerMatch)}
                                                    stroke="rgba(245, 158, 11, 0.45)"
                                                    strokeDasharray="4 4"
                                                    label={{
                                                        value: `Ort: ${avgPerMatch}`,
                                                        fill: '#f59e0b',
                                                        position: 'right',
                                                        fontSize: 10
                                                    }}
                                                />
                                            )}
                                            <Bar
                                                dataKey="goals"
                                                name="goals"
                                                fill="url(#goalBar)"
                                                radius={[4, 4, 0, 0]}
                                                barSize={rangeMode === 'all' && activeChartData.length > 10 ? 14 : 20}
                                                cursor="pointer"
                                                onClick={(entry) => {
                                                    if (entry && entry.matchId) handleMatchClick(entry.matchId);
                                                }}
                                            />
                                            <Bar
                                                dataKey="assists"
                                                name="assists"
                                                fill="url(#assistBar)"
                                                radius={[4, 4, 0, 0]}
                                                barSize={rangeMode === 'all' && activeChartData.length > 10 ? 14 : 20}
                                                cursor="pointer"
                                                onClick={(entry) => {
                                                    if (entry && entry.matchId) handleMatchClick(entry.matchId);
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="total"
                                                name="total"
                                                stroke="#f59e0b"
                                                strokeWidth={2.5}
                                                dot={{ fill: '#f59e0b', r: 3, strokeWidth: 1.5, stroke: '#141821', cursor: 'pointer' }}
                                                activeDot={{
                                                    r: 6,
                                                    fill: '#f59e0b',
                                                    stroke: '#fff',
                                                    strokeWidth: 2,
                                                    cursor: 'pointer',
                                                    onClick: (_, payload) => {
                                                        if (payload?.payload?.matchId) handleMatchClick(payload.payload.matchId);
                                                    }
                                                }}
                                                cursor="pointer"
                                                onClick={(entry) => {
                                                    if (entry && entry.matchId) handleMatchClick(entry.matchId);
                                                }}
                                            />
                                        </>
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Micro Match Quick Pills (Clickable Link to Match Detail) */}
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        gap: '0.45rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        {activeChartData.map((d, i) => (
                            <Link
                                key={d.matchId || i}
                                to={`/dashboard/matches/${d.matchId}`}
                                title={`${d.fullDate || d.name} maçının detayına gitmek için tıklayın`}
                                style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span style={{ color: 'var(--text-secondary)' }}>{d.name}:</span>
                                <strong style={{ color: '#10b981' }}>{d.goals}G</strong>
                                <span style={{ color: 'var(--text-secondary)' }}>/</span>
                                <strong style={{ color: '#06b6d4' }}>{d.assists}A</strong>
                                {d.result && (
                                    <span style={{
                                        padding: '0 4px',
                                        borderRadius: '3px',
                                        fontSize: '0.68rem',
                                        background: d.resultColor,
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    }}>
                                        {d.result}
                                    </span>
                                )}
                                <ExternalLink size={10} color="var(--accent-primary)" style={{ marginLeft: '2px', opacity: 0.8 }} />
                            </Link>
                        ))}
                    </div>

                    {/* Match History Table Toggle (especially helpful for viewing all matches) */}
                    <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setShowMatchHistory(!showMatchHistory)}
                            className="btn btn-secondary"
                            style={{
                                fontSize: '0.8rem',
                                padding: '0.4rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <Calendar size={14} />
                            {showMatchHistory ? 'Maç Listesini Gizle' : `Oynanan Tüm Maçların Listesi (${allFormattedMatches.length})`}
                        </button>
                    </div>

                    {/* Expandable Match History Table */}
                    {showMatchHistory && (
                        <div style={{
                            marginTop: '1rem',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '1rem',
                            overflowX: 'auto'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.5rem 0.75rem' }}>#</th>
                                        <th style={{ padding: '0.5rem 0.75rem' }}>Tarih</th>
                                        <th style={{ padding: '0.5rem 0.75rem' }}>Saha</th>
                                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Skor</th>
                                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Gol</th>
                                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Asist</th>
                                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Toplam</th>
                                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>İncele</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...allFormattedMatches].reverse().map((m, idx) => (
                                        <tr
                                            key={m.matchId || idx}
                                            onClick={() => handleMatchClick(m.matchId)}
                                            title={`${m.fullDate || m.name} maç detayını açmak için tıklayın`}
                                            style={{
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                                                {allFormattedMatches.length - idx}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>
                                                {m.fullDate || m.name}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                                                {m.venue || '-'}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                {m.score ? (
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: m.resultColor || 'rgba(255,255,255,0.05)',
                                                        color: '#fff',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.78rem'
                                                    }}>
                                                        {m.score} {m.result ? `(${m.result})` : ''}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>
                                                {m.goals}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#06b6d4' }}>
                                                {m.assists}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>
                                                {m.total}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                <Link
                                                    to={`/dashboard/matches/${m.matchId}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                    title="Maç detayını görüntüle"
                                                >
                                                    <ExternalLink size={12} /> Detay
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayerPerformanceChart;
