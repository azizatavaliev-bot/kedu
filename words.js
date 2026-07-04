// Словарь Кеду — HSK 1-2, сгруппировано по темам/урокам.
// Формат: { id, hanzi, pinyin, ru, lesson }
// Массив легко расширяется до тысяч слов — просто добавляй объекты с новым lesson.

const LESSONS = [
  { id: 1, title: "Приветствия", icon: "👋" },
  { id: 2, title: "Местоимения", icon: "🙋" },
  { id: 3, title: "Числа", icon: "🔢" },
  { id: 4, title: "Семья", icon: "👪" },
  { id: 5, title: "Еда и напитки", icon: "🍜" },
  { id: 6, title: "Время", icon: "⏰" },
  { id: 7, title: "Цвета", icon: "🎨" },
  { id: 8, title: "Действия", icon: "🏃" },
  { id: 9, title: "Место", icon: "📍" },
  { id: 10, title: "Погода", icon: "☀️" },
  { id: 11, title: "Тело", icon: "🖐️" },
  { id: 12, title: "Одежда", icon: "👕" },
  { id: 13, title: "Животные", icon: "🐱" },
  { id: 14, title: "Профессии", icon: "💼" },
  { id: 15, title: "Качества", icon: "✨" },
  { id: 16, title: "Вопросы", icon: "❓" },
];

const WORDS = [
  // 1. Приветствия
  { hanzi: "你好", pinyin: "nǐ hǎo", ru: "привет", lesson: 1 },
  { hanzi: "谢谢", pinyin: "xièxie", ru: "спасибо", lesson: 1 },
  { hanzi: "不客气", pinyin: "bú kèqi", ru: "не за что", lesson: 1 },
  { hanzi: "再见", pinyin: "zàijiàn", ru: "до свидания", lesson: 1 },
  { hanzi: "对不起", pinyin: "duìbuqǐ", ru: "извините", lesson: 1 },
  { hanzi: "没关系", pinyin: "méi guānxi", ru: "ничего страшного", lesson: 1 },
  { hanzi: "请", pinyin: "qǐng", ru: "пожалуйста (просьба)", lesson: 1 },
  { hanzi: "是", pinyin: "shì", ru: "быть / да", lesson: 1 },
  { hanzi: "不", pinyin: "bù", ru: "не", lesson: 1 },
  { hanzi: "好", pinyin: "hǎo", ru: "хорошо", lesson: 1 },

  // 2. Местоимения
  { hanzi: "我", pinyin: "wǒ", ru: "я", lesson: 2 },
  { hanzi: "你", pinyin: "nǐ", ru: "ты", lesson: 2 },
  { hanzi: "他", pinyin: "tā", ru: "он", lesson: 2 },
  { hanzi: "她", pinyin: "tā", ru: "она", lesson: 2 },
  { hanzi: "我们", pinyin: "wǒmen", ru: "мы", lesson: 2 },
  { hanzi: "你们", pinyin: "nǐmen", ru: "вы", lesson: 2 },
  { hanzi: "他们", pinyin: "tāmen", ru: "они", lesson: 2 },
  { hanzi: "这", pinyin: "zhè", ru: "это", lesson: 2 },
  { hanzi: "那", pinyin: "nà", ru: "то", lesson: 2 },
  { hanzi: "谁", pinyin: "shéi", ru: "кто", lesson: 2 },

  // 3. Числа
  { hanzi: "一", pinyin: "yī", ru: "один", lesson: 3 },
  { hanzi: "二", pinyin: "èr", ru: "два", lesson: 3 },
  { hanzi: "三", pinyin: "sān", ru: "три", lesson: 3 },
  { hanzi: "四", pinyin: "sì", ru: "четыре", lesson: 3 },
  { hanzi: "五", pinyin: "wǔ", ru: "пять", lesson: 3 },
  { hanzi: "六", pinyin: "liù", ru: "шесть", lesson: 3 },
  { hanzi: "七", pinyin: "qī", ru: "семь", lesson: 3 },
  { hanzi: "八", pinyin: "bā", ru: "восемь", lesson: 3 },
  { hanzi: "九", pinyin: "jiǔ", ru: "девять", lesson: 3 },
  { hanzi: "十", pinyin: "shí", ru: "десять", lesson: 3 },
  { hanzi: "百", pinyin: "bǎi", ru: "сто", lesson: 3 },
  { hanzi: "零", pinyin: "líng", ru: "ноль", lesson: 3 },

  // 4. Семья
  { hanzi: "爸爸", pinyin: "bàba", ru: "папа", lesson: 4 },
  { hanzi: "妈妈", pinyin: "māma", ru: "мама", lesson: 4 },
  { hanzi: "哥哥", pinyin: "gēge", ru: "старший брат", lesson: 4 },
  { hanzi: "弟弟", pinyin: "dìdi", ru: "младший брат", lesson: 4 },
  { hanzi: "姐姐", pinyin: "jiějie", ru: "старшая сестра", lesson: 4 },
  { hanzi: "妹妹", pinyin: "mèimei", ru: "младшая сестра", lesson: 4 },
  { hanzi: "儿子", pinyin: "érzi", ru: "сын", lesson: 4 },
  { hanzi: "女儿", pinyin: "nǚ'ér", ru: "дочь", lesson: 4 },
  { hanzi: "朋友", pinyin: "péngyou", ru: "друг", lesson: 4 },
  { hanzi: "家", pinyin: "jiā", ru: "дом / семья", lesson: 4 },

  // 5. Еда и напитки
  { hanzi: "吃", pinyin: "chī", ru: "есть (кушать)", lesson: 5 },
  { hanzi: "喝", pinyin: "hē", ru: "пить", lesson: 5 },
  { hanzi: "米饭", pinyin: "mǐfàn", ru: "рис (варёный)", lesson: 5 },
  { hanzi: "面条", pinyin: "miàntiáo", ru: "лапша", lesson: 5 },
  { hanzi: "水", pinyin: "shuǐ", ru: "вода", lesson: 5 },
  { hanzi: "茶", pinyin: "chá", ru: "чай", lesson: 5 },
  { hanzi: "咖啡", pinyin: "kāfēi", ru: "кофе", lesson: 5 },
  { hanzi: "牛奶", pinyin: "niúnǎi", ru: "молоко", lesson: 5 },
  { hanzi: "鸡蛋", pinyin: "jīdàn", ru: "яйцо", lesson: 5 },
  { hanzi: "苹果", pinyin: "píngguǒ", ru: "яблоко", lesson: 5 },
  { hanzi: "菜", pinyin: "cài", ru: "блюдо / овощи", lesson: 5 },
  { hanzi: "水果", pinyin: "shuǐguǒ", ru: "фрукты", lesson: 5 },

  // 6. Время
  { hanzi: "今天", pinyin: "jīntiān", ru: "сегодня", lesson: 6 },
  { hanzi: "明天", pinyin: "míngtiān", ru: "завтра", lesson: 6 },
  { hanzi: "昨天", pinyin: "zuótiān", ru: "вчера", lesson: 6 },
  { hanzi: "现在", pinyin: "xiànzài", ru: "сейчас", lesson: 6 },
  { hanzi: "年", pinyin: "nián", ru: "год", lesson: 6 },
  { hanzi: "月", pinyin: "yuè", ru: "месяц", lesson: 6 },
  { hanzi: "号", pinyin: "hào", ru: "число (дата)", lesson: 6 },
  { hanzi: "星期", pinyin: "xīngqī", ru: "неделя", lesson: 6 },
  { hanzi: "点", pinyin: "diǎn", ru: "час", lesson: 6 },
  { hanzi: "分钟", pinyin: "fēnzhōng", ru: "минута", lesson: 6 },
  { hanzi: "早上", pinyin: "zǎoshang", ru: "утро", lesson: 6 },
  { hanzi: "晚上", pinyin: "wǎnshang", ru: "вечер", lesson: 6 },

  // 7. Цвета
  { hanzi: "红色", pinyin: "hóngsè", ru: "красный", lesson: 7 },
  { hanzi: "黄色", pinyin: "huángsè", ru: "жёлтый", lesson: 7 },
  { hanzi: "蓝色", pinyin: "lánsè", ru: "синий", lesson: 7 },
  { hanzi: "绿色", pinyin: "lǜsè", ru: "зелёный", lesson: 7 },
  { hanzi: "黑色", pinyin: "hēisè", ru: "чёрный", lesson: 7 },
  { hanzi: "白色", pinyin: "báisè", ru: "белый", lesson: 7 },
  { hanzi: "颜色", pinyin: "yánsè", ru: "цвет", lesson: 7 },

  // 8. Действия
  { hanzi: "去", pinyin: "qù", ru: "идти / ехать", lesson: 8 },
  { hanzi: "来", pinyin: "lái", ru: "приходить", lesson: 8 },
  { hanzi: "看", pinyin: "kàn", ru: "смотреть / читать", lesson: 8 },
  { hanzi: "听", pinyin: "tīng", ru: "слушать", lesson: 8 },
  { hanzi: "说", pinyin: "shuō", ru: "говорить", lesson: 8 },
  { hanzi: "写", pinyin: "xiě", ru: "писать", lesson: 8 },
  { hanzi: "读", pinyin: "dú", ru: "читать вслух", lesson: 8 },
  { hanzi: "买", pinyin: "mǎi", ru: "покупать", lesson: 8 },
  { hanzi: "做", pinyin: "zuò", ru: "делать", lesson: 8 },
  { hanzi: "学习", pinyin: "xuéxí", ru: "учиться", lesson: 8 },
  { hanzi: "工作", pinyin: "gōngzuò", ru: "работать", lesson: 8 },
  { hanzi: "睡觉", pinyin: "shuìjiào", ru: "спать", lesson: 8 },
  { hanzi: "喜欢", pinyin: "xǐhuan", ru: "нравиться", lesson: 8 },

  // 9. Место
  { hanzi: "学校", pinyin: "xuéxiào", ru: "школа", lesson: 9 },
  { hanzi: "医院", pinyin: "yīyuàn", ru: "больница", lesson: 9 },
  { hanzi: "商店", pinyin: "shāngdiàn", ru: "магазин", lesson: 9 },
  { hanzi: "餐厅", pinyin: "cāntīng", ru: "ресторан", lesson: 9 },
  { hanzi: "公司", pinyin: "gōngsī", ru: "компания / офис", lesson: 9 },
  { hanzi: "北京", pinyin: "Běijīng", ru: "Пекин", lesson: 9 },
  { hanzi: "中国", pinyin: "Zhōngguó", ru: "Китай", lesson: 9 },
  { hanzi: "这里", pinyin: "zhèlǐ", ru: "здесь", lesson: 9 },
  { hanzi: "那里", pinyin: "nàlǐ", ru: "там", lesson: 9 },
  { hanzi: "哪里", pinyin: "nǎlǐ", ru: "где", lesson: 9 },

  // 10. Погода
  { hanzi: "天气", pinyin: "tiānqì", ru: "погода", lesson: 10 },
  { hanzi: "下雨", pinyin: "xiàyǔ", ru: "идёт дождь", lesson: 10 },
  { hanzi: "下雪", pinyin: "xiàxuě", ru: "идёт снег", lesson: 10 },
  { hanzi: "热", pinyin: "rè", ru: "жарко", lesson: 10 },
  { hanzi: "冷", pinyin: "lěng", ru: "холодно", lesson: 10 },
  { hanzi: "太阳", pinyin: "tàiyáng", ru: "солнце", lesson: 10 },
  { hanzi: "风", pinyin: "fēng", ru: "ветер", lesson: 10 },
  { hanzi: "云", pinyin: "yún", ru: "облако", lesson: 10 },

  // 11. Тело
  { hanzi: "头", pinyin: "tóu", ru: "голова", lesson: 11 },
  { hanzi: "手", pinyin: "shǒu", ru: "рука (кисть)", lesson: 11 },
  { hanzi: "脚", pinyin: "jiǎo", ru: "нога (стопа)", lesson: 11 },
  { hanzi: "眼睛", pinyin: "yǎnjing", ru: "глаза", lesson: 11 },
  { hanzi: "嘴", pinyin: "zuǐ", ru: "рот", lesson: 11 },
  { hanzi: "耳朵", pinyin: "ěrduo", ru: "уши", lesson: 11 },

  // 12. Одежда
  { hanzi: "衣服", pinyin: "yīfu", ru: "одежда", lesson: 12 },
  { hanzi: "裤子", pinyin: "kùzi", ru: "брюки", lesson: 12 },
  { hanzi: "鞋子", pinyin: "xiézi", ru: "обувь", lesson: 12 },
  { hanzi: "帽子", pinyin: "màozi", ru: "шапка", lesson: 12 },

  // 13. Животные
  { hanzi: "猫", pinyin: "māo", ru: "кошка", lesson: 13 },
  { hanzi: "狗", pinyin: "gǒu", ru: "собака", lesson: 13 },
  { hanzi: "鸟", pinyin: "niǎo", ru: "птица", lesson: 13 },
  { hanzi: "鱼", pinyin: "yú", ru: "рыба", lesson: 13 },
  { hanzi: "马", pinyin: "mǎ", ru: "лошадь", lesson: 13 },

  // 14. Профессии
  { hanzi: "老师", pinyin: "lǎoshī", ru: "учитель", lesson: 14 },
  { hanzi: "医生", pinyin: "yīshēng", ru: "врач", lesson: 14 },
  { hanzi: "学生", pinyin: "xuésheng", ru: "студент", lesson: 14 },
  { hanzi: "经理", pinyin: "jīnglǐ", ru: "менеджер", lesson: 14 },

  // 15. Качества
  { hanzi: "大", pinyin: "dà", ru: "большой", lesson: 15 },
  { hanzi: "小", pinyin: "xiǎo", ru: "маленький", lesson: 15 },
  { hanzi: "多", pinyin: "duō", ru: "много", lesson: 15 },
  { hanzi: "少", pinyin: "shǎo", ru: "мало", lesson: 15 },
  { hanzi: "高", pinyin: "gāo", ru: "высокий", lesson: 15 },
  { hanzi: "矮", pinyin: "ǎi", ru: "низкий (рост)", lesson: 15 },
  { hanzi: "新", pinyin: "xīn", ru: "новый", lesson: 15 },
  { hanzi: "旧", pinyin: "jiù", ru: "старый (вещь)", lesson: 15 },
  { hanzi: "漂亮", pinyin: "piàoliang", ru: "красивый", lesson: 15 },
  { hanzi: "忙", pinyin: "máng", ru: "занятой", lesson: 15 },

  // 16. Вопросы
  { hanzi: "什么", pinyin: "shénme", ru: "что", lesson: 16 },
  { hanzi: "为什么", pinyin: "wèishénme", ru: "почему", lesson: 16 },
  { hanzi: "怎么", pinyin: "zěnme", ru: "как", lesson: 16 },
  { hanzi: "多少", pinyin: "duōshao", ru: "сколько", lesson: 16 },
  { hanzi: "几", pinyin: "jǐ", ru: "сколько (малое число)", lesson: 16 },
  { hanzi: "吗", pinyin: "ma", ru: "вопросительная частица", lesson: 16 },
].map((w, i) => ({ id: i + 1, ...w }));
