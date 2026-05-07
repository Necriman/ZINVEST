/* eslint-disable max-len */
/**
 * O‘zbekcha (lotin) «Moliya asoslari» — o‘quv qamrovi EN/RU bilan mos.
 */
import type { StructuredLesson } from "@/lib/lesson-blocks";

export const FINANCE_UZ_LESSON_1: StructuredLesson = {
  title: "Moliya nima?",
  content: [
    { type: "heading", text: "1.1 Moliyaning ta'rifi" },
    {
      type: "paragraph",
      text: "«Moliya» so‘zi o‘rta asr lotinchasidagi finis — «tugash», ayniqsa qarzni yopishdan kelib chiqgan. Keyin fransuzcha finance — pul boshqaruvi ma’nosiga aylangan. Bugun moliya inson bilimining eng keng sohalaridan biri.",
    },
    { type: "heading", text: "Rasmiy ta'rif" },
    {
      type: "paragraph",
      text: "Moliya — bu shaxslar, korxonalar va davlatlar pul mablag‘larini vaqt bo‘yicha qanday jalb qilish, taqsimlash, investitsiya qilish va boshqarishni, xavf va noaniqlikni hisobga olib o‘rganadigan fan. To‘rtta harakat: (1) Jalb qilish — manba: aksiya, kredit, ish haqi, soliq, obligatsiya. (2) Taqsimlash — qayerga yo‘naltirish: zavod, xodimlar, qimmatli qog‘ozlar; samaradorlik shundan kelib chiqadi. (3) Investitsiya — bugun sarflash, ertaga ko‘proq olish; deyarli har bir qaror investitsion. (4) Boshqaruv — doimiy nazorat, xavf va strategiyani tuzatish.",
    },
    { type: "heading", text: "1-rasm — Moliya: tanqid, vaqt, xavf va qiymat chorrahasida" },
    { type: "heading", text: "Markaziy savol" },
    {
      type: "paragraph",
      text: "Kursning tubida bir savol: cheklangan pul bugun va noaniq kelajakda, hozir qayerga solsak, vaqt o‘tishi bilan eng ko‘p QIYMAT yaratamiz? Omonatdan pensiya tizimigacha — bularning barchasi shu savolga javob qidirish.",
    },
    {
      type: "heading",
      text: "Moliya nima EMAS",
    },
    {
      type: "paragraph",
      text: "Moliya faqat «ko‘proq topish» emas: ba’zan to‘g‘ri qaror — investitsiya qilmaslik, aksiyadorlarga pul qaytarish yoki ijtimoiy dasturlar uchun qarz olish; maqsad — maksimal yig‘im emas, optimal taqsimlash. Moliya buxgalteriya emas: buxgalteriya o‘tganini yozadi, moliya keyingi qadamni hal qiladi. Moliya faqat boylar uchun emas: daromad oladigan, ijara to‘laydigan yoki jamg‘arma qiladigan har bir kishi allaqachon shaxsiy moliyada. Moliya faqat matematika emas: markazda noaniqlik ostida qaror; bir xil raqamlar turli xulosalarga olib kelishi mumkin.",
    },
    {
      type: "heading",
      text: "Misollar: kundalik hayotda moliya",
    },
    {
      type: "paragraph",
      text: "5000 dollar tejamkoringiz bor. A: 2% depozit — yil oxiriga ~5100. B: 18% kredit kartasini yopish — bu 18% «daromad» ga teng. C: indeks fondi ~10% xavf bilan. Bu jalb, taqsimlash, investitsiya va boshqaruv; «to‘g‘ri» javob vaqt va xavfga bog‘liq.",
    },
    { type: "heading", text: "1.2 Moliyaning uch ustuni" },
    {
      type: "paragraph",
      text: "Butun fan uch sohaga bo‘linadi: KIM qaror qiladi va QANDAY maqsadni ko‘zlaydi.",
    },
    { type: "heading", text: "2-rasm — Uch ustun va asosiy vazifalar" },
    {
      type: "heading",
      text: "Ustun 1: shaxsiy moliya",
    },
    {
      type: "paragraph",
      text: "Byudjet va naqd oqim; jamg‘arma va investitsiya (erta boshlash va murakkab foiz); qarzlar (haqiqiy qarz narxi); sug‘urta va xavf; pensiya; soliqqa samaradorlik. OECD va boshqa tadqiqotlar: savodxonlik yuqori bo‘lsa, sof kapital odatda kattaroq, yuqori foizli qarz kamroq.",
    },
    {
      type: "heading",
      text: "Ustun 2: korporativ moliya",
    },
    {
      type: "paragraph",
      text: "Maqsad — egalar uchun qiymatni maksimal qilish. Investitsiya qarorlari (NPV, IRR, okupa muddati); kapital tuzilmasi (qarz va o‘z kapitali); aylanma kapital; dividend va buyback; M&A. Misol: Apple — mahsulotlarga katta investitsiya, naqd zaxira, past stavkada qarz va buyback, o‘sish sekinlagach dividend siyosati.",
    },
    {
      type: "heading",
      text: "Ustun 3: davlat moliyasi",
    },
    {
      type: "paragraph",
      text: "Soliqlar, byudjet, davlat qarzi, ijtimoiy sug‘urta, pul-siyosat bilan o‘zaro ta’sir. Qarorlar maktab, yo‘l, tibbiyot va xavfsizlikka ta’sir qiladi.",
    },
    {
      type: "heading",
      text: "Ustunlarning qisqacha jadvali",
    },
    {
      type: "paragraph",
      text: "Shaxsiy: xonadonlar; maqsad — farovonlik; uzoq muddat. Korporativ: menejerlar va CFO; maqsad — firma qiymati; loyihalar 1–30 yil. Davlat: davlat; maqsad — jamiyat farovonligi; avlodlar bo‘yicha uzoq muddat. Ko‘rsatkichlar: sof boylik; aksiya va ROIC; YaIM, bandlik, tenglik.",
    },
    { type: "heading", text: "1.3 Nima uchun moliya muhim" },
    {
      type: "paragraph",
      text: "Moliyaviy savodxonlik boylikka bevosita ta’sir qiladi: murakkab foiz (masalan, 10 000 so‘m 8% bilan 40 yilda ko‘payadi); xatolar (kredit kartalari, diversifikatsiyasizlik) umr bo‘yi minglab yo‘qotish. Biznes uchun muhim — naqd oqim, faqat hisobdagi foyda emas; kapital narxi — loyihalar uchun «chetan». Dunyoni tushunish: inflyatsiya, stavkalar, inqirozlar — moliyaviy hodisalar. Karyera: moliya — har sohadagi «biznes tili».",
    },
    { type: "heading", text: "3-rasm — Bilimning beshta foydali o‘lchami" },
    {
      type: "heading",
      text: "1.3 bo‘limi xulosasi",
    },
    {
      type: "paragraph",
      text: "Moliya Wall Street uchun tor mutaxassislik emas, o‘qish va hisob kabi hayotiy ko‘nikma. Qanchalik erta o‘rganilsa, murakkab foiz shunchalik uzoq ishlaydi.",
    },
    { type: "heading", text: "1.4 Moliya, iqtisod va buxgalteriya" },
    {
      type: "paragraph",
      text: "Mikroiqtisodiyot — agentlar va bozorlar; makroiqtisodiyot — YaIM, inflyatsiya, stavkalar. Iqtisodiyot «nimani» tushuntiradi; moliya shundan foydalanib pul bilan «nima qilish»ni hal qiladi. Buxgalteriya hisobot beradi: foyda-zarar, balans, naqd oqim. Moliya shu ma’lumotlarga tayangan holda kelajakdagi naqd oqim va qiymatni ko‘radi. Amalda: buxgalterlar faktlar, iqtisodchilar bozor konteksti, moliya tahlilchilari modellar va NPV.",
    },
    { type: "heading", text: "4-rasm — Fokus farqlari" },
    {
      type: "heading",
      text: "5-rasm — Qamrov: aktiv narxidan global boshqaruvgacha",
    },
    {
      type: "paragraph",
      text: "Qisqacha: iqtisodiyot — bozorlar qanday ishlaydi; buxgalteriya — nima bo‘ldi; moliya — xavf sharoitida pul bilan keyin nima qilish.",
    },
    { type: "heading", text: "1-modul lug‘at" },
    {
      type: "paragraph",
      text: "Moliya — noaniqlikda vaqt bo‘yicha pul boshqaruvi. Kapital — faoliyat uchun mablag‘. Shaxsiy / korporativ / davlat moliyasi. Kapital byudjeti, kapital tuzilmasi, murakkab foiz, naqd oqim, imkoniyat narxi, xavf, daromad, tanqid, pulning vaqt qiymati, diskontlash, NPV, hisobotlar, bozor va balans qiymati, ichki qiymat, mikro- va makroiqtisodiyot.",
    },
  ],
};

export const FINANCE_UZ_LESSON_2: StructuredLesson = {
  title: "Baholash va pulning vaqt bo‘yicha qiymati",
  content: [
    { type: "heading", text: "2.1 Pulning vaqt bo‘yicha qiymati" },
    {
      type: "paragraph",
      text: "Bir xil summa bugun ertaga qaraganda qimmatroq. Uch sabab: (1) investitsiya imkoniyati — pul hozir ishlashi mumkin; (2) inflyatsiya — sotib olish quvvati vaqt o‘tishi bilan pasayadi; (3) xavf — kelajakdagi to‘lov shubhali, kompensatsiya kerak. Ratsional tanlov: 1 000 000 so‘m bugun yil oxiridagisidan afzal — daromad, inflyatsiya va noaniqlik tufayli.",
    },
    {
      type: "heading",
      text: "Asosiy printsip va qarz misoli",
    },
    {
      type: "paragraph",
      text: "Do‘stingizga 2 000 000 so‘m 3 yilga, alternativa 12% bo‘lsa, adolatli qaytarish 2 mln dan yuqori: 2 000 000×(1,12)³ ≈ 2 809 856, shuningdek inflyatsiya va default xavfi. Foiz ixtiyoriy to‘lov emas, vaqt bo‘yicha pul narxi.",
    },
    {
      type: "heading",
      text: "Misollar: «mato ostidagi naqd»",
    },
    {
      type: "paragraph",
      text: "10 000 000 so‘m uyda 2 yil, depozit 14%, inflyatsiya 9%: depozitdagi o‘sish va real quvvat yo‘qotilishi — harakatsizlik ham narxlangan qaror.",
    },
    {
      type: "heading",
      text: "2.2 Hozirgi qiymat (PV)",
    },
    {
      type: "paragraph",
      text: "PV javob beradi: kelajakdagi to‘lov bugun qancha turadi? PV = FV / (1 + r)^n; FV — kelajakdagi summa, r — davr stavkasi (ulush), n — davrlar soni. r va n oshsa PV kamayadi. Misol: 15 000 000 4 yildan keyin 10% da: (1,1)^4 = 1,4641, PV ≈ 10 245 181. Diskont stavkasi xavf darajasidagi alternativ daromadni aks ettirishi kerak. Past stavka — ortiqcha to‘lov; yuqori stavka — imkoniyatni boy berish.",
    },
    { type: "heading", text: "2.3 Kelajakdagi qiymat (FV)" },
    {
      type: "paragraph",
      text: "FV = PV×(1 + r)^n — murakkab foizning asosi. Oddiy foiz — faqat asosdan; murakkab — foiz ustiga foiz, o‘sish tezlashadi. Misol: 1 mln, 10%, 5 yil — oddiy ~1,5 mln, murakkab ~1,61 mln. 72 qoidasi: ikkilanish vaqti ≈ 72 / foiz (%). 22 yoshda boshlagan vs 32 da — bir xil daromadda erta boshlash kuchliroq.",
    },
    {
      type: "heading",
      text: "Murakkab foiz va 72 qoidasi",
    },
    {
      type: "paragraph",
      text: "Uzoq muddatda murakkab va oddiy foiz katta farq qiladi; qarz oluvchi uchun murakkab foiz sizga qarshi ishlaydi. 72 qoidasi — tez baholash.",
    },
    { type: "heading", text: "2.4 Kapitalning imkoniyat narxi" },
    {
      type: "paragraph",
      text: "Bu — tark etilgan eng yaxshi alternativning (xuddi shu xavf darajasida) daromadi. PV dagi diskont stavkasi mantiqan shu narx. Misollar: depozit/obligatsiya 12–14%; 20% kredit kartasini yopish = solishtirish uchun «xavfsiz» 20%. Past daromadli hisobda saqlash yashirin yo‘qotish.",
    },
    {
      type: "heading",
      text: "Asosiy fikr",
    },
    {
      type: "paragraph",
      text: "Neytral qaror yo‘q: «hech nima qilmaslik» ham imkoniyat narxi bor. «Nimani boy beraman?» deb so‘rang.",
    },
    { type: "heading", text: "2.5 Aktivlarni baholash" },
    {
      type: "paragraph",
      text: "Aktiv egasi uchun kelajakdagi barcha naqd oqimlarining PV si. NPV = diskontlangan oqimlar yig‘indisi − boshlang‘ich investitsiya; NPV > 0 — loyiha qiymat yaratadi. Aksiyalar: dividend, DCF, ko‘paytiruvchilar. Obligatsiyalar: kupon va nominalning PV si; bozor stavkalari oshsa narx tushadi. Ko‘chmas mulk: daromad va solishtirma usullar. Do‘kon misoli, 15% stavka — ijobiy NPV qabul.",
    },
    { type: "heading", text: "2.6 Xavf va daromad" },
    {
      type: "paragraph",
      text: "Kutilayotgan daromad odatda yuqori bo‘lsa, xavf ham yuqori. Xavf — faqat «yo‘qotish» emas, natijaning noaniqligi. Aktivlar, turlar va mamlakatlar bo‘yicha diversifikatsiya portfel xavfini kamaytirishi mumkin — bu nazariy jihatdan «bepul tushlik». Piramida: asos — likvid past xavf; o‘rta — mulk, fondlar; cho‘qqi — faqat yo‘qotishga tayyor pul bilan spekulyatsiya.",
    },
    {
      type: "heading",
      text: "2.6 xulosasi",
    },
    {
      type: "paragraph",
      text: "Xavfsiz tushunmasdan daromaddan keyin qolmang; maqsad — qabul qilinadigan xavf darajasida daromadni optimallashtirish. Murakkab foiz va diversifikatsiya — asosiy vositalar.",
    },
    { type: "heading", text: "2-modul lug‘at" },
    {
      type: "paragraph",
      text: "Pulning vaqt qiymati, PV, FV, diskont stavkasi, murakkab va oddiy foiz, kapitalning imkoniyat narxi, NPV, baholash, ichki qiymat, diskont omili, annuitet, diversifikatsiya, xavf–daromad, kapitalizatsiya stavkasi (cap rate), 72 qoidasi.",
    },
  ],
};
