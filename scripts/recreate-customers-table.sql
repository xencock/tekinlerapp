-- Müşteri tablosunu UNIQUE constraint'ler olmadan yeniden oluşturan script
-- Bu script silinen müşterilerin tekrar eklenebilmesini sağlar

-- 1. Mevcut veriyi yedekle
CREATE TABLE customers_backup AS SELECT * FROM customers;

-- 2. Mevcut tabloyu sil
DROP TABLE customers;

-- 3. Yeni tabloyu UNIQUE constraint'ler olmadan oluştur
CREATE TABLE `customers` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `firstName` VARCHAR(50) NOT NULL,
  `lastName` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(15),
  `email` VARCHAR(100),
  `tcNumber` VARCHAR(11),
  `address` TEXT,
  `city` VARCHAR(50),
  `district` VARCHAR(50),
  `postalCode` VARCHAR(10),
  `preferredColors` JSON,
  `preferredBrands` JSON,
  `balance` DECIMAL(10,2) DEFAULT 0,
  `totalPurchases` DECIMAL(10,2) DEFAULT 0,
  `totalOrders` INTEGER DEFAULT 0,
  `smsPermission` TINYINT(1) DEFAULT 1,
  `emailPermission` TINYINT(1) DEFAULT 1,
  `notes` TEXT,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdBy` INTEGER REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  `updatedBy` INTEGER REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

-- 4. Veriyi geri yükle
INSERT INTO customers SELECT * FROM customers_backup;

-- 5. Yedek tabloyu sil
DROP TABLE customers_backup;

-- 6. Index'leri yeniden oluştur
CREATE INDEX `customers_is_active` ON `customers` (`isActive`);
CREATE INDEX `customers_first_name` ON `customers` (`firstName`);
CREATE INDEX `customers_last_name` ON `customers` (`lastName`);
CREATE INDEX `customers_created_at` ON `customers` (`createdAt`);
CREATE INDEX `customers_is_active_created_at` ON `customers` (`isActive`, `createdAt`);
CREATE INDEX idx_customers_firstName ON customers(firstName);
CREATE INDEX idx_customers_lastName ON customers(lastName);
CREATE INDEX idx_customers_createdAt ON customers(createdAt);
CREATE INDEX idx_customers_isActive_createdAt ON customers(isActive, createdAt);

-- 7. Sadece aktif müşteriler için unique constraint'ler ekle (partial index)
CREATE UNIQUE INDEX idx_customers_phone_unique ON customers(phone) WHERE isActive = 1;
CREATE UNIQUE INDEX idx_customers_email_unique ON customers(email) WHERE isActive = 1;
CREATE UNIQUE INDEX idx_customers_tcNumber_unique ON customers(tcNumber) WHERE isActive = 1;

-- 8. Performans için genel index'ler ekle
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tcNumber ON customers(tcNumber);

-- 9. Tablo yapısını kontrol et
PRAGMA table_info(customers);
PRAGMA index_list(customers);
