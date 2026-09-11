import type { StepContext } from './context';

const STEP_GUIDANCE: Record<string, { en: string; hi: string }> = {
  location: {
    en: 'This is the location step, and it is the first thing the wizard needs from you. The place you set here decides your district, your local market and the registered businesses around you, so every number in the later steps is about your own area. Tap the GPS button to use where you are standing, or type your block, district and state by hand, then continue.',
    hi: 'यह स्थान चरण है, और यही जानकारी विज़ार्ड को सबसे पहले चाहिए। आपकी चुनी हुई जगह से आपका जिला, आपका स्थानीय बाज़ार और आसपास के दर्ज व्यवसाय तय होते हैं, इसलिए आगे के सारे आँकड़े आपके ही इलाके के होंगे। जीपीएस बटन दबाकर अपनी मौजूदा जगह चुनें, या ब्लॉक, जिला और राज्य हाथ से लिखें, और फिर अगले चरण पर बढ़ें।',
  },
  business: {
    en: 'This is the business step. Here you choose the work you want to start and say how much money you can put in yourself, which is called your own contribution. That single choice decides which schemes you qualify for, so pick honestly and change it later if you need to.',
    hi: 'यह व्यवसाय चरण है। यहाँ आप चुनते हैं कि आप कौन-सा काम शुरू करना चाहते हैं और बताते हैं कि आप स्वयं कितना पैसा लगा सकते हैं, जिसे आपका अपना योगदान कहते हैं। यही एक चुनाव तय करता है कि आप किन योजनाओं के लिए पात्र हैं, इसलिए ईमानदारी से चुनें और ज़रूरत पड़ने पर बाद में बदल दें।',
  },
  demand: {
    en: 'This is the demand and market step. Before you spend any money, it counts how many registered businesses like yours already work around you, and how much room is left for one more. The verdict and the score on this page come from that count, and the opportunity cards below suggest what could work well in your area. Read the verdict first, then look at the opportunities, and re-run the check if the numbers look old.',
    hi: 'यह माँग और बाज़ार का चरण है। पैसा लगाने से पहले यह गिनता है कि आपके आसपास आपके जैसे कितने दर्ज व्यवसाय पहले से चल रहे हैं, और एक और के लिए कितनी जगह बची है। इस पेज का नतीजा और स्कोर उसी गिनती से बनते हैं, और नीचे के अवसर कार्ड बताते हैं कि आपके इलाके में क्या अच्छा चल सकता है। पहले नतीजा पढ़ें, फिर अवसर देखें, और अगर आँकड़े पुराने लगें तो जाँच दोबारा चलाएँ।',
  },
  funding: {
    en: 'This is the credit and subsidy step. It shows the loan and support the scheme links to your business, and how much of the cost you pay yourself. The exact figures are already on screen and come from the official scheme rules, which is why I never recalculate them for you. Read the two amounts, then continue once you are happy with your own contribution.',
    hi: 'यह ऋण और सब्सिडी का चरण है। यह दिखाता है कि योजना आपके व्यवसाय से कितना ऋण और सहायता जोड़ती है, और कितना खर्च आप स्वयं उठाते हैं। सटीक आँकड़े स्क्रीन पर पहले से मौजूद हैं और सरकारी योजना नियमों से आते हैं, इसीलिए मैं उनकी गणना स्वयं नहीं करता। दोनों राशियाँ पढ़ें, और अपने योगदान से संतुष्ट होने पर आगे बढ़ें।',
  },
  identity: {
    en: 'This is the identity step. The wizard asks you to verify yourself through DigiLocker so the project report carries your real name and stays acceptable to a bank. Nothing is approved here; it only links your verified identity to the report. Finish the DigiLocker step, then move on to the report.',
    hi: 'यह पहचान का चरण है। विज़ार्ड आपसे दिगिलॉकर के ज़रिए पहचान सत्यापित करने को कहता है ताकि परियोजना रिपोर्ट में आपका असली नाम आए और वह बैंक के लिए मान्य रहे। यहाँ कुछ भी मंज़ूर नहीं होता; यह केवल आपकी सत्यापित पहचान को रिपोर्ट से जोड़ता है। दिगिलॉकर का चरण पूरा करें, और फिर रिपोर्ट पर जाएँ।',
  },
  report: {
    en: 'This is the report step, the last one. Your project report is built from everything you entered, and you can download it as a PDF to share with your bank. Check the details once before you download, because the bank reads this document and not the screens before it. Generate the report, then open or download it.',
    hi: 'यह रिपोर्ट का चरण है, और यही आख़िरी है। आपकी परियोजना रिपोर्ट आपकी भरी हुई सारी जानकारी से बनती है, और आप इसे पीडीएफ में डाउनलोड करके अपने बैंक के साथ साझा कर सकते हैं। डाउनलोड से पहले विवरण एक बार जाँच लें, क्योंकि बैंक इसी दस्तावेज़ को पढ़ता है। रिपोर्ट बनाएँ, और फिर उसे खोलें या डाउनलोड करें।',
  },
};

const STEP_KEYS = ['location', 'business', 'demand', 'funding', 'identity', 'report'] as const;

const MONEY_HINT = /loan|amount|money|subsidy|emi|tpc|eqi|पैसा|ऋण|राशि|सब्सिडी/i;
const MIC_HINT = /mic|microphone|voice|speak|सुन|माइक|बोल/i;
const SCORE_HINT = /score|feasibilit|competition|स्कोर|प्रतिस्पर्धा/i;

/** Said out loud when a turn recorded nothing usable. */
export const NO_SPEECH = {
  en: 'I did not catch any speech there. Tap the orb, wait for the light, then speak close to the microphone.',
  hi: 'मुझे कोई आवाज़ नहीं मिली। बटन दबाएँ, रोशनी का इंतज़ार करें, फिर माइक के पास बोलें।',
};

const VERDICT_COPY = {
  viable: { en: 'good potential', hi: 'अच्छी संभावना' },
  'niche-gap': { en: 'a focused opportunity', hi: 'एक केंद्रित अवसर' },
  saturated: { en: 'high competition', hi: 'कड़ी प्रतिस्पर्धा' },
} as const;

/**
 * The score is the number applicants ask about first, and "read the demand
 * card" is not an answer. Say the arithmetic, the count behind it and the
 * verdict, from the snapshot the wizard handed us.
 */
function explainScore(context: StepContext, key: 'en' | 'hi'): string {
  const score = context.feasibilityScore ?? 0;
  const verdictKey = context.feasibilityVerdict as keyof typeof VERDICT_COPY | undefined;
  const verdict = verdictKey ? VERDICT_COPY[verdictKey] : undefined;
  const radiusKm = typeof context.radiusMeters === 'number' ? Math.round(context.radiusMeters / 1000) : null;
  const parts: string[] = [];
  if (key === 'hi') {
    parts.push(`आपका स्कोर 100 में से ${score} है।`);
    if (typeof context.competitionScore === 'number') {
      parts.push(`यह 100 में से प्रतिस्पर्धा स्कोर ${context.competitionScore} घटाकर बनता है, इसलिए कम प्रतिस्पर्धा वाले बाज़ार का स्कोर ऊँचा आता है।`);
    }
    if (typeof context.nearbyUnits === 'number') {
      parts.push(radiusKm === null
        ? `आसपास ${context.nearbyUnits} इकाइयाँ दर्ज मिलीं।`
        : `${radiusKm} किलोमीटर के भीतर ${context.nearbyUnits} इकाइयाँ दर्ज मिलीं।`);
    }
    if (verdict) parts.push(`नतीजा है: ${verdict.hi}।`);
    parts.push('अगर यह पुराना लगे तो "स्थानीय माँग फिर जाँचें" दबाएँ।');
    return parts.join(' ');
  }
  parts.push(`Your score is ${score} out of 100.`);
  if (typeof context.competitionScore === 'number') {
    parts.push(`It is 100 minus the competition score of ${context.competitionScore}, so a market with few registered competitors scores higher.`);
  }
  if (typeof context.nearbyUnits === 'number') {
    parts.push(radiusKm === null
      ? `The check found ${context.nearbyUnits} registered units nearby.`
      : `The check found ${context.nearbyUnits} registered units within ${radiusKm} km.`);
  }
  if (verdict) parts.push(`The verdict is ${verdict.en}.`);
  parts.push('If that looks out of date, tap Try local demand again to re-run the check.');
  return parts.join(' ');
}

function pick(lang: string): 'en' | 'hi' {
  return lang === 'hi' ? 'hi' : 'en';
}

/**
 * The numbers currently on screen, said in words. A step explanation that
 * ignores them reads like a manual page; naming them makes it about this
 * applicant's own business.
 */
function describeSnapshot(context: StepContext, key: 'en' | 'hi'): string {
  const facts: string[] = [];
  if (key === 'hi') {
    if (context.district) facts.push(`${context.district} जिला`);
    if (context.enterprise) facts.push(`${context.enterprise} व्यवसाय`);
    if (typeof context.nearbyUnits === 'number') facts.push(`आसपास ${context.nearbyUnits} दर्ज इकाइयाँ`);
    if (typeof context.radiusMeters === 'number') facts.push(`${Math.round(context.radiusMeters / 1000)} किलोमीटर का दायरा`);
    if (typeof context.feasibilityScore === 'number') facts.push(`माँग स्कोर 100 में से ${context.feasibilityScore}`);
    if (typeof context.competitionScore === 'number') facts.push(`प्रतिस्पर्धा स्कोर ${context.competitionScore}`);
    if (typeof context.marginPercent === 'number') facts.push(`आपका योगदान ${context.marginPercent} प्रतिशत`);
    if (context.identityVerified) facts.push('पहचान सत्यापित हो चुकी है');
    if (context.reportReady) facts.push('रिपोर्ट तैयार है');
    return facts.length ? `इस समय स्क्रीन पर: ${facts.join(', ')}।` : '';
  }
  if (context.district) facts.push(`${context.district} district`);
  if (context.enterprise) facts.push(`business ${context.enterprise}`);
  if (typeof context.nearbyUnits === 'number') facts.push(`${context.nearbyUnits} registered units nearby`);
  if (typeof context.radiusMeters === 'number') facts.push(`a ${Math.round(context.radiusMeters / 1000)} km radius`);
  if (typeof context.feasibilityScore === 'number') facts.push(`a demand score of ${context.feasibilityScore} out of 100`);
  if (typeof context.competitionScore === 'number') facts.push(`a competition score of ${context.competitionScore}`);
  if (typeof context.marginPercent === 'number') facts.push(`your own contribution at ${context.marginPercent} percent`);
  if (context.identityVerified) facts.push('your identity is already verified');
  if (context.reportReady) facts.push('your report is ready to download');
  return facts.length ? `Right now the screen shows ${facts.join(', ')}.` : '';
}

/**
 * What "what is this page about?" deserves: the purpose of the step, what the
 * applicant has to do here, and the numbers that are on screen right now.
 */
function explainStep(context: StepContext, key: 'en' | 'hi'): string {
  const byStep = STEP_GUIDANCE[STEP_KEYS[context.step - 1] ?? 'location'];
  const title = context.stepTitle?.trim();
  const parts = [byStep[key]];
  const snapshot = describeSnapshot(context, key);
  if (snapshot) parts.push(snapshot);
  if (key === 'hi') {
    parts.push(title ? `यह चरण ${context.step} है - ${title}।` : `यह चरण ${context.step} है।`);
  } else {
    parts.push(title ? `This is step ${context.step} - ${title}.` : `This is step ${context.step}.`);
  }
  return parts.join(' ');
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
  if (SCORE_HINT.test(question) && typeof context.feasibilityScore === 'number') {
    return explainScore(context, key);
  }
  return explainStep(context, key);
}

export { STEP_KEYS };
