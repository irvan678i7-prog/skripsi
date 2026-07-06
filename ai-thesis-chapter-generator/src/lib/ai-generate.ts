import Groq from "groq-sdk";
import type { AcademicSource } from "./types";
import { getApiKey } from "./get-api-key";

async function getClient() {
  const key = await getApiKey("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY belum diatur. Buka halaman Pengaturan API untuk mengisi API key.");
  return new Groq({ apiKey: key });
}

export async function extractKeywords(
  title: string,
  department: string
): Promise<string[]> {
  const client = await getClient();
  const msg = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: `Dari judul skripsi berikut, ekstrak 5-8 kata kunci akademik yang bisa digunakan untuk mencari jurnal dan buku di database akademik (Crossref, Semantic Scholar, Google Books). Berikan kata kunci dalam bahasa Inggris dan Indonesia.

Judul: "${title}"
Jurusan: "${department}"

Balas HANYA dalam format JSON array string, contoh: ["keyword1", "keyword2", "keyword3"]
Jangan tambahkan penjelasan apapun.`,
      },
    ],
  });
  const text = msg.choices[0]?.message?.content ?? "";
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fallback
  }
  return title
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6);
}

export async function generateChapter(params: {
  chapterNumber: number;
  chapterTitle: string;
  thesisTitle: string;
  department: string;
  method: string;
  citationStyle: string;
  sources: AcademicSource[];
}): Promise<string> {
  const client = await getClient();

  const sourceList = params.sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.authors} (${s.year}). "${s.title}". ${s.publisher ?? ""}. ${s.doi ? `DOI: ${s.doi}` : ""} ${s.url ? `URL: ${s.url}` : ""}`
    )
    .join("\n");

  const chapterInstructions: Record<number, string> = {
    1: `BAB I - PENDAHULUAN

TULIS BAB I YANG SANGAT LENGKAP (minimal 2000 kata, setara 4-5 halaman). Gunakan sitasi dari sumber yang diberikan.

1.1 Latar Belakang Masalah
Tulis MINIMAL 8-10 paragraf yang membahas:
- Paragraf 1-2: Gambaran umum fenomena global/nasional terkait topik. Berikan konteks luas mengapa topik ini relevan saat ini. Sertakan data atau fakta pendukung.
- Paragraf 3-4: Kondisi spesifik di Indonesia atau konteks lokal. Jelaskan bagaimana fenomena ini berkembang dan berdampak. Gunakan sitasi.
- Paragraf 5-6: Identifikasi masalah utama. Jelaskan gap antara kondisi ideal dan realita. Apa yang seharusnya terjadi vs apa yang sebenarnya terjadi.
- Paragraf 7-8: Dampak jika masalah tidak ditangani. Jelaskan urgensi penelitian ini dilakukan sekarang.
- Paragraf 9-10: Penelitian terdahulu yang relevan dan posisi penelitian ini. Jelaskan kebaruan (novelty) penelitian. Gunakan sitasi dari sumber yang diberikan.

1.2 Identifikasi Masalah
Berdasarkan latar belakang, identifikasi 5-6 masalah spesifik:
1. [Masalah pertama yang teridentifikasi]
2. [Masalah kedua yang teridentifikasi]
3. [Masalah ketiga yang teridentifikasi]
4. [Masalah keempat yang teridentifikasi]
5. [Masalah kelima yang teridentifikasi]

1.3 Batasan Masalah
Untuk fokus penelitian, batasi ruang lingkup pada:
1. [Batasan pertama - aspek yang diteliti]
2. [Batasan kedua - lokasi/populasi]
3. [Batasan ketiga - waktu penelitian]
4. [Batasan keempat - variabel yang diteliti]

1.4 Rumusan Masalah
Berdasarkan latar belakang dan batasan masalah, rumusan masalah penelitian ini adalah:
1. Bagaimana [pertanyaan penelitian 1]?
2. Bagaimana [pertanyaan penelitian 2]?
3. Apakah terdapat [pertanyaan penelitian 3]?
4. Sejauh mana [pertanyaan penelitian 4]?

1.5 Tujuan Penelitian
1.5.1 Tujuan Umum
Tulis satu paragraf tentang tujuan utama penelitian secara keseluruhan.

1.5.2 Tujuan Khusus
Sesuai rumusan masalah, tujuan khusus penelitian ini adalah:
1. Untuk mengetahui/menganalisis [sesuai rumusan masalah 1]
2. Untuk mengetahui/menganalisis [sesuai rumusan masalah 2]
3. Untuk mengetahui/menganalisis [sesuai rumusan masalah 3]
4. Untuk mengetahui/menganalisis [sesuai rumusan masalah 4]

1.6 Manfaat Penelitian
1.6.1 Manfaat Teoritis
Tulis 2 paragraf tentang kontribusi penelitian bagi pengembangan ilmu pengetahuan dan teori.

1.6.2 Manfaat Praktis
a) Bagi Institusi/Organisasi: [2-3 kalimat]
b) Bagi Masyarakat: [2-3 kalimat]
c) Bagi Peneliti Selanjutnya: [2-3 kalimat]
d) Bagi Pemerintah/Pembuat Kebijakan: [2-3 kalimat jika relevan]

1.7 Sistematika Penulisan
BAB I PENDAHULUAN: Berisi latar belakang masalah, identifikasi masalah, batasan masalah, rumusan masalah, tujuan penelitian, manfaat penelitian, dan sistematika penulisan.

BAB II TINJAUAN PUSTAKA: Berisi landasan teori yang relevan dengan penelitian, penelitian terdahulu, kerangka pemikiran, dan hipotesis penelitian.

BAB III METODOLOGI PENELITIAN: Berisi jenis penelitian, lokasi dan waktu penelitian, populasi dan sampel, variabel penelitian, teknik pengumpulan data, instrumen penelitian, serta teknik analisis data.

BAB IV HASIL DAN PEMBAHASAN: Berisi deskripsi data, hasil pengujian, dan pembahasan hasil penelitian.

BAB V PENUTUP: Berisi kesimpulan dari hasil penelitian dan saran-saran.`,

    2: `BAB II - TINJAUAN PUSTAKA

TULIS BAB II YANG SANGAT LENGKAP DAN AKADEMIS (minimal 2500 kata, setara 6-7 halaman). WAJIB banyak sitasi dari sumber yang diberikan.

2.1 Landasan Teori

2.1.1 [Teori/Konsep Variabel X - sesuaikan dengan judul skripsi]
Tulis 5-6 paragraf:
- Definisi menurut ahli 1 dengan sitasi
- Definisi menurut ahli 2 dengan sitasi
- Definisi menurut ahli 3 dengan sitasi
- Sintesis definisi dan definisi operasional yang digunakan dalam penelitian
- Karakteristik dan ciri-ciri utama (minimal 5 poin)
- Faktor-faktor yang mempengaruhi (minimal 4 poin dengan penjelasan)

2.1.2 [Teori/Konsep Variabel Y - sesuaikan dengan judul skripsi]
Tulis 5-6 paragraf dengan struktur yang sama:
- Definisi dari beberapa ahli dengan sitasi
- Dimensi atau aspek-aspek (minimal 4 dimensi)
- Indikator pengukuran
- Faktor-faktor yang mempengaruhi

2.1.3 [Teori/Konsep Pendukung - jika ada variabel Z atau konsep tambahan]
Tulis 3-4 paragraf dengan struktur serupa.

2.1.4 Hubungan Antar Variabel
Tulis 3-4 paragraf yang menjelaskan:
- Bagaimana variabel X mempengaruhi variabel Y berdasarkan teori
- Mekanisme atau proses yang menghubungkan kedua variabel
- Dukungan empiris dari penelitian sebelumnya

2.2 Penelitian Terdahulu

Berikut adalah penelitian terdahulu yang relevan dengan penelitian ini:

<<<TABLE_START>>>
PENELITIAN_TERDAHULU
No|Peneliti (Tahun)|Judul Penelitian|Metode|Hasil Penelitian|Persamaan|Perbedaan
1|[Nama] ([Tahun])|[Judul lengkap]|[Kuantitatif/Kualitatif]|[Hasil utama penelitian]|[Kesamaan dengan penelitian ini]|[Perbedaan dengan penelitian ini]
2|[Nama] ([Tahun])|[Judul lengkap]|[Metode]|[Hasil]|[Persamaan]|[Perbedaan]
3|[Nama] ([Tahun])|[Judul lengkap]|[Metode]|[Hasil]|[Persamaan]|[Perbedaan]
4|[Nama] ([Tahun])|[Judul lengkap]|[Metode]|[Hasil]|[Persamaan]|[Perbedaan]
5|[Nama] ([Tahun])|[Judul lengkap]|[Metode]|[Hasil]|[Persamaan]|[Perbedaan]
<<<TABLE_END>>>

Berdasarkan tabel di atas, dapat disimpulkan bahwa:
- [Analisis kesamaan temuan 2-3 kalimat]
- [Analisis perbedaan dan gap penelitian 2-3 kalimat]
- [Posisi penelitian ini dibanding penelitian terdahulu 2-3 kalimat]

2.3 Kerangka Pemikiran
Tulis 4-5 paragraf yang menjelaskan alur logis penelitian:
- Variabel independen dan karakteristiknya
- Variabel dependen dan karakteristiknya
- Bagaimana variabel independen mempengaruhi variabel dependen
- Dasar teoritis hubungan tersebut
- Kesimpulan kerangka pemikiran

2.4 Hipotesis Penelitian
Berdasarkan kerangka pemikiran di atas, hipotesis penelitian ini adalah:
H1: Terdapat pengaruh [variabel X] terhadap [variabel Y]
H2: [Hipotesis kedua jika ada]
H3: [Hipotesis ketiga jika ada]

Penjelasan:
- H1 didasarkan pada teori [nama teori] yang menyatakan bahwa...
- H2 didasarkan pada...`,

    3: `BAB III - METODOLOGI PENELITIAN

TULIS BAB III YANG SANGAT LENGKAP dengan TABEL-TABEL (minimal 2000 kata, setara 5-6 halaman). Metode: ${params.method}.

3.1 Jenis Penelitian
Tulis 2-3 paragraf yang menjelaskan:
- Jenis penelitian yang digunakan (${params.method})
- Alasan pemilihan metode ini
- Kelebihan metode untuk menjawab rumusan masalah

3.2 Lokasi dan Waktu Penelitian

3.2.1 Lokasi Penelitian
Penelitian ini dilaksanakan di [lokasi]. Pemilihan lokasi ini didasarkan pada pertimbangan:
1. [Alasan pertama]
2. [Alasan kedua]
3. [Alasan ketiga]

3.2.2 Waktu Penelitian
Penelitian ini dilaksanakan selama [durasi] bulan, yaitu dari bulan [awal] sampai [akhir] tahun [tahun].

<<<TABLE_START>>>
JADWAL_PENELITIAN
No|Kegiatan|Bulan 1|Bulan 2|Bulan 3|Bulan 4|Bulan 5|Bulan 6
1|Penyusunan Proposal|X|X|-|-|-|-
2|Seminar Proposal|-|X|-|-|-|-
3|Penyusunan Instrumen|-|X|X|-|-|-
4|Pengumpulan Data|-|-|X|X|-|-
5|Pengolahan Data|-|-|-|X|X|-
6|Analisis Data|-|-|-|-|X|-
7|Penulisan Laporan|-|-|-|-|X|X
8|Sidang Skripsi|-|-|-|-|-|X
<<<TABLE_END>>>

3.3 Populasi dan Sampel

3.3.1 Populasi
Populasi dalam penelitian ini adalah [deskripsi populasi]. Jumlah populasi adalah [jumlah] [satuan].

3.3.2 Sampel
Teknik pengambilan sampel menggunakan [teknik sampling]. Penentuan jumlah sampel menggunakan rumus [Slovin/Yamane/lainnya]:

n = N / (1 + N.e²)

Keterangan:
n = Jumlah sampel
N = Jumlah populasi
e = Margin of error (5% atau 0,05)

Dengan populasi N = [jumlah] dan margin of error 5%, maka:
n = [jumlah] / (1 + [jumlah] × 0,05²)
n = [hasil perhitungan]
n = [jumlah sampel] responden

3.3.3 Kriteria Sampel
Kriteria inklusi:
1. [Kriteria 1]
2. [Kriteria 2]
3. [Kriteria 3]

Kriteria eksklusi:
1. [Kriteria 1]
2. [Kriteria 2]

3.4 Variabel Penelitian dan Definisi Operasional

3.4.1 Variabel Penelitian
- Variabel Independen (X): [nama variabel]
- Variabel Dependen (Y): [nama variabel]

3.4.2 Definisi Operasional

<<<TABLE_START>>>
DEFINISI_OPERASIONAL
No|Variabel|Definisi Operasional|Indikator|Skala
1|[Variabel X]|[Definisi operasional variabel X dalam konteks penelitian ini]|1. [Indikator 1] 2. [Indikator 2] 3. [Indikator 3] 4. [Indikator 4]|Likert 1-5
2|[Variabel Y]|[Definisi operasional variabel Y dalam konteks penelitian ini]|1. [Indikator 1] 2. [Indikator 2] 3. [Indikator 3] 4. [Indikator 4]|Likert 1-5
<<<TABLE_END>>>

3.5 Teknik Pengumpulan Data

3.5.1 Sumber Data
a) Data Primer: Data yang diperoleh langsung dari responden melalui kuesioner/wawancara.
b) Data Sekunder: Data yang diperoleh dari dokumen, literatur, dan sumber tertulis lainnya.

3.5.2 Metode Pengumpulan Data
1. Kuesioner: [Penjelasan 2-3 kalimat]
2. Dokumentasi: [Penjelasan 2-3 kalimat]
3. [Metode lain jika ada]

3.6 Instrumen Penelitian

3.6.1 Kisi-kisi Instrumen

<<<TABLE_START>>>
KISI_KISI_INSTRUMEN
No|Variabel|Indikator|Nomor Item|Jumlah
1|[Variabel X]|[Indikator 1]|1, 2, 3|3
-|-|[Indikator 2]|4, 5, 6|3
-|-|[Indikator 3]|7, 8, 9, 10|4
2|[Variabel Y]|[Indikator 1]|11, 12, 13|3
-|-|[Indikator 2]|14, 15, 16|3
-|-|[Indikator 3]|17, 18, 19, 20|4
Total|||20
<<<TABLE_END>>>

3.6.2 Skala Pengukuran
Penelitian ini menggunakan skala Likert dengan 5 alternatif jawaban:

<<<TABLE_START>>>
SKALA_LIKERT
Jawaban|Skor Positif|Skor Negatif
Sangat Setuju (SS)|5|1
Setuju (S)|4|2
Netral (N)|3|3
Tidak Setuju (TS)|2|4
Sangat Tidak Setuju (STS)|1|5
<<<TABLE_END>>>

3.7 Teknik Analisis Data

3.7.1 Analisis Statistik Deskriptif
Analisis deskriptif digunakan untuk menggambarkan karakteristik responden dan variabel penelitian meliputi:
- Distribusi frekuensi
- Mean, median, modus
- Standar deviasi
- Kategori (rendah, sedang, tinggi)

3.7.2 Uji Prasyarat Analisis
a) Uji Normalitas: Menggunakan Kolmogorov-Smirnov atau Shapiro-Wilk. Data dikatakan normal jika nilai signifikansi > 0,05.

b) Uji Linearitas: Menggunakan Test for Linearity. Hubungan dikatakan linear jika nilai Deviation from Linearity > 0,05.

c) Uji Multikolinearitas: Menggunakan nilai VIF dan Tolerance. Tidak terjadi multikolinearitas jika VIF < 10 dan Tolerance > 0,1.

d) Uji Heteroskedastisitas: Menggunakan uji Glejser. Tidak terjadi heteroskedastisitas jika nilai signifikansi > 0,05.

3.7.3 Uji Hipotesis
[Untuk penelitian kuantitatif, jelaskan teknik analisis: regresi, korelasi, t-test, dll]

Kriteria pengambilan keputusan:
- Jika nilai signifikansi < 0,05, maka H0 ditolak (hipotesis diterima)
- Jika nilai signifikansi > 0,05, maka H0 diterima (hipotesis ditolak)

3.8 Uji Validitas dan Reliabilitas

3.8.1 Uji Validitas
Uji validitas menggunakan teknik korelasi Product Moment Pearson. Item dikatakan valid jika:
- r hitung > r tabel, atau
- Nilai signifikansi < 0,05

3.8.2 Uji Reliabilitas
Uji reliabilitas menggunakan Cronbach's Alpha dengan kriteria:

<<<TABLE_START>>>
KRITERIA_RELIABILITAS
Nilai Cronbach Alpha|Kategori
> 0,90|Sangat Reliabel
0,70 - 0,90|Reliabel
0,50 - 0,70|Cukup Reliabel
< 0,50|Kurang Reliabel
<<<TABLE_END>>>

Instrumen dikatakan reliabel jika nilai Cronbach's Alpha > 0,70.`,

    4: `BAB IV - HASIL DAN PEMBAHASAN

TULIS BAB IV YANG KOMPREHENSIF (minimal 1800 kata).

4.1 Gambaran Umum Objek Penelitian
[Deskripsikan lokasi/organisasi penelitian dalam 2-3 paragraf]

4.2 Deskripsi Data Penelitian

4.2.1 Karakteristik Responden
[Deskripsikan karakteristik responden berdasarkan demografi]

4.2.2 Deskripsi Variabel Penelitian
[Sajikan statistik deskriptif setiap variabel]

4.3 Hasil Pengujian

4.3.1 Hasil Uji Validitas dan Reliabilitas
[Jelaskan hasil uji instrumen]

4.3.2 Hasil Uji Prasyarat
[Jelaskan hasil uji normalitas, linearitas, dll]

4.3.3 Hasil Uji Hipotesis
[Sajikan hasil pengujian hipotesis dengan interpretasi]

4.4 Pembahasan
[Bahas setiap hipotesis, hubungkan dengan teori dan penelitian terdahulu]

4.5 Keterbatasan Penelitian
[Sebutkan 3-5 keterbatasan penelitian]`,

    5: `BAB V - PENUTUP

TULIS BAB V YANG PADAT (minimal 800 kata).

5.1 Kesimpulan
Berdasarkan hasil penelitian dan pembahasan, dapat disimpulkan:
1. [Kesimpulan rumusan masalah 1]
2. [Kesimpulan rumusan masalah 2]
3. [Kesimpulan rumusan masalah 3]

5.2 Implikasi Penelitian

5.2.1 Implikasi Teoritis
[Kontribusi terhadap pengembangan teori]

5.2.2 Implikasi Praktis
[Kontribusi praktis bagi stakeholder]

5.3 Saran

5.3.1 Saran Praktis
[Saran untuk institusi/organisasi terkait]

5.3.2 Saran untuk Penelitian Selanjutnya
[Saran untuk peneliti lanjutan]`,
  };

  const styleGuide: Record<string, string> = {
    APA7: "APA 7th Edition - format: (Penulis, Tahun)",
    Vancouver: "Vancouver - format: [nomor]",
    Chicago: "Chicago - format: (Penulis Tahun)",
    IEEE: "IEEE - format: [nomor]",
  };

  const prompt = `Kamu adalah dosen pembimbing skripsi profesional yang membantu mahasiswa menulis draf skripsi dalam Bahasa Indonesia yang LENGKAP dan AKADEMIS.

JUDUL SKRIPSI: "${params.thesisTitle}"
JURUSAN: ${params.department}
METODE: ${params.method}
GAYA SITASI: ${styleGuide[params.citationStyle]}

INSTRUKSI PENULISAN ${params.chapterTitle.toUpperCase()}:
${chapterInstructions[params.chapterNumber]}

SUMBER REFERENSI YANG HARUS DIGUNAKAN:
${sourceList}

ATURAN FORMAT TABEL:
Untuk membuat tabel, gunakan format khusus:
<<<TABLE_START>>>
NAMA_TABEL
Header1|Header2|Header3
Data1|Data2|Data3
Data4|Data5|Data6
<<<TABLE_END>>>

ATURAN SITASI:
1. Gunakan HANYA sumber dari daftar di atas
2. Format sitasi: ${styleGuide[params.citationStyle]}
3. Setiap klaim penting WAJIB ada sitasinya
4. JANGAN membuat sitasi dari sumber yang tidak ada di daftar

ATURAN PENULISAN:
1. Bahasa Indonesia akademik formal dan baku
2. Paragraf harus panjang dan berisi (minimal 4-5 kalimat per paragraf)
3. Gunakan transisi antar paragraf yang baik
4. Struktur heading: gunakan format "1.1", "1.2", dst untuk sub-bab
5. JANGAN menyingkat atau memotong - tulis LENGKAP

TULIS ${params.chapterTitle.toUpperCase()} SEKARANG:`;

  const msg = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 8000,
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.choices[0]?.message?.content ?? "";
}
