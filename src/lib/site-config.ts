/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the ONLY file you need to edit to re-brand for a client.
 *  Content below is the REAL Garaj Plus Premium business info, taken from
 *  https://www.garajpluspremium.com (Sept 2026).
 * ─────────────────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Garaj Plus Premium",
  wordmark: "GARAJ PLUS",
  suffix: "PREMIUM",
  logo: "/brand/garajplus-wordmark.png", // their real logo, from garajpluspremium.com
  tagline: "Kusursuz PPF koruma.",
  description:
    "Garaj Plus Premium; İstanbul Bahçelievler'de PPF kaplama, araç renk değişimi, cam filmi ve boyasız göçük onarımı uygulayan premium araç koruma merkezidir. 13 yılı aşkın tecrübe, STIL TECH 210 Micron TPU teknolojisi.",
  url: "https://www.garajpluspremium.com",

  /** Brand palette: black · white · gold */
  theme: {
    bg: "#050505",
    bg2: "#0e0e0e",
    fg: "#ffffff",
    fgMuted: "#b8b8b8",
    accent: "#c9a24a",
    accentBright: "#f2d67e",
  },

  contact: {
    phone: "0 546 261 13 13",
    whatsapp: "905462611313",
    email: "",
    instagram: "",
    address: "Bahçelievler Mah. Talatpaşa Cad. No:2",
    city: "İstanbul",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Bah%C3%A7elievler+Mah.+Talatpa%C5%9Fa+Cad.+No%3A2+%C4%B0stanbul",
    hours: [
      { day: "Pazartesi – Cumartesi", time: "09:00 – 19:00" },
      { day: "WhatsApp randevu", time: "7/24" },
    ],
  },

  nav: [
    { label: "Stüdyo", href: "#studio" },
    { label: "İşlerimiz", href: "#work" },
    { label: "Hizmetler", href: "#services" },
    { label: "Filmler", href: "#packages" },
    { label: "Süreç", href: "#process" },
    { label: "İletişim", href: "#contact" },
  ],

  stats: [
    { value: 13, prefix: "", suffix: "+", label: "Yıllık tecrübe" },
    { value: 210, prefix: "", suffix: "", label: "Micron TPU film" },
    { value: 7, prefix: "", suffix: " yıl", label: "Solma & sararma garantisi" },
    { value: 4, prefix: "", suffix: "", label: "Uzmanlık alanı" },
  ],

  /** Real photos from the studio's own Instagram (@garajpluspremium). */
  gallery: [
    { src: "/photos/audi-a5.jpg", car: "Audi A5", work: "PPF Kaplama" },
    { src: "/photos/skoda-kamiq.jpg", car: "Škoda Kamiq", work: "PPF Kaplama" },
    { src: "/photos/mini-cooper.jpg", car: "Mini Cooper", work: "PPF Kaplama" },
  ],

  filmSpecs: [
    "STIL TECH 210 Micron",
    "7 Yıl Solma ve Sararma Garantisi",
    "Kil ve Demirtozu Arındırma",
    "PPF Kaplama",
    "Renk Değişimi",
    "Cam Filmi",
    "Boyasız Göçük Onarımı",
    "13 Yıllık Tecrübe",
  ],

  /** Swatches in the 3D studio. `defaultPaint` is what the car wears on load. */
  defaultPaint: "graphite",
  paints: [
    { id: "graphite", name: "Likit Grafit", hex: "#34373c" },
    { id: "obsidian", name: "Obsidyen Siyah", hex: "#0a0b0d" },
    { id: "pearl", name: "İnci Beyazı", hex: "#d6d5cf" },
    { id: "sapphire", name: "Gece Safiri", hex: "#12244a" },
    { id: "bronze", name: "Şampanya Altın", hex: "#6f5a30" },
    { id: "rosso", name: "Rosso Profondo", hex: "#5c0c12" },
  ],

  /** extent = how much of the car (nose → tail, 0..1) the film covers in 3D. */
  defaultCoverage: "full",
  coverage: [
    { id: "front", name: "Ön Kaput & Tampon", detail: "Ön kaput, tampon ve farlar — taş darbesinin en yoğun olduğu bölge", extent: 0.34 },
    { id: "fullfront", name: "Ön Bölge Paketi", detail: "Kaput, çamurluklar, tampon ve ayna kapakları", extent: 0.56 },
    { id: "full", name: "Komple Koruma Paketi", detail: "Aracın tamamı — kapılar, çamurluklar, tavan ve arka bölge dahil", extent: 1 },
  ],

  services: [
    { icon: "shield", title: "PPF Kaplama", text: "STIL TECH 210 Micron TPU zırh ile boyanızı ilk günkü gibi koruyun. Taş sıçramaları, kılcal çizikler ve UV ışınlarına karşı görünmez koruma." },
    { icon: "satin", title: "Renk Değişimi", text: "Aracınıza stil katacak en kaliteli folyo kaplama seçenekleri. AVERY DENNISON ve ORACAL ile orijinal boyayı koruyarak yeni bir kimlik." },
    { icon: "sun", title: "Cam Filmi", text: "Seramik bazlı filmlerle %99 UV koruması ve %80'e varan ısı reddi. Net görüş, yüksek ısı yalıtımı ve sürüş konforu." },
    { icon: "spark", title: "Boyasız Göçük Onarımı", text: "Dolu ve park hasarlarını boyaya zarar vermeden onarıyoruz. Orijinallik %100 korunur, tramer kaydı oluşmaz, çoğu zaman aynı gün teslim." },
  ],

  /** Their real PPF film options (from the PPF Kaplama page). */
  packages: [
    {
      name: "STIL TECH 200",
      title: "200 Micron · 5 Yıl Garanti",
      note: "Günlük kullanım için güçlü koruma",
      features: ["200 micron TPU film", "Kendini onaran üst katman", "Taş darbesi ve kılcal çizik koruması", "5 yıl garanti"],
      featured: false,
    },
    {
      name: "STIL TECH 210",
      title: "210 Micron · 7 Yıl Garanti",
      note: "En çok tercih edilen",
      features: ["210 micron TPU zırh", "Solma ve sararma garantisi", "Yüksek parlaklık, kendini onaran yapı", "UV ve kimyasal direnci", "7 yıl garanti"],
      featured: true,
    },
    {
      name: "ORACAL 250",
      title: "250 Micron · 5 Yıl Garanti",
      note: "Maksimum kalınlık",
      features: ["250 micron kalınlık", "Maksimum darbe direnci", "Uzun ömürlü yüzey koruması", "5 yıl garanti"],
      featured: false,
    },
  ],

  compare: {
    columns: ["PPF", "Seramik", "Wax"],
    rows: [
      { label: "Taş darbesi ve çarpma koruması", values: [true, false, false] },
      { label: "Kendini onaran çizik koruması", values: [true, false, false] },
      { label: "Parlaklık ve su itici etki", values: [true, true, "partial"] },
      { label: "UV, kuş pisliği ve kimyasal direnci", values: [true, true, "partial"] },
      { label: "Garanti / ömür", values: ["7 yıla kadar garanti", "2 – 5 yıl", "Birkaç hafta"] },
    ],
  },

  /** Their real 6-step PPF application process. */
  process: [
    { title: "Detaylı yüzey hazırlığı", text: "Araç baştan sona incelenir; uygulama öncesi yüzey eksiksiz şekilde hazırlanır." },
    { title: "Kimyasal dekontaminasyon", text: "Kil ve demir tozu arındırma ile boyaya yapışmış tüm kalıntılar temizlenir." },
    { title: "Profesyonel polisaj", text: "Mevcut hare ve çizikler giderilir — hiçbir kusur filmin altında kalmaz." },
    { title: "Hassas PPF uygulaması", text: "STIL TECH TPU film, aracın hatlarına göre titizlikle uygulanır." },
    { title: "Kenar ve parça bitimleri", text: "Kenarlar içe katlanır, gerekli parçalar sökülerek kusursuz bitiş sağlanır." },
    { title: "Kusursuz final kontrol", text: "Stüdyo ışığı altında son kontrol ve aracın teslimi." },
  ],

  /** Real Google reviews from their Google Business profile. */
  reviews: [
    { name: "FurkaN Kocaman", car: "Togg · Google yorumu", text: "Togg aracımızı 0 km de komple ppf ile kaplattım. Ahmet bey ve Halil beyin ilgisinden dolayı çok teşekkür ederim. Kesinlikle tavsiye ederim.", rating: 5 },
    { name: "Sefa Seven", car: "PPF kaplama · Google yorumu", text: "İşçilik çok titiz, kullanılan malzeme kaliteli ve uygulama gerçekten kusursuz. Aracı teslim alırken her detay kontrol edilmişti.", rating: 5 },
    { name: "Luess", car: "Mercedes C200 · Google yorumu", text: "Bayiden 0 aldığım Mercedes C200 aracımı Ahmet Bey'e teslim ettim; ilgisinden çok memnun kaldım. İşçilikleri kusursuz.", rating: 5 },
  ],

  faq: [
    { q: "PPF dışarıdan fark edilir mi?", a: "Hayır. Şeffaf TPU film kullanıyor ve panelin izin verdiği her yerde kenarları içe katlıyoruz; normal bakış mesafesinden görünmez, boyanızın parlaklığını korur." },
    { q: "PPF garantisi ne kadar?", a: "STIL TECH 210 Micron filmde 7 yıl solma ve sararma garantisi, STIL TECH 200 Micron ve ORACAL 250 Micron filmlerde 5 yıl garanti sunuyoruz." },
    { q: "Uygulama ne kadar sürer?", a: "Kapsama göre değişir: ön bölge uygulamaları genellikle 1–2 gün, komple koruma paketi ise hazırlık, polisaj ve final kontrol dahil birkaç gün sürer." },
    { q: "Renk değişimi orijinal boyaya zarar verir mi?", a: "Hayır. AVERY DENNISON ve ORACAL folyolar orijinal boyayı korur; istediğinizde sökülerek araç ilk haline döndürülebilir." },
    { q: "Boyasız göçük onarımı tramer kaydı oluşturur mu?", a: "Hayır. PDR yönteminde boya ve macun kullanılmaz; orijinallik %100 korunur, tramer kaydı oluşmaz ve aracın değer kaybı önlenir." },
    { q: "Kaplamalı araç nasıl yıkanır?", a: "İlk haftadan sonra pH nötr şampuanla elde yıkayın, fırçalı otomatik yıkamalardan kaçının. Teslimde bakım önerilerimizi paylaşıyoruz." },
  ],

  /** Required by the 3D model licence (CC BY 4.0) — keep in footer. */
  modelCredit: {
    text: '3D model: "2020 BMW X5 M Competition" — David_Holiday',
    license: "CC BY 4.0",
    href: "https://sketchfab.com/3d-models/2020-bmw-x5-m-competition-9b211d525797457e988c903f67d0b753",
  },
} as const;

export type PaintId = (typeof site.paints)[number]["id"];
export type CoverageId = (typeof site.coverage)[number]["id"];

export const finishLabel = (f: string) => (f === "satin" ? "Mat" : "Parlak");
