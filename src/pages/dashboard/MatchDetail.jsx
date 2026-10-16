import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    Trophy,
    Save,
    Users,
    UserPlus,
    Video,
    FileText,
    ExternalLink,
    Hand,
    Share2,
    Star,
    Trash2,
    Plus,
    ArrowLeft,
    CheckCircle2,
    Sparkles,
    Award,
    Check,
    ThumbsUp,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

import TacticalBoard from '../../components/TacticalBoard';
import ConfirmModal from '../../components/ConfirmModal';
import VenueLocationPicker from '../../components/VenueLocationPicker';
import FeeCollectionTracker from '../../components/FeeCollectionTracker';
import { toTitleCase, stripSenSuffix, formatPlayerDisplayName } from '../../utils';

const MatchDetail = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { matches, groups, finishMatch, deleteMatch, revertMatchToScheduled, getUsersDetails, updateMatchTeams, updateMatchVenue, fetchMatch, fetchGroup, givePlayerRating } = useData();
    const { currentUser } = useAuth();
    const contextMatch = matches.find(m => m.id === matchId);
    const contextGroup = contextMatch ? groups.find(g => g.id === contextMatch.groupId) : null;

    const [fetchedMatch, setFetchedMatch] = useState(null);
    const [fetchedGroup, setFetchedGroup] = useState(null);
    // If we don't have the match in context, we need to load it.
    const [loading, setLoading] = useState(!contextMatch && !!matchId);

    const match = fetchedMatch || contextMatch;
    const group = contextGroup || fetchedGroup;

    // Real-time listener for current match document to capture ratings live
    useEffect(() => {
        if (!matchId) return;
        const matchRef = doc(db, 'matches', matchId);
        const unsubscribe = onSnapshot(matchRef, (docSnap) => {
            if (docSnap.exists()) {
                setFetchedMatch({ id: docSnap.id, ...docSnap.data() });
            }
        }, (err) => {
            console.error("Match listener error:", err);
        });
        return () => unsubscribe();
    }, [matchId]);

    // Fetch match/group data if not in context
    useEffect(() => {
        if (!contextMatch && matchId) {
            setLoading(true);
            const loadData = async () => {
                // 1. Fetch Match
                const m = await fetchMatch(matchId);
                if (m) {
                    setFetchedMatch(m);
                    // 2. Fetch Group if not in context
                    // Try to find group in context first (unlikely if match wasn't there, but possible if subscription was slow)
                    const gInContext = groups.find(g => g.id === m.groupId);
                    if (gInContext) {
                        setFetchedGroup(gInContext); // Should ideally rely on contextGroup logic, but this is safe
                    } else {
                        const g = await fetchGroup(m.groupId);
                        setFetchedGroup(g);
                    }
                }
                setLoading(false);
            };
            loadData();
        }
    }, [matchId, contextMatch, groups, fetchGroup, fetchMatch]);

    const [scoreA, setScoreA] = useState(match?.score?.a || 0);
    const [scoreB, setScoreB] = useState(match?.score?.b || 0);

    // Squad State
    const [teamA, setTeamA] = useState(match?.teamA || []);
    const [teamB, setTeamB] = useState(match?.teamB || []);
    const [teamAName, setTeamAName] = useState(match?.teamAName || 'Takım A');
    const [teamBName, setTeamBName] = useState(match?.teamBName || 'Takım B');
    const [teamAColor, setTeamAColor] = useState(match?.teamAColor || '#2563eb');
    const [teamBColor, setTeamBColor] = useState(match?.teamBColor || '#dc2626');

    // Venue & Location State
    const [venue, setVenue] = useState(match?.venue || '');
    const [venueAddress, setVenueAddress] = useState(match?.venueAddress || '');
    const [venueMapsUrl, setVenueMapsUrl] = useState(match?.venueMapsUrl || '');
    const [venueCoordinates, setVenueCoordinates] = useState(match?.venueCoordinates || null);

    // Media & Content State
    const [videoUrls, setVideoUrls] = useState(match?.videoUrls || (match?.videoUrl ? [match.videoUrl] : []));
    const [matchSummary, setMatchSummary] = useState(match?.matchSummary || '');

    // Stats State: { playerId: { goals: 0, assists: 0 } }
    const [playerStats, setPlayerStats] = useState(match?.stats || {});

    const [isEditing, setIsEditing] = useState(false);
    const [memberDetails, setMemberDetails] = useState([]);
    const [localRatings, setLocalRatings] = useState({});
    const [toast, setToast] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        confirmText: '',
        isDanger: true,
        isLoading: false,
        error: null
    });

    useEffect(() => {
        if (match?.ratings) {
            setLocalRatings(match.ratings);
        }
    }, [match?.ratings]);

    useEffect(() => {
        if (match) {
            setScoreA(match.score?.a || 0);
            setScoreB(match.score?.b || 0);
            const cleanA = (match.teamA || []).map(p => ({ ...p, name: stripSenSuffix(p.name) }));
            const cleanB = (match.teamB || []).map(p => ({ ...p, name: stripSenSuffix(p.name) }));
            setTeamA(cleanA);
            setTeamB(cleanB);
            setTeamAName(match.teamAName || 'Takım A');
            setTeamBName(match.teamBName || 'Takım B');
            setTeamAColor(match.teamAColor || '#2563eb');
            setTeamBColor(match.teamBColor || '#dc2626');
            setVenue(match.venue || '');
            setVenueAddress(match.venueAddress || '');
            setVenueMapsUrl(match.venueMapsUrl || '');
            setVenueCoordinates(match.venueCoordinates || null);
            setVideoUrls(match.videoUrls || (match.videoUrl ? [match.videoUrl] : []));
            setMatchSummary(match.matchSummary || '');
            setPlayerStats(match.stats || {});

            // Non-admin players should NEVER be forced into editing mode
            const userIsAdmin = Boolean(
                currentUser && group && (
                    String(group.createdBy) === String(currentUser.uid || currentUser.id) ||
                    (Array.isArray(group.admins) && group.admins.map(String).includes(String(currentUser.uid || currentUser.id)))
                )
            );
            if (userIsAdmin) {
                setIsEditing(match.status !== 'played');
            } else {
                setIsEditing(false);
            }
        }
    }, [match, currentUser, group]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (group && group.members) {
                const details = await getUsersDetails(group.members);
                setMemberDetails(details);
            }
        };
        fetchMembers();
    }, [group, getUsersDetails]);

    if (loading) return <div>Yükleniyor...</div>;
    if (!match || !group) return <div>Maç bulunamadı.</div>;

    // Combine all available players and sort alphabetically
    const currentUserId = currentUser ? String(currentUser.uid || currentUser.id) : null;
    const isAdmin = Boolean(
        currentUser && group && (
            String(group.createdBy) === currentUserId ||
            (Array.isArray(group.admins) && group.admins.map(String).includes(currentUserId))
        )
    );

    // Check if current user is already in the details list
    const isCurrentUserInDetails = currentUserId && memberDetails.some(m => String(m.id) === currentUserId);

    let effectiveMemberDetails = [...memberDetails];

    // Force add current user if they are creator OR member, and not in details
    if (currentUser && !isCurrentUserInDetails && group.members?.includes(currentUserId)) {
        effectiveMemberDetails.push({
            id: currentUserId,
            name: toTitleCase(stripSenSuffix(currentUser.name || currentUser.displayName || 'Siz')),
            ...currentUser
        });
    }

    const allPlayers = [
        ...effectiveMemberDetails.map(m => ({
            id: m.id,
            name: toTitleCase(stripSenSuffix(m.name))
        })),
        ...(group.guestPlayers || []).map(g => ({
            id: g.id,
            name: toTitleCase(stripSenSuffix(g.name))
        }))
    ].sort((a, b) => (a.name || 'Unknown').localeCompare(b.name || 'Unknown', 'tr'));

    const handleStatChange = (playerId, type, value) => {
        setPlayerStats(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [type]: parseInt(value) || 0
            }
        }));
    };

    const togglePlayerTeam = (player, team) => {
        if (team === 'A') {
            if (teamA.find(p => p.id === player.id)) {
                setTeamA(teamA.filter(p => p.id !== player.id));
            } else {
                setTeamA([...teamA, { ...player, isGoalkeeper: false }]); // Default to not GK
                setTeamB(teamB.filter(p => p.id !== player.id)); // Remove from B if exists
            }
        } else {
            if (teamB.find(p => p.id === player.id)) {
                setTeamB(teamB.filter(p => p.id !== player.id));
            } else {
                setTeamB([...teamB, { ...player, isGoalkeeper: false }]); // Default to not GK
                setTeamA(teamA.filter(p => p.id !== player.id)); // Remove from A if exists
            }
        }
    };

    const toggleGoalkeeper = (player, team) => {
        if (team === 'A') {
            setTeamA(teamA.map(p =>
                p.id === player.id ? { ...p, isGoalkeeper: !p.isGoalkeeper } : p
            ));
        } else {
            setTeamB(teamB.map(p =>
                p.id === player.id ? { ...p, isGoalkeeper: !p.isGoalkeeper } : p
            ));
        }
    };

    const handleSave = () => {
        const parsedA = parseInt(scoreA, 10);
        const parsedB = parseInt(scoreB, 10);
        const finalScoreA = isNaN(parsedA) ? 0 : parsedA;
        const finalScoreB = isNaN(parsedB) ? 0 : parsedB;
        finishMatch(
            matchId,
            finalScoreA,
            finalScoreB,
            playerStats,
            teamA,
            teamB,
            teamAName,
            teamBName,
            videoUrls.filter(url => url.trim() !== ''),
            matchSummary,
            teamAColor,
            teamBColor,
            { venue, venueAddress, venueMapsUrl, venueCoordinates }
        );
        setIsEditing(false);
    };

    const handleTacticalSave = async (newTeamA, newTeamB, colors = {}) => {
        const cleanA = (newTeamA || []).map(p => ({ ...p, name: toTitleCase(stripSenSuffix(p.name)) }));
        const cleanB = (newTeamB || []).map(p => ({ ...p, name: toTitleCase(stripSenSuffix(p.name)) }));
        setTeamA(cleanA);
        setTeamB(cleanB);
        const newColorA = colors?.teamAColor || teamAColor;
        const newColorB = colors?.teamBColor || teamBColor;
        if (colors?.teamAColor) setTeamAColor(colors.teamAColor);
        if (colors?.teamBColor) setTeamBColor(colors.teamBColor);
        // Persist immediate changes for tactical board
        const result = await updateMatchTeams(matchId, cleanA, cleanB, {
            teamAColor: newColorA,
            teamBColor: newColorB,
            teamAName,
            teamBName
        });
        if (result.success) {
            setToast({ type: 'success', message: 'Taktik, dizilim ve takım renkleri kaydedildi!' });
            setTimeout(() => setToast(null), 3000);
        } else {
            setToast({ type: 'error', message: 'Kaydedilirken hata oluştu.' });
            setTimeout(() => setToast(null), 4000);
        }
    };

    const handleSaveVenueOnly = async () => {
        try {
            await updateMatchVenue(matchId, {
                venue,
                venueAddress,
                venueMapsUrl,
                venueCoordinates
            });
            setToast({ type: 'success', message: 'Halısaha tesis ve konum bilgileri güncellendi!' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error saving venue:', err);
            setToast({ type: 'error', message: 'Konum kaydedilirken hata oluştu.' });
            setTimeout(() => setToast(null), 4000);
        }
    };

    // Rating Logic
    const activeRatings = localRatings || match?.ratings || {};

    const getPlayerRatingData = (playerId) => {
        const playerRatings = activeRatings[playerId] || {};
        const votes = Object.values(playerRatings);
        if (votes.length === 0) return { average: '-', count: 0 };
        const sum = votes.reduce((a, b) => a + b, 0);
        return { average: (sum / votes.length).toFixed(1), count: votes.length };
    };

    const getMyVote = (playerId) => {
        if (!currentUserId) return '';
        const playerRatings = activeRatings[playerId] || {};
        const vote = playerRatings[currentUserId];
        return vote !== undefined && vote !== null ? String(vote) : '';
    };

    const handleRate = async (playerId, score) => {
        if (!currentUserId) {
            setToast({ type: 'error', message: 'Puan vermek için giriş yapmalısınız.' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        const val = score === '' ? '' : parseInt(score, 10);

        // Optimistically update local UI immediately
        setLocalRatings(prev => {
            const next = { ...prev };
            const playerVotes = { ...(next[playerId] || {}) };
            if (val === '' || isNaN(val)) {
                delete playerVotes[currentUserId];
            } else {
                playerVotes[currentUserId] = val;
            }
            next[playerId] = playerVotes;
            return next;
        });

        const result = await givePlayerRating(matchId, playerId, score);
        if (!result.success) {
            setToast({ type: 'error', message: result.error || 'Puan verilirken bir hata oluştu.' });
            setTimeout(() => setToast(null), 5000);
        } else {
            const msg = val === '' ? 'Puanınız kaldırıldı.' : `⭐ ${val} puan başarıyla kaydedildi!`;
            setToast({ type: 'success', message: msg });
            setTimeout(() => setToast(null), 2500);
        }
    };

    const handleDeleteMatch = () => {
        const isPlayedOrHasScore = match.status === 'played' || (match.score && (match.score.a !== null || match.score.b !== null));
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: isPlayedOrHasScore ? 'Maçı Sil' : 'Planlanan Maçı Sil',
            message: isPlayedOrHasScore
                ? 'Bu maçı silmek istediğinize emin misiniz? Maç Çöp Kutusu\'na kaldırılacak ve grup sayfasındaki Çöp Kutusu\'ndan dilediğiniz an tek tıkla geri yükleyebileceksiniz.'
                : 'Bu planlanan maçı silmek istediğinize emin misiniz? Maç Çöp Kutusu\'na kaldırılacaktır.',
            confirmText: 'Evet, Sil (Çöp Kutusuna Taşı)',
            isDanger: true,
            isLoading: false,
            error: null
        });
    };

    const handleRevertToScheduled = () => {
        setConfirmModal({
            isOpen: true,
            type: 'revert',
            title: 'Planlanan Duruma Geri Al (Oynanmadı)',
            message: 'Bu maçı "Planlandı (Oynanmadı)" durumuna geri almak istediğinize emin misiniz? Girilen skor ve oyuncu istatistikleri sıfırlanacaktır.',
            confirmText: 'Evet, Geri Al',
            isDanger: false,
            isLoading: false,
            error: null
        });
    };

    const handleModalConfirm = async () => {
        if (confirmModal.type === 'delete') {
            setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
            const result = await deleteMatch(matchId);
            if (result.success) {
                navigate(`/dashboard/groups/${group?.id || match?.groupId || ''}`);
            } else {
                setConfirmModal(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error || 'Maç silinirken hata oluştu.'
                }));
            }
        } else if (confirmModal.type === 'revert') {
            setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
            const result = await revertMatchToScheduled(matchId);
            if (result.success) {
                setIsEditing(false);
                setScoreA(0);
                setScoreB(0);
                setPlayerStats({});
                setConfirmModal({ isOpen: false, type: null, isLoading: false, error: null });
            } else {
                setConfirmModal(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error || 'Maç durumu geri alınırken hata oluştu.'
                }));
            }
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            {toast && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${toast.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: toast.type === 'success' ? '#22c55e' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: '1' }}
                    >
                        ×
                    </button>
                </div>
            )}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/dashboard/groups/${group?.id || match?.groupId || ''}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <ArrowLeft size={16} /> Gruba Dön
                </Link>
                {isAdmin && (
                    <button
                        onClick={handleDeleteMatch}
                        className="btn"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                        title="Maçı Sil"
                    >
                        <Trash2 size={16} /> Maçı Sil
                    </button>
                )}
            </div>
            {/* Scoreboard */}
            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem 1rem' }}>
                <h2 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{match.venue}</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {new Date(match.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {' '}
                    {new Date(match.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <button
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setToast({ type: 'success', message: 'Maç bağlantısı kopyalandı! Arkadaşlarınızla paylaşabilirsiniz.' });
                        setTimeout(() => setToast(null), 3500);
                    }}
                    className="btn btn-secondary"
                    style={{ margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Share2 size={16} /> Paylaş
                </button>

                {/* Video Link Display (Only if exists and not editing) */}
                {!isEditing && videoUrls.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        {videoUrls.map((url, index) => (
                            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Video size={18} /> {videoUrls.length > 1 ? `${index + 1}. Maç Videosunu İzle` : 'Maç Videosunu İzle'} <ExternalLink size={14} />
                            </a>
                        ))}
                    </div>
                )}

                {/* Video Links Input (Editing) */}
                {isEditing && (
                    <div style={{ maxWidth: '500px', margin: '0 auto 2rem auto' }}>
                        {videoUrls.map((url, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Video size={18} color="var(--text-secondary)" />
                                <input
                                    type="url"
                                    placeholder={`Maç Videosu Linki #${index + 1}`}
                                    value={url}
                                    onChange={(e) => {
                                        const newUrls = [...videoUrls];
                                        newUrls[index] = e.target.value;
                                        setVideoUrls(newUrls);
                                    }}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                                <button
                                    onClick={() => {
                                        const newUrls = videoUrls.filter((_, i) => i !== index);
                                        setVideoUrls(newUrls);
                                    }}
                                    style={{ color: 'var(--accent-secondary)' }}
                                    title="Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setVideoUrls([...videoUrls, ''])}
                            className="btn btn-secondary"
                            style={{ width: '100%', fontSize: '0.9rem', marginTop: '0.5rem' }}
                        >
                            <Plus size={16} /> Başka Video Linki Ekle
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    value={teamAName}
                                    onChange={(e) => setTeamAName(e.target.value)}
                                    style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: teamAColor || 'var(--accent-primary)', textAlign: 'center', width: '100%', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Forma:</label>
                                    <input
                                        type="color"
                                        value={teamAColor}
                                        onChange={(e) => setTeamAColor(e.target.value)}
                                        title={`${teamAName} Forma Rengi`}
                                        style={{ width: '28px', height: '24px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                    />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{teamAColor}</span>
                                </div>
                            </>
                        ) : (
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: teamAColor || 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: teamAColor || '#2563eb', border: '1.5px solid rgba(255,255,255,0.7)', display: 'inline-block' }} />
                                {teamAName}
                            </h3>
                        )}
                        {isEditing ? (
                            <input
                                type="number"
                                value={scoreA === '' || isNaN(scoreA) ? '' : scoreA}
                                onChange={(e) => setScoreA(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                style={{ width: '80px', fontSize: '2rem', textAlign: 'center', padding: '0.5rem' }}
                            />
                        ) : (
                            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{isNaN(scoreA) || scoreA === null || scoreA === undefined ? '-' : scoreA}</div>
                        )}
                    </div>

                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>-</div>

                    <div style={{ textAlign: 'center', flex: 1 }}>
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    value={teamBName}
                                    onChange={(e) => setTeamBName(e.target.value)}
                                    style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: teamBColor || 'var(--accent-secondary)', textAlign: 'center', width: '100%', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Forma:</label>
                                    <input
                                        type="color"
                                        value={teamBColor}
                                        onChange={(e) => setTeamBColor(e.target.value)}
                                        title={`${teamBName} Forma Rengi`}
                                        style={{ width: '28px', height: '24px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                    />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{teamBColor}</span>
                                </div>
                            </>
                        ) : (
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: teamBColor || 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: teamBColor || '#dc2626', border: '1.5px solid rgba(255,255,255,0.7)', display: 'inline-block' }} />
                                {teamBName}
                            </h3>
                        )}
                        {isEditing ? (
                            <input
                                type="number"
                                value={scoreB === '' || isNaN(scoreB) ? '' : scoreB}
                                onChange={(e) => setScoreB(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                style={{ width: '80px', fontSize: '2rem', textAlign: 'center', padding: '0.5rem' }}
                            />
                        ) : (
                            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{isNaN(scoreB) || scoreB === null || scoreB === undefined ? '-' : scoreB}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Halısaha Konumu ve Tesis Bilgileri */}
            <VenueLocationPicker
                venue={venue}
                onVenueChange={setVenue}
                address={venueAddress}
                onAddressChange={setVenueAddress}
                mapsUrl={venueMapsUrl}
                onMapsUrlChange={setVenueMapsUrl}
                coordinates={venueCoordinates}
                onCoordinatesChange={setVenueCoordinates}
                isEditing={isEditing}
                canEdit={isAdmin}
                onSaveVenue={isAdmin ? handleSaveVenueOnly : undefined}
            />

            {/* Halısaha Ücret Toplama ve Kasa Takibi (Sadece Grup Yöneticisi Görür) */}
            {isAdmin && (
                <FeeCollectionTracker
                    match={match}
                    group={group}
                    isAdmin={isAdmin}
                />
            )}

            {/* Match Summary Section */}
            {(matchSummary || isEditing) && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} /> Maç Özeti & Değerlendirme
                    </h3>
                    {isEditing ? (
                        <textarea
                            placeholder="Maç hakkında notlar, değerlendirmeler, önemli anlar..."
                            value={matchSummary}
                            onChange={(e) => setMatchSummary(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                resize: 'vertical',
                                lineHeight: '1.5',
                                fontFamily: 'inherit'
                            }}
                        />
                    ) : (
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            {matchSummary}
                        </div>
                    )}
                </div>
            )}

            {/* Tactical Board */}
            <div style={{ marginBottom: '2rem' }}>
                <TacticalBoard match={{ teamA, teamB, teamAName: teamAName || match?.teamAName || 'Takım A', teamBName: teamBName || match?.teamBName || 'Takım B', teamAColor: teamAColor || match?.teamAColor || '#2563eb', teamBColor: teamBColor || match?.teamBColor || '#dc2626' }} group={group} onSave={isAdmin ? handleTacticalSave : undefined} readOnly={!isAdmin} />
            </div>

            {/* Squad Selection (Only visible when editing) */}
            {isEditing && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} /> Kadro Seçimi
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {allPlayers.map(player => {
                            const inA = teamA.find(p => p.id === player.id);
                            const inB = teamB.find(p => p.id === player.id);

                            return (
                                <div key={player.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'var(--bg-primary)',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {formatPlayerDisplayName(player, currentUserId)}
                                        {(inA?.isGoalkeeper || inB?.isGoalkeeper) && <Hand size={14} fill="gold" color="gold" />}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            onClick={() => togglePlayerTeam(player, 'A')}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                background: inA ? (teamAColor || 'var(--accent-primary)') : 'rgba(255,255,255,0.1)',
                                                color: inA ? '#fff' : 'inherit',
                                                fontSize: '0.75rem',
                                                fontWeight: inA ? 'bold' : 'normal'
                                            }}
                                        >
                                            A
                                        </button>
                                        <button
                                            onClick={() => togglePlayerTeam(player, 'B')}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                background: inB ? (teamBColor || 'var(--accent-secondary)') : 'rgba(255,255,255,0.1)',
                                                color: inB ? '#fff' : 'inherit',
                                                fontSize: '0.75rem',
                                                fontWeight: inB ? 'bold' : 'normal'
                                            }}
                                        >
                                            B
                                        </button>
                                        {(inA || inB) && (
                                            <button
                                                onClick={() => toggleGoalkeeper(player, inA ? 'A' : 'B')}
                                                style={{
                                                    padding: '0.25rem',
                                                    borderRadius: '4px',
                                                    background: (inA?.isGoalkeeper || inB?.isGoalkeeper) ? '#FFD700' : 'rgba(255,255,255,0.2)', // Increased contrast
                                                    color: (inA?.isGoalkeeper || inB?.isGoalkeeper) ? '#000' : 'var(--text-primary)', // Brighter text when inactive
                                                    border: '1px solid var(--border-color)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginLeft: '4px' // Added margin
                                                }}
                                                title="Kaleci Yap"
                                            >
                                                <Hand size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Player Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Team A Stats */}
                <div className="card">
                    <h3 style={{ color: teamAColor || 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: teamAColor || '#2563eb', border: '1.5px solid rgba(255,255,255,0.7)', display: 'inline-block' }} />
                        {teamAName} İstatistikleri
                    </h3>
                    {teamA.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Oyuncu seçilmedi.</p>}
                    {teamA.map(player => (
                        <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
                            <Link
                                to={`/profile/${player.id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    color: 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    minWidth: 0,
                                    flex: 1,
                                    overflow: 'hidden'
                                }}
                                className="hover:underline"
                                title="Oyuncu profilini ve son 5 maçlık performans grafiğini gör"
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {formatPlayerDisplayName(player, currentUserId)}
                                </span>
                                {player.isGoalkeeper && <Hand size={14} fill="gold" color="gold" style={{ flexShrink: 0 }} />}
                            </Link>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ width: '38px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Gol</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={playerStats[player.id]?.goals || 0}
                                            onChange={(e) => handleStatChange(player.id, 'goals', e.target.value)}
                                            style={{ width: '38px', padding: '0.2rem', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>{playerStats[player.id]?.goals || 0}</span>
                                    )}
                                </div>
                                <div style={{ width: '38px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Asist</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={playerStats[player.id]?.assists || 0}
                                            onChange={(e) => handleStatChange(player.id, 'assists', e.target.value)}
                                            style={{ width: '38px', padding: '0.2rem', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>{playerStats[player.id]?.assists || 0}</span>
                                    )}
                                </div>
                                <div style={{ width: '46px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Kurtarış</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={playerStats[player.id]?.saves || 0}
                                            onChange={(e) => handleStatChange(player.id, 'saves', e.target.value)}
                                            style={{ width: '46px', padding: '0.2rem', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>{playerStats[player.id]?.saves || 0}</span>
                                    )}
                                </div>
                                {/* Rating Column */}
                                <div style={{ width: '96px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>
                                        Puan {getPlayerRatingData(player.id).count > 0 ? `(${getPlayerRatingData(player.id).count})` : ''}
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', minWidth: '22px', textAlign: 'right' }}>
                                            {getPlayerRatingData(player.id).average}
                                        </span>
                                        <Star size={12} fill="var(--accent-primary)" color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                                        {/* Vote Input */}
                                        {currentUser && String(player.id) !== currentUserId ? (
                                            <select
                                                value={getMyVote(player.id)}
                                                onChange={(e) => handleRate(player.id, e.target.value)}
                                                title="Oyuncuya 1-10 arası puan verin"
                                                style={{
                                                    marginLeft: '4px',
                                                    width: '46px',
                                                    height: '28px',
                                                    padding: '2px 4px',
                                                    fontSize: '0.8rem',
                                                    borderRadius: '4px',
                                                    border: getMyVote(player.id) ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                                                    background: getMyVote(player.id) ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                                                    color: getMyVote(player.id) ? '#f59e0b' : 'var(--text-primary)',
                                                    fontWeight: getMyVote(player.id) ? 'bold' : 'normal',
                                                    cursor: 'pointer',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <option value="">-</option>
                                                {[...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ width: '46px', marginLeft: '4px', flexShrink: 0 }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Team B Stats */}
                <div className="card">
                    <h3 style={{ color: teamBColor || 'var(--accent-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: teamBColor || '#dc2626', border: '1.5px solid rgba(255,255,255,0.7)', display: 'inline-block' }} />
                        {teamBName} İstatistikleri
                    </h3>
                    {teamB.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Oyuncu seçilmedi.</p>}
                    {teamB.map(player => (
                        <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
                            <Link
                                to={`/profile/${player.id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    color: 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    minWidth: 0,
                                    flex: 1,
                                    overflow: 'hidden'
                                }}
                                className="hover:underline"
                                title="Oyuncu profilini ve son 5 maçlık performans grafiğini gör"
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {formatPlayerDisplayName(player, currentUserId)}
                                </span>
                                {player.isGoalkeeper && <Hand size={14} fill="gold" color="gold" style={{ flexShrink: 0 }} />}
                            </Link>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ width: '38px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Gol</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={playerStats[player.id]?.goals || 0}
                                            onChange={(e) => handleStatChange(player.id, 'goals', e.target.value)}
                                            style={{ width: '38px', padding: '0.2rem', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>{playerStats[player.id]?.goals || 0}</span>
                                    )}
                                </div>
                                <div style={{ width: '38px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Asist</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={playerStats[player.id]?.assists || 0}
                                            onChange={(e) => handleStatChange(player.id, 'assists', e.target.value)}
                                            style={{ width: '38px', padding: '0.2rem', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>{playerStats[player.id]?.assists || 0}</span>
                                    )}
                                </div>
                                <div style={{ width: '46px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Kurtarış</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={playerStats[player.id]?.saves || 0}
                                            onChange={(e) => handleStatChange(player.id, 'saves', e.target.value)}
                                            style={{ width: '46px', padding: '0.2rem', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>{playerStats[player.id]?.saves || 0}</span>
                                    )}
                                </div>
                                {/* Rating Column */}
                                <div style={{ width: '96px', textAlign: 'center', flexShrink: 0 }}>
                                    <label style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>
                                        Puan {getPlayerRatingData(player.id).count > 0 ? `(${getPlayerRatingData(player.id).count})` : ''}
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', minWidth: '22px', textAlign: 'right' }}>
                                            {getPlayerRatingData(player.id).average}
                                        </span>
                                        <Star size={12} fill="var(--accent-primary)" color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                                        {/* Vote Input */}
                                        {currentUser && String(player.id) !== currentUserId ? (
                                            <select
                                                value={getMyVote(player.id)}
                                                onChange={(e) => handleRate(player.id, e.target.value)}
                                                title="Oyuncuya 1-10 arası puan verin"
                                                style={{
                                                    marginLeft: '4px',
                                                    width: '46px',
                                                    height: '28px',
                                                    padding: '2px 4px',
                                                    fontSize: '0.8rem',
                                                    borderRadius: '4px',
                                                    border: getMyVote(player.id) ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                                                    background: getMyVote(player.id) ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                                                    color: getMyVote(player.id) ? '#f59e0b' : 'var(--text-primary)',
                                                    fontWeight: getMyVote(player.id) ? 'bold' : 'normal',
                                                    cursor: 'pointer',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <option value="">-</option>
                                                {[...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ width: '46px', marginLeft: '4px', flexShrink: 0 }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isEditing ? (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {match.status === 'played' && (
                        <button onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                            Vazgeç
                        </button>
                    )}
                    <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> Maçı Bitir ve Kaydet
                    </button>
                    {isAdmin && (
                        <button
                            onClick={handleDeleteMatch}
                            className="btn"
                            style={{
                                padding: '0.75rem 2rem',
                                fontSize: '1rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer'
                            }}
                            title="Maçı Sil"
                        >
                            <Trash2 size={18} /> Maçı Sil
                        </button>
                    )}
                </div>
            ) : (
                isAdmin && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}>
                            Düzenle / İstatistik Gir
                        </button>
                        {match.status === 'played' && (
                            <button
                                onClick={handleRevertToScheduled}
                                className="btn btn-secondary"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderColor: 'rgba(245, 158, 11, 0.4)',
                                    color: '#f59e0b'
                                }}
                                title="Maçı oynanmadı durumuna geri al"
                            >
                                Planlanan Duruma Geri Al (Oynanmadı)
                            </button>
                        )}
                        <button
                            onClick={handleDeleteMatch}
                            className="btn"
                            style={{
                                padding: '0.75rem 2rem',
                                fontSize: '1rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer'
                            }}
                            title="Maçı Sil"
                        >
                            <Trash2 size={18} /> Maçı Sil
                        </button>
                    </div>
                )
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText="Vazgeç"
                isDanger={confirmModal.isDanger}
                isLoading={confirmModal.isLoading}
                error={confirmModal.error}
                onConfirm={handleModalConfirm}
                onClose={() => {
                    if (!confirmModal.isLoading) {
                        setConfirmModal({ isOpen: false, type: null, isLoading: false, error: null });
                    }
                }}
            />
        </div>
    );
};

export default MatchDetail;
