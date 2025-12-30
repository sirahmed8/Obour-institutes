// --- INTELLIGENT OFFLINE CHATBOT ---

interface OfflineResponse {
  keywords: string[];
  response: string;
  required?: string[]; // Words that MUST be present
  weight?: number; // Priority multiplier
  lang: 'en' | 'ar';
}

const offlineResponses: OfflineResponse[] = [
  // --- ENGLISH RESPONSES ---
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'evening', 'sup', 'yo'],
    response: "Hello there! 👋 I'm **Obour AI** (Offline Mode). I might not be connected to the super-brain right now, but I can still help you:\n\n• Find **Courses & Instructors**\n• Locate **PDFs & Resources**\n• Guide you through **Login & Settings**\n\nWhat's on your mind?",
    weight: 2,
    lang: 'en'
  },
  {
    keywords: ['who', 'are', 'you', 'name', 'bot'],
    response: "I'm Obour AI! 🤖 Currently running on low-power mode (Offline). I can't write essays for you right now, but I can help you find where your lectures are hiding!",
    lang: 'en'
  },
  {
    keywords: ['joke', 'funny', 'laugh'],
    response: "Why did the PDF go to therapy? Because it had too many **attachments**! 😂\n\n(I know, I know... switch to Online Mode for better jokes!)",
    lang: 'en'
  },
  {
    keywords: ['how', 'are', 'you', 'doing', 'status'],
    required: ['how'],
    response: "I'm functioning perfectly! 🌟 Just waiting for some internet to get my full IQ back. How can I help you with your studies?",
    lang: 'en'
  },
  {
    keywords: ['help', 'support', 'assist', 'capabilities', 'can', 'do'],
    response: "I'm your offline assistant! 🛠️ here's what I can do:\n\n• **Finding Courses**: Just type 'Where is Computer Science?'\n• **Resources**: Ask 'How to download files?'\n• **Account**: Ask 'How to login?'\n\nGo ahead, test me!",
    weight: 1.5,
    lang: 'en'
  },
  {
    keywords: ['course', 'subject', 'class', 'lecture', 'material', 'curriculum', 'study'],
    response: "Looking for study material? 📚\n\nAll courses are on the **Home Page**. Click on any colorful card to see:\n• **Dr. Name** (The boss)\n• **PDFs & Links** (The stuff you need)\n• **Announcements**\n\nPro tip: Use the search bar on the home page for speed!",
    lang: 'en'
  },
  {
    keywords: ['pdf', 'download', 'file', 'slide', 'presentation', 'upload', 'access'],
    response: "Here's how to grab your files:\n\n1️⃣ Go to the **Home Page**\n2️⃣ Click your **Course**\n3️⃣ Look for the **'Resources'** list\n4️⃣ Click any file to open/download\n\nEasy peasy! 🍋",
    lang: 'en'
  },
  {
    keywords: ['admin', 'contact', 'problem', 'issue', 'bug', 'error', 'report', 'talk'],
    response: "Need a human? 🙋‍♂️\n\n• Check the footer for **social media links**\n• Use the 'Inbox' to **message support** (requires login)\n• Switch to **Online Mode** to let me draft a message for you!",
    lang: 'en'
  },
  {
    keywords: ['language', 'arabic', 'english', 'switch', 'change', 'translate'],
    response: "Parlez-vous English? Or Arabic? 🌍\n\nClick your **Profile Picture** (top right) -> **Language**. The whole app will flip instantly!",
    lang: 'en'
  },
  {
    keywords: ['theme', 'dark', 'light', 'appearance', 'color', 'mode', 'eye'],
    response: "Too bright? 🕶️\n\nClick your **Profile Picture** -> **Theme** (Moon icon 🌙). Your eyes will thank you!",
    lang: 'en'
  },
  {
    keywords: ['login', 'signin', 'logout', 'signout', 'account', 'register', 'signup', 'password'],
    response: "Access Control 🔐\n\nSimply click **Login** at the top right and use your **Google Account**. No new passwords to remember!",
    lang: 'en'
  },
  {
    keywords: ['thank', 'thanks', 'cool', 'good', 'awesome', 'great', 'love'],
    response: "You're getting me emotional! 🤖❤️ Happy to help. Good luck with those exams!",
    lang: 'en'
  },
  {
    keywords: ['bye', 'goodbye', 'see', 'later'],
    response: "See you later, innovator! 👋 Study hard!",
    lang: 'en'
  },

  // --- ARABIC RESPONSES ---
  {
    keywords: ['اهلا', 'مرحبا', 'سلام', 'عليكم', 'هلا', 'صباح', 'مساء', 'هاى', 'يا هلا', 'ازيك'],
    response: "يا هلا والله! 👋 أنا **ذكاء عبور** (النسخة الأوفلاين). النت قاطع؟ ولا يهمك، أنا لسه شغال وأقدر أساعدك:\n\n• تلاقي **محاضراتك**\n• تحمل **الملفات**\n• تظبط **إعدادات حسابك**\n\nأؤمرني؟",
    weight: 2,
    lang: 'ar'
  },
  {
    keywords: ['مين', 'انت', 'اسمك', 'عرفني'],
    response: "أنا المساعد الذكي بتاع المنصة 🤖. حالياً شغال 'أوفلاين' يعني على قدّي شوية، بس سدّاد في أي سؤال عن الموقع!",
    lang: 'ar'
  },
  {
    keywords: ['نكتة', 'ضحك', 'هزار'],
    response: "مرة ملف PDF راح للدكتور قاله يا دكتور أنا مضغوط! 😂\n\n(معلش النكت محتاجة نت عشان تبقى أحسن، شغل الأونلاين ونجرب تاني!)",
    lang: 'ar'
  },
  {
    keywords: ['كيف', 'حالك', 'اخبارك', 'عامل', 'اية', 'ايه', 'تمام', 'الجو'],
    required: ['كيف', 'اخبارك', 'عامل'],
    response: "أنا زي الفل طول ما أنت بتذاكر! 🌟 جاهز أساعدك في أي وقت. محتاج حاجة معينة؟",
    lang: 'ar'
  },
  {
    keywords: ['مساعدة', 'خدمات', 'تقدر', 'تعمل', 'وظيفة', 'امكانيات', 'اعرف', 'عايز'],
    response: "عيوني ليك! 👀 دي حاجات أقدر أعملها وأنا أوفلاين:\n\n• **عايز مادة؟**: قولي 'فين مادة البرمجة'\n• **عايز تحمل؟**: قولي 'ازاي انزل المحاضرات'\n• **مشكلة؟**: قولي 'اكلم الادارة ازاي'\n\nجرب تسألني!",
    lang: 'ar'
  },
  {
    keywords: ['مادة', 'مواد', 'كورس', 'محاضرة', 'منهج', 'دراسة', 'سكشن', 'محاضرات'],
    response: "كل المواد موجودة في **الصفحة الرئيسية**. دوس على أي مادة هتلاقي:\n\n📚 **اسم الدكتور**\n📁 **المحاضرات والملفات**\n🎨 **لون مميز للمادة**\n\nنصيحة: استخدم البحث اللي برة عشان توصل أسرع!",
    lang: 'ar'
  },
  {
    keywords: ['ملف', 'تحميل', 'بي دي اف', 'سلايد', 'مذكرة', 'pdf', 'ورق', 'شيت', 'تنزيل', 'افتح'],
    response: "بسيطة جداً! عشان تحمل أي حاجة:\n\n1️⃣ افتح **المادة** من برة\n2️⃣ انزل لقسم **المصادر (Resources)**\n3️⃣ دوس على الملف ويتحمل علطول\n\nالموضوع سهل ومش محتاج لفة! 🍋",
    lang: 'ar'
  },
  {
    keywords: ['مشكلة', 'تواصل', 'ادمن', 'مدير', 'خطأ', 'عطل', 'مشكله', 'شكوى', 'اكلم'],
    response: "عايز تكلم حد حقيقي؟ 🙋‍♂️\n\n• انزل تحت خالص هتلاقي **فيسبوك وواتساب**\n• ابعت **رسالة للإدارة** من صفحة الـ Inbox (لو مسجل دخول)\n• شغل **الأونلاين** وأنا أكتبلك الرسالة!",
    lang: 'ar'
  },
  {
    keywords: ['لغة', 'عربي', 'انجليزي', 'ترجمة', 'غير', 'لغه', 'اللغة', 'حول'],
    response: "عايز تقلب اللغة؟ 🌍\n\nدوس على **صورتك** فوق -> اختار **اللغة (Language)**.\nالموقع كله هيتشقلب عربي أو إنجليزي في ثانية!",
    lang: 'ar'
  },
  {
    keywords: ['ثيم', 'مظهر', 'لون', 'داكن', 'فاتح', 'وضع', 'مود', 'شكل', 'نور', 'ضلمة'],
    response: "النور ضارب في عينك؟ 🕶️\n\nدوس على **صورتك** -> ودوس على **علامة القمر 🌙**.\nوضع الـ Dark Mode رايق ومريح للعين!",
    lang: 'ar'
  },
  {
    keywords: ['دخول', 'خروج', 'حساب', 'تسجيل', 'باسوورد', 'ادخل', 'اخرج', 'ايميل'],
    response: "الدخول سهل جداً 🔐\n\nدوس **تسجيل دخول (Sign In)** فوق واستخدم **حساب جوجل**.\nولا باسوورد ولا وجع قلب، كله أوتوماتيك!",
    lang: 'ar'
  },
  {
    keywords: ['شكر', 'شكرا', 'تسلم', 'عاش', 'حلو', 'جميل', 'جيد', 'تمام', 'كفو', 'متشكر', 'الف', 'حبيبي'],
    response: "حبيبي والله! 😊 أنا موجود عشانك. شد حيلك في المذاكرة وكله هيبقى تمام! 📖✨",
    lang: 'ar'
  },
  {
    keywords: ['مع السلامة', 'باي', 'سلام', 'اشوفك', 'سلام عليكم', 'غور'],
    response: "سلام يا بطل! 👋 بالتوفيق. لو عوزت أي حاجة أنا موجود 24/7 (حتى لو النت قاطع)!",
    lang: 'ar'
  }
];

const fallbackResponseEn = "I'm currently in **Offline Mode** and my brain is a bit tiny right now 🤏. I missed that.\n\nCould you try one of these?\nkeywords:\n• **'Where are courses?'**\n• **'How to download?'**\n• **'Change theme'**";
const fallbackResponseAr = "أنا حالياً **أوفلاين** ومخي على قده شوية 🤏. مفهمتش قصدك.\n\nممكن تجرب تقول:\n• **'فين المواد؟'**\n• **'احمل الملفات ازاي؟'**\n• **'غير الشكل'**";

function isArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
}

/**
 * Get a smart response from the offline chatbot engine using fuzzy keyword scoring
 */
export function getOfflineResponse(userMessage: string): string {
  const isAr = isArabic(userMessage);
  const lowerMessage = userMessage.toLowerCase().trim();
  const tokens = lowerMessage.split(/[\s,?!.]+/).filter(t => t.length > 1); // Tokenize
  
  let bestMatch: OfflineResponse | null = null;
  let highestScore = 0;

  // Filter responses by language
  const targetResponses = offlineResponses.filter(r => r.lang === (isAr ? 'ar' : 'en'));

  for (const item of targetResponses) {
    let score = 0;
    let matchesRequired = !item.required; 
    
    // Check required words if they exist
    if (item.required) {
      matchesRequired = item.required.some(req => lowerMessage.includes(req));
    }

    if (!matchesRequired && item.required) continue; 

    // Calculate score based on keyword matches
    item.keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        score += (item.weight || 1);
        // Bonus for exact token match
        if (tokens.includes(keyword)) score += 0.5;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Lower threshold slightly to be more chatty, but keep relevance
  if (bestMatch && highestScore >= 0.5) {
    return bestMatch.response;
  }
  
  return isAr ? fallbackResponseAr : fallbackResponseEn;
}
