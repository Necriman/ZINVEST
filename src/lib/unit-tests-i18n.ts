import type { Language } from "./translations";
import { UNIT_TESTS, type UnitKey, type UnitTest } from "./unit-test-content";

const UNIT_TESTS_RU: Record<UnitKey, UnitTest> = {
  "finance-fundamentals": {
    unitKey: "finance-fundamentals",
    title: "Юнит-тест «Основы финансов»",
    questions: [
      {
        id: "ff-u1-q1",
        prompt: "Слово «finance» исторически восходит к латинскому корню, означающему:",
        options: [
          "Инвестиции и доходность",
          "Завершение или погашение долга",
          "Изучение рынков",
          "Управление риском",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q2",
        prompt: "Какое утверждение ЛУЧШЕ всего отражает центральный вопрос, на который пытаются ответить финансы?",
        options: [
          "Как компании могут максимизировать краткосрочную прибыль каждый квартал?",
          "Куда направить ограниченные деньги сегодня, чтобы создать максимальную ценность во времени?",
          "Как точно учесть прошлые финансовые операции?",
          "Какую ставку центральные банки должны устанавливать для контроля инфляции?",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q3",
        prompt: "Финансовый аналитик изучает отчёт о прибылях и убытках за прошлый год и использует его для прогноза денежных потоков и решения по новому заводу. Какое описание верно?",
        options: [
          "Аналитик занимается бухгалтерией, изучая отчёт о прибылях",
          "Аналитик занимается экономикой, изучая рыночные тренды",
          "Аналитик использует бухгалтерские данные (прошлое) как вход для финансового решения (будущее)",
          "Это не бухгалтерия и не финансы — это операционный менеджмент",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q4",
        prompt: "У вас 8 000 $ сбережений. Вы вкладываете их в индексный фонд с доходностью 9% вместо погашения студенческого кредита под 5%. Какова альтернативная стоимость вашего решения?",
        options: [
          "9% — доходность фонда",
          "5% — сэкономленные проценты по кредиту",
          "4% — разница между ставками",
          "Альтернативной стоимости нет, оба варианта связаны с деньгами",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q5",
        prompt: "Какой столп финансов отвечает за решение компании между выпуском акций и привлечением долга для расширения завода?",
        options: [
          "Личные финансы — это влияет на акционеров",
          "Публичные финансы — государство регулирует рынки",
          "Корпоративные финансы — конкретно структура капитала",
          "Макроэкономика — ставки влияют на оба варианта",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q6",
        prompt: "Компания очень прибыльна с отличными продуктами, но регулярно не получает оплату от клиентов вовремя и страдает от нехватки денег. Какую область корпоративных финансов она запустила?",
        options: [
          "Капитальное бюджетирование",
          "Дивидендная политика",
          "Управление оборотным капиталом",
          "Слияния и поглощения",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q7",
        prompt: "Публичные финансы изучают ПРЕЖДЕ ВСЕГО:",
        options: [
          "Как люди планируют пенсию и управляют долгами",
          "Как работают и регулируются биржи",
          "Как государство привлекает доходы, распределяет расходы и управляет госдолгом",
          "Как ТНК хеджируют валютный риск",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q8",
        prompt: "Три столпа финансов — личные, корпоративные и публичные — отличаются прежде всего:",
        options: [
          "Математическими инструментами",
          "Тем, кто принимает решение и какую цель оптимизирует",
          "Тем, работают ли они на внутреннем или международном рынках",
          "Размером сумм денег",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q9",
        prompt: "5 000 $ инвестировано под 8% в год на 30 лет под сложный процент. Сколько примерно получится? (Подсказка: 5 000 × 1.08^30 ≈ 5 000 × 10,06)",
        options: ["17 000 $", "29 000 $", "50 300 $", "12 000 $"],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q10",
        prompt: "Основатель стартапа уверяет, что его приложение «гарантированно даст 200% за год». Финансово грамотный инвестор СНАЧАЛА спросит:",
        options: [
          "«Как называется приложение и какая стратегия маркетинга?»",
          "«Каков уровень риска — какова вероятность получить ноль или потерять деньги?»",
          "«200% больше, чем 100%?»",
          "«У приложения красивый интерфейс?»",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q11",
        prompt: "Что НАИБОЛЕЕ точно отличает финансы от бухгалтерии?",
        options: [
          "Финансы используют компьютеры; бухгалтерия — бумажные книги",
          "Бухгалтерия фиксирует прошлое; финансы используют эти данные для будущих решений",
          "Финансы важны только для крупных корпораций; бухгалтерия — для всех",
          "Бухгалтерия измеряет денежные потоки; финансы — бухгалтерскую прибыль",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q12",
        prompt: "Макроэкономист прогнозирует рост ставок на 2% в следующем году. Корпоративный финансовый менеджер использует прогноз для повышения ставки дисконтирования в модели бюджетирования капитала, и часть проектов показывают отрицательный NPV. Что это лучше всего иллюстрирует?",
        options: [
          "Конфликт между экономикой и финансами",
          "Как макроэкономические данные напрямую попадают в финансовые модели",
          "Почему бухгалтерские данные надёжнее экономических прогнозов",
          "Что более высокие ставки всегда делают инвестиции выгодными",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q1",
        prompt: "Вы получите 5 000 000 сум через 3 года. Друг предлагает дать 4 000 000 сум сегодня. Депозитная ставка 10% годовых. Что выбрать и почему?",
        options: [
          "Взять 4 000 000 сегодня — деньги в руках всегда лучше",
          "Взять 4 000 000 сегодня, потому что PV 5 млн через 3 года под 10% ≈ 3 756 574 — меньше 4 млн",
          "Подождать 5 000 000, ведь это большая сумма",
          "Разницы нет — у денег нет временной стоимости",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q2",
        prompt: "Какое утверждение ВЕРНО объясняет, зачем существует процент по кредиту?",
        options: [
          "Банки придумали процент ради прибыли",
          "Государство требует процент для контроля инфляции",
          "Процент компенсирует кредитору упущенные инвестиционные возможности, инфляцию и неопределённость",
          "Процент берут только при риске дефолта",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q3",
        prompt: "По формуле PV = FV ÷ (1 + r)^n, какова приведённая стоимость 12 000 000 сум через 2 года при ставке дисконта 15%?",
        options: [
          "10 400 000 сум",
          "9 075 145 сум",
          "10 000 000 сум",
          "11 000 000 сум",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q4",
        prompt: "Две инвестиции обещают 20 000 000 сум через 5 лет. Ставка А — 10%, ставка B — 20%. У какой выше PV?",
        options: [
          "У B, потому что 20% больше",
          "Они равны — обе платят 20 000 000",
          "У A, потому что меньшая ставка даёт больший PV",
          "Невозможно определить без доп. данных",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q5",
        prompt: "Вы вкладываете 3 000 000 сум под 12% сложного процента на 4 года. Какова примерно будущая стоимость?",
        options: [
          "4 440 000 сум",
          "4 716 349 сум",
          "4 000 000 сум",
          "5 200 000 сум",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q6",
        prompt: "Банк предлагает 12% простых или 10% сложных процентов в год на 5 лет. На 1 000 000 сум что лучше?",
        options: [
          "12% простые (1 600 000 сум) — ставка выше",
          "10% сложные (1 610 510 сум) — капитализация даёт больше",
          "Они одинаковы за 5 лет",
          "Простые проценты всегда выгоднее сложных",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q7",
        prompt: "У вас 8 000 000 сум. Вы вкладываете их в акции с ожидаемой доходностью 18%. Банк гарантирует 14%. Через год акции дали лишь 11%. Какова была ваша альтернативная стоимость?",
        options: [
          "11% — фактическая доходность",
          "18% — ожидаемая доходность",
          "14% — депозит, от которого вы отказались",
          "7% — разница между ожиданием (18%) и фактом (11%)",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q8",
        prompt: "Инвестиция приносит 16% в год. Альтернативная стоимость капитала 14%. Стоит ли инвестировать?",
        options: [
          "Нет — 16% недостаточно",
          "Да — доходность выше альтернативной стоимости, инвестиция создаёт ценность",
          "Только если риск нулевой",
          "Только если инвестиция длится не менее 10 лет",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q9",
        prompt: "Вы вкладываете 30 000 000 сум в проект. PV всех будущих потоков — 26 000 000 сум. Каков NPV и что делать?",
        options: [
          "NPV = +26 000 000 — принять",
          "NPV = −30 000 000 — отклонить",
          "NPV = −4 000 000 — отклонить, инвестиция разрушает ценность",
          "NPV = +4 000 000 — принять",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q10",
        prompt: "Облигация платит 10 000 000 сум в год 3 года плюс 100 000 000 сум при погашении. Рыночные ставки резко выросли. Что произойдёт с ценой облигации?",
        options: [
          "Цена вырастет — высокие ставки означают больше дохода",
          "Цена упадёт — фиксированные платежи теперь дисконтируются под более высокую ставку, PV ниже",
          "Ничего не изменится — облигации не зависят от ставок",
          "Цена удвоится",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q11",
        prompt: "Какое из утверждений о риске и доходности ВЕРНО?",
        options: [
          "Можно найти настоящие высокодоходные безрисковые инвестиции, если хорошо искать",
          "Меньший риск всегда означает большую доходность — у безопасных компаний хороший менеджмент",
          "Более высокая ожидаемая доходность всегда сопровождается большим риском — без исключений",
          "Риск важен только для крупных инвесторов, не для частных лиц",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q12",
        prompt: "Инвестор держит 50% в депозитах, 30% в недвижимости и 20% в индексных фондах. Это ЛУЧШЕ всего описано как:",
        options: [
          "Спекуляция",
          "Сложный процент",
          "Диверсифицированный портфель в форме инвестиционной пирамиды",
          "Расчёт альтернативной стоимости",
        ],
        correctIndex: 2,
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
        id: "ff-u1-q1",
        prompt: "«Finance» so‘zi tarixan qaysi lotin ildizidan kelib chiqgan?",
        options: [
          "Investitsiya va daromad",
          "Qarzni yopish yoki tugatish",
          "Bozorlarni o‘rganish",
          "Xavfni boshqarish",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q2",
        prompt: "Quyidagilardan qaysi biri moliya javob izlayotgan markaziy savolni ENG yaxshi ifodalaydi?",
        options: [
          "Kompaniyalar har chorakda qisqa muddatli foydani qanday maksimallashtirishi mumkin?",
          "Bugun cheklangan pulni vaqt o‘tishi bilan eng katta qiymat yaratadigan joyga qanday yo‘naltirish kerak?",
          "O‘tgan moliyaviy operatsiyalarni qanday aniq qayd etish?",
          "Inflyatsiyani nazorat qilish uchun markaziy banklar qaysi stavkani belgilashi kerak?",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q3",
        prompt: "Moliyaviy tahlilchi kompaniyaning o‘tgan yilgi foyda hisobotini ko‘rib chiqib, kelgusi yil naqd oqimlarini bashorat qiladi va yangi zavodga investitsiya qilishni tavsiya etadi. Qaysi javob to‘g‘ri?",
        options: [
          "Tahlilchi foyda hisobotini ko‘rib buxgalterlik bilan shug‘ullanmoqda",
          "Tahlilchi bozor tendentsiyalarini o‘rganib iqtisod bilan shug‘ullanmoqda",
          "Tahlilchi buxgalterlik ma’lumotini (o‘tgan) kelajakdagi moliya qarori uchun kirish sifatida ishlatmoqda",
          "Bu na buxgalteriya, na moliya — bu operatsion menejment",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q4",
        prompt: "Sizda 8 000$ jamg‘arma bor. 5% foiz bilan talabalik kreditini yopish o‘rniga 9% beradigan indeks fondga qo‘yyapsiz. Qaroringizning imkoniyat narxi qancha?",
        options: [
          "9% — fonddagi daromad",
          "5% — kreditni yopib tejaladigan foiz",
          "4% — ikki stavka orasidagi farq",
          "Imkoniyat narxi yo‘q, ikkala variant ham pul bilan bog‘liq",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q5",
        prompt: "Kompaniyaning zavodni kengaytirish uchun yangi aksiya chiqarish yoki qarz olish o‘rtasida tanlovini moliyaning qaysi ustuni hal qiladi?",
        options: [
          "Shaxsiy moliya — bu shaxs aksiyadorlarga ta’sir qiladi",
          "Davlat moliyasi — davlat moliya bozorlarini tartibga soladi",
          "Korporativ moliya — aniqrog‘i kapital tuzilmasi qarori",
          "Makroiqtisodiyot — stavkalar har ikkala variantga ta’sir qiladi",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q6",
        prompt: "Kompaniya juda foydali va yaxshi mahsulotlarga ega, ammo mijozlardan to‘lovlarni o‘z vaqtida yig‘a olmay, doim naqdsiz qoladi. U korporativ moliyaning qaysi sohasini e’tiborsiz qoldirgan?",
        options: [
          "Kapital byudjeti",
          "Dividend siyosati",
          "Aylanma kapital boshqaruvi",
          "Qo‘shilish va sotib olish",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q7",
        prompt: "Davlat moliyasi ENG ko‘proq nimani o‘rganadi?",
        options: [
          "Shaxslar pensiyaga qanday tayyorlanadi va qarzni boshqaradi",
          "Birjalar qanday ishlaydi va tartibga solinadi",
          "Davlat daromadlarni qanday yig‘adi, sarflaydi va davlat qarzini boshqaradi",
          "Transmilliy korporatsiyalar valyuta xavfini qanday himoya qiladi",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q8",
        prompt: "Moliyaning uchta ustuni — shaxsiy, korporativ va davlat — asosan nimasi bilan farqlanadi?",
        options: [
          "Hisoblash uchun matematik vositalari bilan",
          "Kim qaror qabul qilishi va qanday maqsadni optimallashtirishi bilan",
          "Mahalliy yoki xalqaro bozorlarda ishlashi bilan",
          "Pul miqdorlarining hajmi bilan",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q9",
        prompt: "5 000$ 30 yilga 8% murakkab foiz bilan qo‘yildi. Taxminan qancha bo‘ladi? (5 000 × 1.08^30 ≈ 5 000 × 10.06)",
        options: ["17 000$", "29 000$", "50 300$", "12 000$"],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q10",
        prompt: "Startap asoschisi yangi ilovasi «albatta bir yilda 200% beradi» deydi. Moliyaviy savodli investor BIRINCHI bo‘lib nimani so‘raydi?",
        options: [
          "«Ilova nomi va marketing strategiyasi qanday?»",
          "«Xavf darajasi qanday — ilova hech narsa qaytarmaslik yoki yo‘qotish ehtimoli qancha?»",
          "«200% 100% dan kattami?»",
          "«Ilovaning interfeysi chiroylimi?»",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q11",
        prompt: "Quyidagilardan qaysi biri moliyani buxgalteriyadan ENG aniq farqlaydi?",
        options: [
          "Moliya kompyuter ishlatadi; buxgalteriya qog‘oz daftar",
          "Buxgalteriya o‘tganni qayd qiladi; moliya bu ma’lumotni kelajakdagi qarorlar uchun ishlatadi",
          "Moliya faqat yirik korporatsiyalar uchun, buxgalteriya hammaga taalluqli",
          "Buxgalteriya pul oqimlarini, moliya hisobdagi foydani o‘lchaydi",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q12",
        prompt: "Makroiqtisodchi kelgusi yil stavkalar 2% ga oshishini bashorat qiladi. Korporativ moliya menejeri shu prognozdan foydalanib kapital byudjetida diskont stavkasini oshiradi va bir qator loyihalar manfiy NPV ni ko‘rsatadi. Bu eng yaxshi nimani ko‘rsatadi?",
        options: [
          "Iqtisodiyot va moliya o‘rtasidagi qarama-qarshilik",
          "Makroiqtisodiy ma’lumotlar to‘g‘ridan-to‘g‘ri moliyaviy qaror modellariga qanday kirishini",
          "Nima uchun buxgalterlik ma’lumotlari iqtisodiy bashoratlardan ishonchliroqligini",
          "Yuqori stavkalar har doim investitsiyani foydali qilishini",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q1",
        prompt: "Siz 3 yildan keyin 5 000 000 so‘m olasiz. Do‘st bugun 4 000 000 so‘m berishni taklif qiladi. Depozit stavkasi 10% yillik. Qaysini tanlash kerak va nega?",
        options: [
          "Bugun 4 000 000 ni olish — qo‘ldagi pul har doim yaxshi",
          "Bugun 4 000 000 ni olish — 10% da 5 mln ning 3 yildan keyingi PV si atigi 3 756 574, bu 4 mln dan kam",
          "5 000 000 ni kutish — bu kattaroq raqam",
          "Farqi yo‘q — pulning vaqt qiymati yo‘q",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q2",
        prompt: "Quyidagilardan qaysi biri kreditda foiz nima uchun mavjudligini TO‘G‘RI tushuntiradi?",
        options: [
          "Banklar foyda olish uchun foizni o‘ylab topgan",
          "Davlat inflyatsiyani nazorat qilish uchun foizni talab qiladi",
          "Foiz qarz beruvchiga investitsion imkoniyat, inflyatsiya va noaniqlik uchun kompensatsiya beradi",
          "Foiz faqat default xavfi mavjud bo‘lganda olinadi",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q3",
        prompt: "PV = FV ÷ (1 + r)^n formulasi bo‘yicha 2 yildan keyin olinadigan 12 000 000 so‘mning hozirgi qiymati 15% diskont stavkasida qancha?",
        options: [
          "10 400 000 so‘m",
          "9 075 145 so‘m",
          "10 000 000 so‘m",
          "11 000 000 so‘m",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q4",
        prompt: "Ikkala investitsiya 5 yildan keyin 20 000 000 so‘m to‘lashga va’da beradi. A ning diskont stavkasi 10%, B ning 20%. Qaysida PV yuqori?",
        options: [
          "B da, chunki 20% kattaroq raqam",
          "Bir xil — har ikkalasi 20 000 000 to‘laydi",
          "A da, chunki past diskont stavkasi yuqori PV beradi",
          "Qo‘shimcha ma’lumotsiz aniqlab bo‘lmaydi",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q5",
        prompt: "Siz 3 000 000 so‘mni 4 yilga 12% murakkab foiz bilan qo‘ydingiz. Taxminan kelajakdagi qiymat qancha?",
        options: [
          "4 440 000 so‘m",
          "4 716 349 so‘m",
          "4 000 000 so‘m",
          "5 200 000 so‘m",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q6",
        prompt: "Bank 5 yilga 12% oddiy yoki 10% murakkab foiz taklif qiladi. 1 000 000 so‘m uchun qaysi yaxshi?",
        options: [
          "12% oddiy (1 600 000 so‘m) — stavka yuqoriroq",
          "10% murakkab (1 610 510 so‘m) — kapitallashuv ko‘proq beradi",
          "5 yil davomida bir xil",
          "Oddiy foiz har doim murakkabdan yaxshi",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q7",
        prompt: "Sizda 8 000 000 so‘m bor. Uni 18% kutilgan daromadli aksiyalarga qo‘ydingiz. Bank 14% kafolatlaydi. Bir yildan keyin aksiyalar atigi 11% berdi. Imkoniyat narxingiz qancha edi?",
        options: [
          "11% — haqiqiy daromad",
          "18% — kutilgan daromad",
          "14% — siz voz kechgan bank depoziti",
          "7% — kutilgan (18%) va haqiqiy (11%) o‘rtasidagi farq",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q8",
        prompt: "Investitsiya yiliga 16% beradi. Sizning kapitalning imkoniyat narxingiz 14%. Investitsiya qilish kerakmi?",
        options: [
          "Yo‘q — 16% yetarli emas",
          "Ha — daromad imkoniyat narxidan yuqori, demak qiymat yaratiladi",
          "Faqat hech qanday xavf bo‘lmasa",
          "Faqat kamida 10 yil davom etsa",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q9",
        prompt: "Siz loyihaga 30 000 000 so‘m investitsiya qilasiz. Barcha kelajakdagi naqd oqimlarning PV si 26 000 000 so‘m. NPV qancha va nima qilish kerak?",
        options: [
          "NPV = +26 000 000 — qabul qilish",
          "NPV = −30 000 000 — rad etish",
          "NPV = −4 000 000 — rad etish, investitsiya qiymatni yo‘qotadi",
          "NPV = +4 000 000 — qabul qilish",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q10",
        prompt: "Obligatsiya 3 yil davomida har yili 10 000 000 so‘m, qaytarish vaqtida esa 100 000 000 so‘m to‘laydi. Bozor stavkalari keskin ko‘tarildi. Bu obligatsiyaning narxiga nima bo‘ladi?",
        options: [
          "Narx ko‘tariladi — yuqori stavka ko‘proq daromad demakdir",
          "Narx tushadi — qat’iy to‘lovlar endi yuqoriroq stavkada diskontlanadi, PV pasayadi",
          "Hech narsa o‘zgarmaydi — obligatsiyalar stavkaga bog‘liq emas",
          "Narx ikki barobarga oshadi",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q11",
        prompt: "Xavf va daromad haqida quyidagi qaysi fikr TO‘G‘RI?",
        options: [
          "Yaxshi qidirsangiz, haqiqatan yuqori daromadli, nol xavfli investitsiya topish mumkin",
          "Past xavf har doim yuqori daromad bildiradi — xavfsiz kompaniyalar yaxshi boshqariladi",
          "Yuqori kutilgan daromad har doim yuqori xavf bilan keladi — istisnosiz",
          "Xavf faqat yirik investorlar uchun muhim, shaxslar uchun emas",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q12",
        prompt: "Investor 50% ni bank depozitlariga, 30% ni ko‘chmas mulkka, 20% ni indeks fondlariga qo‘yadi. Bu ENG yaxshi qanday tasvirlanadi?",
        options: [
          "Spekulyatsiya",
          "Murakkab foiz",
          "Investitsion piramida ko‘rinishida diversifikatsiyalangan portfel",
          "Imkoniyat narxini hisoblash",
        ],
        correctIndex: 2,
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
