# Tekinler İş Yeri Yönetim Sistemi

Bu proje, Tekinler iş yeri için geliştirilmiş kapsamlı bir stok takip, envanter ve müşteri yönetim sistemidir. Proje, bir Node.js backend ve React.js frontend uygulamasından oluşmaktadır.

## Proje Genel Bakış

Bu sistem, küçük ve orta ölçekli işletmelerin temel operasyonel ihtiyaçlarını karşılamak üzere tasarlanmıştır. Aşağıdaki ana modülleri içerir:
- **Stok ve Ürün Yönetimi:** Ürünleri, kategorileri ve stok seviyelerini yönetin.
- **Satış Yönetimi (POS):** Hızlı ve kolay bir şekilde satış işlemleri gerçekleştirin.
- **Müşteri Yönetimi:** Müşteri bilgilerini ve işlem geçmişini takip edin.
- **Barkod Sistemi:** Ürünler için barkod oluşturun, okutun ve yazdırın.
- **Kullanıcı Yönetimi:** Sisteme erişecek kullanıcıları yönetin.

## Teknoloji Stack'i

- **Backend:** Node.js, Express.js
- **Frontend:** React.js, Tailwind CSS
- **Veritabanı:** SQLite
- **Kimlik Doğrulama:** JSON Web Tokens (JWT)
- **ORM:** Sequelize

## Mevcut Özellikler

- **Kullanıcı Yönetimi:** Güvenli kullanıcı kaydı, girişi ve yetkilendirme.
- **Ürün Yönetimi:** Ürün ekleme, silme, düzenleme ve kategorize etme.
- **Stok Takibi:** Gerçek zamanlı stok seviyeleri, düşük stok uyarıları.
- **Barkod Entegrasyonu:** JsBarcode ile barkod oluşturma ve yazdırma, web kamera ile barkod okuma.
- **Satış Noktası (POS):** Modern ve kullanıcı dostu satış arayüzü, sepet yönetimi.
- **Müşteri Yönetimi:** Müşteri kayıtları, bakiye takibi ve işlem geçmişi.
- **Raporlama:** Temel satış, stok ve müşteri raporları.
- **Güvenlik:** Gerekli güvenlik önlemleri (CORS, Helmet, parola şifreleme).

## Kurulum ve Başlatma

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm (Node Package Manager)

### Kurulum Adımları

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/xencock/tekinlerapp.git
    cd tekinlerapp
    ```

2.  **Backend Bağımlılıklarını Yükleyin:**
    ```bash
    npm install
    ```

3.  **Frontend Bağımlılıklarını Yükleyin:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

4.  **Environment Dosyasını Yapılandırın:**
    `.env.example` dosyasını kopyalayarak `.env` adında yeni bir dosya oluşturun ve içeriğini projenize göre düzenleyin.
    ```bash
    cp env.example .env
    ```
    `.env` dosyasındaki temel ayarlar:
    ```env
    PORT=5000
    DB_PATH=./database.sqlite
    JWT_SECRET=your-super-secret-jwt-key
    CORS_ORIGIN=http://localhost:3000
    ```

5.  **Veritabanını Hazırlayın:**
    Aşağıdaki komut, veritabanı tablolarını oluşturur ve başlangıç verilerini (admin kullanıcısı, kategoriler) ekler.
    ```bash
    npm run setup
    ```

6.  **Uygulamayı Başlatın:**
    Bu komut hem backend sunucusunu hem de frontend geliştirme sunucusunu aynı anda başlatır.
    ```bash
    npm run dev
    ```
    - Backend API `http://localhost:5000` adresinde çalışacaktır.
    - Frontend uygulaması `http://localhost:3000` adresinde açılacaktır.

## Proje Yapısı

```
/
├── config/          # Veritabanı ve diğer yapılandırma dosyaları
├── frontend/        # React.js frontend uygulaması
├── middleware/      # Express middleware'leri (auth, validation)
├── models/          # Sequelize veritabanı modelleri
├── routes/          # API endpoint yönlendirmeleri
├── scripts/         # Kurulum ve başlangıç scriptleri
├── utils/           # Yardımcı fonksiyonlar (logger, response)
├── server.js        # Ana backend sunucu dosyası
├── database.sqlite  # SQLite veritabanı dosyası
├── package.json     # Proje bağımlılıkları ve scriptleri
└── README.md        # Bu doküman
```

## API Endpoint'leri

Tüm API endpoint'leri `/api` ön eki ile başlar. Örneğin: `/api/users`.

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
- **Users:** `GET /api/users`, `GET /api/users/:id`
- **Products:** `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`
- **Categories:** `GET /api/categories`, `POST /api/categories`
- **Customers:** `GET /api/customers`, `POST /api/customers`
- **Sales:** `POST /api/sales`, `GET /api/sales`
- **Balance:** `POST /api/balance/add`
- **Stock:** `POST /api/stock/add`

Detaylı endpoint bilgileri için `routes/` klasöründeki dosyaları inceleyebilirsiniz.

## Gelecek Planları

- Gelişmiş raporlama ve veri görselleştirme.
- Fatura oluşturma ve yazdırma modülü.
- React Native ile mobil uygulama geliştirme.
- Gerçek zamanlı bildirimler için Socket.io entegrasyonu.
- Kapsamlı testlerin (integration, UI) yazılması.

## Bakım Notu

Bu depo düzenli olarak güncellenmektedir. Son değişiklikler, POS sepetinin sayfa yenilemelerinde korunması ve yazdırma penceresi açılışlarında pop-up engelleyici uyumluluğu üzerine iyileştirmeleri içerir.
