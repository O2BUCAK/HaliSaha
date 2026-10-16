# HaliSaha — Brand Book
**Sürüm:** 1.0 · **Tarih:** 16 Ekim 2026  
**Marka tanımı:** Arkadaş gruplarının halı saha maçlarını, sezonlarını ve oyuncu performanslarını tek yerde bir araya getiren dijital amatör lig platformu.

> Bu doküman, mevcut uygulama ve depo yapısı temel alınarak önerilen yeni marka sistemidir. Renkler, tipografi ve logo yönü tasarım önerisidir; uygulamanın tamamına uygulanmadan önce gerçek ekranlarda doğrulanmalıdır.

## 1. Marka özü

### Marka vaadi
**Maç biter, rekabet devam eder.**

HaliSaha, haftalık maçı bir anıya; oyuncu performansını ölçülebilir istatistiğe; arkadaş grubunu da kendi ligine dönüştürür.

### Konumlandırma
Amatör futbol oynayan arkadaş grupları için maç organizasyonu, oyuncu istatistiği ve sezon rekabetini kolaylaştıran, mobilde rahat kullanılan dijital lig merkezi.

### Marka kişiliği
- **Rekabetçi:** Skor, liderlik ve kişisel rekorlar görünür olmalı.
- **Samimi:** Profesyonel spor verisini arkadaş grubu dilinde sunmalı.
- **Net:** İstatistikler hızlı okunmalı; gereksiz görsel gürültü olmamalı.
- **Sahaya ait:** Çizgiler, saha geometrisi ve maç günü ritmi görsel dile yön vermeli.
- **Adil:** Veriler ve durumlar renk kadar metin/ikonla da açıklanmalı.

### Hedef kitle
- Düzenli halı saha maçı yapan arkadaş grupları
- Grup yöneticileri ve maç organizatörleri
- Gol/asist, maçın oyuncusu ve sezon liderlik tablosunu takip eden oyuncular

### Slogan seçenekleri
**Ana slogan:** Maç biter, rekabet devam eder.  
Alternatifler: **Kendi ligin, kendi efsanen.** · **Sahadaki hikâyen burada.** · **Arkadaş maçı. Lig ciddiyeti.**

## 2. İsim ve yazım

- Ürün adı: **HaliSaha** (arayüzde “Halı Saha” yazımı da doğal Türkçe metinde kullanılabilir).
- Logo/ürün etiketi: `HaliSaha`
- Alan adı: `halisaha.ozbucak.com.tr`
- GitHub proje adı: `O2BUCAK/HaliSaha`
- Metinlerde “halısaha” yerine doğal yazım olarak “halı saha” tercih edilir.
- Büyük/küçük harf biçimi ve ürün adı bütün arayüzlerde tutarlı tutulur.

## 3. Görsel kimlik yönü

### Yaratıcı fikir: “Saha çizgisi + skor işareti”
Ana sembol, yuvarlatılmış köşeli kompakt bir saha planı ve orta çizgi/orta daire geometrisinden oluşur. İçindeki küçük daire topu veya oyuncu konumunu çağrıştırır. Sembol, küçük boyutlarda da ayırt edilebilir olmalıdır.

Logo ailesi:
1. **Ana logo:** Sembol + HaliSaha wordmark.
2. **Yatay logo:** Navigasyon, masaüstü üst bar ve doküman kapakları.
3. **Sembol:** Favicon, avatar ve mobil uygulama simgesi.
4. **Tek renk logo:** Açık veya koyu tek renkli yüzeyler ve baskı.

Logo kuralları:
- Sembolün etrafında en az sembol genişliğinin %20’si kadar boşluk bırak.
- Sembolü yatay/dikey esnetme; çizgileri ve oranları değiştirme.
- Sembolü karmaşık fotoğraf üstüne doğrudan koyma; gerekirse düz zemin kullan.
- Parıltı, 3D, ağır gölge veya birden fazla gradyan kullanma.
- Küçük boyutlarda wordmark yerine sembolü kullan.

## 4. Renk sistemi

Mevcut koyu arayüz ve yeşil vurgu yaklaşımı korunup daha dengeli, erişilebilir ve ölçeklenebilir hâle getirilir. Kırmızı, marka aksanı olmaktan çıkarılarak yalnızca tehlike/hata durumlarına ayrılır.

| Token | HEX | Kullanım |
|---|---|---|
| Pitch / Primary | `#16A34A` | Ana CTA, aktif durum, olumlu vurgu |
| Pitch Bright | `#22C55E` | Grafik vurgusu, küçük parıltısız vurgu |
| Pitch Deep | `#166534` | Hover/aktif koyu yeşil |
| Night | `#070B09` | Ana koyu arka plan |
| Surface | `#111814` | Kart ve panel yüzeyi |
| Surface Raised | `#18211B` | Açılır panel, seçili kart |
| Line | `#29352D` | Kenarlık ve ayraç |
| Text Primary | `#F5F7F5` | Ana metin |
| Text Muted | `#A5B2A8` | İkincil metin |
| White | `#FFFFFF` | Açık yüzeyde metin veya ters logo |
| Danger | `#EF4444` | Hata, silme, kritik uyarı |
| Warning | `#F59E0B` | Bekleyen durum ve dikkat |
| Info | `#60A5FA` | Bilgilendirme, bağlantı ve nötr durum |

### Kullanım oranı
- %70 koyu/nötr yüzeyler
- %20 içerik yüzeyleri ve çizgiler
- %10 yeşil ve durum vurguları

**Erişilebilirlik:** Yeşil zemin üzerinde beyaz metin kullanıldığında her boyutta kontrast kontrolü yapılmalı; küçük metinlerde gerekirse Pitch Deep kullanılmalı. Renk, tek başına durum anlatmamalı; metin ve ikonla desteklenmelidir.

### CSS token önerisi
```css
:root {
  color-scheme: dark;
  --color-bg: #070B09;
  --color-surface: #111814;
  --color-surface-raised: #18211B;
  --color-border: #29352D;
  --color-text: #F5F7F5;
  --color-text-muted: #A5B2A8;
  --color-primary: #16A34A;
  --color-primary-hover: #15803D;
  --color-primary-soft: rgb(34 197 94 / 14%);
  --color-success: #22C55E;
  --color-danger: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #60A5FA;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  --shadow-card: 0 8px 24px rgb(0 0 0 / 18%);
  --focus-ring: 0 0 0 3px rgb(34 197 94 / 28%);
}
```

## 5. Tipografi

**Önerilen aile:** Inter. Sistem alternatifi: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Inter mevcut CSS’te zaten kullanıldığı için marka devamlılığı sağlar; self-host edilirse performans ve veri minimizasyonu açısından faydalı olur.

| Stil | Öneri | Kullanım |
|---|---|---|
| Display | 32–40 px / 700–800 | Sayfa başlığı, şampiyonluk anı |
| H1 | 28–32 px / 700 | Ana sayfa başlığı |
| H2 | 22–26 px / 700 | Sayfa bölümleri |
| H3 | 18–20 px / 650 | Kart ve modül başlıkları |
| Body | 14–16 px / 400–500 | Gövde metni |
| Label | 12–13 px / 500–600 | Alan etiketi, yardımcı bilgi |
| Stat | 24–36 px / 700–800 | Gol, asist, puan, sıra |
| Tabular numbers | tabular-nums | Skor, puan tablosu, metrikler |

- Başlıklar kısa ve güçlü olsun; tüm metinleri büyük harfle yazma.
- Tablo ve metriklerde rakam hizasını korumak için `font-variant-numeric: tabular-nums` kullan.
- Uzun açıklamalarda 55–75 karakter satır uzunluğunu hedefle.

## 6. Fotoğraf, illüstrasyon ve grafik dili

- Gerçekçi, arkadaş grubu ve amatör futbol atmosferi taşıyan görüntüler tercih edilir.
- Yapay “dev stadyum/elit profesyonel takım” hissi yerine sentetik çim, saha ışıkları, yelekler, top ve maç önü/sonu anları öne çıkar.
- Görseller yüksek kontrastlı ve okunaklı arayüzün arka planını bastırmayacak şekilde kullanılmalı.
- İstatistik grafikleri sade çizgiler, az renk ve net eksen etiketleriyle sunulmalı.
- Saha taktik tahtasında çizgi renkleri görünür olmalı; oyuncu ayrımı yalnızca renkle değil, takım etiketi veya forma işaretiyle de yapılmalı.
- Stok görsel kullanılıyorsa lisans ve kullanım hakkı doğrulanmalı.

## 7. İkonografi

- Mevcut `lucide-react` ikon kütüphanesiyle tutarlı, sade çizgisel ikonlar kullanılmalı.
- Varsayılan ikon boyutu 18–20 px; navigasyonda 20 px, yoğun veri tablolarında 16 px.
- Aynı bağlamda dolu ve çizgisel ikon stilleri karıştırılmamalı.
- Gol, asist, kurtarış, kart, takvim, kadro, taktik, kupa ve sıralama için anlaşılır ikonlar seçilmeli.
- İkonlar buton metninin yerini almamalı; yalnızca evrensel ve iyi bilinen eylemlerde metinsiz kullanılmalı.

## 8. UI bileşen ilkeleri

### Kartlar
- Zemin `Surface`, kenarlık `Line`, köşe `14px`.
- Hover hareketi en fazla 1–2 px; gereksiz sürekli animasyon yok.
- Kart içeriği öncelik sırasına göre: başlık → ana metrik → açıklayıcı bağlam → eylem.

### Butonlar
- **Primary:** Yeşil zemin, yüksek öncelikli tek eylem.
- **Secondary:** Şeffaf/koyu yüzey ve kenarlık.
- **Danger:** Yalnızca silme veya geri alınması zor işlemlerde.
- En az 44×44 px etkileşim alanı hedeflenmeli.
- Disabled, loading ve focus durumları ayrıca tasarlanmalı.

### Formlar
- Etiketler alanın üzerinde kalır; placeholder etiket yerine geçmez.
- Hata mesajı alanın yakınında, ne yapılacağını söyleyen bir cümleyle görünür.
- Odak halkası klavye ile gezinirken görünür olmalı.
- Tarih, skor, oyuncu ve takım alanlarında mobil giriş kolaylığı öncelikli olmalı.

### Tablolar ve istatistikler
- Skor ve temel metrikler görsel hiyerarşinin en üstünde yer alır.
- Sıralamada sıra, oyuncu adı ve metrik değerleri dar ekranda da korunur.
- Sıralama değişimleri renk yanında ok/etiketle anlatılır.
- Maç kayıtlarında durum etiketleri: Planlandı, Tamamlandı, İptal edildi.

### Durum renkleri
- Başarı/tamamlandı: Success
- Hata/iptal/kritik: Danger
- Bekliyor/dikkat: Warning
- Bilgi/nötr: Info veya nötr yüzey
- Renkleri skor üstünlüğünü ahlaki değer gibi gösterecek şekilde kullanma.

## 9. Ses tonu ve mikro metin

### Ses tonu
Samimi, canlı ve futbola yakın; asla küçümseyici, saldırgan veya profesyonel kulüp jargonuyla aşırı dolu değil.

**Tercih et**
- “Maçını ekle”
- “Kadroyu oluştur”
- “İstatistikleri kaydet”
- “Sezon sıralaması”
- “Katılma isteği gönder”
- “Harika maç! İstatistiklerin güncellendi.”

**Kaçın**
- Belirsiz “Gönder” (hangi işlemin gönderildiği belli değilse)
- Hata mesajlarında suçlayıcı “Yanlış yaptın”
- Gereksiz İngilizce terimler
- Her ekranda ünlem ve aşırı iddialı vaatler

### Hazır metin örnekleri
- Boş maç listesi: **Henüz maç yok. İlk maçınızı ekleyerek ligi başlatın.**
- Boş istatistik: **Bu sezon için henüz istatistik oluşmadı.**
- Başarılı kayıt: **Maç kaydedildi. İstatistikler güncellendi.**
- Bağlantı hatası: **Şu anda kaydedemedik. Bağlantını kontrol edip tekrar dene.**
- Katılma isteği: **İsteğin grup yöneticilerine gönderildi.**
- Silme onayı: **Bu kayıt silinecek. Bu işlem geri alınamayabilir. Devam etmek istiyor musun?**

## 10. Erişilebilirlik ve hareket

- WCAG AA kontrastı hedeflenmeli; normal metinde en az 4.5:1, büyük metinde 3:1.
- Her etkileşim klavye ile kullanılabilir; odak sırası mantıklı olmalı.
- Form alanlarının erişilebilir adı olmalı; ikon düğmelerinde `aria-label` bulunmalı.
- Durumlar renk dışında metin/ikonla da belirtilmeli.
- `prefers-reduced-motion` ayarı desteklenmeli.
- Grafikler, renklerin yanı sıra etiket ve mümkünse tablo alternatifi sağlamalı.
- Mobilde yatay taşma ve 320 px genişlikte temel görevlerin tamamlanması test edilmeli.

## 11. Marka uygulamaları

### Web uygulaması
- Üst çubukta sembol + HaliSaha wordmark.
- Ana eylem “Maç ekle” yeşil primary buton.
- Koyu arka plan üzerinde kartları net katmanlarla ayır.
- Ana sayfada yaklaşan/son maçlar ve sezon özeti öne çıkar.

### Oyuncu kartı
- Oyuncu adı ve grup/sezon bilgisi
- Gol, asist, maç sayısı ve puan
- Gerekliyse kaleci kurtarışları
- Kartı sosyal paylaşımda okunacak basit hiyerarşiyle tasarla.

### Sosyal medya / Open Graph
- Yatay 1200×630 px format.
- Sembol ve ürün adı sol üstte; slogan ve tek ana mesaj; saha çizgisi teması.
- Çok küçük metin ve karmaşık istatistik panoları kullanılmamalı.
- Açık/kapalı görsel varyantları hazırlanmalı.

### Favicon
- Sadece saha sembolü.
- 16×16, 32×32 ve 180×180 boyutlarda test.
- Koyu zeminde yeşil sembol; açık zeminde koyu sembol varyantı.

## 12. Ürün içi tasarım ilkeleri

1. **Maç gününde hızlı:** Maç ekleme ve istatistik girişi mümkün olduğunca az adımla tamamlanmalı.
2. **Veri güvenilirliği:** İstatistik değişikliği ve maç onayı açıkça anlatılmalı.
3. **Grup odaklı:** Grup, sezon ve maç ilişkileri arayüzde görünür olmalı.
4. **Rekabet keyifli kalsın:** Liderlik tabloları motive edici olmalı; oyuncuları aşağılayan dil kullanılmamalı.
5. **Önce mobil:** Saha kenarında tek elle kullanım ve okunabilirlik kritik.
6. **Gerektiğinde açıklama:** Misafir oyuncu, davet, katılma isteği ve sezon durumları net anlatılmalı.

## 13. Dosya ve kod organizasyonu önerisi

Önerilen marka dosyaları:
```text
docs/brand/
  brand-book.md
  assets/
    logo.svg
    logo-mark.svg
    logo-mono.svg
    og-template.svg
```

CSS token'larını tek kaynaktan yönet; bileşenlerde sabit renkleri tekrarlama. Yeni tasarım uygulanırken mevcut mobil düzen ve form kullanılabilirliği korunmalı.

## 14. Kapsam dışı ve karar notları

- Bu doküman marka yönü ve tasarım sistemi önerir; mevcut uygulama ekranlarının tamamını yeniden tasarlamaz.
- Logo için tarif edilen geometri bir yön tarifidir; nihai SVG çizimi ve farklı boyut testleri ayrı tasarım/uygulama adımıdır.
- Mevcut `og-banner.png` dosyası görülmeden marka ile uyumu hakkında kesin hüküm verilmemiştir.
- Yayına geçmeden önce ana akışlar, kontrast, mobil ekranlar ve gerçek veri uzunlukları üzerinde doğrulama yapılmalıdır.

---
**HaliSaha · Maç biter, rekabet devam eder.**
