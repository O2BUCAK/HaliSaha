import React from 'react';
import { X, ShieldCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';

const KvkkModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{
                maxWidth: '720px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ShieldCheck size={24} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                            KVKK Aydınlatma Metni ve Gizlilik Politikası
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem' }}
                        aria-label="Kapat"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem'
                }}>
                    <div style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(34, 197, 94, 0.08)',
                        borderLeft: '4px solid var(--accent-primary)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)'
                    }}>
                        <strong>6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong> ve 2026 yılı güncel mevzuatı uyarınca kişisel verilerinizin güvenliği ve gizliliği en üst seviyede korunmaktadır.
                    </div>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={16} color="var(--accent-primary)" /> 1. Veri Sorumlusu
                        </h3>
                        <p>
                            Bu platform kapsamında işlenen kişisel verileriniz bakımından veri sorumlusu <strong>Halı Saha İstatistik Platformu</strong> yönetimidir.
                            İletişim ve veri koruma başvuruları için resmi iletişim kanalı:
                            <a href="mailto:ersin@ozbucak.com.tr" style={{ color: 'var(--accent-primary)', marginLeft: '0.3rem', textDecoration: 'underline' }}>
                                ersin@ozbucak.com.tr
                            </a>.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.4rem' }}>
                            2. İşlenen Kişisel Veriler
                        </h3>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                            <li><strong>Kimlik & Profil Bilgileri:</strong> Ad-soyad, kullanıcı takma adı (nickname), biyografi ve avatar görseli.</li>
                            <li><strong>İletişim Bilgileri:</strong> E-posta adresi (hesap güvenliği ve doğrulama amacıyla).</li>
                            <li><strong>Spor & Performans Verileri:</strong> Oynanan maçlar, takımlar, gol, asist, kaleci kurtarışları ve maç sonu oyuncu puanları (1-10 skalası).</li>
                            <li><strong>Teknik & İşlem Güvenliği Verileri:</strong> IP bilgileri, oturum zamanları, sistem işlem kayıtları (5651 Sayılı Kanun gereği loglama).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.4rem' }}>
                            3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri
                        </h3>
                        <p>
                            Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen; <em>"Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması"</em>, <em>"Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi"</em> ve <em>"İlgili kişinin meşru menfaatleri"</em> hukuki sebeplerine dayalı olarak; üyelik süreçlerinin yürütülmesi, halı saha lig ve istatistiklerinin tutulması, puanlamaların şeffaf biçimde hesaplanması amacıyla işlenmektedir.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.4rem' }}>
                            4. Kişisel Verilerin Aktarılması ve Güvenlik Altyapısı
                        </h3>
                        <p>
                            Platformumuz, güvenilir ve yüksek güvenlikli Google Cloud ve Firebase bulut altyapısında barındırılmaktadır. Verileriniz üçüncü şahıslara veya reklam pazarlamacılarına asla satılmaz; yalnızca platformun teknik sürekliliği için gerekli altyapı sağlayıcılarıyla sınırlı olarak işlenir.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.4rem' }}>
                            5. İlgili Kişi Hakları (KVKK Madde 11 & Unutulma Hakkı)
                        </h3>
                        <p>
                            KVKK'nın 11. maddesi uyarınca herkes veri sorumlusuna başvurarak;
                        </p>
                        <ul style={{ paddingLeft: '1.25rem', margin: '0.3rem 0' }}>
                            <li>Kişisel verisinin işlenip işlenmediğini öğrenme,</li>
                            <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
                            <li>Kişisel verilerin düzeltilmesini isteme (Profil sayfasından anlık yapılabilir),</li>
                            <li><strong>Kişisel verilerin silinmesini veya yok edilmesini isteme ("Hesabımı Sil" butonuyla veya e-posta yoluyla),</strong></li>
                            <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme haklarına sahiptir.</li>
                        </ul>
                    </section>

                    <section style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <Mail size={18} color="var(--accent-primary)" />
                        <span>
                            Başvurularınız için: <strong>ersin@ozbucak.com.tr</strong> adresine kayıtlı e-postanızdan yazılı talepte bulunabilirsiniz. Talepleriniz en geç 30 gün içinde ücretsiz sonuçlandırılır.
                        </span>
                    </section>
                </div>

                <div style={{
                    marginTop: '1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <CheckCircle2 size={16} /> Okudum, Anladım
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KvkkModal;
