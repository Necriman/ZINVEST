import type { Language } from "./translations";
import { UNIT_TESTS, type UnitKey, type UnitTest } from "./unit-test-content";

const UNIT_TESTS_RU: Record<UnitKey, UnitTest> = {
  "finance-fundamentals": {
    unitKey: "finance-fundamentals",
    title: "Юнит-тест «Основы финансов»",
    questions: [
      {
        id: "ff-q1",
        prompt: "Выручка и прибыль — одно и то же. Верно или нет?",
        options: ["Верно", "Неверно"],
        correctIndex: 1,
      },
      {
        id: "ff-q2",
        prompt: "Что описывает движение денег в/из бизнеса (а не бухгалтерскую прибыль)?",
        options: ["Прибыль", "Денежный поток", "Выручка"],
        correctIndex: 1,
      },
      {
        id: "ff-q3",
        prompt: "Бюджет нужен в основном для:",
        options: ["Только прогноза налогов", "Планирования и контроля денег"],
        correctIndex: 1,
      },
      {
        id: "ff-q4",
        prompt: "Почему бизнес может показывать прибыль и при этом остаться без денег?",
        options: [
          "Потому что деньги и прибыль всегда совпадают",
          "Потому что моменты платежей и поступлений могут различаться",
          "Потому что прибыль всегда сразу означает наличие денег",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-q5",
        prompt: "Зачем нужен резервный фонд?",
        options: ["Для вложений в акции", "Подушка на непредвиденные расходы"],
        correctIndex: 1,
      },
    ],
  },
  "investing-basics": {
    unitKey: "investing-basics",
    title: "Юнит-тест «Основы инвестирования»",
    questions: [
      {
        id: "ib-q1",
        prompt: "Диверсификация в первую очередь помогает снизить:",
        options: [
          "Все риски до нуля",
          "Риск одного актива (или одного сектора)",
          "Инфляцию автоматически",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q2",
        prompt: "Обычно ETF — это:",
        options: [
          "Одна акция",
          "Фонд с корзиной активов",
          "Сберегательный счёт",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q3",
        prompt: "Риск и доходность обычно:",
        options: [
          "Не связаны",
          "Часто связаны (более высокий потенциальный доход часто с большим риском)",
          "Всегда обратно связаны",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q4",
        prompt: "Сложный процент означает:",
        options: [
          "Процент только на начальную сумму",
          "Процент начисляется на процент со временем",
          "Процент фиксирован и никогда не растёт",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q5",
        prompt: "Долгосрочные инвестиции в целом про:",
        options: [
          "Полное устранение волатильности",
          "Время для роста и сложного процента",
          "Покупки только в один день",
        ],
        correctIndex: 1,
      },
    ],
  },
  "financial-analysis": {
    unitKey: "financial-analysis",
    title: "Юнит-тест «Финансовый анализ»",
    questions: [
      {
        id: "fa-q1",
        prompt: "Баланс в основном отражает:",
        options: [
          "Наличные только за этот месяц",
          "Активы, обязательства и капитал на дату",
          "Выручку каждый день",
        ],
        correctIndex: 1,
      },
      {
        id: "fa-q2",
        prompt: "Отчёт о прибыли и убытках лучше всего описать как:",
        options: [
          "Снимок того, что у вас есть в один момент",
          "Сводку результатов за период",
          "Список только долгов",
        ],
        correctIndex: 1,
      },
      {
        id: "fa-q3",
        prompt: "Если обязательства растут, капитал часто:",
        options: [
          "Должен всегда расти",
          "Может снижаться или расти в зависимости от активов",
          "Всегда остаётся неизменным",
        ],
        correctIndex: 1,
      },
      {
        id: "fa-q4",
        prompt: "Анализ денежного потока помогает понять:",
        options: [
          "Приходят и уходят ли деньги по факту",
          "Только бухгалтерскую прибыль",
          "Только цены акций",
        ],
        correctIndex: 0,
      },
      {
        id: "fa-q5",
        prompt: "Какая метрика напрямую про способность погасить краткосрочные обязательства?",
        options: [
          "Коэффициенты ликвидности / платёжеспособности",
          "Случайный «emoji»-показатель",
          "Узнаваемость бренда",
        ],
        correctIndex: 0,
      },
    ],
  },
  "personal-finance": {
    unitKey: "personal-finance",
    title: "Юнит-тест «Личные финансы»",
    questions: [
      {
        id: "pf-q1",
        prompt: "Кредитный скоринг в основном оценивает:",
        options: ["Рыночные тренды", "Кредитоспособность", "Кулинарные навыки"],
        correctIndex: 1,
      },
      {
        id: "pf-q2",
        prompt: "Управление долгами — это:",
        options: [
          "Игнорировать выплаты",
          "Планировать выплаты и снижать стоимость процентов со временем",
          "Брать долги без плана",
        ],
        correctIndex: 1,
      },
      {
        id: "pf-q3",
        prompt: "Бюджет помогает:",
        options: [
          "Избегать любых расходов",
          "Делать компромиссы и согласовывать траты с целями",
          "Только отслеживать доходность инвестиций",
        ],
        correctIndex: 1,
      },
      {
        id: "pf-q4",
        prompt: "Резервный фонд должен быть:",
        options: [
          "Высоковолатильным и неликвидным",
          "Относительно безопасным и доступным",
          "Сразу использован для долгосрочных вложений",
        ],
        correctIndex: 1,
      },
      {
        id: "pf-q5",
        prompt: "Финансовая цель без срока обычно:",
        options: [
          "Эффективнее",
          "Сложнее спланировать и отследить",
          "Всегда совпадает с бюджетом",
        ],
        correctIndex: 1,
      },
    ],
  },
};

const UNIT_TESTS_UZ: Record<UnitKey, UnitTest> = {
  "finance-fundamentals": {
    unitKey: "finance-fundamentals",
    title: "«Moliya asoslari» unit testi",
    questions: [
      {
        id: "ff-q1",
        prompt: "Daromad va foyda bir xil narsa. To'g'rimi yoki yo'qmi?",
        options: ["To'g'ri", "Noto'g'ri"],
        correctIndex: 1,
      },
      {
        id: "ff-q2",
        prompt: "Qaysi biri biznesga kirgan/chiqkan naqd pulni (hisobdagi foyda emas) ifodalaydi?",
        options: ["Foyda", "Pul oqimi", "Daromad"],
        correctIndex: 1,
      },
      {
        id: "ff-q3",
        prompt: "Byudjet asosan nima uchun:",
        options: ["Faqat soliqlarni bashorat qilish", "Pulni rejalashtirish va nazorat qilish"],
        correctIndex: 1,
      },
      {
        id: "ff-q4",
        prompt: "Nega biznes foyda ko'rsatishi mumkin, lekin naqdsiz qolishi mumkin?",
        options: [
          "Chunki naqd va foyda har doim bir xil",
          "Chunki to'lov va tushum vaqtlari farq qilishi mumkin",
          "Chunki foyda darhol naqd borligini anglatadi",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-q5",
        prompt: "Favqulodda fond maqsadi:",
        options: ["Aksiyalarga investitsiya", "Kutilmagan xarajatlar uchun podushka"],
        correctIndex: 1,
      },
    ],
  },
  "investing-basics": {
    unitKey: "investing-basics",
    title: "«Investitsiya asoslari» unit testi",
    questions: [
      {
        id: "ib-q1",
        prompt: "Diversifikatsiya birinchi navbatda qanday xavfni kamaytirishga yordam beradi:",
        options: [
          "Barcha xavflarni nolga",
          "Bitta aktiv (yoki sektor) xavfi",
          "Inflatsiyani avtomatik",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q2",
        prompt: "ETF odatda:",
        options: [
          "Bitta aksiya",
          "Aktivlar to'plamini ushlab turgan fond",
          "Tejamkorlik hisobi",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q3",
        prompt: "Xavf va daromad odatda:",
        options: [
          "Aloqasiz",
          "Ko'pincha bog'liq (yuqori potentsial daromad ko'pincha yuqori xavf bilan)",
          "Har doim teskari bog'langan",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q4",
        prompt: "Murakkab foiz degani:",
        options: [
          "Faqat boshlang'ich summadan foiz",
          "Vaqt o'tishi bilan foiz foizga qo'shiladi",
          "Foiz doimiy va o'smaydi",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q5",
        prompt: "Uzoq muddatli investitsiya odatda:",
        options: [
          "Volatillikni butunlay yo'q qilish",
          "O'sish va murakkab foiz uchun vaqt berish",
          "Faqat bir kunda sotib olish",
        ],
        correctIndex: 1,
      },
    ],
  },
  "financial-analysis": {
    unitKey: "financial-analysis",
    title: "«Moliyaviy tahlil» unit testi",
    questions: [
      {
        id: "fa-q1",
        prompt: "Balans asosan nimani aks ettiradi:",
        options: [
          "Faqat shu oydagi naqd",
          "Berilgan sanadagi aktivlar, majburiyatlar va kapital",
          "Har kuni daromad",
        ],
        correctIndex: 1,
      },
      {
        id: "fa-q2",
        prompt: "Daromad hisoboti eng yaxshi qilib qanday tasvirlanadi:",
        options: [
          "Bir lahzada egalikdagi narsaning surati",
          "Davr bo'yicha natijalar xulosasi",
          "Faqat qarzlar ro'yxati",
        ],
        correctIndex: 1,
      },
      {
        id: "fa-q3",
        prompt: "Majburiyatlar ossa, kapital ko'pincha:",
        options: [
          "Har doim o'sishi kerak",
          "Aktivlarga qarab kamayishi yoki o'sishi mumkin",
          "Har doim o'zgarmas",
        ],
        correctIndex: 1,
      },
      {
        id: "fa-q4",
        prompt: "Pul oqimi tahlili nimani tushunishga yordam beradi:",
        options: [
          "Naqd haqiqatan kirayotimi-chiqayotimi",
          "Faqat buxgalter foydasi",
          "Faqat aksiya narxlari",
        ],
        correctIndex: 0,
      },
      {
        id: "fa-q5",
        prompt: "Qaysi ko'rsatkich qisqa muddatli majburiyatlarni qoplash qobiliyati haqida eng to'g'ridan-to'g'ri?",
        options: [
          "Likvidlik / to'lov qobiliyati nisbatlari",
          "Tasodifiy emoji ball",
          "Brend xabardorligi",
        ],
        correctIndex: 0,
      },
    ],
  },
  "personal-finance": {
    unitKey: "personal-finance",
    title: "«Shaxsiy moliya» unit testi",
    questions: [
      {
        id: "pf-q1",
        prompt: "Kredit reytingi asosan nimani baholash uchun ishlatiladi:",
        options: ["Bozor tendentsiyalari", "Kredit ishonchliligi", "Oshpazlik mahorati"],
        correctIndex: 1,
      },
      {
        id: "pf-q2",
        prompt: "Qarz boshqaruvi — bu:",
        options: [
          "To'lovlarni e'tiborsiz qoldirish",
          "To'lovlarni rejalashtirish va foiz xarajatini vaqt o'tishi bilan kamaytirish",
          "Rejasiz ko'proq qarz olish",
        ],
        correctIndex: 1,
      },
      {
        id: "pf-q3",
        prompt: "Byudjet yordam beradi:",
        options: [
          "Barcha xarajatlardan qochish",
          "Tanlovlar qilish va xarajatlarni maqsadlarga moslash",
          "Faqat investitsiya daromadini kuzatish",
        ],
        correctIndex: 1,
      },
      {
        id: "pf-q4",
        prompt: "Favqulodda fond bo'lishi kerak:",
        options: [
          "Yuqori volatillik va illikvid",
          "Nisbatan xavfsiz va tez kiradigan",
          "Darhol uzoq muddatli investitsiya uchun ishlatiladi",
        ],
        correctIndex: 1,
      },
      {
        id: "pf-q5",
        prompt: "Muddat yo'q moliyaviy maqsad odatda:",
        options: [
          "Samaraliroq",
          "Rejalashtirish va kuzatish qiyinroq",
          "Har doim byudjet bilan bir xil",
        ],
        correctIndex: 1,
      },
    ],
  },
};

export function getLocalizedUnitTests(language: Language): Record<UnitKey, UnitTest> {
  if (language === "ru") return UNIT_TESTS_RU;
  if (language === "uz") return UNIT_TESTS_UZ;
  return UNIT_TESTS;
}

export function getLocalizedUnitTest(language: Language, unitKey: UnitKey): UnitTest | undefined {
  return getLocalizedUnitTests(language)[unitKey];
}
