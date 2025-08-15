-- 2 Fiyat Sistemi Migration Script
-- Bu script Products tablosuna cashPrice ve creditPrice alanlarını ekler

-- 1. Mevcut retailPrice alanını cashPrice olarak yeniden adlandır
ALTER TABLE Products RENAME COLUMN retailPrice TO cashPrice;

-- 2. Yeni creditPrice alanını ekle
ALTER TABLE Products ADD COLUMN creditPrice DECIMAL(10,2) DEFAULT 0.00;

-- 3. Mevcut cashPrice değerlerini creditPrice'a da kopyala (geçici olarak)
UPDATE Products SET creditPrice = cashPrice WHERE creditPrice IS NULL OR creditPrice = 0;

-- 4. creditPrice için index ekle
CREATE INDEX idx_products_credit_price ON Products(creditPrice);

-- 5. Değişiklikleri kontrol et
SELECT id, name, cashPrice, creditPrice FROM Products LIMIT 10;
