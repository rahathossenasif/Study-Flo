# STUDYFLO - Android APK Build

## GitHub এ আপলোড করলে কী হবে?

এই zip-এর সাথে একটা **স্মার্ট GitHub Actions workflow** আছে।

Workflow নিজে থেকেই করবে:
1. Dependencies ইনস্টল
2. Web অ্যাপ বিল্ড
3. `npx cap add android` (যদি android ফোল্ডার অসম্পূর্ণ হয়)
4. `npx cap sync`
5. Kotlin stdlib error ফিক্স (আপনার আগের error টা)
6. Debug APK বিল্ড
7. APK আপলোড করে artifact হিসেবে রাখবে

### কীভাবে ব্যবহার করবেন

1. এই পুরো ফোল্ডার GitHub repository তে push করুন
2. GitHub → **Actions** ট্যাবে যান
3. **Build Debug APK** workflow রান করুন (বা push করলে অটোমেটিক রান হবে)
4. শেষ হলে **Artifacts** সেকশন থেকে `studyflo-debug-apk` ডাউনলোড করুন

---

## লোকালে বিল্ড করতে চাইলে

```bash
npm install --legacy-peer-deps
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK পাবেন এখানে:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## আসল Error ফিক্স

আপনার আগের error ছিল:
```
Could not find org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.0
```

এটা ঠিক করার জন্য workflow-এ এবং android/build.gradle-এ Kotlin version force করা আছে (1.9.24)।
