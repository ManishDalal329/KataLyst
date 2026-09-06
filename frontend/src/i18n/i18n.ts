import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';

const savedLanguage = localStorage.getItem('sahakar_language') || 'en';

const resources = {
  en: {
    translation: {
      app_title: "KataLyst",
      app_subtitle: "Cooperative Gig Services Platform",
      tagline: "Empowering Workers Through Democratic Cooperatives",
      hero_title: "Fair Work. Zero Exploitation.",
      hero_desc: "Traditional gig platforms deduct 20-30% commissions. KataLyst guarantees 80% to workers, 15% to community welfare funds, and only 5% platform fee.",
      nav_home: "Home",
      nav_services: "Book Services",
      nav_worker_app: "Worker App",
      nav_coop_admin: "Coop Admin",
      nav_gov_admin: "Gov Portal",
      login: "Sign In / OTP",
      logout: "Sign Out",
      role_customer: "Customer",
      role_worker: "Worker Member",
      role_coop_admin: "Coop Admin",
      role_gov_admin: "Gov Admin",
      quick_login_title: "Quick Demo Login",
      select_category: "Select Service Category",
      search_placeholder: "Search plumber, electrician, cleaner...",
      smart_match: "AI Smart Match Score",
      book_now: "Book Service",
      price_breakdown: "Transparent Price Breakdown",
      worker_gets: "Worker Receives (80%)",
      coop_fund: "Cooperative Welfare Fund (15%)",
      platform_fee: "Platform Fee (5%)",
      total_amount: "Total Amount Payable",
      governance_title: "Cooperative Democratic Governance",
      vote_now: "Cast Vote (1 Member 1 Vote)",
      fund_balance: "Cooperative Fund Balance",
      platform_analytics: "Ministry & Platform Analytics"
    }
  },
  hi: {
    translation: {
      app_title: "कैटालिस्ट (KataLyst)",
      app_subtitle: "सहकारी गिग सेवा मंच",
      tagline: "लोकतांत्रिक सहकारिता से श्रमिकों का सशक्तिकरण",
      hero_title: "न्यायसंगत काम। शून्य शोषण।",
      hero_desc: "पारंपरिक गिग प्लेटफॉर्म 20-30% कमीशन लेते हैं। कैटालिस्ट (KataLyst) 80% सीधे श्रमिक को, 15% कल्याण कोष को और केवल 5% प्लेटफॉर्म शुल्क सुनिश्चित करता है।",
      nav_home: "मुख्य पृष्ठ",
      nav_services: "सेवाएं बुक करें",
      nav_worker_app: "श्रमिक ऐप",
      nav_coop_admin: "सहकारी व्यवस्थापक",
      nav_gov_admin: "सरकारी पोर्टल",
      login: "साइन इन / ओटीपी",
      logout: "साइन आउट",
      role_customer: "ग्राहक",
      role_worker: "सहकारी श्रमिक",
      role_coop_admin: "सहकारी व्यवस्थापक",
      role_gov_admin: "सरकारी अधिकारी",
      quick_login_title: "त्वरित डेमो लॉगिन",
      select_category: "सेवा श्रेणी चुनें",
      search_placeholder: "प्लंंबर, इलेक्ट्रिशियन, सफाई कर्मी खोजें...",
      smart_match: "एआई स्मार्ट मैच स्कोर",
      book_now: "सेवा बुक करें",
      price_breakdown: "पारदर्शी मूल्य विभाजन",
      worker_gets: "श्रमिक हिस्सा (80%)",
      coop_fund: "सहकारी कल्याण कोष (15%)",
      platform_fee: "प्लेटफॉर्म शुल्क (5%)",
      total_amount: "कुल देय राशि",
      governance_title: "सहकारी लोकतांत्रिक शासन",
      vote_now: "मतदान करें (1 सदस्य 1 मत)",
      fund_balance: "सहकारी कोष शेष",
      platform_analytics: "मंत्रालय और प्लेटफॉर्म विश्लेषण"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('sahakar_language', lng);
});

export default i18n;
