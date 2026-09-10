/** English source copy. Other languages are requested from the translation API. */
export interface UiStrings {
  navBenefits: string;
  navHowTo: string;
  heroGetStarted: string;
  howTitle: string;
  step01Number: string;
  step01Title: string;
  step01Desc: string;
  step02Number: string;
  step02Title: string;
  step02Desc: string;
  step03Number: string;
  step03Title: string;
  step03Desc: string;
  footerBrand: string;
  footerSubtitle: string;
  footerDesc: string;
  footerResources: string;
  footerHowItWorks: string;
  footerLegal: string;
  footerPrivacy: string;
  footerTerms: string;
  footerCookies: string;
  footerCopyright: string;
  footerBuiltAs: string;
  wizardBackToLanding: string;
}

const english: UiStrings = {
  navBenefits: 'Benefits',
  navHowTo: 'How it works',
  heroGetStarted: 'Start your plan',
  howTitle: 'How UdyogSaarthi works',
  step01Number: '01',
  step01Title: 'Choose your business',
  step01Desc: 'Select your idea, location, and the amount you can contribute.',
  step02Number: '02',
  step02Title: 'Check local demand',
  step02Desc: 'Compare your idea with available business and location data nearby.',
  step03Number: '03',
  step03Title: 'Prepare your report',
  step03Desc: 'Review funding estimates and generate a detailed project report.',
  footerBrand: 'UdyogSaarthi',
  footerSubtitle: 'Independent rural enterprise advisory platform',
  footerDesc: 'Clear local demand, funding, and project-report guidance for aspiring entrepreneurs.',
  footerResources: 'Resources',
  footerHowItWorks: 'How it works',
  footerLegal: 'Legal',
  footerPrivacy: 'Privacy policy',
  footerTerms: 'Terms of service',
  footerCookies: 'Cookie policy',
  footerCopyright: '© 2026 UdyogSaarthi',
  footerBuiltAs: 'Advisory estimates only',
  wizardBackToLanding: 'Back to home',
};

export function getTranslations(langCode: string): UiStrings {
  void langCode;
  return english;
}
