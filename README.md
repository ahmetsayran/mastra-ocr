# 🚀 Mastra OCR — Proje Başlangıç Rehberi

Bu proje, belgeleri (fatura, fiş, form, rapor gibi) yapay zekâ ile okuyan ve analiz eden bir **OCR** (belgeden yazı okuma) uygulamasıdır. Tek bir sayfada (**AI Bot**) yapay zekâyla sohbet edebilir, görsel veya PDF belge yükleyebilir, belgenin yazısını okutabilir, fatura bilgilerini ayıklatabilir, belgeyi özetletebilir ve yüklediğiniz belgeler hakkında soru sorabilirsiniz. Yaptığınız her şey sol taraftaki **Records** listesinde görünür.

Proje hazır bir altyapının (boilerplate) üzerine kurulmuştur: giriş, yetki, dosya kütüphanesi, işlem kayıtları ve panel bu altyapıdan gelir; yapay zekâ özellikleri bunların üzerine eklenmiştir.

Bu rehber, hiç kodlama veya proje kurulumu tecrübesi olmayan kişiler için en basit ve anlaşılır haliyle hazırlanmıştır. Lütfen adımları sırayla, atlamadan takip edin.

---

## 🗺️ Yol Haritası

Proje aşama aşama geliştirildi. Her aşama bittiğinde bu liste güncellenir.

**✅ Tamamlananlar**
1. **Altyapı:** API, panel ve veritabanı çalışır halde.
2. **Yapay zekâ bağlantısı:** Mastra ile bir OCR ajanı kuruldu. Model: NVIDIA Nemotron 3.5 Super VL (OpenRouter üzerinden, ücretsiz).
3. **Belge yükleme:** Dosya kütüphanesine yeni bir belge türü (`OCR_DOCUMENT`) eklendi. Belgeler kalıcı olarak kaydediliyor.
4. **Belge okuma (Read Text):** Belgedeki yazı okunup aynı kayda ekleniyor.
5. **Bilgi ayıklama (Extract Data):** Faturadan fatura no, tarih, satıcı, alıcı, ara toplam, KDV, genel toplam ve para birimi ayrı ayrı alınıp düzenli veri (JSON) olarak kaydediliyor.
6. **Sohbet:** Yapay zekâyla sohbet edilebiliyor; sohbetler ve mesajlar kaydediliyor. Cevap ekranda yazılıyormuş gibi kelime kelime geliyor.
7. **Belgeler hakkında soru sorma (RAG):** Yüklenen belgeler parçalara bölünüp aranabilir hale getiriliyor; sohbette sorulan soruya belgelerdeki ilgili bölümlerle cevap veriliyor.
8. **Güvenlik kontrolleri:** Sohbete yazılan "önceki talimatları yok say" gibi saldırı cümleleri engelleniyor; cevaplarda anahtar ve şifre benzeri bilgiler gizleniyor.
9. **Yapay zekâ araçları:** Yapay zekâ sohbet içinde gönderi yorumlarını listeleyip ekleyebiliyor, güncelleyip silebiliyor; belgeleri listeleyip özetleyebiliyor. Her işlem kullanıcının yetkisine göre yapılıyor ve işlem kaydına yazılıyor.
10. **Belge özeti (Summarize):** Belgenin 3-5 cümlelik Türkçe özeti çıkarılıp kayda yazılıyor. Aynı belge tekrar istenirse kayıttaki özet kullanılıyor.
11. **PDF desteği:** Yazılı PDF'lerin yazısı yapay zekâ kullanmadan okunuyor. Taranmış (yazısı resim olan) PDF'lerin sayfaları görsele çevrilip yapay zekâya okutuluyor.
12. **AI Bot sayfası:** Sohbet, belge yükleme ve belge analizi tek sayfada. Sol menüde sohbetler ve belgeler (**Records**), her kayıtta yeniden adlandırma ve silme menüsü var. Koyu ve açık tema, telefon görünümü destekleniyor.

**💡 İleride eklenebilecekler:** belge türünü otomatik tanıma (fatura, fiş, kimlik), ayıklanan bilgiyi doğrulama (toplam = ara toplam + KDV), sonucu elle düzeltebilme ekranı, belge şablonları, tablo ve kalem satırlarını ayıklama, toplu belge yükleme, sonuçları Excel/CSV olarak indirme, sohbet içinde belge önizlemesi.

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

3. **pgvector (Veritabanı eklentisi)**: Belgeler hakkında soru sorabilmek için gereken arama eklentisi. **Bu olmadan veritabanı kurulumu hata verir.**
   - **Mac (Homebrew):** `brew install pgvector`
   - **Linux (Ubuntu/Debian):** `sudo apt install postgresql-16-pgvector` *(16 yerine kendi PostgreSQL sürümünüzü yazın.)*
   - **Windows:** En kolayı aşağıdaki Docker yöntemidir. Docker kullanmak istemiyorsanız [pgvector kurulum sayfasındaki](https://github.com/pgvector/pgvector#windows) Windows adımlarını izleyin.
   - **Docker ile (her işletim sistemi):** PostgreSQL ve pgvector'u ayrı ayrı kurmak yerine, [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurup proje klasöründe `cd packages/database && docker compose up -d` yazabilirsiniz. Bu, pgvector'un hazır geldiği bir veritabanı başlatır (kullanıcı ve şifre `postgres`).

4. **Git**: Kod klasörünü bilgisayara indirebilmek için.
   - [git-scm.com](https://git-scm.com) adresinden indirip kolayca kurabilirsiniz.

5. **VS Code**: Kodlara bakmak için kullanacağımız editör. (Önerilen)

---

## 📦 2. Adım Adım Kurulum

### Adım 1: Projeyi Bilgisayarınıza İndirin
Terminali açıp şunları sırayla yazın:
```bash
git clone <depo-adresi>
cd <proje-klasoru>
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

Sonra `config/apps/api/.env` dosyasını açıp şu iki satırı düzenleyin:

- **`BETTER_AUTH_SECRET=`** — Girişlerin güvenliği için gizli bir anahtar. Terminalde `openssl rand -base64 32` yazın ve çıkan yazıyı bu satırın sonuna yapıştırın. *(Bu değer size özeldir, kimseyle paylaşmayın.)*
- **`REDIS_URL=`** — Bilgisayarınızda Redis kurulu değilse bu satırın sonundaki adresi silip boş bırakın. Proje Redis olmadan da çalışır.

### Adım 4: Veritabanını Kurun
Veritabanımızdaki tabloların otomatik oluşması için terminale şu sırayla yazın (Önce PostgreSQL'in bilgisayarınızda çalışıyor olduğundan emin olun!):
```bash
cd packages/database
bun run prisma migrate dev
bun run prisma generate
cd ../..
```

İlk kurulumda bu adım tabloları oluşturur ve örnek verileri ekler: bir **yönetici hesabı**, örnek kullanıcılar ve ülke/şehir listesi. Panele giriş yapacağınız yönetici hesabının bilgileri `apps/api/src/seeders/system-initialization.seeder.ts` dosyasındadır.

*(Örnek veriler eklenmediyse, yani giriş yapamıyorsanız, `packages/database` klasöründe `bun run seed` yazın.)*

### Adım 5: OpenRouter Anahtarını Ekleyin
Belgeleri okuyan yapay zekâ modeline (**NVIDIA Nemotron 3.5 Super VL**, ücretsiz sürüm) [OpenRouter](https://openrouter.ai) üzerinden bağlanıyoruz. Bunun için bir anahtar gerekiyor:

1. [openrouter.ai](https://openrouter.ai) adresinde hesap açıp giriş yapın.
2. [Keys](https://openrouter.ai/settings/keys) sayfasında **Create API Key** butonuna basın. *(Ücretsiz model kullandığımız için kredi yüklemeniz gerekmez.)*
3. Oluşan `sk-or-v1-...` ile başlayan anahtarı kopyalayın. *(Anahtar yalnızca bir kez gösterilir.)*
4. `config/apps/api/.env` dosyasını açıp `OPENROUTER_API_KEY=` satırının sonuna yapıştırın ve kaydedin.

> ⚠️ **Anahtarlarınızı ve şifrelerinizi kimseyle paylaşmayın.** Sadece `.env` dosyasına yazın; bu dosya GitHub'a gönderilmez. `.env.example` dosyasına asla gerçek anahtar veya şifre yazmayın.

---

## 🎬 3. Projeyi Çalıştırma

Kurulum tamamen bitti! Artık projeyi başlatabiliriz. Ana proje klasöründe terminale şunu yazın:

```bash
bun run dev
```

Ekranda birkaç yazı belirecek ve yeşil yazılar göreceksiniz.
- **Siteye Girmek İçin:** Tarayıcınızda `http://localhost:5173` adresine gidin. *(Adresi `127.0.0.1` ile değil, `localhost` ile yazın; aksi halde giriş yapılamaz.)*
- Giriş ekranında Adım 4'teki yönetici hesabıyla giriş yapın. Giriş yapınca doğrudan **AI Bot** sayfası açılır.

### 🤖 Yapay Zekâ Panelini (Mastra Studio) Açmak
Yapay zekâ ajanını ayrıca denemek isterseniz yeni bir terminal açıp şunu yazın:

```bash
cd apps/api
bun run mastra:dev
```

- Tarayıcınızda `http://localhost:4111` adresine gidin.
- **OCR Agent** adlı ajanı seçip onunla sohbet ederek deneyebilirsiniz.
- *(Bunun çalışması için Adım 5'teki OpenRouter anahtarının eklenmiş olması gerekir.)*

---

## 🧭 4. AI Bot Sayfası Nasıl Kullanılır?

Her şey tek sayfada yapılır:

1. **Sohbet başlatın:** Alttaki kutuya bir soru yazıp gönderin. İlk mesajla yeni bir sohbet oluşur; başlığı mesajın ilk 50 karakteridir. Sol üstteki **New chat** ile yeni bir sohbete başlayabilirsiniz.
2. **Belge ekleyin:** Mesaj kutusunun solundaki 📎 (ataş) butonuyla bir görsel veya PDF seçin. Belge kaydedilir ve arka planda okunup aranabilir hale gelir. Birkaç saniye sonra onunla ilgili soru sorabilirsiniz (örnek: *"Faturadaki genel toplam nedir?"*, *"Son eklediğim belgeyi özetle"*).
3. **Belgeyi analiz edin:** Sol menüdeki **Records** listesinde belgeye tıklayın. Açılan pencerede:
   - **Read Text** — belgedeki yazıyı okur,
   - **Extract Data** — fatura bilgilerini tek tek ayıklar,
   - **Summarize** — belgenin kısa özetini çıkarır,
   - **Open / Download** — dosyayı açar veya indirir.
   Sonuçlar aynı pencerede ilgili başlığın altında görünür ve kaydedilir; pencereyi kapatıp açsanız da kaybolmaz.
4. **Kayıtları yönetin:** Records'ta bir kaydın üzerine gelince sağında **⋯** belirir. Sohbetleri **Rename** ile yeniden adlandırabilir, **Delete** ile silebilirsiniz. Belgelerde ayrıca **View** vardır.
5. **Görünüm:** Sağ üstteki ay/güneş simgesiyle koyu ve açık tema arasında geçiş yapabilirsiniz. Sol menünün kenarını sürükleyerek genişliğini ayarlayabilirsiniz.

Belgeler ayrıca **Dosya Kütüphanesi** sayfasında (`http://localhost:5173/file-library`) tablo halinde görülebilir. Yapılan her işlem (kim, ne zaman, ne yaptı) **işlem kayıtları** sayfasında (`http://localhost:5173/audit-logs`) listelenir.

---

## 📄 5. Belge İşleme Nasıl Çalışır?

Belge yükleme ve kaydetme işini projenin hazır **dosya kütüphanesi** yapar; yapay zekâ kayıtlı belgeyi okur ve analiz eder.

```
1) Belgeyi yükle    → POST /file-library-assets              (type: OCR_DOCUMENT)
                      belge kaydedilir, arka planda okunup aranabilir hale getirilir
2) Belgeyi okut     → POST /file-library-assets/{uuid}/ocr
                      belgedeki yazı okunur, aynı kayda eklenir
3) Bilgi ayıkla     → POST /file-library-assets/{uuid}/extract
                      fatura bilgileri tek tek ayıklanır, aynı kayda eklenir
4) Özet çıkar       → POST /file-library-assets/{uuid}/summary
                      belgenin kısa özeti çıkarılır, aynı kayda eklenir
5) Soru sor         → POST /threads/{uuid}/messages
                      soruya, belgelerdeki ilgili bölümlerle cevap verilir
```

2., 3. ve 4. adım birbirinden bağımsızdır; istediğiniz sırayla, istediğiniz kadar çalıştırabilirsiniz. Biri diğerinin sonucunu silmez.

**Dosya türüne göre okuma:**

| Belge | Nasıl okunur | Yapay zekâ kullanır mı? |
|---|---|---|
| Görsel (JPG, PNG, WEBP) | Görsel yapay zekâya (VLM) okutulur | Evet, 1 istek |
| Yazılı PDF (bilgisayarda oluşturulmuş) | Yazı doğrudan PDF'ten okunur | Hayır |
| Taranmış PDF (yazısı resim olan) | Her sayfa görsele çevrilip yapay zekâya okutulur | Evet, sayfa başına 1 istek |

**Ayıklanan fatura bilgileri:** fatura no, tarih, satıcı, alıcı, ara toplam (KDV hariç), KDV, genel toplam, para birimi. Belgede yazmayan bilgi boş bırakılır. Tutarlar düz sayı (`1.440,00 TL` → `1440`), tarih `YYYY-MM-DD` biçiminde kaydedilir.

- **Kabul edilen dosyalar:** JPEG, PNG, WEBP ve PDF (en fazla 10 MB). Taranmış PDF'ler en fazla 5 sayfa olabilir.
- **Kayıtlar kalıcıdır:** Sayfayı kapatıp açsanız da yüklenen belgeler, sohbetler ve sonuçlar silinmez.
- **Giriş gerekir:** Bu işlemler için giriş yapmış ve ilgili yetkiye sahip bir kullanıcı olmalısınız. Her kullanıcı yalnızca kendi sohbetlerini görür.
- **Uç noktaları görmek için:** API çalışırken tarayıcıda `http://localhost:3000/swagger` adresine gidin. *(`config/apps/api/.env` dosyasında `PORT` değerini değiştirdiyseniz 3000 yerine o sayıyı yazın.)*

> 🔒 Yüklenen belgeler proje klasöründeki `storage/` klasörüne kaydedilir. Bu klasör GitHub'a gönderilmez; belgeleriniz sadece kendi bilgisayarınızda kalır.

---

## 🔍 6. Neler Yapabilirsiniz? (Analiz Örnekleri)

- **Belgeden yazı çıkarma:** Fatura, fiş, sözleşme veya taranmış bir sayfanın yazısını dijital metne çevirin.
- **Fatura verisi ayıklama:** Birden çok faturanın tutarlarını, tarihlerini ve firma adlarını düzenli veri olarak toplayın.
- **Özet çıkarma:** Uzun bir raporun veya sözleşmenin birkaç cümlelik özetini alın.
- **Belgeler üzerinde soru-cevap:** *"Bu ayki faturalarda en yüksek tutar hangisi?"*, *"Sözleşmede ödeme süresi kaç gün?"* gibi sorular sorun; cevap yüklediğiniz belgelerden gelir.
- **Sohbetle işlem yaptırma:** *"Şu gönderinin yorumlarını listele"*, *"Son yüklediğim belgeyi özetle"* gibi isteklerde yapay zekâ ilgili aracı kendisi kullanır.

---

## 🧩 7. Projeye Yeni Bir Şey Eklemek İsterseniz

Proje, hazır altyapının kurallarına göre yazılmıştır. Yeni bir özellik eklerken aynı düzeni izleyin:

- **Yeni bir API özelliği:** `apps/api/src/modules/` altında, `posts` modülündeki gibi `controller.ts`, `dtos.ts`, `service.ts`, `formatters.ts`, `types.ts`, `index.ts` dosyalarıyla bir modül açın. Yetkileri `modules/auth/authorization/permissions/constants.ts`, işlem kaydı türlerini `modules/audit-logs/constants.ts` içine ekleyin.
- **Ayarlar ve yapay zekâ komutları:** İlgili modülün `constants.ts` dosyasına yazın (örnek: `modules/file-library-assets/constants.ts` içindeki okuma, ayıklama ve özet komutları).
- **Yapay zekâ parçaları:** Ajan, araçlar, güvenlik kontrolleri ve embedding modeli `apps/api/src/mastra/` klasöründedir. Yeni bir araç eklerseniz `mastra/tools/` altına yazıp `mastra/agents/ocr-agent.ts` içinde ajana tanıtın.
- **Veritabanı değişikliği:** `packages/database/schema.prisma` dosyasını düzenleyip `packages/database` klasöründe `bun run prisma migrate dev` çalıştırın.
- **Panelde yeni bir sayfa veya bileşen:** `apps/web/src/features/` altında `pages`, `hooks`, `queries`, `components` klasörleriyle bir özellik klasörü açın; sayfanın adresini `apps/web/src/routes/` altına ekleyin.
- **API değiştikten sonra:** Panelin API tiplerini güncellemek için `packages/eden` klasöründe `bun run prepare-types` çalıştırın.

---

## ⚠️ 8. Bilinmesi Gereken Sınırlar

- **Ücretsiz modelin günlük sınırı vardır.** Sınır dolunca yapay zekâ özellikleri (okuma, ayıklama, özet, sohbet) bir süre çalışmaz; ekranda *"Yapay zekâ servisi şu an yoğun"* uyarısı çıkar. Sınır günlük olarak sıfırlanır. Yazılı PDF'lerin okunması bu sınırı harcamaz.
- **Taranmış PDF'ler en fazla 5 sayfa olabilir.** Her sayfa bir yapay zekâ isteği harcar.
- **Records listesi** son 20 sohbeti ve son 20 dosyayı gösterir.
- **Cevap akışı:** Yapay zekânın cevabı önce tamamen hazırlanır, sonra ekranda kelime kelime gösterilir.

---

## 🚨 9. Hata Çözüm Rehberi (Kurtarıcı Adımlar)

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

### 💡 Veritabanı kurulumunda "extension "vector" is not available" hatası
pgvector eklentisi kurulu değil. Ön Gereksinimler bölümündeki 3. adımı yapın, PostgreSQL'i yeniden başlatın ve Adım 4'ü tekrar çalıştırın.

### 💡 Giriş yapıyorum ama giriş ekranına geri dönüyorum
- Siteyi `127.0.0.1` ile değil, `http://localhost:5173` adresiyle açın.
- Panel başka bir portta açıldıysa (örneğin 5173 doluysa ve terminalde `5174` yazıyorsa), `config/apps/api/.env` dosyasındaki `APP_URL` değerini o adresle değiştirip projeyi yeniden başlatın.
- `BETTER_AUTH_SECRET` değerini Adım 3'teki gibi doldurduğunuzdan emin olun.

### 💡 "Yapay zekâ servisi şu an yoğun, biraz sonra tekrar deneyin"
Ücretsiz modelin günlük kullanım sınırı dolmuştur. Bir süre sonra (genellikle ertesi gün) tekrar deneyin.

### 💡 "Yapay zekâ servisine bağlanılamadı, OpenRouter anahtarını kontrol edin"
`config/apps/api/.env` dosyasındaki `OPENROUTER_API_KEY` boş veya hatalıdır. Adım 5'i tekrar yapın ve projeyi yeniden başlatın.

### 💡 "Taranmış PDF en fazla 5 sayfa olabilir"
Yazısı resim olan PDF'ler sayfa sayfa okunur. Belgeyi 5 sayfalık parçalara bölüp ayrı ayrı yükleyin.

### 💡 "Desteklenmeyen dosya türü" veya "Dosya boyutu maksimum dosya boyutundan büyük olamaz"
Yalnızca JPG, PNG, WEBP ve PDF dosyaları kabul edilir; dosya 10 MB'tan küçük olmalıdır.

### 💡 Terminalde "REDIS_URL is not set, cache will not be used" yazıyor
Bu bir hata değil, bilgilendirmedir. Redis kullanmıyorsanız görmezden gelebilirsiniz.

### 💡 "Port 5173 / 3000 is already in use" (Port dolu) Hatası
Arka planda projeyi zaten çalıştırmışsınız veya başka bir program bu kanalları kullanıyor olabilir. Terminal'i tamamen kapatıp yeni bir terminal açarak tekrar deneyin.
