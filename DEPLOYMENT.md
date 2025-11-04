# Secret Chat - Vercel Deployment Guide

## 🚀 Vercel'e Deploy Etme Adımları

### 1. Vercel Hesabı ve Bağlantı
1. [vercel.com](https://vercel.com) adresine git
2. GitHub hesabınla giriş yap
3. "New Project" butonuna tıkla
4. `hasancavitkocak/secretchat` repository'sini seç

### 2. Deployment Ayarları
Vercel otomatik olarak Next.js projesini algılayacak:

**Framework Preset**: Next.js
**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

### 3. Environment Variables (Opsiyonel)
Vercel dashboard'da Environment Variables bölümünde:
```
NODE_ENV=production
```

### 4. Deploy
"Deploy" butonuna tıkla - yaklaşık 2-3 dakika sürecek.

## 🔧 WebSocket Nasıl Çalışacak?

### Development vs Production

**Development (localhost)**:
- Frontend: `http://localhost:3000`
- WebSocket: `ws://localhost:3001` (ayrı server)

**Production (Vercel)**:
- Frontend: `https://your-app.vercel.app`
- WebSocket: `https://your-app.vercel.app/api/socket` (API route)

### Otomatik Geçiş
Kod otomatik olarak environment'ı algılıyor:
```javascript
const socketUrl = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'ws://localhost:3001';
```

## 📱 Vercel'de Çalışacak Özellikler

✅ **Gerçek Zamanlı Eşleşme**: Serverless functions ile
✅ **Canlı Mesajlaşma**: WebSocket API routes
✅ **Arkadaşlık Sistemi**: Anlık bildirimler
✅ **Premium Sistemi**: Tüm kontroller
✅ **Mobile Responsive**: PWA benzeri deneyim
✅ **Global CDN**: Dünya çapında hızlı erişim

## 🌐 Production URL
Deploy sonrası URL'iniz şöyle olacak:
`https://secretchat-[random].vercel.app`

## 🔄 Otomatik Deployment
GitHub'a her push yaptığınızda Vercel otomatik olarak yeniden deploy edecek.

## 🐛 Troubleshooting

**WebSocket Bağlantı Sorunu**:
- Vercel logs'ları kontrol et
- Browser console'da hata var mı bak
- API route'ların çalıştığını kontrol et

**Build Hatası**:
- `npm run build` local'de çalışıyor mu?
- Dependencies eksik mi?
- TypeScript hataları var mı?

## 📊 Vercel Analytics
Deploy sonrası Vercel Analytics'i aktif edebilirsin:
- Real-time kullanıcı sayısı
- Sayfa performansı
- WebSocket bağlantı istatistikleri

## 🎯 Next Steps
1. Custom domain bağla
2. Analytics aktif et
3. Performance monitoring kur
4. Error tracking ekle (Sentry)
5. Database entegrasyonu (Supabase/PlanetScale)