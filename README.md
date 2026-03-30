# Nature Go — Admin Panel

Flutter ilovasi uchun Next.js admin boshqaruv paneli. Firebase Firestore bilan ishlaydi, Vercelga deploy qilinadi.

---

## 🚀 Vercelga Deploy qilish

### 1. Firebase Authentication sozlash

Firebase Console → Authentication → Sign-in method → **Email/Password** ni yoqing.

Keyin **Users** bo'limida admin hisob qo'shing:
- Email: `evolution2024team@gmail.com`
- Parol: (o'zingiz xohlagan parol)

---

### 2. Firestore Rules yangilash

Firebase Console → Firestore → **Rules** bo'limiga o'ting va quyidagi qoidalarni joylashtiring:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
             request.auth.token.email == 'evolution2024team@gmail.com';
    }

    match /places/{placeId} {
      allow read: if isAdmin() || resource.data.isPublished == true;
      allow write: if isAdmin();
    }

    match /reviews/{reviewId} {
      allow read: if isAdmin() || resource.data.isPublished == true;
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

### 3. GitHub'ga yuklash

```bash
git init
git add .
git commit -m "Initial admin panel"
git remote add origin https://github.com/username/nature-go-admin.git
git push -u origin main
```

---

### 4. Vercel sozlash

1. [vercel.com](https://vercel.com) ga kiring
2. **New Project** → GitHub repo ni tanlang
3. **Environment Variables** bo'limida quyidagilarni qo'shing:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDn_1-ffF7Qon2n4QKXpdNv16OCuZJc2ys` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `nature-go-c188e.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `nature-go-c188e` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `nature-go-c188e.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `225052370906` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:225052370906:web:a45f608a746ecc97fa42e3` |

4. **Deploy** bosing!

---

### 5. Firebase Authorized Domains

Firebase Console → Authentication → Settings → **Authorized domains** → Vercel domenini qo'shing:
```
your-project.vercel.app
```

---

## 🖥️ Lokal ishga tushirish

```bash
npm install
npm run dev
```

`http://localhost:3000` ga o'ting.

---

## ✨ Imkoniyatlar

- 🔐 **Kirish** — Email/parol orqali faqat admin kira oladi
- 📊 **Statistika** — Joylar, sharhlar, reyting, viloyat/tur bo'yicha tahlil
- 📍 **Joylar** — Ko'rish, tasdiqlash/rad etish, tahrirlash, o'chirish, qidirish, filtrlash
- 💬 **Sharhlar** — Ko'rish, tasdiqlash/rad etish, tahrirlash, o'chirish
- 🌙 **Yorug'/Qorong'u rejim** — Avtomatik yoki qo'lda
- 📱 **Mobil moslashuvchan** — Barcha ekran o'lchamlarida ishlaydi
