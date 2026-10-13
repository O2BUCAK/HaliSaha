import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
    User,
    Mail,
    Edit2,
    Save,
    X,
    Instagram,
    Twitter,
    Facebook,
    Linkedin,
    Database,
    ShieldCheck,
    Trash2,
    ArrowLeft,
    Eye,
    EyeOff,
    Lock
} from 'lucide-react';
import { toTitleCase, stripSenSuffix, useSEO } from '../utils';
import KvkkModal from '../components/KvkkModal';
import ConfirmModal from '../components/ConfirmModal';
import PlayerPerformanceChart from '../components/PlayerPerformanceChart';

const Profile = () => {
    const { currentUser, updateProfile, deleteAccount } = useAuth();
    const { matches, groups } = useData();
    const { userId } = useParams();
    const navigate = useNavigate();

    const currentUserId = currentUser ? String(currentUser.uid || currentUser.id) : null;
    const targetUserId = userId ? String(userId) : currentUserId;
    const isOwner = Boolean(currentUserId && targetUserId === currentUserId);

    const [viewedUser, setViewedUser] = useState(isOwner ? currentUser : null);
    const [loadingUser, setLoadingUser] = useState(!isOwner);
    const [userError, setUserError] = useState(null);

    const [showKvkkModal, setShowKvkkModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
    const [extraMatches, setExtraMatches] = useState([]);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Evet, Onayla',
        isDanger: true,
        isLoading: false,
        error: null,
        onConfirm: null
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        nickname: currentUser?.nickname || '',
        bio: currentUser?.bio || '',
        showPerformanceChart: currentUser?.showPerformanceChart !== false,
        socialLinks: {
            instagram: currentUser?.socialLinks?.instagram || '',
            twitter: currentUser?.socialLinks?.twitter || '',
            facebook: currentUser?.socialLinks?.facebook || '',
            linkedin: currentUser?.socialLinks?.linkedin || ''
        }
    });
    const [message, setMessage] = useState(null);

    // Sync formData when currentUser updates
    useEffect(() => {
        if (isOwner && currentUser) {
            setViewedUser(currentUser);
            setFormData({
                name: currentUser?.name || '',
                nickname: currentUser?.nickname || '',
                bio: currentUser?.bio || '',
                showPerformanceChart: currentUser?.showPerformanceChart !== false,
                socialLinks: {
                    instagram: currentUser?.socialLinks?.instagram || '',
                    twitter: currentUser?.socialLinks?.twitter || '',
                    facebook: currentUser?.socialLinks?.facebook || '',
                    linkedin: currentUser?.socialLinks?.linkedin || ''
                }
            });
        }
    }, [currentUser, isOwner]);

    // Fetch other user if viewing another player's profile
    useEffect(() => {
        let isMounted = true;
        if (!isOwner && targetUserId) {
            setLoadingUser(true);
            setUserError(null);

            // Check if target is a guest player in any group
            let foundGuest = null;
            for (const g of groups) {
                const found = (g.guestPlayers || []).find(gp => String(gp.id) === targetUserId);
                if (found) {
                    foundGuest = found;
                    break;
                }
            }

            if (foundGuest || targetUserId.startsWith('guest_')) {
                const guestName = foundGuest ? foundGuest.name : 'Misafir Oyuncu';
                if (isMounted) {
                    setViewedUser({
                        id: targetUserId,
                        name: toTitleCase(guestName),
                        nickname: 'Misafir Oyuncu',
                        bio: 'Grup maçlarında mücadele eden misafir oyuncu kartı.',
                        role: 'guest',
                        showPerformanceChart: true
                    });
                    setLoadingUser(false);
                }
                return;
            }

            // Normal user profile lookup in Firestore
            getDoc(doc(db, 'users', targetUserId))
                .then(snap => {
                    if (!isMounted) return;
                    if (snap.exists()) {
                        const uData = snap.data();
                        setViewedUser({
                            id: snap.id,
                            ...uData,
                            name: toTitleCase(uData.name || uData.displayName || 'Kullanıcı'),
                            nickname: uData.nickname ? toTitleCase(uData.nickname) : toTitleCase(uData.name || 'Kullanıcı')
                        });
                    } else {
                        // Check if player has matches
                        let foundName = null;
                        for (const m of (matches || [])) {
                            const p = [...(m.teamA || []), ...(m.teamB || [])].find(pl => String(pl.id || pl.uid) === targetUserId);
                            if (p && p.name) {
                                foundName = p.name;
                                break;
                            }
                            if (m.stats?.[targetUserId]?.name) {
                                foundName = m.stats[targetUserId].name;
                                break;
                            }
                        }

                        if (foundName) {
                            setViewedUser({
                                id: targetUserId,
                                name: toTitleCase(stripSenSuffix(foundName)),
                                nickname: toTitleCase(stripSenSuffix(foundName)),
                                bio: 'Oyuncu istatistik ve maç kayıt kartı.',
                                showPerformanceChart: true
                            });
                        } else {
                            setUserError('Kullanıcı profili bulunamadı.');
                        }
                    }
                    setLoadingUser(false);
                })
                .catch(err => {
                    if (!isMounted) return;
                    console.error("Error fetching user profile:", err);
                    setUserError('Kullanıcı bilgileri yüklenirken hata oluştu.');
                    setLoadingUser(false);
                });
        }
        return () => { isMounted = false; };
    }, [targetUserId, isOwner, groups, matches]);

    // Ensure all matches across Firestore are loaded for full player history
    useEffect(() => {
        let isMounted = true;
        if (targetUserId) {
            getDocs(collection(db, 'matches'))
                .then(snap => {
                    if (!isMounted) return;
                    const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setExtraMatches(loaded);
                })
                .catch(err => {
                    console.warn("Could not fetch extra matches:", err);
                });
        }
        return () => { isMounted = false; };
    }, [targetUserId]);

    useSEO({
        title: isOwner
            ? 'Profilim'
            : (viewedUser ? `${toTitleCase(viewedUser.name || viewedUser.nickname)} | Oyuncu Profili` : 'Oyuncu Profili'),
        description: 'Halı Saha İstatistik Platformu oyuncu profili ve son 5 maçlık gol/asist performans grafiği.'
    });

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'showPerformanceChart') {
            setFormData(prev => ({
                ...prev,
                showPerformanceChart: checked
            }));
        } else if (name.startsWith('social_')) {
            const socialKey = name.replace('social_', '');
            setFormData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [socialKey]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'name' ? toTitleCase(value) : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await updateProfile(formData);
        if (result.success) {
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
            setIsEditing(false);
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error });
        }
    };

    const handleTogglePrivacy = async () => {
        if (!isOwner || isUpdatingPrivacy) return;
        setIsUpdatingPrivacy(true);
        const currentVal = viewedUser?.showPerformanceChart !== false;
        const newVal = !currentVal;

        const result = await updateProfile({ showPerformanceChart: newVal });
        setIsUpdatingPrivacy(false);

        if (result.success) {
            setMessage({
                type: 'success',
                text: newVal
                    ? 'Performans grafiğiniz diğer kullanıcılara görünür yapıldı.'
                    : 'Performans grafiğiniz diğer kullanıcılara gizlendi (Yalnızca siz görebilirsiniz).'
            });
            setTimeout(() => setMessage(null), 3500);
        } else {
            setMessage({ type: 'error', text: result.error || 'Ayar güncellenemedi.' });
        }
    };

    const handleDeleteAccount = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hesabımı ve Verilerimi Sil',
            message: '6698 Sayılı KVKK Madde 11 (Unutulma Hakkı) kapsamında hesabınızı ve tüm kişisel verilerinizi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!',
            confirmText: 'Evet, Hesabımı Sil',
            cancelText: 'Vazgeç',
            isDanger: true,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                setIsDeleting(true);
                setMessage({ type: 'success', text: 'Hesap ve veriler siliniyor...' });
                const result = await deleteAccount();
                if (result.success) {
                    navigate('/');
                } else {
                    setIsDeleting(false);
                    setConfirmModal(prev => ({
                        ...prev,
                        isLoading: false,
                        error: result.error || 'Hesap silinirken hata oluştu.'
                    }));
                }
            }
        });
    };

    const handleMigration = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Verileri Güncelle (Eski Kayıtları Düzelt)',
            message: 'Veritabanındaki tüm isimleri güncelleyip, baş harfleri büyük yapacak ve eski kayıtları düzeltecektir. Devam etmek istiyor musunuz?',
            confirmText: 'Evet, Güncelle',
            cancelText: 'Vazgeç',
            isDanger: false,
            isLoading: false,
            error: null,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
                try {
                    setMessage({ type: 'success', text: 'Güncelleme başladı...' });

                    // 1. Update Current User if name needs title casing
                    if (currentUser) {
                        const currentName = currentUser.name || '';
                        const formattedName = toTitleCase(currentName);
                        if (formattedName && formattedName !== currentName) {
                            await updateProfile({ name: formattedName });
                        }
                    }

                    // 2. Update Groups (Guest Players)
                    const groupsRef = collection(db, 'groups');
                    const groupsSnap = await getDocs(groupsRef);
                    for (const groupDoc of groupsSnap.docs) {
                        const groupData = groupDoc.data();
                        if (groupData.guestPlayers && groupData.guestPlayers.length > 0) {
                            const updatedGuests = groupData.guestPlayers.map(g => ({
                                ...g,
                                name: toTitleCase(g.name)
                            }));
                            try {
                                await updateDoc(doc(db, 'groups', groupDoc.id), { guestPlayers: updatedGuests });
                            } catch (gErr) {
                                console.warn("Group update error:", gErr);
                            }
                        }
                    }

                    // 3. Update Matches (Fix player team names)
                    const matchesRef = collection(db, 'matches');
                    const matchesSnap = await getDocs(matchesRef);
                    for (const matchDoc of matchesSnap.docs) {
                        const matchData = matchDoc.data();
                        let needsUpdate = false;
                        const updatePayload = {};

                        const fixPlayers = (players) => {
                            if (!players) return [];
                            return players.map(p => ({
                                ...p,
                                name: toTitleCase(p.name)
                            }));
                        };

                        if (matchData.teamA) {
                            updatePayload.teamA = fixPlayers(matchData.teamA);
                            needsUpdate = true;
                        }
                        if (matchData.teamB) {
                            updatePayload.teamB = fixPlayers(matchData.teamB);
                            needsUpdate = true;
                        }

                        if (matchData.stats) {
                            const newStats = {};
                            let statsUpdated = false;
                            Object.entries(matchData.stats).forEach(([id, stat]) => {
                                if (stat.name) {
                                    newStats[id] = { ...stat, name: toTitleCase(stat.name) };
                                    statsUpdated = true;
                                } else {
                                    newStats[id] = stat;
                                }
                            });
                            if (statsUpdated) {
                                updatePayload.stats = newStats;
                                needsUpdate = true;
                            }
                        }

                        if (needsUpdate) {
                            try {
                                await updateDoc(doc(db, 'matches', matchDoc.id), updatePayload);
                            } catch (mErr) {
                                console.warn("Match update error:", mErr);
                            }
                        }
                    }

                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                    setMessage({ type: 'success', text: 'Veritabanı başarıyla güncellendi!' });
                    setTimeout(() => setMessage(null), 5000);
                } catch (error) {
                    console.error("Migration Error:", error);
                    setConfirmModal(prev => ({
                        ...prev,
                        isLoading: false,
                        error: 'Güncelleme sırasında hata oluştu: ' + (error.message || error)
                    }));
                }
            }
        });
    };

    if (!currentUser) return <div className="container" style={{ padding: '2rem' }}>Giriş yapmalısınız.</div>;

    if (loadingUser) {
        return (
            <div className="container layout" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Oyuncu profili yükleniyor...</div>
            </div>
        );
    }

    if (userError || !viewedUser) {
        return (
            <div className="container layout" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{userError || 'Kullanıcı bulunamadı.'}</div>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Geri Dön
                </button>
            </div>
        );
    }

    const displayName = toTitleCase(viewedUser.name || viewedUser.nickname || 'Kullanıcı');
    const displayNickname = toTitleCase(viewedUser.nickname || viewedUser.name || '');
    const showChartStatus = viewedUser.showPerformanceChart !== false;

    return (
        <div className="container layout">
            <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                {/* Back button when viewing other users */}
                {!isOwner && (
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-secondary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginBottom: '1rem',
                            padding: '0.5rem 0.85rem'
                        }}
                    >
                        <ArrowLeft size={16} /> Geri Dön
                    </button>
                )}

                <div className="card">
                    {/* Header bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>
                            {isOwner ? 'Profilim' : 'Oyuncu Profili'}
                        </h2>
                        {isOwner && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                                <Edit2 size={18} /> Düzenle
                            </button>
                        )}
                    </div>

                    {message && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
                            border: `1px solid ${message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                <div style={{
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    background: 'var(--bg-secondary)', border: '2px solid var(--accent-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1rem auto', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)'
                                }}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Profil fotoğrafı değiştirilemez</div>
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Ad Soyad</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            style={{ paddingLeft: '3rem' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Lakap / Forma Adı</label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        value={formData.nickname}
                                        onChange={handleChange}
                                        placeholder="Maçlarda görünecek adınız (Örn: R10)"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Hakkımda / Biyografi</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Oyun tarzınız, mevkiniz veya favori ayak..."
                                        rows="3"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {/* Privacy Setting Toggle Inside Edit Form */}
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="showPerformanceChart"
                                            checked={formData.showPerformanceChart}
                                            onChange={handleChange}
                                            style={{ marginTop: '0.25rem', width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {formData.showPerformanceChart ? <Eye size={16} color="var(--accent-primary)" /> : <EyeOff size={16} color="#ef4444" />}
                                                Performans Grafiğini (Son 5 Maç & Tüm Maçlar) Diğer Kullanıcılara Göster
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                                İşaret kaldırıldığında, profilinizi ziyaret eden diğer üyeler maç performans ve gol/asist grafiklerinizi göremez.
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Sosyal Medya Hesapları</label>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Instagram size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#E1306C' }} />
                                            <input
                                                type="text"
                                                name="social_instagram"
                                                value={formData.socialLinks.instagram}
                                                onChange={handleChange}
                                                placeholder="Instagram Kullanıcı Adı"
                                                style={{ paddingLeft: '3rem' }}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Twitter size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#1DA1F2' }} />
                                            <input
                                                type="text"
                                                name="social_twitter"
                                                value={formData.socialLinks.twitter}
                                                onChange={handleChange}
                                                placeholder="Twitter/X Kullanıcı Adı"
                                                style={{ paddingLeft: '3rem' }}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Facebook size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#1877F2' }} />
                                            <input
                                                type="text"
                                                name="social_facebook"
                                                value={formData.socialLinks.facebook}
                                                onChange={handleChange}
                                                placeholder="Facebook Kullanıcı Adı"
                                                style={{ paddingLeft: '3rem' }}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Linkedin size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#0077b5' }} />
                                            <input
                                                type="text"
                                                name="social_linkedin"
                                                value={formData.socialLinks.linkedin || ''}
                                                onChange={handleChange}
                                                placeholder="LinkedIn Kullanıcı Adı"
                                                style={{ paddingLeft: '3rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        <Save size={18} /> Kaydet
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                                        <X size={18} /> İptal
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div>
                            {/* Player Profile Card */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: 'var(--bg-secondary)', border: '4px solid var(--accent-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1rem', fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)',
                                    boxShadow: 'var(--shadow-glow)'
                                }}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{displayNickname}</h3>
                                {viewedUser.nickname && viewedUser.nickname !== viewedUser.name && (
                                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {displayName}
                                    </div>
                                )}
                                {viewedUser.email && (
                                    <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <Mail size={16} /> {viewedUser.email}
                                    </div>
                                )}
                            </div>

                            {viewedUser.bio && (
                                <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>"{viewedUser.bio}"</p>
                                </div>
                            )}

                            {/* Social Media Links */}
                            <div>
                                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Sosyal Medya</h4>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    {viewedUser.socialLinks?.instagram && (
                                        <a href={`https://instagram.com/${viewedUser.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none' }}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(225, 48, 108, 0.1)', borderRadius: '50%', color: '#E1306C' }}>
                                                <Instagram size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>Instagram</span>
                                        </a>
                                    )}
                                    {viewedUser.socialLinks?.twitter && (
                                        <a href={`https://twitter.com/${viewedUser.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none' }}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(29, 161, 242, 0.1)', borderRadius: '50%', color: '#1DA1F2' }}>
                                                <Twitter size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>Twitter</span>
                                        </a>
                                    )}
                                    {viewedUser.socialLinks?.facebook && (
                                        <a href={`https://facebook.com/${viewedUser.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none' }}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(24, 119, 242, 0.1)', borderRadius: '50%', color: '#1877F2' }}>
                                                <Facebook size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>Facebook</span>
                                        </a>
                                    )}
                                    {viewedUser.socialLinks?.linkedin && (
                                        <a href={`https://linkedin.com/in/${viewedUser.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none' }}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(0, 119, 181, 0.1)', borderRadius: '50%', color: '#0077b5' }}>
                                                <Linkedin size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>LinkedIn</span>
                                        </a>
                                    )}
                                    {(!viewedUser.socialLinks?.instagram && !viewedUser.socialLinks?.twitter && !viewedUser.socialLinks?.facebook && !viewedUser.socialLinks?.linkedin) && (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Henüz sosyal medya hesabı eklenmemiş.</div>
                                    )}
                                </div>
                            </div>

                            {/* Privacy Controls Card for Profile Owner */}
                            {isOwner && (
                                <div style={{
                                    marginTop: '2rem',
                                    padding: '1.25rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                            {showChartStatus ? <Eye size={18} color="var(--accent-primary)" /> : <Lock size={18} color="#ef4444" />}
                                            Performans Grafiği Görünürlüğü (KVKK / Gizlilik)
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', maxWidth: '520px' }}>
                                            {showChartStatus
                                                ? 'Grafik açık: Profilinizi ziyaret eden üyeler son 5 maçlık ve tüm maçlar performans grafiğinizi görebilir.'
                                                : 'Grafik gizli: Maç performans grafikleriniz diğer kullanıcılara gizlenmiştir (yalnızca siz görebilirsiniz).'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTogglePrivacy}
                                        disabled={isUpdatingPrivacy}
                                        className="btn btn-secondary"
                                        style={{
                                            fontSize: '0.85rem',
                                            padding: '0.5rem 0.9rem',
                                            borderColor: showChartStatus ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                                            color: showChartStatus ? 'var(--accent-primary)' : '#ef4444'
                                        }}
                                    >
                                        {showChartStatus ? '🔒 Grafiği Gizle' : '👁️ Grafiği Görünür Yap'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Integrated Recharts Performance Trends Component */}
                    {(() => {
                        const combinedMatchesMap = new Map();
                        (matches || []).forEach(m => { if (m && m.id) combinedMatchesMap.set(m.id, m); });
                        extraMatches.forEach(m => { if (m && m.id) combinedMatchesMap.set(m.id, m); });
                        const allAvailableMatches = Array.from(combinedMatchesMap.values());

                        return (
                            <PlayerPerformanceChart
                                playerId={targetUserId}
                                matches={allAvailableMatches}
                                isOwner={isOwner}
                                showPerformanceChart={showChartStatus}
                                onTogglePrivacy={isOwner ? handleTogglePrivacy : null}
                                isUpdatingPrivacy={isUpdatingPrivacy}
                            />
                        );
                    })()}

                    {/* KVKK and Administrative Tools (Owner Only) */}
                    {isOwner && (
                        <>
                            <div style={{
                                marginTop: '2rem',
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <ShieldCheck size={20} color="var(--accent-primary)" />
                                    <h4 style={{ fontSize: '1rem', margin: 0 }}>Gizlilik ve KVKK Hakları</h4>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
                                    6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca işlenen kişisel verilerinizi inceleyebilir, aydınlatma metnini görüntüleyebilir veya dilediğiniz an tüm verilerinizle birlikte hesabınızı kalıcı olarak silebilirsiniz (Unutulma Hakkı).
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowKvkkModal(true)}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <ShieldCheck size={16} /> KVKK Aydınlatma Metni
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="btn btn-secondary"
                                        style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--accent-danger)',
                                            borderColor: 'rgba(239, 68, 68, 0.4)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem'
                                        }}
                                    >
                                        <Trash2 size={16} /> {isDeleting ? 'Siliniyor...' : 'Hesabımı ve Verilerimi Sil'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                                <button
                                    onClick={handleMigration}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)', justifyContent: 'center' }}
                                >
                                    <Database size={18} /> Verileri Güncelle (Eski Kayıtları Düzelt)
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <KvkkModal isOpen={showKvkkModal} onClose={() => setShowKvkkModal(false)} />

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
        </div>
    );
};

export default Profile;
