-- Müşteri tablosundaki unique constraint'leri kaldırıp partial index'ler ekleyen script
-- Bu script silinen müşterilerin tekrar eklenebilmesini sağlar

-- 1. Mevcut unique constraint'leri kaldır
DROP INDEX IF EXISTS customers_phone;
DROP INDEX IF EXISTS customers_email;
DROP INDEX IF EXISTS customers_tc_number;

-- 2. Sadece aktif müşteriler için unique constraint'ler ekle (partial index)
CREATE UNIQUE INDEX idx_customers_phone_unique ON customers(phone) WHERE isActive = 1;
CREATE UNIQUE INDEX idx_customers_email_unique ON customers(email) WHERE isActive = 1;
CREATE UNIQUE INDEX idx_customers_tcNumber_unique ON customers(tcNumber) WHERE isActive = 1;

-- 3. Performans için genel index'ler ekle
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tcNumber ON customers(tcNumber);

-- 4. Mevcut index'leri koru
-- customers_is_active, customers_first_name, customers_last_name, customers_created_at, customers_is_active_created_at
-- idx_customers_firstName, idx_customers_lastName, idx_customers_createdAt, idx_customers_isActive_createdAt

PRAGMA index_list(customers);
