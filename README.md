# 🚀 Proje Başlangıç Rehberi

Bu proje, yüklenen belge görsellerini (fatura, fiş, form gibi) yapay zekâ ile okuyan bir **OCR** (belgeden yazı okuma) uygulamasıdır. Hazır bir proje altyapısının (boilerplate) üzerine kurulmuştur: giriş, yetki, dosya kütüphanesi ve yönetim paneli bu altyapıdan gelir, belge okuma bunlara eklenmiştir.

Bu rehber, hiç kodlama veya proje kurulumu tecrübesi olmayan kişiler için en basit ve anlaşılır haliyle hazırlanmıştır. Lütfen adımları sırayla, atlamadan takip edin.

---

## 🗺️ Yol Haritası

Proje aşama aşama geliştiriliyor. Her aşama bittiğinde bu liste güncellenir.

**✅ Tamamlananlar**
1. **Altyapı:** API, yönetim paneli ve veritabanı çalışır halde.
2. **Yapay zekâ bağlantısı:** Mastra ile bir OCR ajanı kuruldu. Model: NVIDIA Nemotron 3.5 Super VL (OpenRouter üzerinden, ücretsiz).
3. **Belge yükleme:** Dosya kütüphanesine yeni bir belge türü (`OCR_DOCUMENT`) eklendi. Belgeler kalıcı olarak kaydediliyor.
4. **Belge okuma:** Kayıtlı belge yapay zekâya okutuluyor, okunan yazı aynı kayda ekleniyor. Panelde **Read Text** butonu var.
5. **Sonucu görme:** Okunan yazı paneldeki belge penceresinde görünüyor.
6. **Bilgi ayıklama:** Faturadan fatura no, tarih, satıcı, alıcı, ara toplam, KDV, genel toplam ve para birimi ayrı ayrı alınıp düzenli veri (JSON) olarak kaydediliyor. Panelde **Extract Data** butonu var.

**⏳ Sıradakiler**
- Belge özeti çıkarma
- PDF belge desteği

**💡 İleride eklenebilecekler:** belge türünü tanıma, okunan bilgiyi doğrulama, sonucu düzeltebilme ekranı, şablon yönetimi, işlem geçmişi.

---

## 🔧 1. Olmazsa Olmaz Programlar (Ön Gereksinimler)

Projeyi bilgisayarınızda çalıştırabilmeniz için ilk olarak şu programları kurmanız gerekiyor:

1. **Bun (Çalıştırma Ortamı)**: Projemizin kalbidir.
   - **Mac/Linux kullanıyorsanız** terminali açıp şunu yapıştırın:
     `curl -fsSL https://bun.sh/install | bash`
   - **Windows kullanıyorsanız** PowerShell'i yönetici olarak açıp şunu yapıştırın:
     `powershell -c "irm bun.sh/install.ps1 | iex"`
   
2. **PostgreSQL (Veritabanı)**: Verilerin kaydedileceği yer.
   - Bilgisayarınıza [PostgreSQL](https://www.postgresql.org/download/) indirip kurun ("İleri, İleri" diyerek kurabilirsiniz).
   - Kurulum sırasında sizden bir şifre isteyecektir. Bu şifreyi **`postgres`** olarak ayarlarsanız kurulumda hiçbir dosya değiştirmenize gerek kalmaz.

3. **Git**: Kod klasörünü bilgisayara indirebilmek için.
   - [git-scm.com](https://git-scm.com) adresinden indirip kolayca kurabilirsiniz.

4. **VS Code**: Kodlara bakmak için kullanacağımız editör. (Önerilen)

---

## 📦 2. Adım Adım Kurulum

### Adım 1: Projeyi Bilgisayarınıza İndirin
Terminali açıp şunları sırayla yazın:
```bash
git clone https://github.com/ahmetsayran/mastra-ocr.git
cd mastra-ocr
```

### Adım 2: Gerekli Paketleri Yükleyin
Projemizin çalışması için internetteki bazı paketlere ihtiyacı var. Bunları tek bir komutla çekiyoruz:
```bash
bun install
```
*(Bu işlem internet hızınıza bağlı olarak 1-2 dakika sürebilir, bitmesini bekleyin.)*

### Adım 3: Ayar Dosyalarını Hazırlayın
Projeyi, kendi bilgisayarımızda çalışacak şekilde yapılandırmamız lazım. Terminale sırasıyla bunları yapıştırın:
```bash
cp config/apps/api/.env.example config/apps/api/.env
cp config/apps/web/.env.example config/apps/web/.env
```
*(Windows'ta "cp çalışmıyor" hatası alırsanız, klasörün içine girip `.env.example` adlı dosyanın bir kopyasını oluşturup adını `.env` yapabilirsiniz.)*

### Adım 4: Veritabanını Kurun
Veritabanımızdaki tabloların otomatik oluşması için terminale şu sırayla yazın (Önce PostgreSQL'in bilgisayarınızda çalışıyor olduğundan emin olun!):
```bash
cd packages/database
bun run prisma migrate dev
bun run prisma generate
cd ../..
```

### Adım 5: OpenRouter Anahtarını Ekleyin
Belgeleri okuyan yapay zekâ modeline (**NVIDIA Nemotron 3.5 Super VL**, ücretsiz sürüm) [OpenRouter](https://openrouter.ai) üzerinden bağlanıyoruz. Bunun için bir anahtar gerekiyor:

1. [openrouter.ai](https://openrouter.ai) adresinde hesap açıp giriş yapın.
2. [Keys](https://openrouter.ai/settings/keys) sayfasında **Create API Key** butonuna basın. *(Ücretsiz model kullandığımız için kredi yüklemeniz gerekmez.)*
3. Oluşan `sk-or-v1-...` ile başlayan anahtarı kopyalayın. *(Anahtar yalnızca bir kez gösterilir.)*
4. `config/apps/api/.env` dosyasını açıp `OPENROUTER_API_KEY=` satırının sonuna yapıştırın ve kaydedin.

> ⚠️ **Anahtarınızı kimseyle paylaşmayın.** Sadece `.env` dosyasına yazın; bu dosya GitHub'a gönderilmez. `.env.example` dosyasına asla gerçek anahtar yazmayın.

---

## 🎬 3. Projeyi Çalıştırma

Kurulum tamamen bitti! Artık projeyi başlatabiliriz. Ana proje klasöründe terminale şunu yazın:

```bash
bun run dev
```

Ekranda birkaç yazı belirecek ve yeşil yazılar göreceksiniz.
- **Siteye Girmek İçin:** Tarayıcınızda `http://localhost:5173` adresine gidin.
- (Eğer her şey tamamsa karşınıza giriş ekranı çıkacaktır.)

### 🤖 Yapay Zekâ Panelini (Mastra Studio) Açmak
Belgeleri okuyan yapay zekâ ajanını ayrıca denemek isterseniz yeni bir terminal açıp şunu yazın:

```bash
cd apps/api
bun run mastra:dev
```

- Tarayıcınızda `http://localhost:4111` adresine gidin.
- **OCR Agent** adlı ajanı seçip onunla sohbet ederek deneyebilirsiniz.
- *(Bunun çalışması için Adım 5'teki OpenRouter anahtarının eklenmiş olması gerekir.)*

---

## 📄 4. Belge Okuma (OCR) Nasıl Çalışır?

Belge yükleme ve kaydetme işini projenin hazır **dosya kütüphanesi** yapar; yapay zekâ sadece kayıtlı belgeyi okur.

```
1) Belgeyi yükle  → POST /file-library-assets   (type: OCR_DOCUMENT)
                    belge kaydedilir, size bir belge numarası (uuid) döner
2) Belgeyi okut   → POST /file-library-assets/{uuid}/ocr
                    yapay zekâ belgeyi okur, okunan yazı aynı kayda eklenir
3) Bilgi ayıkla   → POST /file-library-assets/{uuid}/extract
                    yapay zekâ fatura bilgilerini tek tek ayıklar, aynı kayda eklenir
```

2. ve 3. adım birbirinden bağımsızdır; istediğiniz sırayla, istediğiniz kadar çalıştırabilirsiniz. Biri diğerinin sonucunu silmez.

**Ayıklanan fatura bilgileri:** fatura no, tarih, satıcı, alıcı, ara toplam (KDV hariç), KDV, genel toplam, para birimi. Belgede yazmayan bilgi boş bırakılır. Tutarlar düz sayı (`1.440,00 TL` → `1440`), tarih `YYYY-MM-DD` biçiminde kaydedilir.

- **Kabul edilen dosyalar:** JPEG, PNG, WEBP (en fazla 10 MB).
- **Kayıtlar kalıcıdır:** Sayfayı kapatıp açsanız da yüklenen belgeler ve okunan yazılar silinmez.
- **Giriş gerekir:** Bu işlemler için giriş yapmış ve dosya yetkisi olan bir kullanıcı olmalısınız.
- **Panelden kullanmak için:** Paneldeki **File Library** sayfasında **Upload File** ile dosya yüklerken türü **OCR_DOCUMENT** seçin. Satırın menüsünden **View** ile belgeyi açıp **Read Text** butonuna basın. Okuma bitince bildirim çıkar ve okunan yazı aynı pencerede **Read Text** başlığının altında görünür. Daha önce okunmuş bir belgeyi açtığınızda yazı orada durur; henüz okunmamışsa *Not read yet* yazar. Aynı pencerede **Extract Data** butonuna basınca fatura bilgileri **Invoice Data** başlığının altında tek tek görünür; henüz ayıklanmamışsa *Not extracted yet* yazar.
- **Uç noktaları görmek için:** API çalışırken tarayıcıda `http://localhost:3000/swagger` adresine gidin. *(`config/apps/api/.env` dosyasında `PORT` değerini değiştirdiyseniz 3000 yerine o sayıyı yazın.)*

> 🔒 Yüklenen belgeler proje klasöründeki `storage/` klasörüne kaydedilir. Bu klasör GitHub'a gönderilmez; belgeleriniz sadece kendi bilgisayarınızda kalır.

---

## 🚨 5. Hata Çözüm Rehberi (Kurtarıcı Adımlar)

Eğer projenizi çalıştırırken veya kurarken bir şeyler ters giderse **paniğe kapılmayın**. En çok karşılaşılan sorunları nasıl çözeceğiniz aşağıda:

### 💡 "bun install" yaparken hata aldım / Paketler hatalı yüklendi!
Paketler yüklenirken bir şebeke problemi veya uyumsuzluk olmuş olabilir. En etkili çözüm "**Kapatıp Tekrar Açmak / Silip Yüklemek**"tir :)
Projenin ana klasöründeyken terminalde şunları yazarak temizleyip baştan yükleyin:

**Mac/Linux için:**
```bash
rm -rf node_modules
rm bun.lock
bun install
```

**Windows (PowerShell) için:**
```bash
Remove-Item -Recurse -Force node_modules
Remove-Item -Force bun.lock
bun install
```
*(Bu komutlar eski bozuk kurulumu silerek `bun install` ile en temiz haliyle tekrar yükler.)*

### 💡 "Database Connection" (Veritabanı Bağlantı) Hatası
- PostgreSQL veritabanını kurduğunuzdan ve arka planda açık olduğundan emin olun.
- Şifrenizi kurulumda `postgres` yapmadıysanız, `config/apps/api/.env` dosyasına girip oradaki `postgresql://postgres:postgres@localhost...` yazan kısımdaki ikinci `postgres`'i koyduğunuz kendi şifrenizle değiştirin.

### 💡 "Port 5173 / 3000 is already in use" (Port dolu) Hatası
Arka planda projeyi zaten çalıştırmışsınız veya başka bir program bu kanalları kullanıyor olabilir. Terminal'i tamamen kapatıp yeni bir terminal açarak tekrar deneyin.
