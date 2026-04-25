import { useEffect, useState } from "react";

export type AppLanguage = "English" | "हिंदी" | "தமிழ்" | "తెలుగు" | "বাংলা";

const LANGUAGE_KEY = "foodiefinds_language";
const LANGUAGE_EVENT = "foodiefinds-language-change";

export const APP_LANGUAGES: AppLanguage[] = ["English", "हिंदी", "தமிழ்", "తెలుగు", "বাংলা"];

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    appName: "LINKY",
    explore: "Explore",
    new: "New",
    follow: "Follow",
    noCreatorsAvailable: "No creators available",
    noNewCreators: "No new creators",
    noFollowedCreators: "No followed creators",
    checkBackLater: "Check back later for new creators",
    followCreators: "Follow creators to see them here",
    exploreCreators: "Explore Creators",
    settings: "Settings",
    language: "Language",
    dndMode: "DND Mode",
    stopPromotionalCalls: "Stop receiving promotional calls",
    legalPolicies: "Legal & Policies",
    reportProblem: "Report a Problem",
    blockedCreators: "Blocked Creators",
    supportAvailable: "Contact Support",
    supportLocked: "Complete your first recharge to unlock support",
    supportHint: "Support chat is available after your first successful recharge",
    talktimeTransactions: "Talktime Transactions",
    noTransactions: "No transactions yet",
    transactionHint: "Your recharge history will appear here",
    paid: "Paid",
    bonus: "bonus",
    rechargeWallet: "Recharge Wallet",
    randomMatch: "Random Match",
    match: "Match",
    chooseCallType: "Choose Call Type",
    selectConnection: "Select how you want to connect with a creator",
    audioCall: "Audio Call",
    videoCall: "Video Call",
    voiceOnly: "Voice only",
    faceToFace: "Face to face",
    cancel: "Cancel",
    startMatch: "Start Match",
  },
  "हिंदी": {
    appName: "लिंकी",
    explore: "एक्सप्लोर",
    new: "नया",
    follow: "फॉलो",
    noCreatorsAvailable: "कोई क्रिएटर उपलब्ध नहीं",
    noNewCreators: "कोई नया क्रिएटर नहीं",
    noFollowedCreators: "कोई फॉलो किया गया क्रिएटर नहीं",
    checkBackLater: "नए क्रिएटर्स के लिए बाद में देखें",
    followCreators: "क्रिएटर्स को फॉलो करें ताकि वे यहां दिखें",
    exploreCreators: "क्रिएटर्स देखें",
    settings: "सेटिंग्स",
    language: "भाषा",
    dndMode: "डीएनडी मोड",
    stopPromotionalCalls: "प्रमोशनल कॉल रोकें",
    legalPolicies: "कानूनी और नीतियां",
    reportProblem: "समस्या रिपोर्ट करें",
    blockedCreators: "ब्लॉक किए गए क्रिएटर्स",
    supportAvailable: "सपोर्ट से संपर्क करें",
    supportLocked: "सपोर्ट अनलॉक करने के लिए पहला रिचार्ज पूरा करें",
    supportHint: "पहले सफल रिचार्ज के बाद सपोर्ट चैट उपलब्ध होगी",
    talktimeTransactions: "टॉकटाइम लेनदेन",
    noTransactions: "अभी कोई लेनदेन नहीं",
    transactionHint: "आपका रिचार्ज इतिहास यहां दिखेगा",
    paid: "भुगतान",
    bonus: "बोनस",
    rechargeWallet: "वॉलेट रिचार्ज करें",
    randomMatch: "रैंडम मैच",
    match: "मैच",
    chooseCallType: "कॉल प्रकार चुनें",
    selectConnection: "चुनें कि आप क्रिएटर से कैसे जुड़ना चाहते हैं",
    audioCall: "ऑडियो कॉल",
    videoCall: "वीडियो कॉल",
    voiceOnly: "केवल आवाज",
    faceToFace: "फेस टू फेस",
    cancel: "रद्द करें",
    startMatch: "मैच शुरू करें",
  },
  "தமிழ்": {
    appName: "லிங்கி",
    explore: "ஆராய்க",
    new: "புதியது",
    follow: "பின்தொடர்",
    noCreatorsAvailable: "கிரியேட்டர்கள் இல்லை",
    noNewCreators: "புதிய கிரியேட்டர்கள் இல்லை",
    noFollowedCreators: "பின்தொடர்ந்த கிரியேட்டர்கள் இல்லை",
    checkBackLater: "புதிய கிரியேட்டர்களுக்கு பிறகு பார்க்கவும்",
    followCreators: "கிரியேட்டர்களை பின்தொடருங்கள்",
    exploreCreators: "கிரியேட்டர்களை பார்க்கவும்",
    settings: "அமைப்புகள்",
    language: "மொழி",
    dndMode: "DND முறை",
    stopPromotionalCalls: "விளம்பர அழைப்புகளை நிறுத்தவும்",
    legalPolicies: "சட்டம் மற்றும் கொள்கைகள்",
    reportProblem: "பிரச்சனையை தெரிவிக்கவும்",
    blockedCreators: "தடுக்கப்பட்ட கிரியேட்டர்கள்",
    supportAvailable: "ஆதரவை தொடர்பு கொள்ளவும்",
    supportLocked: "ஆதரவை திறக்க முதல் ரீசார்ஜ் முடிக்கவும்",
    supportHint: "முதல் வெற்றிகரமான ரீசார்ஜ் பிறகு ஆதரவு அரட்டை கிடைக்கும்",
    talktimeTransactions: "டாக்டைம் பரிவர்த்தனைகள்",
    noTransactions: "இன்னும் பரிவர்த்தனைகள் இல்லை",
    transactionHint: "உங்கள் ரீசார்ஜ் வரலாறு இங்கே தோன்றும்",
    paid: "செலுத்தியது",
    bonus: "போனஸ்",
    rechargeWallet: "வாலட்டை ரீசார்ஜ் செய்யவும்",
    randomMatch: "ரேண்டம் மேட்ச்",
    match: "மேட்ச்",
    chooseCallType: "அழைப்பு வகையை தேர்வு செய்க",
    selectConnection: "கிரியேட்டருடன் எப்படி இணைவது என்பதை தேர்வு செய்க",
    audioCall: "ஆடியோ அழைப்பு",
    videoCall: "வீடியோ அழைப்பு",
    voiceOnly: "குரல் மட்டும்",
    faceToFace: "நேருக்கு நேர்",
    cancel: "ரத்து",
    startMatch: "மேட்ச் தொடங்கு",
  },
  "తెలుగు": {
    appName: "లింకీ",
    explore: "అన్వేషించండి",
    new: "కొత్తవి",
    follow: "ఫాలో",
    noCreatorsAvailable: "క్రియేటర్లు అందుబాటులో లేరు",
    noNewCreators: "కొత్త క్రియేటర్లు లేరు",
    noFollowedCreators: "ఫాలో చేసిన క్రియేటర్లు లేరు",
    checkBackLater: "కొత్త క్రియేటర్ల కోసం తర్వాత చూడండి",
    followCreators: "క్రియేటర్లను ఫాలో చేయండి",
    exploreCreators: "క్రియేటర్లను చూడండి",
    settings: "సెట్టింగ్స్",
    language: "భాష",
    dndMode: "DND మోడ్",
    stopPromotionalCalls: "ప్రచార కాల్స్ ఆపండి",
    legalPolicies: "చట్టపరమైనవి మరియు విధానాలు",
    reportProblem: "సమస్యను నివేదించండి",
    blockedCreators: "బ్లాక్ చేసిన క్రియేటర్లు",
    supportAvailable: "సపోర్ట్‌ను సంప్రదించండి",
    supportLocked: "సపోర్ట్ కోసం మొదటి రీచార్జ్ పూర్తి చేయండి",
    supportHint: "మొదటి విజయవంతమైన రీచార్జ్ తర్వాత సపోర్ట్ చాట్ అందుబాటులో ఉంటుంది",
    talktimeTransactions: "టాక్‌టైమ్ లావాదేవీలు",
    noTransactions: "ఇంకా లావాదేవీలు లేవు",
    transactionHint: "మీ రీచార్జ్ చరిత్ర ఇక్కడ కనిపిస్తుంది",
    paid: "చెల్లించినది",
    bonus: "బోనస్",
    rechargeWallet: "వాలెట్ రీచార్జ్ చేయండి",
    randomMatch: "రాండమ్ మ్యాచ్",
    match: "మ్యాచ్",
    chooseCallType: "కాల్ రకం ఎంచుకోండి",
    selectConnection: "క్రియేటర్‌తో ఎలా కనెక్ట్ కావాలో ఎంచుకోండి",
    audioCall: "ఆడియో కాల్",
    videoCall: "వీడియో కాల్",
    voiceOnly: "కేవలం వాయిస్",
    faceToFace: "ముఖాముఖి",
    cancel: "రద్దు",
    startMatch: "మ్యాచ్ ప్రారంభించండి",
  },
  "বাংলা": {
    appName: "লিংকি",
    explore: "এক্সপ্লোর",
    new: "নতুন",
    follow: "ফলো",
    noCreatorsAvailable: "কোনও ক্রিয়েটর নেই",
    noNewCreators: "নতুন ক্রিয়েটর নেই",
    noFollowedCreators: "ফলো করা ক্রিয়েটর নেই",
    checkBackLater: "নতুন ক্রিয়েটরের জন্য পরে দেখুন",
    followCreators: "ক্রিয়েটরদের ফলো করুন",
    exploreCreators: "ক্রিয়েটর দেখুন",
    settings: "সেটিংস",
    language: "ভাষা",
    dndMode: "DND মোড",
    stopPromotionalCalls: "প্রোমোশনাল কল বন্ধ করুন",
    legalPolicies: "আইন ও নীতি",
    reportProblem: "সমস্যা রিপোর্ট করুন",
    blockedCreators: "ব্লক করা ক্রিয়েটর",
    supportAvailable: "সাপোর্টে যোগাযোগ করুন",
    supportLocked: "সাপোর্ট খুলতে প্রথম রিচার্জ করুন",
    supportHint: "প্রথম সফল রিচার্জের পরে সাপোর্ট চ্যাট পাওয়া যাবে",
    talktimeTransactions: "টকটাইম লেনদেন",
    noTransactions: "এখনও কোনও লেনদেন নেই",
    transactionHint: "আপনার রিচার্জ ইতিহাস এখানে দেখা যাবে",
    paid: "পেমেন্ট",
    bonus: "বোনাস",
    rechargeWallet: "ওয়ালেট রিচার্জ করুন",
    randomMatch: "র্যান্ডম ম্যাচ",
    match: "ম্যাচ",
    chooseCallType: "কল টাইপ বেছে নিন",
    selectConnection: "কীভাবে ক্রিয়েটরের সাথে যুক্ত হবেন বেছে নিন",
    audioCall: "অডিও কল",
    videoCall: "ভিডিও কল",
    voiceOnly: "শুধু ভয়েস",
    faceToFace: "সামনাসামনি",
    cancel: "বাতিল",
    startMatch: "ম্যাচ শুরু করুন",
  },
};

export function getStoredLanguage(): AppLanguage {
  const storedLanguage = localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null;
  return storedLanguage && APP_LANGUAGES.includes(storedLanguage) ? storedLanguage : "English";
}

export function setStoredLanguage(language: AppLanguage) {
  localStorage.setItem(LANGUAGE_KEY, language);
  document.documentElement.lang = language;
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: language }));
}

export function useAppLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(() => getStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language;

    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<AppLanguage>).detail || getStoredLanguage();
      setLanguageState(nextLanguage);
    };

    window.addEventListener(LANGUAGE_EVENT, handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(LANGUAGE_EVENT, handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, [language]);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    setStoredLanguage(nextLanguage);
  };

  const t = (key: string) => TRANSLATIONS[language][key] || TRANSLATIONS.English[key] || key;

  return { language, setLanguage, t };
}
