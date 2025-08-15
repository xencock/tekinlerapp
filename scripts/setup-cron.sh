#!/bin/bash

# Otomatik veritabanı bakım için cron job kurulum script'i
# Bu script günlük backup ve haftalık bakım için cron job'lar oluşturur

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Tekinler App Veritabanı Bakım Cron Job Kurulumu"
echo "=================================================="
echo ""

# Cron job'ları oluştur
echo "📅 Cron job'lar oluşturuluyor..."

# Günlük backup (her gün saat 02:00'da)
(crontab -l 2>/dev/null; echo "0 2 * * * cd $PROJECT_DIR && npm run db:backup >> logs/cron-backup.log 2>&1") | crontab -

# Haftalık tam bakım (her Pazar saat 03:00'da)
(crontab -l 2>/dev/null; echo "0 3 * * 0 cd $PROJECT_DIR && npm run db:maintenance >> logs/cron-maintenance.log 2>&1") | crontab -

# Günlük integrity check (her gün saat 01:00'da)
(crontab -l 2>/dev/null; echo "0 1 * * * cd $PROJECT_DIR && npm run db:check >> logs/cron-check.log 2>&1") | crontab -

echo "✅ Cron job'lar başarıyla oluşturuldu!"
echo ""

# Mevcut cron job'ları göster
echo "📋 Mevcut Cron Job'lar:"
crontab -l
echo ""

# Log dosyaları için dizin oluştur
mkdir -p "$PROJECT_DIR/logs"
touch "$PROJECT_DIR/logs/cron-backup.log"
touch "$PROJECT_DIR/logs/cron-maintenance.log"
touch "$PROJECT_DIR/logs/cron-check.log"

echo "📁 Log dosyaları oluşturuldu:"
echo "  - logs/cron-backup.log"
echo "  - logs/cron-maintenance.log"
echo "  - logs/cron-check.log"
echo ""

# Cron job'ları test et
echo "🧪 Cron job'ları test ediliyor..."
echo "Günlük backup test:"
cd "$PROJECT_DIR" && npm run db:backup

echo ""
echo "Haftalık bakım test:"
cd "$PROJECT_DIR" && npm run db:maintenance

echo ""
echo "Integrity check test:"
cd "$PROJECT_DIR" && npm run db:check

echo ""
echo "🎉 Kurulum tamamlandı!"
echo ""
echo "📝 Cron job'lar şu şekilde çalışacak:"
echo "  - Her gün 01:00: Veritabanı integrity kontrolü"
echo "  - Her gün 02:00: Otomatik backup"
echo "  - Her Pazar 03:00: Tam bakım (integrity + backup + WAL temizleme)"
echo ""
echo "📊 Log dosyalarını takip etmek için:"
echo "  tail -f logs/cron-backup.log"
echo "  tail -f logs/cron-maintenance.log"
echo "  tail -f logs/cron-check.log"
echo ""
echo "🔄 Cron job'ları kaldırmak için: crontab -e"
