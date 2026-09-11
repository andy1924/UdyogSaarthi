import type { StepContext } from './context';

const STEP_GUIDANCE: Record<string, { en: string; hi: string }> = {
  location: {
    en: 'Set your business location first. Use the GPS button, or type your block, district and state, then continue.',
    hi: 'पहले अपना स्थान चुनें। जीपीएस बटन दबाएँ, या ब्लॉक, जिला और राज्य लिखें, फिर आगे बढ़ें।',
  },
  business: {
    en: 'Pick the business you want to start, then set how much money you can put in yourself.',
    hi: 'जो व्यवसाय शुरू करना है उसे चुनें, फिर बताएँ कि आप स्वयं कितना पैसा लगा सकते हैं।',
  },
  demand: {
    en: 'This step checks whether there is enough demand near you. Read the verdict, then see the suggested opportunities.',
    hi: 'यह चरण देखता है कि आपके आसपास पर्याप्त माँग है या नहीं। नतीजा पढ़ें, फिर सुझाए अवसर देखें।',
  },
  funding: {
    en: 'This step shows the scheme-linked credit and your own contribution. The exact figures are already on screen.',
    hi: 'यह चरण योजना से जुड़ा ऋण और आपका योगदान दिखाता है। सटीक आँकड़े स्क्रीन पर मौजूद हैं।',
  },
  identity: {
    en: 'Verify your identity with DigiLocker so the project report carries your name.',
    hi: 'दिगिलॉकर से अपनी पहचान सत्यापित करें ताकि परियोजना रिपोर्ट में आपका नाम आए।',
  },
  report: {
    en: 'Your project report is ready to generate and download. You can share the PDF with your bank.',
    hi: 'आपकी परियोजना रिपोर्ट बनकर तैयार है। आप इस पीडीएफ को अपने बैंक के साथ साझा कर सकते हैं।',
  },
};

const STEP_KEYS = ['location', 'business', 'demand', 'funding', 'identity', 'report'] as const;

const MONEY_HINT = /loan|amount|money|subsidy|emi|tpc|eqi|पैसा|ऋण|राशि|सब्सिडी/i;
const MIC_HINT = /mic|microphone|voice|speak|सुन|माइक|बोल/i;

function pick(lang: string): 'en' | 'hi' {
  return lang === 'hi' ? 'hi' : 'en';
}

export function offlineAnswer(question: string, context: StepContext, lang: string): string {
  const key = pick(lang);
  if (MONEY_HINT.test(question)) {
    return key === 'hi'
      ? 'सटीक राशि स्क्रीन पर दिखाई गई है। मैं स्वयं कोई गणना नहीं करता - Scheme rules v2024-11 देखें।'
      : 'The exact amount is already shown on screen. I do not calculate it myself - see Scheme rules v2024-11.';
  }
  if (MIC_HINT.test(question)) {
    return key === 'hi'
      ? 'माइक बटन दबाएँ, बोलें, और रुक जाएँ। आपकी आवाज़ इस डिवाइस से बाहर नहीं जाती।'
      : 'Press the mic button, speak, then pause. Your audio never leaves this device.';
  }
  const byStep = STEP_GUIDANCE[STEP_KEYS[context.step - 1] ?? 'location'];
  const base = byStep[key];
  const title = context.stepTitle?.trim() || 'this step';
  return key === 'hi'
    ? `${base} (चरण ${context.step} - ${title})`
    : `${base} (Step ${context.step} - ${title})`;
}

export { STEP_KEYS };
