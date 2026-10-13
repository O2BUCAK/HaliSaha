import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { toTitleCase, stripSenSuffix, formatPlayerDisplayName } from '../../utils';
import InviteMember from '../../components/InviteMember';
import AdSenseBanner from '../../components/AdSenseBanner';
import ConfirmModal from '../../components/ConfirmModal';
import { Users, Calendar, Plus, Copy, Check, UserPlus, Trophy, Play, Square, Mail, Trash2, Shield, ShieldAlert, Video, FileText, Save, Hash, Share2, Star, Link2, X, Eraser, RotateCcw, CreditCard, DollarSign } from 'lucide-react';


const GroupDetail = () => {
    const { groupId } = useParams();
    const {
        groups, getGroupMatches, getDeletedGroupMatches, addGuestMember, startSeason, endSeason,
        getSeasonStats, getAllTimeStats, assignMatchToSeason, removeMember,
        removeGuestMember, addAdmin, removeAdmin, getUsersDetails,
        fetchGroup, sendJoinRequest, getJoinRequests, respondToJoinRequest,
        updateGroupJerseyNumbers, mergeGuestToUser, cleanupGuestDuplicates,
        deleteMatch, restoreMatch, permanentDeleteMatch, updateGroupFeeSettings
    } = useData();
    const { currentUser } = useAuth();
    const [fetchedGroup, setFetchedGroup] = useState(null);
    const [joinRequests, setJoinRequests] = useState([]);
    const [_requestsLoading, setRequestsLoading] = useState(false);
    // const [activeTab, setActiveTab] = useState('summary'); // summary, matches, members, requests
    const [statType, setStatType] = useState('players'); // players, goalkeepers
    const [joinStatus, setJoinStatus] = useState(null); // null, success, error
    const [copied, setCopied] = useState(false);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestError, setGuestError] = useState('');
    const [seasonName, setSeasonName] = useState('');
    const [showStartSeason, setShowStartSeason] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [memberDetails, setMemberDetails] = useState([]);
    const [jerseyMap, setJerseyMap] = useState({});
    const [isEditingJersey, setIsEditingJersey] = useState(false);

    // Guest Merge State
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [selectedGuestForMerge, setSelectedGuestForMerge] = useState(null);
    const [selectedMemberForMerge, setSelectedMemberForMerge] = useState('');
    const [selectedSeasonId, setSelectedSeasonId] = useState('active');

    // Sorting State
    const [statsSortBy, setStatsSortBy] = useState('goals'); // players: goals, assists, matches; gk: saves, cleanSheets, matches
    const [statsSortOrder, setStatsSortOrder] = useState('desc'); // desc, asc
    const [matchSortOrder, setMatchSortOrder] = useState('desc'); // desc (newest), asc (oldest)

    // Match Trash & Recovery State
    const [undoToast, setUndoToast] = useState(null);
    const [showTrashSection, setShowTrashSection] = useState(false);
    const [isRestoringMatch, setIsRestoringMatch] = useState(false);
    const [showRecoveryGuide, setShowRecoveryGuide] = useState(false);

    // Fee / Kasa Tracking State (Admin only)
    const [showFeeTracker, setShowFeeTracker] = useState(false);
    const [groupIban, setGroupIban] = useState('');
    const [groupAccountName, setGroupAccountName] = useState('');
    const [groupDefaultPitchFee, setGroupDefaultPitchFee] = useState(2100);
    const [groupNotes, setGroupNotes] = useState('Açıklamaya adınızı yazınız.');
    const [isSavingGroupFees, setIsSavingGroupFees] = useState(false);
    const [groupFeeToast, setGroupFeeToast] = useState(null);

    // Use group from context if available (member), otherwise use fetched group (public)
    const contextGroup = groups.find(g => g.id === groupId);
    const group = contextGroup || fetchedGroup;

    // Determine if user is a member
    const currentUserId = currentUser ? String(currentUser.uid || currentUser.id) : null;
    const isMember = Boolean(currentUserId && group?.members && group.members.map(String).includes(currentUserId));
    const isAdmin = Boolean(
        currentUser && group && (
            String(group.createdBy) === currentUserId ||
            (Array.isArray(group.admins) && group.admins.map(String).includes(currentUserId))
        )
    );

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Evet, Sil',
        cancelText: 'Vazgeç',
        isDanger: true,
        isLoading: false,
        error: null,
        onConfirm: null
    });
    const [mergeError, setMergeError] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [actionSuccessMsg, setActionSuccessMsg] = useState('');

    const [loading, setLoading] = useState(!contextGroup); // Initial loading if not in context

    useEffect(() => {
        // If not found in context (not a member), fetch it
        if (!contextGroup && groupId) {
            setLoading(true);
            const loadGroup = async () => {
                const g = await fetchGroup(groupId);
                setFetchedGroup(g);
                setLoading(false);
            };
            loadGroup();
        } else {
            setLoading(false);
        }
    }, [groupId, contextGroup, fetchGroup]);

    useEffect(() => {
        if (isAdmin) {
            const loadRequests = async () => {
                setRequestsLoading(true);
                const reqs = await getJoinRequests(groupId);
                setJoinRequests(reqs);
                setRequestsLoading(false);
            };
            loadRequests();
        }
    }, [isAdmin, groupId, getJoinRequests]);

    useEffect(() => {
        if (group) {
            setJerseyMap(group.jerseyNumbers || {});
        }
    }, [group]);

    useEffect(() => {
        if (group?.members) {
            const loadMembers = async () => {
                const details = await getUsersDetails(group.members);
                setMemberDetails(details);
            };
            loadMembers();
        }
    }, [group?.members, getUsersDetails]);

    useEffect(() => {
        if (group?.activeSeasonId) {
            setSelectedSeasonId(group.activeSeasonId);
        } else {
            setSelectedSeasonId('all-time');
        }
    }, [group?.activeSeasonId]);

    const allGroupMatches = getGroupMatches(groupId);

    useEffect(() => {
        if (group?.feeSettings) {
            setGroupIban(group.feeSettings.adminIban || '');
            setGroupAccountName(group.feeSettings.adminAccountName || '');
            setGroupDefaultPitchFee(group.feeSettings.defaultPitchFee || 2100);
            setGroupNotes(group.feeSettings.paymentNotes || 'Açıklamaya adınızı yazınız.');
        }
    }, [group?.feeSettings]);

    const groupPaymentStats = React.useMemo(() => {
        let totalCollected = 0;
        let totalTarget = 0;
        let unpaidMatchesCount = 0;
        const trackedList = [];

        (allGroupMatches || []).forEach(m => {
            if (m.paymentTracking) {
                const pt = m.paymentTracking;
                let mCollected = 0;
                const mTarget = Number(pt.totalPitchFee) || 0;
                Object.values(pt.players || {}).forEach(p => {
                    if (p.status === 'paid' || p.status === 'partial') {
                        mCollected += Number(p.amountPaid || 0);
                    }
                });
                const mRemaining = Math.max(0, mTarget - mCollected);
                if (mRemaining > 0) unpaidMatchesCount += 1;
                totalCollected += mCollected;
                totalTarget += mTarget;
                const mDeposit = pt.depositPaid ? (Number(pt.depositAmount) || 0) : 0;
                trackedList.push({
                    match: m,
                    collected: mCollected,
                    target: mTarget,
                    remaining: mRemaining,
                    deposit: mDeposit,
                    percent: mTarget > 0 ? Math.min(100, Math.round((mCollected / mTarget) * 100)) : 0
                });
            }
        });

        const totalRemaining = Math.max(0, totalTarget - totalCollected);
        const overallPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

        return {
            totalCollected,
            totalTarget,
            totalRemaining,
            overallPercent,
            unpaidMatchesCount,
            trackedList
        };
    }, [allGroupMatches]);

    const handleSaveGroupFees = async () => {
        setIsSavingGroupFees(true);
        setGroupFeeToast(null);
        try {
            const res = await updateGroupFeeSettings(groupId, {
                adminIban: groupIban,
                adminAccountName: groupAccountName,
                defaultPitchFee: Number(groupDefaultPitchFee) || 0,
                paymentNotes: groupNotes
            });
            if (res.success) {
                setGroupFeeToast({ type: 'success', message: 'Grup varsayılan IBAN ve kasa ayarları güncellendi!' });
            } else {
                setGroupFeeToast({ type: 'error', message: res.error || 'Kaydedilemedi.' });
            }
        } catch (err) {
            console.error('Error saving group fees:', err);
            setGroupFeeToast({ type: 'error', message: 'Bir hata oluştu.' });
        } finally {
            setIsSavingGroupFees(false);
            setTimeout(() => setGroupFeeToast(null), 3500);
        }
    };

    const handleJoinRequest = async () => {
        setJoinStatus('loading');
        const result = await sendJoinRequest(groupId);
        if (result.success) {
            setJoinStatus('success');
        } else {
            setJoinStatus('error');
            alert(result.error);
        }
    };

    const handleRequestResponse = async (req, status) => {
        await respondToJoinRequest(req.id, status, groupId, req.userId);
        // Refresh list locally
        setJoinRequests(prev => prev.filter(r => r.id !== req.id));
    };

    if (loading) return <div className="p-4 text-center">Yükleniyor...</div>;
    if (!group) return <div className="p-4 text-center">Grup bulunamadı veya erişim izniniz yok.</div>;

    // Remove blocking view for non-members
    // if (!isMember && !isAdmin) { ... }

    // Sort members alphabetically
    const sortedMembers = [...memberDetails].sort((a, b) =>
        (a.name || 'Unknown').localeCompare(b.name || 'Unknown', 'tr')
    );

    // Sort guests alphabetically
    const sortedGuests = [...(group.guestPlayers || [])].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'tr')
    );

    const activeSeason = group.activeSeasonId
        ? group.seasons?.find(s => s.id === group.activeSeasonId)
        : null;

    // Determine which stats to show based on selection
    const displayedStats = selectedSeasonId === 'all-time'
        ? getAllTimeStats(groupId)
        : getSeasonStats(groupId, selectedSeasonId);

    const handleStatSort = (criteria) => {
        if (statsSortBy === criteria) {
            setStatsSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setStatsSortBy(criteria);
            setStatsSortOrder('desc');
        }
    };

    const getSortIcon = (criteria) => {
        if (statsSortBy !== criteria) return null;
        return statsSortOrder === 'desc' ? '↓' : '↑';
    };

    // Sort logic for displayedStats based on statType and statsSortBy
    const sortedStats = [...displayedStats].sort((a, b) => {
        let diff = 0;
        if (statType === 'goalkeepers') {
            // Goalkeeper sorts
            if (statsSortBy === 'matches') diff = b.matches - a.matches;
            else if (statsSortBy === 'saves') diff = (b.saves || 0) - (a.saves || 0);
            else if (statsSortBy === 'cleanSheets') diff = (b.cleanSheets || 0) - (a.cleanSheets || 0);
            else if (statsSortBy === 'rating') diff = (parseFloat(b.averageRating === '-' ? 0 : b.averageRating) - parseFloat(a.averageRating === '-' ? 0 : a.averageRating));
            else {
                // Default GK: Clean Sheets then Saves
                if (b.cleanSheets !== a.cleanSheets) diff = (b.cleanSheets || 0) - (a.cleanSheets || 0);
                else diff = (b.saves || 0) - (a.saves || 0);
            }
        } else {
            // Player sorts
            if (statsSortBy === 'matches') diff = b.matches - a.matches;
            else if (statsSortBy === 'assists') diff = (b.assists || 0) - (a.assists || 0);
            else if (statsSortBy === 'contribution') diff = ((b.goals || 0) + (b.assists || 0)) - ((a.goals || 0) + (a.assists || 0));
            else if (statsSortBy === 'rating') diff = (parseFloat(b.averageRating === '-' ? 0 : b.averageRating) - parseFloat(a.averageRating === '-' ? 0 : a.averageRating));
            else {
                // Default Player: Goals
                diff = (b.goals || 0) - (a.goals || 0);
            }
        }

        return statsSortOrder === 'desc' ? diff : -diff;
    });

    // Filter matches based on selection and sort by date using string comparison
    const displayedMatches = getGroupMatches(groupId).filter(m => {
        if (selectedSeasonId === 'all-time') return true;
        return m.seasonId === selectedSeasonId;
    }).sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return matchSortOrder === 'desc'
            ? dateB.localeCompare(dateA)
            : dateA.localeCompare(dateB);
    });

    const deletedMatches = getDeletedGroupMatches(groupId);

    const copyCode = () => {
        navigator.clipboard.writeText(group.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddGuest = async (e) => {
        e.preventDefault();
        if (guestName.trim()) {
            const result = await addGuestMember(groupId, guestName.trim());
            if (result.success) {
                setGuestName('');
                setGuestError('');
                setShowAddGuest(false);
            } else {
                setGuestError(result.error);
            }
        }
    };

    const handleStartSeason = (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        if (seasonName.trim()) {
            startSeason(groupId, seasonName.trim());
            setSeasonName('');
            setShowStartSeason(false);
        }
    };

    const handleRemoveMember = (member) => {
        if (!isAdmin) return;
        const memberName = toTitleCase(member.name || member.nickname || 'Bu üyeyi');
        setConfirmModal({
            isOpen: true,
            title: 'Üyeyi Gruptan Çıkar',
            message: `"${memberName}" adlı üyeyi gruptan çıkarmak istediğinize emin misiniz?`,
            confirmText: 'Evet, Çıkar',
            cancelText: 'Vazgeç',
            isDanger: true,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                const result = await removeMember(groupId, member.id);
                if (result.success) {
                    setConfirmModal({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', isDanger: true, isLoading: false, error: null, onConfirm: null });
                    setActionSuccessMsg('Üye gruptan çıkarıldı.');
                    setTimeout(() => setActionSuccessMsg(''), 4000);
                } else {
                    setConfirmModal(prev => ({ ...prev, isLoading: false, error: result.error || 'Üye çıkarılırken hata oluştu.' }));
                }
            }
        });
    };

    const handleRemoveGuest = (guest) => {
        if (!isAdmin) return;
        const guestName = toTitleCase(guest.name || 'Bu misafiri');
        setConfirmModal({
            isOpen: true,
            title: 'Misafir Oyuncuyu Sil',
            message: `"${guestName}" adlı misafir oyuncuyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            confirmText: 'Evet, Sil',
            cancelText: 'Vazgeç',
            isDanger: true,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                const result = await removeGuestMember(groupId, guest.id);
                if (result.success) {
                    setConfirmModal({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', isDanger: true, isLoading: false, error: null, onConfirm: null });
                    setActionSuccessMsg('Misafir oyuncu başarıyla silindi.');
                    setTimeout(() => setActionSuccessMsg(''), 4000);
                } else {
                    setConfirmModal(prev => ({ ...prev, isLoading: false, error: result.error || 'Misafir silinirken hata oluştu.' }));
                }
            }
        });
    };

    const handleRestoreMatch = async (matchId) => {
        setIsRestoringMatch(true);
        const res = await restoreMatch(matchId);
        setIsRestoringMatch(false);
        if (res.success) {
            setUndoToast(null);
            setActionSuccessMsg('Maç başarıyla geri yüklendi! İstatistikler ve kadrolar güncellendi.');
            setTimeout(() => setActionSuccessMsg(''), 4500);
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Geri Yükleme Hatası',
                message: res.error || 'Maç geri yüklenirken bir sorun oluştu.',
                confirmText: 'Tamam',
                cancelText: null,
                isDanger: false,
                isLoading: false,
                error: null,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handlePermanentDeleteMatch = (matchId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Kalıcı Olarak Sil',
            message: 'Bu maçı çöp kutusundan kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            confirmText: 'Evet, Kalıcı Sil',
            cancelText: 'Vazgeç',
            isDanger: true,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                const result = await permanentDeleteMatch(matchId);
                if (result.success) {
                    setConfirmModal({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', isDanger: true, isLoading: false, error: null, onConfirm: null });
                    setActionSuccessMsg('Maç kalıcı olarak silindi.');
                    setTimeout(() => setActionSuccessMsg(''), 3000);
                } else {
                    setConfirmModal(prev => ({ ...prev, isLoading: false, error: result.error || 'Silinirken hata oluştu.' }));
                }
            }
        });
    };

    const handleDeleteMatch = (matchId, isPlayed = false) => {
        if (!isAdmin) return;
        setConfirmModal({
            isOpen: true,
            title: isPlayed ? 'Maçı Sil' : 'Planlanan Maçı Sil',
            message: isPlayed
                ? 'Bu maçı silmek istediğinize emin misiniz? Maç Çöp Kutusu\'na kaldırılacaktır. Yanlışlıkla silmeniz durumunda dilediğiniz an Çöp Kutusu\'ndan tek tıkla geri yükleyebilirsiniz.'
                : 'Bu planlanan maçı silmek istediğinize emin misiniz? Maç Çöp Kutusu\'na kaldırılacaktır.',
            confirmText: 'Evet, Sil (Çöp Kutusuna Taşı)',
            cancelText: 'Vazgeç',
            isDanger: true,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                const result = await deleteMatch(matchId);
                if (result.success) {
                    setConfirmModal({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', isDanger: true, isLoading: false, error: null, onConfirm: null });
                    setUndoToast({ matchId, id: matchId, timestamp: Date.now() });
                    setActionSuccessMsg('Maç silindi ve Çöp Kutusu\'na taşındı. Aşağıdaki "Geri Al" butonuyla anında geri alabilirsiniz.');
                    setTimeout(() => setActionSuccessMsg(''), 6000);
                } else {
                    setConfirmModal(prev => ({ ...prev, isLoading: false, error: result.error || 'Maç silinirken hata oluştu.' }));
                }
            }
        });
    };

    const handleToggleAdmin = (memberId, isCurrentAdmin) => {
        if (!isAdmin) return;
        setConfirmModal({
            isOpen: true,
            title: isCurrentAdmin ? 'Yöneticiliği Al' : 'Yönetici Yap',
            message: isCurrentAdmin
                ? 'Bu kullanıcının grup yöneticiliği yetkisini almak istediğinize emin misiniz?'
                : 'Bu kullanıcıyı grup yöneticisi yapmak istediğinize emin misiniz? Yönetici olan üyeler maç oluşturup düzenleyebilir.',
            confirmText: isCurrentAdmin ? 'Evet, Yetkiyi Al' : 'Evet, Yönetici Yap',
            cancelText: 'Vazgeç',
            isDanger: isCurrentAdmin,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                const result = isCurrentAdmin
                    ? await removeAdmin(groupId, memberId)
                    : await addAdmin(groupId, memberId);
                if (result.success) {
                    setConfirmModal({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', isDanger: true, isLoading: false, error: null, onConfirm: null });
                    setActionSuccessMsg(isCurrentAdmin ? 'Yöneticilik yetkisi alındı.' : 'Yönetici yapıldı.');
                    setTimeout(() => setActionSuccessMsg(''), 4000);
                } else {
                    setConfirmModal(prev => ({ ...prev, isLoading: false, error: result.error || 'İşlem başarısız.' }));
                }
            }
        });
    };

    const handleJerseyChange = (userId, number) => {
        setJerseyMap(prev => ({ ...prev, [userId]: number }));
    };

    const saveJerseyNumbers = async () => {
        await updateGroupJerseyNumbers(groupId, jerseyMap);
        setIsEditingJersey(false);
    };

    const handleOpenMergeModal = (guest) => {
        setSelectedGuestForMerge(guest);
        setShowMergeModal(true);
        setSelectedMemberForMerge('');
        setMergeError('');
    };

    const handleMergeGuest = async () => {
        if (!selectedGuestForMerge || !selectedMemberForMerge) return;
        setIsMerging(true);
        setMergeError('');
        const result = await mergeGuestToUser(groupId, selectedGuestForMerge.id, selectedMemberForMerge);
        setIsMerging(false);
        if (result.success) {
            setShowMergeModal(false);
            setSelectedGuestForMerge(null);
            setSelectedMemberForMerge('');
            setActionSuccessMsg('Misafir oyuncu başarıyla üyeyle eşleştirildi.');
            setTimeout(() => setActionSuccessMsg(''), 4000);
        } else {
            setMergeError(result.error || 'Eşleştirme yapılamadı.');
        }
    };

    const hasGuestDuplicates = group?.guestPlayers?.length > 0 &&
        (new Set(group.guestPlayers.map(p => p.name.trim().toLowerCase().replace(/\s+/g, ' '))).size !== group.guestPlayers.length);

    const handleCleanupDuplicates = () => {
        if (!isAdmin) return;
        setConfirmModal({
            isOpen: true,
            title: 'Tekrarlayan Misafirleri Temizle',
            message: 'Yinelenen misafir oyuncular temizlenecektir (ilk eklenen kayıt korunur, geçmiş maçlardaki istatistikler ve puanlar aktarılır). Devam etmek istiyor musunuz?',
            confirmText: 'Evet, Temizle',
            cancelText: 'Vazgeç',
            isDanger: false,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                const result = await cleanupGuestDuplicates(groupId);
                if (result.success) {
                    setConfirmModal({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', isDanger: true, isLoading: false, error: null, onConfirm: null });
                    setActionSuccessMsg(`${result.count || 0} adet yinelenen kayıt başarıyla temizlendi.`);
                    setTimeout(() => setActionSuccessMsg(''), 4000);
                } else {
                    setConfirmModal(prev => ({ ...prev, isLoading: false, error: result.error || 'Temizleme sırasında hata oluştu.' }));
                }
            }
        });
    };

    return (
        <div>
            {/* Header */}
            <div className="responsive-header">
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{group.name}</h2>
                    <div className="responsive-header-content">
                        <div className="flex-center" style={{ gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Katılım Kodu:</span>
                            <code style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{group.joinCode}</code>
                            <button onClick={copyCode} style={{ marginLeft: '0.5rem', color: copied ? 'var(--accent-success)' : 'var(--text-secondary)' }} title="Kopyala">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Grup bağlantısı kopyalandı! Bu linki arkadaşlarınızla paylaşabilirsiniz.');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            title="Paylaş"
                        >
                            <Share2 size={18} /> Paylaş
                        </button>
                        {/* Join Button for Non-Members */}
                        {!isMember && (
                            currentUser ? (
                                joinStatus === 'success' ? (
                                    <div className="text-green-500 text-sm font-bold">İstek Gönderildi</div>
                                ) : (
                                    <button onClick={handleJoinRequest} className="btn btn-primary" disabled={joinStatus === 'loading'} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                        {joinStatus === 'loading' ? '...' : 'Gruba Katıl'}
                                    </button>
                                )
                            ) : (
                                <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Gruba Katıl</Link>
                            )
                        )}
                    </div>
                </div>
                {isMember && (
                    <Link to={`/dashboard/groups/${groupId}/matches/create`} className="btn btn-primary">
                        <Plus size={18} /> Maç Oluştur
                    </Link>
                )}
            </div>

            {/* Season Section */}
            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trophy size={20} color="var(--accent-secondary)" />
                            Sezon:
                        </h3>
                        <select
                            value={selectedSeasonId}
                            onChange={(e) => setSelectedSeasonId(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        >
                            {activeSeason && (
                                <option value={activeSeason.id}>
                                    Aktif: {activeSeason.name}
                                </option>
                            )}
                            <option value="all-time">Tüm Zamanlar</option>
                            {(group.seasons || []).filter(s => s.id !== group.activeSeasonId && s.status === 'completed').length > 0 && (
                                <optgroup label="Geçmiş Sezonlar">
                                    {(group.seasons || [])
                                        .filter(s => s.id !== group.activeSeasonId && s.status === 'completed')
                                        .map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))
                                    }
                                </optgroup>
                            )}
                        </select>
                    </div>

                    <div>
                        {activeSeason && selectedSeasonId === activeSeason.id ? (
                            isAdmin && (
                                <button onClick={() => endSeason(groupId)} className="btn btn-secondary" style={{ color: '#ff4444', borderColor: '#ff4444' }}>
                                    <Square size={16} fill="#ff4444" /> Sezonu Bitir
                                </button>
                            )
                        ) : (
                            !showStartSeason && isAdmin && !activeSeason && (
                                <button onClick={() => setShowStartSeason(true)} className="btn btn-primary">
                                    <Play size={16} /> Sezon Başlat
                                </button>
                            )
                        )}
                    </div>
                </div>

                {showStartSeason && (
                    <form onSubmit={handleStartSeason} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Sezon Adı (Örn: Kış 2025)"
                            value={seasonName}
                            onChange={(e) => setSeasonName(e.target.value)}
                            style={{ flex: 1 }}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Başlat</button>
                        <button type="button" onClick={() => setShowStartSeason(false)} className="btn btn-secondary">İptal</button>
                    </form>
                )}

                {/* Stats Table */}
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                            {selectedSeasonId === 'all-time' ? 'Genel İstatistikler (Tüm Zamanlar)' : 'Sezon İstatistikleri'}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
                            {/* Stats Sort Dropdown */}
                            <select
                                value={statsSortBy}
                                onChange={(e) => setStatsSortBy(e.target.value)}
                                style={{
                                    padding: '0.25rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.8rem',
                                    marginRight: '0.5rem'
                                }}
                            >
                                {statType === 'players' ? (
                                    <>
                                        <option value="goals">Gol</option>
                                        <option value="assists">Asist</option>
                                        <option value="contribution">Skor Katkısı</option>
                                        <option value="matches">Maç</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="cleanSheets">Gol Yememe</option>
                                        <option value="saves">Kurtarış</option>
                                        <option value="matches">Maç</option>
                                    </>
                                )}
                            </select>

                            <button
                                onClick={() => { setStatType('players'); setStatsSortBy('goals'); setStatsSortOrder('desc'); }}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    background: statType === 'players' ? 'var(--accent-primary)' : 'transparent',
                                    color: statType === 'players' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}>
                                Oyuncular
                            </button>
                            <button
                                onClick={() => { setStatType('goalkeepers'); setStatsSortBy('cleanSheets'); setStatsSortOrder('desc'); }}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    background: statType === 'goalkeepers' ? 'var(--accent-primary)' : 'transparent',
                                    color: statType === 'goalkeepers' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}>
                                Kaleciler
                            </button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Oyuncu</th>
                                <th
                                    style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleStatSort('matches')}
                                >
                                    Maç {getSortIcon('matches')}
                                </th>
                                {statType === 'players' ? (
                                    <>
                                        <th
                                            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleStatSort('goals')}
                                        >
                                            Gol {getSortIcon('goals')}
                                        </th>
                                        <th
                                            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleStatSort('assists')}
                                        >
                                            Asist {getSortIcon('assists')}
                                        </th>
                                        <th
                                            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleStatSort('rating')}
                                        >
                                            Ort. Puan {getSortIcon('rating')}
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        <th
                                            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleStatSort('saves')}
                                        >
                                            Kurtarış {getSortIcon('saves')}
                                        </th>
                                        <th
                                            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleStatSort('cleanSheets')}
                                        >
                                            Gol Yememe {getSortIcon('cleanSheets')}
                                        </th>
                                        <th
                                            style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleStatSort('rating')}
                                        >
                                            Ort. Puan {getSortIcon('rating')}
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.length > 0 ? (
                                sortedStats.map((stat, index) => (
                                    <tr key={stat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? '#cd7f32' : 'var(--bg-primary)')),
                                                color: index < 3 ? 'black' : 'var(--text-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>
                                                {index + 1}
                                            </span>
                                            {(() => {
                                                const member = memberDetails.find(m => m.id === stat.id);
                                                // Prefer member name (from live profile), fallback to stat name (historical/guest)
                                                const rawName = member ? (member.name || member.nickname) : stat.name;
                                                const formatted = formatPlayerDisplayName(rawName, currentUserId, stat.id);
                                                return (
                                                    <Link
                                                        to={`/profile/${stat.id}`}
                                                        style={{
                                                            color: 'var(--text-primary)',
                                                            textDecoration: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontWeight: '500'
                                                        }}
                                                        className="hover:underline"
                                                        title={`${formatted} profilini ve performans trendlerini görüntüle`}
                                                    >
                                                        {formatted}
                                                    </Link>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stat.matches}</td>
                                        {statType === 'players' ? (
                                            <>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stat.goals}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stat.assists}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {stat.averageRating !== '-' ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                            {stat.averageRating} <Star size={12} fill="orange" color="orange" />
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stat.saves || 0}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stat.cleanSheets || 0}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {stat.averageRating !== '-' ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                            {stat.averageRating} <Star size={12} fill="orange" color="orange" />
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Henüz istatistik oluşmadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="responsive-grid-2-1">
                {/* Matches Section */}
                <div>
                    {actionSuccessMsg && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10b981',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Check size={18} /> {actionSuccessMsg}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Calendar size={20} /> Maçlar
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setShowFeeTracker(prev => !prev)}
                                    className="btn btn-secondary"
                                    style={{
                                        fontSize: '0.8rem',
                                        padding: '0.3rem 0.65rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        borderColor: showFeeTracker ? '#eab308' : 'rgba(234, 179, 8, 0.4)',
                                        color: showFeeTracker ? '#facc15' : '#fde047',
                                        background: showFeeTracker ? 'rgba(234, 179, 8, 0.15)' : 'transparent'
                                    }}
                                    title="Saha Ücreti & Kasa Takibi (Sadece Grup Yöneticisi Görür)"
                                >
                                    <CreditCard size={14} />
                                    <span>Kasa & Ücret</span>
                                    {groupPaymentStats.totalRemaining > 0 && (
                                        <span style={{
                                            background: '#ef4444',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '1px 6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {groupPaymentStats.totalRemaining.toLocaleString('tr-TR')} ₺
                                        </span>
                                    )}
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setShowTrashSection(prev => !prev)}
                                    className="btn btn-secondary"
                                    style={{
                                        fontSize: '0.8rem',
                                        padding: '0.3rem 0.65rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        borderColor: showTrashSection ? 'var(--accent-primary)' : (deletedMatches.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'),
                                        color: showTrashSection ? 'var(--accent-primary)' : (deletedMatches.length > 0 ? '#fca5a5' : 'var(--text-secondary)')
                                    }}
                                    title="Silinen maçları ve çöp kutusunu görüntüle"
                                >
                                    <Trash2 size={14} />
                                    <span>Çöp Kutusu</span>
                                    {deletedMatches.length > 0 && (
                                        <span style={{
                                            background: '#ef4444',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '1px 6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {deletedMatches.length}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setMatchSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                                {matchSortOrder === 'desc' ? '↓ En Yeni' : '↑ En Eski'}
                            </button>
                        </div>
                    </div>

                    {/* Grup Yöneticisi Kasa & Ücret Takip Paneli (SADECE YÖNETİCİ GÖRÜR) */}
                    {isAdmin && showFeeTracker && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1.25rem',
                            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                            border: '1px solid rgba(234, 179, 8, 0.35)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 8px 20px -4px rgba(0,0,0,0.3)'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            Grup Kasa & Ücret Takibi
                                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#facc15', fontWeight: 'bold' }}>
                                                <Shield size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                                                Sadece Yönetici
                                            </span>
                                        </h4>
                                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            Tüm maçların toplanan ücretlerini ve grubun varsayılan IBAN bilgilerini yönetin.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFeeTracker(false)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                    Kapat
                                </button>
                            </div>

                            {/* 3 Summary Stat Boxes */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#86efac' }}>Toplam Toplanan Kasa</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e', marginTop: '0.2rem' }}>
                                        {groupPaymentStats.totalCollected.toLocaleString('tr-TR')} ₺
                                    </div>
                                </div>

                                <div style={{ background: groupPaymentStats.totalRemaining > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)', border: `1px solid ${groupPaymentStats.totalRemaining > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.72rem', color: groupPaymentStats.totalRemaining > 0 ? '#fca5a5' : '#86efac' }}>Bekleyen / Eksik Tutar</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: groupPaymentStats.totalRemaining > 0 ? '#ef4444' : '#22c55e', marginTop: '0.2rem' }}>
                                        {groupPaymentStats.totalRemaining.toLocaleString('tr-TR')} ₺
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Takip Edilen Maç</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                        {groupPaymentStats.trackedList.length} Maç
                                    </div>
                                </div>
                            </div>

                            {/* Group Default IBAN Form */}
                            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    💳 Grubun Varsayılan IBAN & Ödeme Bilgileri
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', alignItems: 'flex-end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Yönetici IBAN:</label>
                                        <input
                                            type="text"
                                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                                            value={groupIban}
                                            onChange={(e) => setGroupIban(e.target.value)}
                                            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Hesap Sahibi:</label>
                                        <input
                                            type="text"
                                            placeholder="Örn: Ersin Özbudak"
                                            value={groupAccountName}
                                            onChange={(e) => setGroupAccountName(e.target.value)}
                                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                        />
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={handleSaveGroupFees}
                                            disabled={isSavingGroupFees}
                                            className="btn btn-primary"
                                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                                        >
                                            {isSavingGroupFees ? 'Kaydediliyor...' : 'Varsayılan Olarak Kaydet'}
                                        </button>
                                    </div>
                                </div>
                                {groupFeeToast && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: groupFeeToast.type === 'success' ? '#86efac' : '#fca5a5' }}>
                                        {groupFeeToast.message}
                                    </div>
                                )}
                            </div>

                            {/* List of Tracked Matches */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    Maç Bazında Ücret Durumu
                                </div>
                                {groupPaymentStats.trackedList.length === 0 ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Henüz hiçbir maçta ücret takibi girilmemiş. Herhangi bir maçın detay sayfasına giderek "Saha Ücreti & Kasa Takibi" alanından oyuncu ödemelerini girmeye başlayabilirsiniz.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {groupPaymentStats.trackedList.map(({ match: tm, collected, target, remaining, deposit, percent }) => (
                                            <div
                                                key={tm.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0.65rem 0.85rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    flexWrap: 'wrap',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        {tm.venue || 'Halı Saha Maçı'} {tm.date ? `(${new Date(tm.date).toLocaleDateString('tr-TR')})` : ''}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <span>Toplanan: <strong style={{ color: '#22c55e' }}>{collected.toLocaleString('tr-TR')} ₺</strong> / {target.toLocaleString('tr-TR')} ₺</span>
                                                        {remaining > 0 && <span style={{ color: '#ef4444' }}>(Kalan: {remaining.toLocaleString('tr-TR')} ₺)</span>}
                                                        {deposit > 0 && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(234, 179, 8, 0.15)',
                                                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                                                color: '#facc15',
                                                                fontWeight: '600'
                                                            }}>
                                                                🔖 Kapora: {deposit.toLocaleString('tr-TR')} ₺
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: percent >= 100 ? '#22c55e' : '#facc15' }}>
                                                        %{percent}
                                                    </span>
                                                    <Link
                                                        to={`/dashboard/matches/${tm.id}`}
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                                    >
                                                        Ödemeleri Yönet ➔
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trash & Recovery Section */}
                    {showTrashSection && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1.25rem',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Trash2 size={16} /> Silinen Maçlar (Çöp Kutusu)
                                    </h4>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Yanlışlıkla sildiğiniz maçları tek tıkla geri yükleyebilir, puan ve istatistikleri eski haline getirebilirsiniz.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRecoveryGuide(!showRecoveryGuide)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', color: 'var(--accent-primary)' }}
                                >
                                    {showRecoveryGuide ? 'Rehberi Gizle' : '💡 Eski Maçı Nasıl Kurtarırım?'}
                                </button>
                            </div>

                            {/* Recovery Guide Banner */}
                            {showRecoveryGuide && (
                                <div style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: '1.5'
                                }}>
                                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                                        📌 Daha önce kalıcı silinmiş eski bir maçı geri getirme:
                                    </strong>
                                    Eğer maç bu çöp kutusu özelliği eklenmeden önce kalıcı silindiyse:
                                    <ol style={{ margin: '0.4rem 0 0.4rem 1.25rem', padding: 0 }}>
                                        <li><strong>+ Maç Oluştur</strong> butonu ile aynı tarih ve saatte yeni bir maç açın.</li>
                                        <li>Oyuncuları <strong>A Takımı</strong> ve <strong>B Takımı</strong> olarak ekleyin.</li>
                                        <li><strong>Maçı Tamamla</strong> diyerek skoru, golleri ve asistleri girip kaydedin.</li>
                                    </ol>
                                    Sistem tüm oyuncu profillerini, gol krallığını ve performans grafiklerini otomatik olarak eksiksiz yeniden hesaplayacaktır.
                                </div>
                            )}

                            {deletedMatches.length === 0 ? (
                                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Çöp kutusunda silinmiş maç bulunmuyor.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {deletedMatches.map(dm => (
                                        <div
                                            key={dm.id}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                background: 'rgba(20, 24, 33, 0.85)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '0.75rem'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                    {dm.venue || 'Halı Saha Maçı'} {dm.date ? `(${dm.date})` : ''}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {dm.score ? (
                                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                                            Skor: {dm.score.a} - {dm.score.b}
                                                        </span>
                                                    ) : 'Planlanan Maç'}
                                                    {dm.deletedAt && ` • Silinme: ${new Date(dm.deletedAt).toLocaleDateString('tr-TR')} ${new Date(dm.deletedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestoreMatch(dm.id)}
                                                    disabled={isRestoringMatch}
                                                    className="btn btn-primary"
                                                    style={{
                                                        padding: '0.35rem 0.75rem',
                                                        fontSize: '0.8rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    title="Maçı geri yükle"
                                                >
                                                    <RotateCcw size={14} />
                                                    <span>Geri Yükle</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePermanentDeleteMatch(dm.id)}
                                                    className="btn"
                                                    style={{
                                                        padding: '0.35rem 0.6rem',
                                                        fontSize: '0.8rem',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Kalıcı olarak sil"
                                                >
                                                    <Trash2 size={13} /> Kalıcı Sil
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayedMatches.length > 0 ? (
                            displayedMatches.map(match => (
                                <div key={match.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            {new Date(match.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            {' '}
                                            {new Date(match.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {match.venue}
                                            {match.videoUrl && <Video size={14} color="var(--accent-primary)" />}
                                            {match.matchSummary && <FileText size={14} color="var(--accent-secondary)" />}
                                        </div>
                                        {match.seasonId ? (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--accent-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'white' }}>Sezon Maçı</span>
                                        ) : (
                                            activeSeason && (
                                                <button
                                                    onClick={() => assignMatchToSeason(match.id, activeSeason.id)}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        background: 'transparent',
                                                        border: '1px solid var(--accent-primary)',
                                                        color: 'var(--accent-primary)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        marginTop: '0.25rem'
                                                    }}
                                                >
                                                    + {activeSeason.name} Ekle
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {match.status === 'played' ? (
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                                            {(isNaN(match.score?.a) || isNaN(match.score?.b) || match.score?.a === undefined || match.score?.b === undefined) ? (
                                                <span style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: '500' }}>Skor Belirtilmedi</span>
                                            ) : (
                                                `${match.score.a} - ${match.score.b}`
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(255, 165, 0, 0.1)', color: 'orange', borderRadius: '1rem', fontSize: '0.875rem' }}>
                                            Planlandı
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Link to={`/dashboard/matches/${match.id}`} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                            Detay
                                        </Link>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteMatch(match.id, match.status === 'played')}
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem 0.6rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                                    cursor: 'pointer',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '0.85rem'
                                                }}
                                                title="Maçı Sil"
                                            >
                                                <Trash2 size={15} /> Sil
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Henüz maç oluşturulmamış.
                            </div>
                        )}
                    </div>
                </div>

                {/* Members Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={20} /> Üyeler
                        </h3>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowInvite(!showInvite)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                    <Mail size={16} /> Davet Et
                                </button>
                                <button onClick={() => setShowAddGuest(!showAddGuest)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                    <UserPlus size={16} /> Misafir Ekle
                                </button>
                                <button onClick={handleCleanupDuplicates} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} title="Yinelenen İsimleri ve Kayıtları Temizle">
                                    <Eraser size={16} /> Temizle
                                </button>
                                {isEditingJersey ? (
                                    <button onClick={saveJerseyNumbers} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--accent-success)' }}>
                                        <Save size={16} /> Kaydet
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditingJersey(true)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                        <Hash size={16} /> Forma No
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isAdmin && hasGuestDuplicates && (
                        <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'rgba(255, 165, 0, 0.1)', border: '1px solid orange', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'orange', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldAlert size={20} />
                                <strong>Dikkat:</strong> Yinelenen misafir oyuncular tespit edildi!
                            </span>
                            <button onClick={handleCleanupDuplicates} className="btn" style={{ background: 'orange', color: 'white', border: 'none', padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}>
                                Tekrarlayanları Sil
                            </button>
                        </div>
                    )}

                    {showInvite && <InviteMember groupId={groupId} />}

                    {showAddGuest && (
                        <form onSubmit={handleAddGuest} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Misafir Oyuncu Adı"
                                value={guestName}
                                onChange={(e) => setGuestName(toTitleCase(e.target.value))}
                                style={{ marginBottom: '0.5rem' }}
                                autoFocus
                            />
                            {guestError && <div className="text-red-500 text-sm mb-2">{guestError}</div>}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }}>Kaydet</button>
                        </form>
                    )}

                    <div className="card" style={{ padding: '0' }}>
                        {sortedMembers.map((member) => {
                            const isMemberAdmin = (group.admins || [group.createdBy]).includes(member.id);
                            return (
                                <div key={member.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {stripSenSuffix(member.name).charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Link
                                                to={`/profile/${member.id}`}
                                                style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}
                                                className="hover:underline"
                                                title="Oyuncu profilini ve performans trendlerini görüntüle"
                                            >
                                                {formatPlayerDisplayName(member, currentUserId)}
                                            </Link>
                                            {isMemberAdmin && <Shield size={14} color="gold" fill="gold" />}
                                            {/* Jersey Number Display / Edit */}
                                            {isEditingJersey ? (
                                                <input
                                                    type="text"
                                                    value={jerseyMap[member.id] || ''}
                                                    onChange={(e) => handleJerseyChange(member.id, e.target.value)}
                                                    placeholder="#"
                                                    style={{ width: '40px', padding: '2px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                />
                                            ) : (
                                                (jerseyMap[member.id] || group.jerseyNumbers?.[member.id]) && (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                        #{jerseyMap[member.id] || group.jerseyNumbers?.[member.id]}
                                                    </span>
                                                )
                                            )}
                                        </span>
                                    </div>

                                    {isAdmin && (
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                            {currentUserId && String(member.id) !== String(currentUserId) && (
                                                <button
                                                    onClick={() => handleToggleAdmin(member.id, isMemberAdmin)}
                                                    style={{ background: 'none', border: 'none', color: isMemberAdmin ? 'gold' : 'var(--text-secondary)', cursor: 'pointer' }}
                                                    title={isMemberAdmin ? "Yöneticiliği Al" : "Yönetici Yap"}
                                                >
                                                    {isMemberAdmin ? <ShieldAlert size={16} /> : <Shield size={16} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveMember(member)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                title="Üyeyi Çıkar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {sortedGuests.map((guest, index) => (
                            <div key={guest.id} style={{
                                padding: '1rem',
                                borderBottom: index !== sortedGuests.length - 1 ? '1px solid var(--border-color)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {toTitleCase(guest.name).charAt(0).toUpperCase() || 'M'}
                                </div>
                                <Link
                                    to={`/profile/${guest.id}`}
                                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}
                                    className="hover:underline"
                                    title="Misafir oyuncu kartı ve maç istatistiklerini görüntüle"
                                >
                                    <span>{toTitleCase(guest.name)} (Misafir)</span>
                                </Link>
                                <span style={{ marginLeft: '0.5rem' }}>
                                    {isEditingJersey ? (
                                        <input
                                            type="text"
                                            value={jerseyMap[guest.id] || ''}
                                            onChange={(e) => handleJerseyChange(guest.id, e.target.value)}
                                            placeholder="#"
                                            style={{ width: '40px', padding: '2px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        (jerseyMap[guest.id] || group.jerseyNumbers?.[guest.id]) && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                #{jerseyMap[guest.id] || group.jerseyNumbers?.[guest.id]}
                                            </span>
                                        )
                                    )}
                                </span>
                                {isAdmin && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleOpenMergeModal(guest)}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}
                                            title="Üyeyle Eşleştir"
                                        >
                                            <Link2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveGuest(guest)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            title="Misafiri Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isAdmin && joinRequests.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={20} /> Katılma İstekleri
                    </h3>
                    <div className="card">
                        {joinRequests.map(req => (
                            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{req.userName}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{req.userEmail}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleRequestResponse(req, 'approved')} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}>
                                        <Check size={16} /> Onayla
                                    </button>
                                    <button onClick={() => handleRequestResponse(req, 'rejected')} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}>
                                        <X size={16} /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Merge Modal */}
            {showMergeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Misafiri Üyeyle Eşleştir</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            <strong>{selectedGuestForMerge?.name}</strong> adlı misafir oyuncunun tüm istatistiklerini aşağıdaki üyeye aktar:
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Üye Seçin</label>
                            <select
                                value={selectedMemberForMerge}
                                onChange={(e) => setSelectedMemberForMerge(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            >
                                <option value="">Bir üye seçin...</option>
                                {memberDetails.map(m => (
                                    <option key={m.id} value={m.id}>{m.name || m.nickname} ({m.email})</option>
                                ))}
                            </select>
                        </div>

                        {mergeError && (
                            <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                                {mergeError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowMergeModal(false)} className="btn btn-secondary">İptal</button>
                            <button onClick={handleMergeGuest} className="btn btn-primary" disabled={!selectedMemberForMerge || isMerging}>
                                {isMerging ? 'Eşleştiriliyor...' : 'Eşleştir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Undo Floating Notification Banner */}
            {undoToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: 'rgba(20, 24, 33, 0.98)',
                    border: '1px solid var(--accent-primary)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
                    borderRadius: '8px',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#fff',
                    maxWidth: '420px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trash2 size={18} color="#ef4444" />
                        <span style={{ fontSize: '0.85rem' }}>Maç silindi (Çöp Kutusu'na alındı).</span>
                    </div>
                    <button
                        onClick={() => handleRestoreMatch(undoToast.matchId)}
                        disabled={isRestoringMatch}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        <RotateCcw size={14} /> {isRestoringMatch ? 'Yükleniyor...' : 'Geri Al'}
                    </button>
                    <button
                        onClick={() => setUndoToast(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                        title="Kapat"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText || 'Evet, Onayla'}
                cancelText={confirmModal.cancelText || 'Vazgeç'}
                isDanger={confirmModal.isDanger !== false}
                isLoading={confirmModal.isLoading}
                error={confirmModal.error}
                onConfirm={confirmModal.onConfirm}
                onClose={() => {
                    if (!confirmModal.isLoading) {
                        setConfirmModal(prev => ({ ...prev, isOpen: false, error: null, onConfirm: null }));
                    }
                }}
            />

            <AdSenseBanner />
        </div>
    );
};

export default GroupDetail;
