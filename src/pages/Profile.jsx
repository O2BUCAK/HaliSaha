import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Edit2, Save, X, Instagram, Twitter, Facebook, Linkedin, Database, ShieldCheck, Trash2 } from 'lucide-react';
import { toTitleCase, useSEO } from '../utils';
import KvkkModal from '../components/KvkkModal';

const Profile = () => {
    const { currentUser, updateProfile, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [showKvkkModal, setShowKvkkModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    useSEO({
        title: 'Profilim',
        description: 'Halı Saha İstatistik Platformu profilinizi yönetin, sosyal medya hesaplarınızı bağlayın ve oyuncu kartınızı güncelleyin.'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        nickname: currentUser?.nickname || '',
        bio: currentUser?.bio || '',
        socialLinks: {
            instagram: currentUser?.socialLinks?.instagram || '',
            twitter: currentUser?.socialLinks?.twitter || '',
            facebook: currentUser?.socialLinks?.facebook || '',
            website: currentUser?.socialLinks?.website || ''
        }
    });
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('social_')) {
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

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "6698 Sayılı KVKK Madde 11 (Unutulma Hakkı) kapsamında hesabınızı ve tüm kişisel verilerinizi kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!"
        );
        if (!confirmed) return;

        setIsDeleting(true);
        setMessage({ type: 'success', text: 'Hesap ve veriler siliniyor...' });
        const result = await deleteAccount();
        if (result.success) {
            navigate('/');
        } else {
            setIsDeleting(false);
            setMessage({ type: 'error', text: result.error });
        }
    };

    const handleMigration = async () => {
        if (!window.confirm('Veritabanındaki tüm isimleri güncelleyip, eski kayıtları düzeltecek. Emin misiniz?')) return;

        try {
            setMessage({ type: 'success', text: 'Güncelleme başladı...' });

            // 1. Update Users
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            const batchPromises = [];

            for (const userDoc of usersSnap.docs) {
                const userData = userDoc.data();
                if (userData.name) {
                    const newName = toTitleCase(userData.name);
                    if (newName !== userData.name) {
                        batchPromises.push(updateDoc(doc(db, 'users', userDoc.id), { name: newName }));
                    }
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
                    batchPromises.push(updateDoc(doc(db, 'groups', groupDoc.id), { guestPlayers: updatedGuests }));
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

                // Fix stats names if present
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
                    batchPromises.push(updateDoc(doc(db, 'matches', matchDoc.id), updatePayload));
                }
            }

            await Promise.all(batchPromises);
            setMessage({ type: 'success', text: 'Veritabanı başarıyla güncellendi!' });
            setTimeout(() => setMessage(null), 5000);

        } catch (error) {
            console.error("Migration Error:", error);
            setMessage({ type: 'error', text: 'Güncelleme sırasında hata oluştu.' });
        }
    };

    if (!currentUser) return <div>Giriş yapmalısınız.</div>;

    return (
        <div className="container layout">
            <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem' }}>Profilim</h2>
                        {!isEditing && (
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
                                    {currentUser.name.charAt(0).toUpperCase()}
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Kullanıcı Adı (Nick)</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="text"
                                            name="nickname"
                                            value={formData.nickname}
                                            onChange={handleChange}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Görünen Adınız"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Biyografi</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Kendinizden bahsedin..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Sosyal Medya</h3>
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: 'var(--bg-secondary)', border: '4px solid var(--accent-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1rem', fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)',
                                    boxShadow: 'var(--shadow-glow)'
                                }}>
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{currentUser.nickname || currentUser.name}</h3>
                                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    {currentUser.name}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} /> {currentUser.email}
                                </div>
                            </div>

                            {currentUser.bio && (
                                <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{currentUser.bio}"</p>
                                </div>
                            )}

                            <div>
                                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Sosyal Medya</h4>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                                    {currentUser.socialLinks?.instagram && (
                                        <a href={`https://instagram.com/${currentUser.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', transition: 'transform 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(225, 48, 108, 0.1)', borderRadius: '50%', color: '#E1306C' }}>
                                                <Instagram size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>Instagram</span>
                                        </a>
                                    )}
                                    {currentUser.socialLinks?.twitter && (
                                        <a href={`https://twitter.com/${currentUser.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', transition: 'transform 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(29, 161, 242, 0.1)', borderRadius: '50%', color: '#1DA1F2' }}>
                                                <Twitter size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>Twitter</span>
                                        </a>
                                    )}
                                    {currentUser.socialLinks?.facebook && (
                                        <a href={`https://facebook.com/${currentUser.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', transition: 'transform 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(24, 119, 242, 0.1)', borderRadius: '50%', color: '#1877F2' }}>
                                                <Facebook size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>Facebook</span>
                                        </a>
                                    )}
                                    {currentUser.socialLinks?.linkedin && (
                                        <a href={`https://linkedin.com/in/${currentUser.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', transition: 'transform 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ padding: '0.75rem', background: 'rgba(0, 119, 181, 0.1)', borderRadius: '50%', color: '#0077b5' }}>
                                                <Linkedin size={24} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>LinkedIn</span>
                                        </a>
                                    )}
                                    {(!currentUser.socialLinks?.instagram && !currentUser.socialLinks?.twitter && !currentUser.socialLinks?.facebook && !currentUser.socialLinks?.linkedin) && (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Henüz sosyal medya hesabı eklenmemiş.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                </div>
            </div>

            <KvkkModal isOpen={showKvkkModal} onClose={() => setShowKvkkModal(false)} />
        </div>
    );
};

export default Profile;
