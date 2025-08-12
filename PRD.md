# Tekinler İş Yeri Yönetim Uygulaması - PRD (Product Requirements Document)

## Proje Genel Bakış

**Proje Adı:** Tekinler İş Yeri Yönetim Sistemi
**Versiyon:** 1.0
**Tarih:** 2025
**Hedef Kullanıcılar:** 3-4 kullanıcı (iş yeri sahibi ve çalışanları)
**Platformlar:** Web (Masaüstü), iOS (Mobil - Planlanan)

## Proje Amacı

İş yerinde stok takibi, envanter yönetimi, satış işlemleri, müşteri yönetimi ve barkod sistemi entegrasyonu ile kapsamlı bir yönetim sistemi oluşturmak. Sistem, web platformundan erişilebilir olacak ve gelecekte mobil platform desteği ile gerçek zamanlı veri senkronizasyonu sağlayacaktır.

## Hedef Kullanıcılar

- **İş Yeri Sahibi ve Çalışanları:** Tüm kullanıcılar başlangıçta aynı yetkilere sahip olacaktır.
- **Kullanıcı Sayısı:** 3-4 kullanıcı.
- **Erişim:** Web platformundan tam erişim. Mobil erişim planlanmaktadır.

## Sistem Mimarisi

### Teknoloji Stack
- **Backend:** Node.js, Express.js
- **Frontend (Web):** React.js, JavaScript
- **Mobile (iOS):** React Native (Planlanan)
- **Veritabanı:** SQLite
- **Barkod Desteği:** JsBarcode, ZXing
- **Authentication:** JWT (JSON Web Token)
- **Real-time:** Socket.io (Planlanan)
- **Cloud:** AWS/Azure (Deployment için planlanan)

## Temel Özellikler

### 1. Kullanıcı Yönetimi ve Güvenlik
- [x] Kullanıcı kayıt ve giriş sistemi
- [x] Basit kullanıcı yönetimi (tüm kullanıcılar için eşit yetki)
- [x] Oturum yönetimi (JWT tabanlı)
- [ ] Şifre sıfırlama
- [ ] İki faktörlü doğrulama (Opsiyonel)

### 2. Stok ve Envanter Yönetimi
- [x] Ürün ekleme, düzenleme ve silme
- [x] Kategori yönetimi
- [x] Stok miktarı takibi
- [x] Stok giriş ve çıkış işlemleri
- [x] Ürün arama ve filtreleme
- [x] Stok raporları (Temel)
- [x] Minimum stok uyarıları
- [ ] Toplu ürün import/export (Excel, CSV)

### 3. Barkod Sistemi
- [x] Barkod oluşturma (QR, Code128, EAN13)
- [x] Barkod okuma (Web kamerası ile)
- [x] Barkod ile hızlı ürün arama
- [x] Barkod yazdırma desteği
- [ ] Toplu barkod oluşturma

### 4. Satış Yönetimi (POS)
- [x] Yeni satış oluşturma arayüzü (POS)
- [x] Sepet yönetimi
- [x] Fiyat hesaplama (KDV dahil)
- [x] İndirim uygulama
- [x] Ödeme alma (Nakit, Kredi Kartı, Havale)
- [x] Satış geçmişi ve takibi
- [ ] Fatura oluşturma ve yazdırma
- [ ] Günlük ve aylık satış raporları

### 5. Müşteri Yönetimi
- [x] Müşteri kayıt, düzenleme ve silme
- [x] Müşteri arama ve listeleme
- [x] Müşteri işlem geçmişi (satışlar, ödemeler)
- [x] Müşteri bakiye takibi
- [x] Müşteriye özel notlar ekleme
- [x] Müşteri raporları (Temel)
- [ ] Müşteri kategorileri veya grupları

### 6. Tedarikçi Yönetimi (Planlanan)
- [ ] Tedarikçi kayıt ve düzenleme
- [ ] Tedarikçiye göre ürün listesi
- [ ] Tedarikçi sipariş yönetimi
- [ ] Tedarikçi performans takibi

### 7. Raporlama ve Analiz
- [x] Stok raporları
- [x] Müşteri raporları
- [ ] Detaylı satış raporları
- [ ] Kâr/zarar analizi
- [ ] En çok satan ürünler raporu
- [ ] Grafiksel dashboard ve analizler
- [ ] Raporları Excel/PDF formatında export etme

### 8. Bildirimler ve Uyarılar
- [x] Düşük stok uyarıları (Arayüzde)
- [ ] Anlık satış bildirimleri (Real-time)
- [ ] Sistem içi genel uyarılar
- [ ] Email veya SMS ile bildirim (Opsiyonel)

## Platform Özellikleri

### Web Uygulaması
- [x] Responsive tasarım (Mobil ve masaüstü uyumlu)
- [x] Yazdırma desteği (Barkod, Raporlar)
- [ ] Gelişmiş dashboard ve veri görselleştirme
- [ ] Detaylı raporlama arayüzleri
- [ ] Toplu işlem yetenekleri (Stok, Müşteri)
- [ ] Klavye kısayolları ile hızlı kullanım

### iOS Uygulaması (Planlanan)
- [ ] Barkod tarama için kamera entegrasyonu
- [ ] Hızlı satış ve stok kontrolü
- [ ] Anlık (Push) bildirimler
- [ ] Çevrimdışı (Offline) çalışma modu
- [ ] Temel raporlara erişim

## Veri Senkronizasyonu (Planlanan)
- [ ] Web ve mobil arasında gerçek zamanlı veri güncelleme
- [ ] Mobil için çevrimdışı veri saklama ve senkronizasyon
- [ ] Veri çakışmalarını önleme mekanizması
- [ ] Otomatik veritabanı yedekleme
- [ ] Veri import/export araçları

## Güvenlik
- [x] SSL/TLS şifreleme (Deployment sonrası)
- [x] API güvenliği (Yetkilendirme ve Veri Doğrulama)
- [x] Veri şifreleme (Kullanıcı parolaları için bcrypt)
- [x] Temel log yönetimi
- [ ] Detaylı yedekleme stratejisi

## Performans Gereksinimleri
- [x] Sayfa yükleme süresi < 3 saniye
- [x] API yanıt süresi < 1 saniye
- [x] Eşzamanlı 10 kullanıcı desteği
- [ ] %99.9 çalışma süresi (Uptime)
- [ ] Mobil veri kullanımı için optimizasyon (Mobil uygulama için)

## UI/UX Gereksinimleri
- [x] Modern ve kullanıcı dostu arayüz
- [x] Kolay ve anlaşılır kullanım akışı
- [x] Türkçe dil desteği
- [x] Mobil uyumlu (Mobile-first) yaklaşım
- [ ] Açık/Koyu tema seçeneği
- [ ] Erişilebilirlik standartlarına uyum

## Proje Yol Haritası

### Faz 1: Temel Altyapı (Tamamlandı)
- [x] Proje kurulumu ve yapılandırma
- [x] Veritabanı şeması ve modellerin oluşturulması
- [x] Backend API geliştirme (Node.js, Express)
- [x] Kullanıcı yönetimi ve JWT tabanlı kimlik doğrulama

### Faz 2: Stok ve Ürün Yönetimi (Tamamlandı)
- [x] Ürün ve kategori yönetimi için CRUD işlemleri
- [x] Stok takibi ve hareketleri
- [x] Barkod sistemi entegrasyonu (Oluşturma, Okuma)
- [x] İlgili web arayüzlerinin geliştirilmesi

### Faz 3: Satış ve Müşteri Yönetimi (Tamamlandı)
- [x] POS (Satış Noktası) sistemi ve sepet yönetimi
- [x] Müşteri yönetimi için CRUD işlemleri
- [x] Müşteri bakiye ve işlem takibi
- [x] Satış sonrası stok güncellemesi

### Faz 4: Mobil Uygulama (Planlanan)
- [ ] React Native ile iOS uygulaması geliştirme
- [ ] Kamera ile barkod tarama özelliği
- [ ] Çevrimdışı çalışma ve anlık bildirimler

### Faz 5: Raporlama ve Optimizasyon (Planlanan)
- [ ] Gelişmiş raporlama sistemi ve arayüzler
- [ ] Veri görselleştirmeleri için dashboard geliştirme
- [ ] Performans optimizasyonu ve veritabanı iyileştirmeleri
- [ ] Kapsamlı testler ve hata düzeltmeleri

### Faz 6: Deployment ve Yayın (Planlanan)
- [ ] Sunucu üzerinde production ortamının kurulması
- [ ] App Store için yayın sürecinin başlatılması
- [ ] Teknik dokümantasyon ve kullanıcı kılavuzlarının hazırlanması

## Test Stratejisi
- [x] Unit testler (Mevcut, genişletilecek)
- [ ] Integration testler
- [ ] UI (Arayüz) testleri
- [ ] Performans ve yük testleri
- [ ] Güvenlik testleri
- [ ] Kullanıcı kabul testleri

## Dokümantasyon
- [x] API dokümantasyonu (README.md içinde temel düzeyde)
- [x] Teknik mimari dokümanı (ARCHITECTURE.md)
- [ ] Detaylı kullanıcı kılavuzu
- [ ] Deployment kılavuzu
