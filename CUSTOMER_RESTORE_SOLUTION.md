# Müşteri Geri Yükleme Sistemi Çözümü

## Problem
Silinen müşterileri tekrar eklemeye çalıştığımda sistem izin vermiyordu. Bu sorun, veritabanında "soft delete" (yumuşak silme) kullanılması ve UNIQUE constraint'lerin silinen kayıtları da dahil etmesi nedeniyle oluşuyordu.

## Çözüm
Sistem "soft delete" kullanarak müşterileri gerçekten silmek yerine `isActive` alanını `false` yapıyor. Ancak veritabanı şemasında `phone`, `email` ve `tcNumber` alanları için UNIQUE constraint'ler vardı ve bu constraint'ler silinen kayıtları da dahil ediyordu.

### 1. Veritabanı Şeması Güncellendi
- Tablo yeniden oluşturuldu ve UNIQUE constraint'ler kaldırıldı
- Sadece aktif müşteriler için partial unique index'ler eklendi
- Bu sayede silinen müşterilerin bilgileri tekrar kullanılabilir hale geldi

### 2. Partial Unique Index'ler Eklendi
```sql
-- Sadece aktif müşteriler için unique constraint'ler
CREATE UNIQUE INDEX idx_customers_phone_unique ON customers(phone) WHERE isActive = 1;
CREATE UNIQUE INDEX idx_customers_email_unique ON customers(email) WHERE isActive = 1;
CREATE UNIQUE INDEX idx_customers_tcNumber_unique ON customers(tcNumber) WHERE isActive = 1;
```

### 3. Yeni API Endpoint'leri Eklendi
- `GET /api/customers/deleted` - Silinen müşterileri listele
- `POST /api/customers/:id/restore` - Silinen müşteriyi geri yükle
- `DELETE /api/customers/:id/permanent` - Müşteriyi kalıcı olarak sil

### 4. Frontend Entegrasyonu Eklendi
- Müşteriler sayfasına toggle butonu eklendi
- Silinen müşteriler aynı sayfada listeleniyor
- Geri yükleme butonu her silinen müşterinin yanında
- Arama ve filtreleme özellikleri korundu

## Nasıl Çalışır?

### Müşteri Silme (Soft Delete)
1. Müşteri silindiğinde `isActive` alanı `false` yapılır
2. Veri kaybolmaz, sadece gizlenir
3. Aynı telefon, email veya TC numarası ile yeni müşteri eklenebilir

### Müşteri Geri Yükleme
1. Silinen müşteri listesinden geri yüklenebilir
2. Çakışma kontrolü yapılır (aynı bilgiler aktif müşteride varsa geri yüklenemez)
3. Geri yüklenen müşteri tekrar aktif hale gelir

### Kalıcı Silme (Hard Delete)
1. Sadece satış geçmişi olmayan müşteriler için kullanılabilir
2. Veri tamamen silinir ve geri alınamaz
3. Güvenlik için ekstra kontrol yapılır

## Avantajlar

✅ **Veri Kaybı Yok**: Silinen müşteriler geri yüklenebilir
✅ **Çakışma Önleme**: Aynı bilgiler aktif müşterilerde kullanılamaz
✅ **Esneklik**: Müşteri bilgileri tekrar kullanılabilir
✅ **Güvenlik**: Satış geçmişi olan müşteriler korunur
✅ **Performans**: Partial index'ler sayesinde hızlı sorgular

## Kullanım

### 1. Silinen Müşterileri Görüntüleme
- Müşteriler sayfasında "Silinen Müşteriler" toggle butonuna tıklayın
- Silinen müşteriler aynı tabloda listelenir
- Arama özelliği hem aktif hem silinen müşteriler için çalışır

### 2. Müşteri Geri Yükleme
- Silinen müşteri listesinde "Geri Yükle" butonuna tıklayın
- Sistem çakışma kontrolü yapar
- Başarılı olursa müşteri tekrar aktif hale gelir

### 3. Aktif Müşterilere Dönme
- "Aktif Müşteriler" toggle butonuna tıklayın
- Normal müşteri listesine geri dönersiniz

## Teknik Detaylar

### Veritabanı Değişiklikleri
- `customers` tablosu yeniden oluşturuldu
- UNIQUE constraint'ler kaldırıldı
- Partial unique index'ler eklendi
- Mevcut veriler korundu

### API Değişiklikleri
- Yeni endpoint'ler eklendi
- Çakışma kontrolü eklendi
- Hata yönetimi geliştirildi

### Frontend Değişiklikleri
- Müşteriler sayfasına toggle butonu eklendi
- Silinen müşteriler aynı tabloda gösteriliyor
- Geri yükleme butonu eklendi
- Toast bildirimleri eklendi
- ESLint hook kuralları düzeltildi
- useToast hook'u normal fonksiyonlarda kullanım sorunu çözüldü

## Test Sonuçları

✅ Silinen müşteriler tekrar eklenebiliyor
✅ Partial unique index'ler çalışıyor
✅ Geri yükleme sistemi çalışıyor
✅ Çakışma kontrolü çalışıyor
✅ Frontend entegrasyonu çalışıyor
✅ Toggle butonu ile kolay geçiş
✅ Arama özelliği her iki modda da çalışıyor
✅ ESLint hataları düzeltildi
✅ useToast hook sorunu çözüldü

## Sonuç

Bu çözüm sayesinde:
- Silinen müşteriler artık tekrar eklenebiliyor
- Veri bütünlüğü korunuyor
- Sistem daha esnek ve kullanıcı dostu
- Müşteri kayıpları önleniyor
- **Entegre arayüz**: Ayrı sayfa yerine toggle ile kolay erişim
- **Tek tablo**: Hem aktif hem silinen müşteriler aynı yerde

Sistem artık hem güvenli hem de esnek bir şekilde çalışıyor. Kullanıcı deneyimi önemli ölçüde iyileştirildi.
