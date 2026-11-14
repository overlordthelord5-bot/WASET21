import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServicesRouter } from './server/servicesRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '8mb' }));
app.use('/api', createServicesRouter());

// In-memory & JSON file persistence for newsletter subscribers
const SUBSCRIBERS_FILE = path.resolve(process.cwd(), 'data', 'newsletter_subscribers.json');

interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  interests?: string[];
  subscribedAt: string;
  source: string;
}

function loadSubscribers(): NewsletterSubscriber[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read subscribers file:', err);
  }
  return [
    {
      id: 'sub-demo-1',
      email: 'founder@techcairo.eg',
      subscribedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      source: 'footer_newsletter',
      interests: ['الضرائب', 'تأسيس الشركات'],
    },
    {
      id: 'sub-demo-2',
      email: 'cfo@alexventures.com',
      subscribedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      source: 'footer_newsletter',
      interests: ['الاستشارات المالية', 'دراسات الجدوى'],
    },
  ];
}

function saveSubscribers(subscribers: NewsletterSubscriber[]): boolean {
  try {
    const dir = path.dirname(SUBSCRIBERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save subscribers file:', err);
    return false;
  }
}

let subscribersList: NewsletterSubscriber[] = loadSubscribers();

// Newsletter Subscription API
app.post('/api/newsletter/subscribe', (req: Request, res: Response) => {
  try {
    const { email, name, interests } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'البريد الإلكتروني مطلوب.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'صيغة البريد الإلكتروني غير صحيحة، يرجى كتابة بريد صالح (مثال: name@example.com).',
      });
    }

    // Check if already subscribed
    const existing = subscribersList.find((s) => s.email === trimmedEmail);
    if (existing) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: 'أهلاً بك مجدداً! أنت مشترك بالفعل في نشرة وسيط الاستشارية وتصلك كافة التحديثات الدورية.',
        subscriberCount: subscribersList.length,
      });
    }

    const newSubscriber: NewsletterSubscriber = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: trimmedEmail,
      name: name ? String(name).trim() : undefined,
      interests: Array.isArray(interests) ? interests : ['استشارات عامة'],
      subscribedAt: new Date().toISOString(),
      source: 'footer_newsletter',
    };

    subscribersList.unshift(newSubscriber);
    saveSubscribers(subscribersList);

    console.log(`[WASEET Newsletter] New subscriber registered: ${trimmedEmail}`);

    return res.status(201).json({
      success: true,
      alreadySubscribed: false,
      message: 'شكراً لاشتراكك! تم تسجيل بريدك الإلكتروني بنجاح في النشرة الاستشارية لمنصة وسيط.',
      subscriberCount: subscribersList.length,
    });
  } catch (error: any) {
    console.error('Error handling newsletter subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ غير متوقع أثناء معالجة الاشتراك. يرجى المحاولة مرة أخرى.',
    });
  }
});

app.get('/api/newsletter/subscribers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: subscribersList.length,
    subscribers: subscribersList.map((s) => ({
      id: s.id,
      email: s.email,
      subscribedAt: s.subscribedAt,
      interests: s.interests,
    })),
  });
});

// API health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    platform: 'WASEET Consulting Marketplace',
    version: '1.0.0',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    newsletterSubscribers: subscribersList.length,
  });
});

// Gemini AI Assistant Server Proxy (Server-side API Key protection)
app.post('/api/ai-assistant', async (req: Request, res: Response) => {
  try {
    const { prompt, userQuery, conversationHistory } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Graceful fallback with domain-specific curated response when API key is not yet set
      return res.json({
        success: true,
        isFallback: true,
        reply: `مرحباً بك في منصة "وسيط"! 
بناءً على طلبك، نوصي بالتواصل مع مستشارينا المعتمدين في قسم **الضرائب وتأسيس الشركات والمحاسبة**.
يمكنك استعراض دليل المستشارين واختيار موعد الاستشارة المناسب لك عبر الفيديو أو المحادثة.

*(ملاحظة نظام: المساعد الذكي يوجهك لاختيار التخصص المناسب، ولا يعد بديلاً عن الاستشارة المهنية المتخصصة).*`,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `أنت المساعد الذكي التفاعلي لمنصة "وسيط" (WASEET) - منصة الوساطة الاستشارية الأولى في جمهورية مصر العربية.
مهمتك:
1. توجيه العميل للتخصص الاستشاري الأنسب لاحتياجه من بين تخصصات المنصة (الضرائب، المحاسبة، تأسيس الشركات GAFI، الاستشارات القانونية، التسويق، البرمجة، دراسات الجدوى، إلخ).
2. مساعدة العميل في صياغة استفساره أو طلب عرض السعر (RFQ) بدقة واحترافية.
3. شرح خطوات حجز الاستشارات ونظام الضمان (Escrow) الذي يحمي حقوق العميل والمستشار بالجنيه المصري.

قواعد صارمة:
- لا تقدم بنفسك رأياً قانونياً أو فتوى قضائية أو تشخيصاً طبياً أو نصيحة استثمارية حاسمة على أنها بديل عن المستشار البشري المرخص.
- شجع دائماً العميل على حجز جلسة استشارية مع أحد خبراء منصة وسيط المعتمدين.
- تحدث بلغة عربية مهنية وودودة تناسب السوق المصري.`;

    const chatContent = `${systemInstruction}\n\nطلب العميل:\n${userQuery || prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatContent,
    });

    return res.json({
      success: true,
      reply: response.text || 'يسعدنا مساعدتك في اختيار المستشار الأنسب عبر منصة وسيط.',
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'تعذر الاتصال بالمساعد الذكي في الوقت الحالي. يمكنك استعراض المستشارين مباشرة من الدليل.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Dev server with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WASEET] Server running at http://localhost:${PORT}`);
  });
}

startServer();
