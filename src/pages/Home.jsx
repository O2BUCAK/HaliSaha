import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Activity, Users, Trophy, Shield, MapPin, Star, DollarSign, CheckCircle2 } from 'lucide-react';
import { useSEO } from '../utils';

const Home = () => {
    const { currentUser } = useAuth();

    useSEO({
        title: 'Ana Sayfa | Halı Saha İstatistik Platformu',
        description: 'Arkadaş grubunuzu kurun, halı saha maçlarınızı organize edin, oyuncuları puanlayın ve detaylı istatistiklerle rekabeti artırın.'
    });

    if (currentUser) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div>
            {/* Hero Section */}
            <section style={{
                padding: '4.5rem 0 3.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.15), transparent 70%)'
            }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.9rem',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.84rem',
                        fontWeight: '600',
                        marginBottom: '1.5rem'
                    }}>
                        <Trophy size={14} />
                        <span>Arkadaş Grupları İçin Ücretsiz Halı Saha Ligi</span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                        fontWeight: '800',
                        lineHeight: '1.15',
                        letterSpacing: '-0.03em',
                        marginBottom: '1.25rem',
                        color: '#ffffff',
                        textWrap: 'balance'
                    }}>
                        Halı Saha Maçlarınızı <br />
                        <span className="text-gradient">Profesyonel Bir Lige Dönüştürün</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                        color: 'var(--text-secondary)',
                        maxWidth: '680px',
                        margin: '0 auto 2.25rem',
                        lineHeight: 1.6
                    }}>
                        Maçlarınızı organize edin, taktik tahtasında kadro kurun, maç sonu oyuncuları puanlayın ve kasa ücretlerini tek yerden yönetin.
                    </p>

                    <div className="flex-center" style={{ gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}>
                            Hemen Ücretsiz Başla <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}>
                            Mevcut Hesaba Giriş Yap
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.75rem',
                        flexWrap: 'wrap',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={15} color="var(--accent-primary)" />
                            %100 Ücretsiz Kullanım
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={15} color="var(--accent-primary)" />
                            KVKK Uyumlu & Güvenli
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={15} color="var(--accent-primary)" />
                            Hızlı & Kolay Kurulum
                        </span>
                    </div>
                </div>
            </section>

            {/* Platform Feature Showcase */}
            <section id="ozellikler" style={{ padding: '4.5rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                            Halı Saha Severler İçin Geliştirilen Özellikler
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            Gruptaki WhatsApp kaosuna son verin. Kadro, taktik, puanlama ve kasa takibi tek çatı altında.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <FeatureCard
                            icon={<Users size={24} color="var(--accent-primary)" />}
                            title="Grup & Sezon Yönetimi"
                            desc="Arkadaş grubunuza özel lig kurun. Sezonlar başlatın, şampiyonları belirleyin ve tüm zamanlar tablosunu tutun."
                        />
                        <FeatureCard
                            icon={<Activity size={24} color="#38bdf8" />}
                            title="Taktik Tahtası"
                            desc="Gerçekçi halı saha çiminde oyuncuları dizin, kaleciyi belirleyin ve takım forma renklerini seçin."
                        />
                        <FeatureCard
                            icon={<Star size={24} color="#f59e0b" />}
                            title="Oyuncu Puanlama Sistemi"
                            desc="Her maç bitiminde oyuncular birbirine 1-10 arası puan verir. Maçın adamı ve haftanın en iyisi otomatik seçilir."
                        />
                        <FeatureCard
                            icon={<Trophy size={24} color="#a855f7" />}
                            title="Gol, Asist & Kurtarış"
                            desc="Kaleci kurtarışları dahil tüm bireysel verileri tutun. Son 5 maçlık form grafiği ile performansı takip edin."
                        />
                        <FeatureCard
                            icon={<DollarSign size={24} color="var(--accent-primary)" />}
                            title="Ücret Toplama & Kasa"
                            desc="Saha kaporası, oyuncu başı aidat, IBAN paylaşımı ve ödeme yapan/yapmayan oyuncu takibini kolayca yapın."
                        />
                        <FeatureCard
                            icon={<MapPin size={24} color="#ef4444" />}
                            title="Tesis & Konum Paylaşımı"
                            desc="Maçın oynanacağı halısahanın harita konumunu, saatini ve tesis bilgilerini gruptaki herkesle tek tıkla paylaşın."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="nasil-calisir" style={{
                padding: '4.5rem 0',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.015)'
            }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                            3 Basit Adımda Başlayın
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            Karmaşık ayarlar olmadan dakikalar içinde liginizi hayata geçirin.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '2rem'
                    }}>
                        <StepCard
                            step="01"
                            title="Grubunu Kur"
                            desc="Halı saha grubunu oluştur, davet bağlantısını arkadaşlarına gönder veya misafir oyuncuları listeye ekle."
                        />
                        <StepCard
                            step="02"
                            title="Maçını Oluştur"
                            desc="Tarih, saat ve tesis konumunu seç. Taktik tahtasında A ve B takımı kadrolarını oluştur."
                        />
                        <StepCard
                            step="03"
                            title="Puanla & Takip Et"
                            desc="Düdük çaldıktan sonra skoru gir, arkadaşlarına puan ver, gol krallığı ve kasa durumunu incele."
                        />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1.05rem' }}>
                            İlk Halı Saha Grubunu Başlat <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
        <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </div>
);

const StepCard = ({ step, title, desc }) => (
    <div style={{
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        position: 'relative'
    }}>
        <div style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            color: 'var(--accent-primary)',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: '0.75rem'
        }}>
            {step}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </div>
);

export default Home;
