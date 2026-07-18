// SahayCredit Onboarding Core Logic

// 15 Psychometric Scenario-Based Questions (Bilingual)
const QUESTIONS = [
  {
    category: "financialDiscipline",
    en: {
      question: "If you receive ₹10,000 unexpectedly, what do you do first?",
      options: [
        "Save it",
        "Pay a pending bill",
        "Buy something needed",
        "Invest it"
      ]
    },
    hi: {
      question: "यदि आपको अप्रत्याशित रूप से ₹10,000 प्राप्त होते हैं, तो आप सबसे पहले क्या करेंगे?",
      options: [
        "इसे बचाएं",
        "लंबित बिल का भुगतान करें",
        "जरूरी चीज खरीदें",
        "इसे निवेश करें"
      ]
    }
  },
  {
    category: "financialDiscipline",
    en: {
      question: "You're short ₹500 for rent. What do you do?",
      options: [
        "Borrow from family",
        "Delay a small expense",
        "Ask employer for advance",
        "Skip rent this month"
      ]
    },
    hi: {
      question: "आपके पास किराए के लिए ₹500 कम हैं। आप क्या करेंगे?",
      options: [
        "परिवार से उधार लेंगे",
        "छोटा खर्च टालेंगे",
        "नियोक्ता से एडवांस मांगेंगे",
        "इस महीने किराया नहीं देंगे"
      ]
    }
  },
  {
    category: "financialDiscipline",
    en: {
      question: "How often do you check your bank balance?",
      options: [
        "Daily",
        "Weekly",
        "When I need money",
        "Rarely"
      ]
    },
    hi: {
      question: "आप अपना बैंक बैलेंस कितनी बार चेक करते हैं?",
      options: [
        "दैनिक",
        "साप्ताहिक",
        "जब मुझे पैसों की जरूरत होती है",
        "शायद ही कभी"
      ]
    }
  },
  {
    category: "financialDiscipline",
    en: {
      question: "How often do you track your daily or weekly expenses?",
      options: [
        "I write down or log every single rupee spent.",
        "I track only major expenses and keep a mental note of smaller ones.",
        "I focus on ensuring my bank balance stays above a safety level."
      ]
    },
    hi: {
      question: "आप अपने दैनिक या साप्ताहिक खर्चों को कितनी बार ट्रैक करते हैं?",
      options: [
        "मैं खर्च किए गए एक-एक रुपये को लिखता या लॉग करता हूं।",
        "मैं केवल बड़े खर्चों पर नजर रखता हूं और छोटे खर्चों को दिमाग में याद रखता हूं।",
        "मैं यह सुनिश्चित करने पर ध्यान केंद्रित करता हूं कि मेरा बैंक बैलेंस सुरक्षित स्तर से ऊपर रहे।"
      ]
    }
  },
  {
    category: "financialDiscipline",
    en: {
      question: "A major festival or family event is coming up in two months, requiring extra expenses.",
      options: [
        "You reduce your personal spending in the preceding weeks to prepare.",
        "You cover the costs using a mix of current savings and short-term credit.",
        "You borrow from local vendors and pay them back after the event."
      ]
    },
    hi: {
      question: "दो महीने में एक बड़ा त्योहार या पारिवारिक कार्यक्रम आ रहा है, जिसके लिए अतिरिक्त खर्चों की आवश्यकता है।",
      options: [
        "आप तैयारी के लिए पहले के सप्ताहों में अपने व्यक्तिगत खर्चों को कम करते हैं।",
        "आप वर्तमान बचत और अल्पकालिक ऋण के मिश्रण का उपयोग करके खर्चों को पूरा करते हैं।",
        "आप स्थानीय विक्रेताओं से उधार लेते हैं और कार्यक्रम के बाद उन्हें भुगतान करते हैं।"
      ]
    }
  },
  {
    category: "riskAttitude",
    en: {
      question: "You want to start a new business venture or expand your current shop. What is your strategy?",
      options: [
        "Start small using only personal savings, growing slowly.",
        "Take a business loan to launch at a larger scale from day one.",
        "Partner with a friend to share the initial investment and risk."
      ]
    },
    hi: {
      question: "आप एक नया व्यवसाय शुरू करना चाहते हैं या अपनी दुकान बढ़ाना चाहते हैं। आपकी रणनीति क्या है?",
      options: [
        "केवल व्यक्तिगत बचत का उपयोग करके छोटा शुरू करें और धीरे-धीरे बढ़ें।",
        "पहले दिन से ही बड़े पैमाने पर लॉन्च करने के लिए एक व्यावसायिक ऋण लें।",
        "प्रारंभिक निवेश और जोखिम को साझा करने के लिए किसी मित्र के साथ साझेदारी करें।"
      ]
    }
  },
  {
    category: "riskAttitude",
    en: {
      question: "A supplier offers a 20% discount if you buy double your usual inventory, but demand is uncertain.",
      options: [
        "Decline the offer to avoid the risk of unsold stock and locked capital.",
        "Buy double, confident you can push sales through extra effort.",
        "Buy 50% more, negotiating a smaller discount to balance risk."
      ]
    },
    hi: {
      question: "एक आपूर्तिकर्ता (Supplier) 20% की छूट देता है यदि आप अपनी सामान्य से दोगुनी इन्वेंट्री खरीदते हैं, लेकिन मांग अनिश्चित है।",
      options: [
        "बिक्री न होने के जोखिम और पूंजी फंसने से बचने के लिए प्रस्ताव को अस्वीकार करें।",
        "अतिरिक्त प्रयास के माध्यम से बिक्री बढ़ाने के विश्वास के साथ दोगुना खरीदें।",
        "जोखिम को संतुलित करने के लिए थोड़ी कम छूट पर 50% अधिक खरीदारी करें।"
      ]
    }
  },
  {
    category: "riskAttitude",
    en: {
      question: "An investment opportunity promises to double your money in 1 year, but you could lose it all.",
      options: [
        "Invest nothing; you prefer low but guaranteed returns.",
        "Invest a small amount (under 5% of savings) that you are comfortable losing.",
        "Invest a significant portion, believing high risk is necessary for growth."
      ]
    },
    hi: {
      question: "एक निवेश अवसर 1 वर्ष में आपके पैसे को दोगुना करने का वादा करता है, लेकिन आप इसे पूरा खो भी सकते हैं।",
      options: [
        "कुछ भी निवेश न करें; आप कम लेकिन गारंटीड रिटर्न पसंद करते हैं।",
        "एक छोटी राशि (बचत का 5% से कम) निवेश करें जिसे खोने में आपको कोई समस्या न हो।",
        "बड़ा हिस्सा निवेश करें, यह मानकर कि विकास के लिए उच्च जोखिम आवश्यक है।"
      ]
    }
  },
  {
    category: "riskAttitude",
    en: {
      question: "If you face a sudden 30% drop in income next month due to market changes, how do you adapt?",
      options: [
        "Immediately cut down household expenses to the absolute minimum.",
        "Draw from your emergency cash reserves to maintain your lifestyle.",
        "Seek additional work or odd jobs immediately to cover the shortfall."
      ]
    },
    hi: {
      question: "यदि अगले महीने बाजार में बदलाव के कारण आपकी आय में 30% की अचानक गिरावट आती है, तो आप कैसे ढलेंगे?",
      options: [
        "तुरंत घरेलू खर्चों को न्यूनतम स्तर पर कम करें।",
        "अपनी जीवनशैली बनाए रखने के लिए अपनी आपातकालीन नकद बचत का उपयोग करें।",
        "कमी को पूरा करने के लिए तुरंत अतिरिक्त काम या छोटे-मोटे काम खोजें।"
      ]
    }
  },
  {
    category: "riskAttitude",
    en: {
      question: "You have the option to buy business/crop insurance that protects against extreme loss but costs a monthly fee.",
      options: [
        "Buy it for peace of mind, even if you never make a claim.",
        "Save that monthly fee in a separate emergency bank account instead.",
        "Don't buy it, trusting that your other income sources will cover losses."
      ]
    },
    hi: {
      question: "आपके पास व्यवसाय/फसल बीमा खरीदने का विकल्प है जो नुकसान से बचाता है लेकिन मासिक शुल्क लेता है।",
      options: [
        "मन की शांति के लिए इसे खरीदें, भले ही आपको कभी दावा न करना पड़े।",
        "इसके बजाय उस मासिक शुल्क को एक अलग आपातकालीन बैंक खाते में बचाएं।",
        "इसे न खरीदें, यह मानकर कि आपकी अन्य आय के स्रोत नुकसान की भरपाई कर देंगे।"
      ]
    }
  },
  {
    category: "repaymentIntent",
    en: {
      question: "You have both an informal loan from a neighbor and a bank loan. Cash is tight. Which do you pay first?",
      options: [
        "The bank loan, to protect your formal credit record and avoid late fees.",
        "The neighbor's loan, to preserve your social reputation and trust.",
        "Pay 50% to both, and explain the situation honestly to both parties."
      ]
    },
    hi: {
      question: "आपके पास पड़ोसी से लिया गया एक अनौपचारिक ऋण और एक बैंक ऋण दोनों हैं। पैसे की तंगी है। आप पहले किसे चुकाएंगे?",
      options: [
        "बैंक ऋण को, अपने औपचारिक क्रेडिट रिकॉर्ड की सुरक्षा और लेट फीस से बचने के लिए।",
        "पड़ोसी के ऋण को, अपनी सामाजिक प्रतिष्ठा और विश्वास को बनाए रखने के लिए।",
        "दोनों को 50% भुगतान करें, और दोनों पक्षों को ईमानदारी से स्थिति समझाएं।"
      ]
    }
  },
  {
    category: "repaymentIntent",
    en: {
      question: "A customer pays you late, making you miss your loan repayment by 5 days. What do you do?",
      options: [
        "Call the lender on the due date, explain the delay, and commit to a new date.",
        "Repay quietly with late fees as soon as you receive the customer's money.",
        "Borrow from a friend for 5 days to make the payment exactly on time."
      ]
    },
    hi: {
      question: "एक ग्राहक आपको देरी से भुगतान करता है, जिससे आप अपने ऋण भुगतान में 5 दिन की देरी कर बैठते हैं। आप क्या करेंगे?",
      options: [
        "देय तिथि पर ऋणदाता को कॉल करें, देरी का कारण बताएं, और एक नई तिथि तय करें।",
        "जैसे ही ग्राहक से पैसे मिले, लेट फीस के साथ बिना शोर-शराबे के भुगतान करें।",
        "ठीक समय पर भुगतान करने के लिए 5 दिनों के लिए किसी मित्र से उधार लें।"
      ]
    }
  },
  {
    category: "repaymentIntent",
    en: {
      question: "Your lender makes a bookkeeping error and forgets to charge your monthly payment. What do you do?",
      options: [
        "Proactively contact the lender to report the error and make the payment.",
        "Wait for the lender to notice, keeping the cash reserved in your account.",
        "Use the money to buy inventory for now, and repay whenever they request it."
      ]
    },
    hi: {
      question: "आपका ऋणदाता खाता-बही में गलती करता है और आपसे मासिक भुगतान लेना भूल जाता है। आप क्या करेंगे?",
      options: [
        "गलती की रिपोर्ट करने और भुगतान करने के लिए सक्रिय रूप से ऋणदाता से संपर्क करें।",
        "ऋणदाता के ध्यान देने का इंतजार करें, और अपने खाते में पैसे सुरक्षित रखें।",
        "फिलहाल इस पैसे का उपयोग स्टॉक खरीदने के लिए करें, और उनके मांगने पर चुकाएं।"
      ]
    }
  },
  {
    category: "repaymentIntent",
    en: {
      question: "A close relative faces a medical emergency and asks for money, but your loan installment is due.",
      options: [
        "Give the money to your relative and request the lender for a repayment extension.",
        "Pay the loan installment first, then help the relative by finding other sources.",
        "Split the money, giving half to the relative and half to the lender."
      ]
    },
    hi: {
      question: "एक करीबी रिश्तेदार को चिकित्सा आपातकाल का सामना करना पड़ता है और वे पैसे मांगते हैं, लेकिन आपकी ऋण किस्त देय है।",
      options: [
        "पैसे अपने रिश्तेदार को दें और ऋणदाता से भुगतान बढ़ाने का अनुरोध करें।",
        "पहले ऋण किस्त का भुगतान करें, फिर अन्य स्रोतों से व्यवस्था कर रिश्तेदार की मदद करें।",
        "पैसे बांटें, आधा रिश्तेदार को दें और आधा ऋणदाता को भुगतान करें।"
      ]
    }
  },
  {
    category: "repaymentIntent",
    en: {
      question: "Your neighbors default-protest a lender due to high rates. They pressure you to stop paying too.",
      options: [
        "Continue to pay your installments silently as per your original agreement.",
        "Join the neighborhood protest and stop your repayments until a resolution is made.",
        "Keep payment on hold but contact the lender to negotiate a lower rate individually."
      ]
    },
    hi: {
      question: "उच्च दरों के कारण आपके पड़ोसी एक ऋणदाता के खिलाफ विरोध कर रहे हैं। वे आप पर भी भुगतान रोकने का दबाव डालते हैं।",
      options: [
        "अपने मूल समझौते के अनुसार चुपचाप अपनी किस्तों का भुगतान जारी रखें।",
        "पड़ोस के विरोध में शामिल हों और समाधान होने तक अपना भुगतान रोक दें।",
        "भुगतान को रोकें लेकिन कम दर के लिए व्यक्तिगत रूप से ऋणदाता से बातचीत करें।"
      ]
    }
  }
];

// UI Translation Dictionary
const UI_TRANSLATIONS = {
  en: {
    welcomeBadgeText: "Alternative Credit Scoring",
    welcomeTitleTop: "Get a credit score in 3 minutes.",
    welcomeTitleBottom: "No CIBIL needed.",
    welcomeSubtitle: "We use your UPI activity, mobile bills, and daily life data to build your score.",
    feature1Title: "Zero CIBIL Needed",
    feature1Desc: "Designed especially for first-time borrowers and thin-file individuals.",
    feature2Title: "Psychometric Test",
    feature2Desc: "A 15-question behavioral quiz covering real-life financial scenarios.",
    feature3Title: "Instant Credit Line",
    feature3Desc: "Get approved for limits up to ₹2,00,000 sent directly to your bank account.",
    startBtnText: "Check My Score",
    privacyNotice: "🔒 Your responses are confidential and secure.",
    
    // Quiz Screen
    questionNumberLabel: "Question {num} of 15",
    financialDiscipline: "Financial Discipline",
    riskAttitude: "Risk Attitude",
    repaymentIntent: "Repayment Intent",
    autoSaved: "✓ Auto-saved",
    
    // Processing Screen
    processingHeadline: "Calculating Sahay Score...",
    stepFdText: "Analyzing UPI patterns...",
    stepRaText: "Reviewing mobile payment history...",
    stepRiText: "Running psychometric model...",
    stepScoringText: "Computing score with XGBoost...",
    
    // Result Screen
    resultHeadline: "Your Credit Profile",
    resultTagline: "Based on your alternate digital footprint.",
    profileTierTitle: "Tier:",
    limitLabel: "Approved Credit Limit",
    limitSub: "Zero pre-closure fees, transparent terms.",
    breakdownHeadline: "Behavioral Dimensions",
    applyBtnText: "Apply for Loan",
    restartBtnText: "Retake Assessment",
    confidenceLabel: "Score Range: {min}–{max}",
    rateLabel: "Suggested Rate",
    shapHeadline: "Top 3 Score Drivers (SHAP)",
    improvementHeadline: "How to Improve Your Score",
    eligibilityEligible: "Eligible",
    eligibilityReview: "Review Required",
    
    // Consent Screen
    consentRbiText: "RBI Account Aggregator Framework",
    consentHeadline: "Share Alternate Data",
    consentSubtitle: "Configure what data you want to share. Raw data never leaves your device — only encrypted gradients are shared.",
    consentUpiTitle: "UPI & Bank Transactions",
    consentUpiDesc: "Analyzes income patterns to maximize your credit limit (via RBI Account Aggregator).",
    consentUpiDisclosure: "Processed on your device. Raw data never leaves your phone.",
    consentBillsTitle: "Mobile Bill History",
    consentBillsDesc: "Measures payment consistency and financial discipline.",
    consentBillsDisclosure: "Processed on your device. Raw data never leaves your phone.",
    consentEcomTitle: "E-Commerce Behavior",
    consentEcomDesc: "Evaluates purchase volumes and checkout trends on Flipkart / Meesho.",
    consentEcomDisclosure: "Processed on your device. Raw data never leaves your phone.",
    consentLocationTitle: "Geolocation Stability (6 months)",
    consentLocationDesc: "Verifies stable home and shop location coordinates.",
    consentLocationDisclosure: "Processed on your device. Raw data never leaves your phone.",
    consentGstTitle: "Merchant / GST Ratings",
    consentGstDesc: "Validates operational ratings and tax compliance scores.",
    consentGstDisclosure: "Processed on your device. Raw data never leaves your phone.",
    
    signatureLabel: "Sign to Confirm Consent",
    signaturePlaceholder: "Type your Full Name to sign",
    signatureDesc: "This constitutes a legally binding authorization under the Account Aggregator framework.",
    reassuranceText: "Your data stays on your phone. Always.",
    consentBtnText: "I Agree & Continue",

    // RBI Link Screen
    rbiAaBadgeLbl: "RBI ACCOUNT AGGREGATOR",
    rbiLinkTitle: "Link Bank Statements",
    rbiLinkSubtitle: "Connect bank statements securely via the RBI Account Aggregator network to confirm UPI flow & transactions.",
    lblSelectBank: "Select Your Primary Bank",
    lblRbiAaHandle: "Account Aggregator Handle / Phone",
    rbiAaHint: "Or type your 10-digit mobile number linked to your bank account.",
    rbiBtnOtpText: "Request Verification OTP",
    lblEnterOtp: "Enter 6-Digit Consent OTP",
    rbiOtpSentHint: "Sent via bank to phone linked with selected account",
    rbiBtnVerifyText: "Verify & Authorize Link",
    rbiBtnOtpBack: "← Back to Bank Selection",
    rbiProceedQuizBtn: "Proceed to Questionnaire",
    rbiFetchStatusTitle: "Accessing Accounts",
    rbiLogStep1: "• Connecting to Account Aggregator handle...",
    rbiLogStep2: "• Discovered 1 Savings Bank Account...",
    rbiLogStep3: "• Transferring 12-month transaction statements...",
    rbiLogStep4: "• Analyzing monthly credit/debit transaction profiles...",

    // Score Simulator (removed)
    unitMonths: "months",
    unitStars: "stars"
  },
  hi: {
    welcomeBadgeText: "वैकल्पिक क्रेडिट स्कोरिंग",
    welcomeTitleTop: "3 मिनट में क्रेडिट स्कोर पाएं।",
    welcomeTitleBottom: "सिबिल की कोई जरूरत नहीं।",
    welcomeSubtitle: "आपका स्कोर बनाने के लिए हम आपकी यूपीआई गतिविधि, मोबाइल बिल और दैनिक जीवन के डेटा का उपयोग करते हैं।",
    feature1Title: "शून्य सिबिल की आवश्यकता",
    feature1Desc: "विशेष रूप से पहली बार उधार लेने वालों और बिना सिबिल वाले व्यक्तियों के लिए डिज़ाइन किया गया।",
    feature2Title: "साइकोमेट्रिक परीक्षण",
    feature2Desc: "वास्तविक जीवन के वित्तीय परिदृश्यों को कवर करने वाली 15-प्रश्नों की व्यवहार प्रश्नोत्तरी।",
    feature3Title: "तुरंत क्रेडिट लिमिट",
    feature3Desc: "सीधे अपने बैंक खाते में ₹2,00,000 तक की स्वीकृत क्रेडिट लिमिट प्राप्त करें।",
    startBtnText: "अपना स्कोर जांचें",
    privacyNotice: "🔒 आपकी प्रतिक्रियाएं पूरी तरह गोपनीय और सुरक्षित हैं।",
    
    // Quiz Screen
    questionNumberLabel: "प्रश्न 15 में से {num}",
    financialDiscipline: "वित्तीय अनुशासन",
    riskAttitude: "जोखिम के प्रति दृष्टिकोण",
    repaymentIntent: "भुगतान का इरादा",
    autoSaved: "✓ स्वतः सुरक्षित (Auto-saved)",
    
    // Processing Screen
    processingHeadline: "सहाय स्कोर की गणना की जा रही है...",
    stepFdText: "यूपीआई पैटर्न का विश्लेषण किया जा रहा है...",
    stepRaText: "मोबाइल भुगतान इतिहास की समीक्षा की जा रही है...",
    stepRiText: "व्यवहार मॉडल चलाया जा रहा है...",
    stepScoringText: "एक्सजीबूस्ट (XGBoost) से स्कोर की गणना की जा रही है...",
    
    // Result Screen
    resultHeadline: "आपकी क्रेडिट प्रोफाइल",
    resultTagline: "आपके वैकल्पिक डिजिटल पदचिह्न के आधार पर।",
    profileTierTitle: "श्रेणी (Tier):",
    limitLabel: "स्वीकृत क्रेडिट लिमिट",
    limitSub: "शून्य प्री-क्लोजर शुल्क, पारदर्शी नियम।",
    breakdownHeadline: "व्यवहारिक आयाम",
    applyBtnText: "लोन के लिए आवेदन करें",
    restartBtnText: "पुनः परीक्षण करें",
    confidenceLabel: "स्कोर सीमा: {min}–{max}",
    rateLabel: "अनुशंसित ब्याज दर",
    shapHeadline: "टॉप 3 स्कोर चालक (SHAP Drivers)",
    improvementHeadline: "अपना स्कोर कैसे सुधारें",
    eligibilityEligible: "योग्य (Eligible)",
    eligibilityReview: "पुनर्विचार आवश्यक (Review Required)",
    
    // Consent Screen
    consentRbiText: "आरबीआई (RBI) अकाउंट एग्रीगेटर फ्रेमवर्क",
    consentHeadline: "वैकल्पिक डेटा साझा करें",
    consentSubtitle: "चुनें कि आप कौन सा डेटा साझा करना चाहते हैं। मूल डेटा कभी भी आपके डिवाइस से बाहर नहीं जाता है - केवल एन्क्रिप्टेड ग्रेडिएंट साझा किए जाते हैं।",
    consentUpiTitle: "यूपीआई (UPI) और बैंक लेनदेन",
    consentUpiDesc: "आपकी क्रेडिट सीमा बढ़ाने के लिए आय के पैटर्न का विश्लेषण (अकाउंट एग्रीगेटर के माध्यम से)।",
    consentUpiDisclosure: "आपके डिवाइस पर प्रोसेस किया गया। मूल डेटा कभी भी आपके फोन से बाहर नहीं जाता है।",
    consentBillsTitle: "मोबाइल बिल भुगतान इतिहास",
    consentBillsDesc: "भुगतान निरंतरता और वित्तीय अनुशासन को मापता है।",
    consentBillsDisclosure: "आपके डिवाइस पर प्रोसेस किया गया। मूल डेटा कभी भी आपके फोन से बाहर नहीं जाता है।",
    consentEcomTitle: "ई-कॉमर्स व्यवहार",
    consentEcomDesc: "फ्लिपकार्ट / मीशो पर खरीद की मात्रा और चेकआउट प्रवृत्तियों का मूल्यांकन करता है।",
    consentEcomDisclosure: "आपके डिवाइस पर प्रोसेस किया गया। मूल डेटा कभी भी आपके फोन से बाहर नहीं जाता है।",
    consentLocationTitle: "जियोलोकेशन स्थिरता (6 महीने)",
    consentLocationDesc: "स्थिर घर और दुकान के स्थान निर्देशांक को सत्यापित करता है।",
    consentLocationDisclosure: "आपके डिवाइस पर प्रोसेस किया गया। मूल डेटा कभी भी आपके फोन से बाहर नहीं जाता है।",
    consentGstTitle: "व्यापारी / जीएसटी रेटिंग",
    consentGstDesc: "परिचालन रेटिंग और कर अनुपालन स्कोर को सत्यापित करता है।",
    consentGstDisclosure: "आपके डिवाइस पर प्रोसेस किया गया। मूल डेटा कभी भी आपके फोन से बाहर नहीं जाता है।",
    
    signatureLabel: "सहमति की पुष्टि के लिए हस्ताक्षर करें",
    signaturePlaceholder: "हस्ताक्षर करने के लिए अपना पूरा नाम टाइप करें",
    signatureDesc: "यह अकाउंट एग्रीगेटर फ्रेमवर्क के तहत कानूनी रूप से बाध्यकारी प्राधिकरण का गठन करता है।",
    reassuranceText: "काफी सुरक्षित। आपका डेटा हमेशा आपके फोन पर सुरक्षित रहता है। हमेशा।",
    consentBtnText: "मैं सहमत हूँ और आगे बढ़ें",

    // RBI Link Screen
    rbiAaBadgeLbl: "आरबीआई (RBI) अकाउंट एग्रीगेटर",
    rbiLinkTitle: "बैंक खाते लिंक करें",
    rbiLinkSubtitle: "यूपीआई फ्लो और लेनदेन की पुष्टि के लिए आरबीआई अकाउंट एग्रीगेटर के माध्यम से बैंक स्टेटमेंट को सुरक्षित रूप से लिंक करें।",
    lblSelectBank: "अपने प्राथमिक बैंक का चयन करें",
    lblRbiAaHandle: "अकाउंट एग्रीगेटर हैंडल / मोबाइल नंबर",
    rbiAaHint: "या अपने बैंक खाते से जुड़ा 10-अंकीय मोबाइल नंबर दर्ज करें।",
    rbiBtnOtpText: "सत्यापन ओटीपी (OTP) का अनुरोध करें",
    lblEnterOtp: "6-अंकीय सहमति ओटीपी दर्ज करें",
    rbiOtpSentHint: "चयनित बैंक खाते से जुड़े फोन नंबर पर भेजा गया",
    rbiBtnVerifyText: "सत्यापित और लिंक करें",
    rbiBtnOtpBack: "← बैंक चयन पर वापस जाएं",
    rbiProceedQuizBtn: "प्रश्नावली पर आगे बढ़ें",
    rbiFetchStatusTitle: "खाते एक्सेस किए जा रहे हैं",
    rbiLogStep1: "• अकाउंट एग्रीगेटर हैंडल से कनेक्ट किया जा रहा है...",
    rbiLogStep2: "• 1 बचत बैंक खाते का पता चला...",
    rbiLogStep3: "• 12-महीने के लेनदेन स्टेटमेंट ट्रांसफर किए जा रहे हैं...",
    rbiLogStep4: "• मासिक जमा/निकासी लेनदेन प्रोफाइल का विश्लेषण किया जा रहा है...",

    // Score Simulator (removed)
    unitMonths: "महीने",
    unitStars: "सितारे"
  }
};

// Application State
let state = {
  borrowerId: 'borrower-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
  deviceFingerprint: (function() {
    let devId = null;
    try {
      devId = localStorage.getItem('sahay_device_id');
      if (!devId) {
        devId = 'dev-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('sahay_device_id', devId);
      }
    } catch (e) {
      // LocalStorage access blocked (e.g. in some incognito settings)
      devId = 'dev-incognito-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    return devId;
  })(),
  currentLanguage: 'en', // 'en' or 'hi'
  currentScreen: 'welcome-screen',
  currentQuestionIndex: 0,
  answers: Array(15).fill(null), // Store indices: 0, 1, 2, 3
  scoreData: null,
  consents: { upi: true, bills: true, ecom: true, location: true, gst: true },
  signatureName: '',
  
  // Simulator Parameters
  simState: {
    calibrationOffset: 0,
    mobile: 12,
    upi: 30000,
    geo: 'stable',
    ecom: 'low',
    gst: 4.0,
    psycho: 'medium',
    salary_consistency: 1.0,
    failed_tx_ratio: 1.0,
    merchant_diversity: 1.0,
    refund_ratio: 1.0
  }
};

// DOM Cache
const dom = {
  // Navigation / Lang
  langBtn: document.getElementById('lang-toggle-btn'),
  screens: {
    welcome: document.getElementById('welcome-screen'),
    consent: document.getElementById('consent-screen'),
    rbiLink: document.getElementById('rbi-link-screen'),
    ekyc: document.getElementById('ekyc-screen'),
    quiz: document.getElementById('quiz-screen'),
    processing: document.getElementById('processing-screen'),
    result: document.getElementById('result-screen'),
    shap: document.getElementById('shap-screen'),
    comparison: document.getElementById('comparison-screen'),
    emiPlanner: document.getElementById('emi-planner-screen'),
    vault: document.getElementById('vault-screen'),
    privacy: document.getElementById('privacy-screen')
  },
  
  // Comparison View
  compHeadline: document.getElementById('comp-headline'),
  compTagline: document.getElementById('comp-tagline'),
  lendersList: document.getElementById('lenders-list'),
  chartTitle: document.getElementById('chart-title'),
  chartSubtitle: document.getElementById('chart-subtitle'),
  costChartBars: document.getElementById('cost-chart-bars'),
  compBackBtn: document.getElementById('comp-back-btn'),
  compBackBtnText: document.getElementById('comp-back-btn-text'),
  
  // EMI Planner Screen
  emiPlannerBtn: document.getElementById('emi-planner-btn'),
  emiPlannerBtnText: document.getElementById('emi-planner-btn-text'),
  planAmountInput: document.getElementById('plan-amount-input'),
  planAmountVal: document.getElementById('plan-amount-val'),
  planRateInput: document.getElementById('plan-rate-input'),
  planTenureGroup: document.getElementById('plan-tenure-group'),
  planEmiOutput: document.getElementById('plan-emi-output'),
  planInterestOutput: document.getElementById('plan-interest-output'),
  planPayableOutput: document.getElementById('plan-payable-output'),
  planDonutChart: document.getElementById('plan-donut-chart'),
  planDonutCenterVal: document.getElementById('plan-donut-center-val'),
  planIncomeInput: document.getElementById('plan-income-input'),
  planAffordCard: document.getElementById('plan-afford-card'),
  planAffordRatio: document.getElementById('plan-afford-ratio'),
  planAffordStatus: document.getElementById('plan-afford-status'),
  planScheduleBody: document.getElementById('plan-schedule-body'),
  planApplyBtn: document.getElementById('plan-apply-btn'),
  planApplyBtnText: document.getElementById('plan-apply-btn-text'),
  planBackBtn: document.getElementById('plan-back-btn'),
  planBackBtnText: document.getElementById('plan-back-btn-text'),

  // Privacy / Federated Learning Screen
  privacyBtn: document.getElementById('privacy-btn'),
  privacyBtnText: document.getElementById('privacy-btn-text'),
  flBackBtn: document.getElementById('fl-back-btn'),
  flBackBtnText: document.getElementById('fl-back-btn-text'),

  // Document Vault Screen
  docVaultBtn: document.getElementById('doc-vault-btn'),
  docVaultBtnText: document.getElementById('doc-vault-btn-text'),
  vaultCompletenessPct: document.getElementById('vault-completeness-pct'),
  vaultCompletenessFill: document.getElementById('vault-completeness-fill'),
  vaultGridList: document.getElementById('vault-grid-list'),
  vaultDeleteBtn: document.getElementById('vault-delete-btn'),
  vaultDeleteBtnText: document.getElementById('vault-delete-btn-text'),
  vaultBackBtn: document.getElementById('vault-back-btn'),
  vaultBackBtnText: document.getElementById('vault-back-btn-text'),

  // RBI Account Aggregator View
  rbiAaBadgeLbl: document.getElementById('rbi-aa-badge-lbl'),
  rbiLinkTitle: document.getElementById('rbi-link-title'),
  rbiLinkSubtitle: document.getElementById('rbi-link-subtitle'),
  lblSelectBank: document.getElementById('lbl-select-bank'),
  lblRbiAaHandle: document.getElementById('lbl-rbi-aa-handle'),
  rbiAaInput: document.getElementById('rbi-aa-input'),
  rbiAaHint: document.getElementById('rbi-aa-hint'),
  rbiRequestOtpBtn: document.getElementById('rbi-request-otp-btn'),
  rbiBtnOtpText: document.getElementById('rbi-btn-otp-text'),
  lblEnterOtp: document.getElementById('lbl-enter-otp'),
  rbiOtpSentHint: document.getElementById('rbi-otp-sent-hint'),
  rbiVerifyOtpBtn: document.getElementById('rbi-verify-otp-btn'),
  rbiBtnVerifyText: document.getElementById('rbi-btn-verify-text'),
  rbiOtpBackBtn: document.getElementById('rbi-otp-back-btn'),
  rbiBtnOtpBack: document.getElementById('rbi-btn-otp-back'),
  rbiProceedQuizBtn: document.getElementById('rbi-proceed-quiz-btn'),
  rbiBtnProceedText: document.getElementById('rbi-btn-proceed-text'),
  rbiFetchStatusTitle: document.getElementById('rbi-fetch-status-title'),
  
  // Welcome View
  welcomeBadgeText: document.getElementById('welcome-badge-text'),
  welcomeTitleTop: document.getElementById('welcome-title-top'),
  welcomeTitleBottom: document.getElementById('welcome-title-bottom'),
  welcomeSubtitle: document.getElementById('welcome-subtitle'),
  feature1Title: document.getElementById('feature-1-title'),
  feature1Desc: document.getElementById('feature-1-desc'),
  feature2Title: document.getElementById('feature-2-title'),
  feature2Desc: document.getElementById('feature-2-desc'),
  feature3Title: document.getElementById('feature-3-title'),
  feature3Desc: document.getElementById('feature-3-desc'),
  startBtn: document.getElementById('start-btn'),
  startBtnText: document.getElementById('start-btn-text'),
  privacyNotice: document.getElementById('privacy-notice'),
  
  // Quiz View
  quizNumLabel: document.getElementById('question-number-label'),
  quizCatLabel: document.getElementById('question-category-label'),
  quizProgressFill: document.getElementById('quiz-progress-bar'),
  questionCard: document.getElementById('question-card'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-list'),
  backBtn: document.getElementById('back-btn'),
  saveIndicator: document.getElementById('footer-save-indicator'),
  
  // Processing View
  processingHeadline: document.getElementById('processing-headline'),
  stepFd: document.getElementById('step-fd'),
  stepFdText: document.getElementById('step-fd-text'),
  stepRa: document.getElementById('step-ra'),
  stepRaText: document.getElementById('step-ra-text'),
  stepRi: document.getElementById('step-ri'),
  stepRiText: document.getElementById('step-ri-text'),
  stepScoring: document.getElementById('step-scoring'),
  stepScoringText: document.getElementById('step-scoring-text'),
  
  // Result View
  resultHeadline: document.getElementById('result-headline'),
  resultTagline: document.getElementById('result-tagline'),
  gaugeFill: document.getElementById('gauge-fill'),
  scoreVal: document.getElementById('score-value'),
  profileTierTitle: document.getElementById('profile-tier-title'),
  profileTierValue: document.getElementById('profile-tier-value'),
  profileName: document.getElementById('profile-name'),
  profileDesc: document.getElementById('profile-desc'),
  limitLabel: document.getElementById('limit-label'),
  limitValue: document.getElementById('limit-value'),
  limitSub: document.getElementById('limit-sub'),
  breakdownHeadline: document.getElementById('breakdown-headline'),
  dimFdLabel: document.getElementById('dim-fd-label'),
  dimFdVal: document.getElementById('dim-fd-val'),
  dimFdBar: document.getElementById('dim-fd-bar'),
  dimRaLabel: document.getElementById('dim-ra-label'),
  dimRaVal: document.getElementById('dim-ra-val'),
  dimRaBar: document.getElementById('dim-ra-bar'),
  dimRiLabel: document.getElementById('dim-ri-label'),
  dimRiVal: document.getElementById('dim-ri-val'),
  dimRiBar: document.getElementById('dim-ri-bar'),
  applyBtnText: document.getElementById('apply-btn-text'),
  applyBtn: document.getElementById('apply-btn'),
  restartBtnText: document.getElementById('restart-btn-text'),
  restartBtn: document.getElementById('restart-btn'),
  eligibilityFlag: document.getElementById('eligibility-flag'),
  confidenceBand: document.getElementById('confidence-band'),
  confidenceBoundsLabel: document.getElementById('confidence-bounds-label'),
  confidenceScoreText: document.getElementById('lbl-score-confidence-text'),
  confidenceBarFill: document.getElementById('confidence-bar-fill'),
  confidenceContextText: document.getElementById('confidence-context-text'),
  confidenceTooltipDesc: document.getElementById('lbl-confidence-tooltip-desc'),
  fraudStatusCard: document.getElementById('fraud-status-card'),
  fraudStatusIcon: document.getElementById('fraud-status-icon'),
  fraudStatusLabel: document.getElementById('fraud-status-label'),
  fraudStatusDesc: document.getElementById('fraud-status-desc'),
  rateLabel: document.getElementById('rate-label'),
  rateValue: document.getElementById('rate-value'),
  shapHeadline: document.getElementById('shap-headline'),
  shapFactorsList: document.getElementById('shap-factors-list'),
  improvementHeadline: document.getElementById('improvement-headline'),
  improvementTipsList: document.getElementById('improvement-tips-list'),
  
  // SHAP Screen elements
  viewShapBtn: document.getElementById('view-shap-btn'),
  viewShapBtnText: document.getElementById('view-shap-btn-text'),
  shapScreenTitle: document.getElementById('shap-screen-title'),
  shapScreenSubtitle: document.getElementById('shap-screen-subtitle'),
  shapFinalScoreVal: document.getElementById('shap-final-score-val'),
  shareReportBtn: document.getElementById('share-report-btn'),
  shareReportBtnText: document.getElementById('share-report-btn-text'),
  shapCompareBtn: document.getElementById('shap-compare-btn'),
  shapCompareBtnText: document.getElementById('shap-compare-btn-text'),
  shapBackBtn: document.getElementById('shap-back-btn'),
  shapBackBtnText: document.getElementById('shap-back-btn-text'),
  reportBox: document.getElementById('report-box'),
  reportText: document.getElementById('report-text'),
  closeReportBtn: document.getElementById('close-report-btn'),
  lblReportPreview: document.getElementById('lbl-report-preview'),
  
  // Consent View elements
  consentRbiText: document.getElementById('consent-rbi-text'),
  consentHeadline: document.getElementById('consent-headline'),
  consentSubtitle: document.getElementById('consent-subtitle'),
  consentUpiTitle: document.getElementById('consent-upi-title'),
  consentUpiDesc: document.getElementById('consent-upi-desc'),
  consentUpiDisclosure: document.getElementById('consent-upi-disclosure'),
  consentBillsTitle: document.getElementById('consent-bills-title'),
  consentBillsDesc: document.getElementById('consent-bills-desc'),
  consentBillsDisclosure: document.getElementById('consent-bills-disclosure'),
  consentEcomTitle: document.getElementById('consent-ecom-title'),
  consentEcomDesc: document.getElementById('consent-ecom-desc'),
  consentEcomDisclosure: document.getElementById('consent-ecom-disclosure'),
  consentLocationTitle: document.getElementById('consent-location-title'),
  consentLocationDesc: document.getElementById('consent-location-desc'),
  consentLocationDisclosure: document.getElementById('consent-location-disclosure'),
  consentGstTitle: document.getElementById('consent-gst-title'),
  consentGstDesc: document.getElementById('consent-gst-desc'),
  consentGstDisclosure: document.getElementById('consent-gst-disclosure'),
  signatureLabel: document.getElementById('signature-label'),
  signatureInput: document.getElementById('signature-input'),
  signatureDesc: document.getElementById('signature-desc'),
  reassuranceText: document.getElementById('reassurance-text'),
  consentProceedBtn: document.getElementById('consent-proceed-btn'),
  consentBtnText: document.getElementById('consent-btn-text'),
  consentToggles: {
    upi: document.getElementById('consent-upi-toggle'),
    bills: document.getElementById('consent-bills-toggle'),
    ecom: document.getElementById('consent-ecom-toggle'),
    location: document.getElementById('consent-location-toggle'),
    gst: document.getElementById('consent-gst-toggle')
  },
  salaryConsistencySelect: document.getElementById('salary-consistency-select'),
  failedTxSelect: document.getElementById('failed-tx-select'),
  merchantDiversitySelect: document.getElementById('merchant-diversity-select'),
  refundRatioSelect: document.getElementById('refund-ratio-select'),
  
  // Score Simulator elements (removed)
};

// Initialize Application
function init() {
  bindEvents();
  renderScreen();
}

// Bind Interaction Listeners
function bindEvents() {
  // Language Selector
  dom.langBtn.addEventListener('click', toggleLanguage);
  bindRbiEvents();

  // Mobile Hub Drawer Listeners
  const hubToggleBtn = document.getElementById('demo-hub-toggle-btn');
  const hubDrawer = document.getElementById('mobile-demo-hub-drawer');
  const hubCloseBtn = document.getElementById('close-hub-drawer-btn');
  const hubOverlay = document.getElementById('mobile-hub-overlay');
  const mobileOnboardingBtn = document.getElementById('btn-mobile-onboarding');

  if (hubToggleBtn && hubDrawer && hubOverlay) {
    hubToggleBtn.addEventListener('click', () => {
      hubDrawer.style.transform = 'translateY(0)';
      hubOverlay.style.opacity = '1';
      hubOverlay.style.pointerEvents = 'auto';
    });

    const closeHub = () => {
      hubDrawer.style.transform = 'translateY(105%)';
      hubOverlay.style.opacity = '0';
      hubOverlay.style.pointerEvents = 'none';
    };

    if (hubCloseBtn) hubCloseBtn.addEventListener('click', closeHub);
    hubOverlay.addEventListener('click', closeHub);
    if (mobileOnboardingBtn) mobileOnboardingBtn.addEventListener('click', closeHub);
  }

  // Welcome Screen -> Start (Proceed to Consent Screen first)
  dom.startBtn.addEventListener('click', () => {
    navigateTo('consent-screen');
  });

  // Consent Screen - Toggles
  dom.consentToggles.upi.addEventListener('change', (e) => {
    state.consents.upi = e.target.checked;
  });
  dom.consentToggles.bills.addEventListener('change', (e) => {
    state.consents.bills = e.target.checked;
  });
  dom.consentToggles.ecom.addEventListener('change', (e) => {
    state.consents.ecom = e.target.checked;
  });
  dom.consentToggles.location.addEventListener('change', (e) => {
    state.consents.location = e.target.checked;
  });
  dom.consentToggles.gst.addEventListener('change', (e) => {
    state.consents.gst = e.target.checked;
  });

  const updateAdditionalFootprints = () => {
    if (!dom.salaryConsistencySelect) return;
    const salVal = dom.salaryConsistencySelect.value;
    const failVal = dom.failedTxSelect.value;
    const divVal = dom.merchantDiversitySelect.value;
    const refVal = dom.refundRatioSelect.value;

    state.simState.salary_consistency = salVal === "Very Regular" ? 1.0 : salVal === "Mostly Regular" ? 0.67 : salVal === "Irregular" ? 0.33 : 0.0;
    state.simState.failed_tx_ratio = failVal === "0" ? 1.0 : failVal === "1-2" ? 0.75 : failVal === "3-5" ? 0.35 : 0.0;
    state.simState.merchant_diversity = divVal === "Many" ? 1.0 : divVal === "Few" ? 0.67 : divVal === "One" ? 0.33 : 0.0;
    state.simState.refund_ratio = refVal === "Rarely" ? 1.0 : refVal === "Occasionally" ? 0.75 : refVal === "Frequently" ? 0.35 : 0.0;
  };

  if (dom.salaryConsistencySelect) {
    dom.salaryConsistencySelect.addEventListener('change', updateAdditionalFootprints);
    dom.failedTxSelect.addEventListener('change', updateAdditionalFootprints);
    dom.merchantDiversitySelect.addEventListener('change', updateAdditionalFootprints);
    dom.refundRatioSelect.addEventListener('change', updateAdditionalFootprints);
    // Initial load
    updateAdditionalFootprints();
  }

  // Consent Screen - Digital Signature input listener
  dom.signatureInput.addEventListener('input', (e) => {
    state.signatureName = e.target.value.trim();
    // Enable proceed button only if user has typed a name (at least 2 letters)
    if (state.signatureName.length > 1) {
      dom.consentProceedBtn.disabled = false;
    } else {
      dom.consentProceedBtn.disabled = true;
    }
  });

  // Consent Screen -> Accept & Proceed
  dom.consentProceedBtn.addEventListener('click', () => {
    navigateTo('rbiLink');
  });

  // Quiz Screen -> Back Navigation
  dom.backBtn.addEventListener('click', handleBack);

  // Result Screen -> Apply (Navigate to Comparison Screen)
  if (dom.applyBtn) {
    dom.applyBtn.addEventListener('click', () => {
      navigateTo('comparison-screen');
    });
  }

  // Comparison Screen -> Back
  dom.compBackBtn.addEventListener('click', () => {
    navigateTo('result-screen');
  });

  // Result Screen -> Restart Onboarding
  dom.restartBtn.addEventListener('click', resetAssessment);



  // Result Screen -> EMI Planner Screen Navigation
  if (dom.emiPlannerBtn) {
    dom.emiPlannerBtn.addEventListener('click', () => {
      navigateTo('emiPlanner');
    });
  }

  // EMI Planner Screen -> Controls & Handlers
  dom.planBackBtn.addEventListener('click', () => {
    navigateTo('result-screen');
  });

  dom.planApplyBtn.addEventListener('click', () => {
    if (state.scoreData) {
      state.scoreData.creditLimit = state.plannerState.amount;
      state.scoreData.interestRate = state.plannerState.rate;
      state.lenderTenures = { 
        0: state.plannerState.tenure, 
        1: state.plannerState.tenure, 
        2: state.plannerState.tenure, 
        3: state.plannerState.tenure 
      };
    }
    navigateTo('comparison-screen');
  });

  // Slider & Text Inputs listeners for Planner
  dom.planAmountInput.addEventListener('input', (e) => {
    state.plannerState.amount = parseInt(e.target.value);
    updatePlannerUI();
  });

  dom.planRateInput.addEventListener('input', (e) => {
    state.plannerState.rate = parseFloat(e.target.value) || 14;
    updatePlannerUI();
  });

  dom.planIncomeInput.addEventListener('input', (e) => {
    state.plannerState.income = parseInt(e.target.value) || 0;
    updatePlannerUI();
  });

  dom.planTenureGroup.querySelectorAll('.tenure-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      dom.planTenureGroup.querySelectorAll('.tenure-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.plannerState.tenure = parseInt(e.target.getAttribute('data-tenure'));
      updatePlannerUI();
    });
  });



  // Result Screen -> Privacy Screen Navigation
  if (dom.privacyBtn) {
    dom.privacyBtn.addEventListener('click', () => {
      navigateTo('privacy');
    });
  }

  // Result Screen -> SHAP Screen
  if (dom.viewShapBtn) {
    dom.viewShapBtn.addEventListener('click', () => {
      navigateTo('shap-screen');
    });
  }

  // SHAP Screen -> Actions
  if (dom.shareReportBtn) {
    dom.shareReportBtn.addEventListener('click', shareScoreReport);
  }
  if (dom.shapCompareBtn) {
    dom.shapCompareBtn.addEventListener('click', () => {
      navigateTo('comparison-screen');
    });
  }
  if (dom.shapBackBtn) {
    dom.shapBackBtn.addEventListener('click', () => {
      navigateTo('result-screen');
    });
  }
  if (dom.closeReportBtn) {
    dom.closeReportBtn.addEventListener('click', () => {
      dom.reportBox.style.display = 'none';
    });
  }
  // Privacy Screen -> Back
  if (dom.flBackBtn) {
    dom.flBackBtn.addEventListener('click', () => {
      navigateTo('result-screen');
    });
  }

  // Data split toggle
  const flSplitToggle = document.getElementById('fl-split-toggle');
  if (flSplitToggle) {
    flSplitToggle.addEventListener('change', () => {
      const cols = document.getElementById('fl-split-columns');
      if (cols) cols.style.display = flSplitToggle.checked ? 'grid' : 'none';
    });
  }

  // Result Screen -> Document Vault Screen Navigation
  if (dom.docVaultBtn) {
    dom.docVaultBtn.addEventListener('click', () => {
      navigateTo('vault');
    });
  }

  // Document Vault Screen -> Controls & Handlers
  dom.vaultBackBtn.addEventListener('click', () => {
    navigateTo('result-screen');
  });

  dom.vaultDeleteBtn.addEventListener('click', () => {
    const confirmMsg = state.currentLanguage === 'en'
      ? "WARNING: This will permanently delete all your data and clear your credit profile from SahayCredit's local secure device memory. Do you wish to proceed?"
      : "चेतावनी: यह आपके सभी डेटा को स्थायी रूप से हटा देगा और सहायक्रेडिट की स्थानीय सुरक्षित डिवाइस मेमोरी से आपके क्रेडिट प्रोफाइल को मिटा देगा। क्या आप आगे बढ़ना चाहते हैं?";
    
    if (confirm(confirmMsg)) {
      resetAssessment();
      alert(state.currentLanguage === 'en' ? "All data cleared successfully." : "सभी डेटा सफलतापूर्वक मिटा दिया गया है।");
    }
  });

  // ── eKYC Screen — Event Handlers ──────────────────────────────────────────
  const ekycAadhaarInput = document.getElementById('ekyc-aadhaar-input');
  const ekycPanInput = document.getElementById('ekyc-pan-input');
  const ekycNameInput = document.getElementById('ekyc-name-input');
  const ekycVerifyBtn = document.getElementById('ekyc-verify-btn');
  const ekycProceedBtn = document.getElementById('ekyc-proceed-btn');
  const ekycRetryBtn = document.getElementById('ekyc-retry-btn');

  function validateEkycInputs() {
    if (!ekycVerifyBtn) return;
    const aadhaar = (ekycAadhaarInput?.value || '').replace(/\s/g, '');
    const pan = (ekycPanInput?.value || '').trim().toUpperCase();
    const name = (ekycNameInput?.value || '').trim();
    const aadhaarValid = /^\d{12}$/.test(aadhaar);
    const panValid = /^[A-Z]{5}\d{4}[A-Z]$/.test(pan);
    const nameValid = name.length >= 2;
    ekycVerifyBtn.disabled = !(aadhaarValid && panValid && nameValid);
  }

  if (ekycAadhaarInput) {
    // Auto-format Aadhaar with spaces: 1234 5678 9012
    ekycAadhaarInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 12);
      if (v.length > 8) v = v.slice(0,4) + ' ' + v.slice(4,8) + ' ' + v.slice(8);
      else if (v.length > 4) v = v.slice(0,4) + ' ' + v.slice(4);
      e.target.value = v;
      validateEkycInputs();
    });
  }
  if (ekycPanInput) {
    ekycPanInput.addEventListener('input', () => validateEkycInputs());
  }
  if (ekycNameInput) {
    ekycNameInput.addEventListener('input', () => validateEkycInputs());
  }

  if (ekycVerifyBtn) {
    ekycVerifyBtn.addEventListener('click', async () => {
      const aadhaar = ekycAadhaarInput.value.replace(/\s/g, '');
      const pan = ekycPanInput.value.trim().toUpperCase();
      const name = ekycNameInput.value.trim();

      // Hide input, show verifying
      document.getElementById('ekyc-step-input').style.display = 'none';
      document.getElementById('ekyc-step-verifying').style.display = 'block';
      document.getElementById('ekyc-step-success').style.display = 'none';
      document.getElementById('ekyc-step-failed').style.display = 'none';

      // Animate log lines
      const logs = [
        document.getElementById('ekyc-log-1'),
        document.getElementById('ekyc-log-2'),
        document.getElementById('ekyc-log-3'),
        document.getElementById('ekyc-log-4')
      ];
      logs.forEach(l => { if (l) { l.style.opacity = '0.3'; l.style.transition = 'opacity 0.4s'; }});

      for (let i = 0; i < logs.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        if (logs[i]) logs[i].style.opacity = '1';
      }

      // Call backend API
      try {
        const resp = await fetch('/api/ekyc/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            borrowerId: state.borrowerId,
            documentType: 'aadhaar',
            documentNumber: aadhaar,
            name: name,
            panNumber: pan,
            deviceFingerprint: state.deviceFingerprint
          })
        });
        const data = await resp.json();

        await new Promise(r => setTimeout(r, 500));
        document.getElementById('ekyc-step-verifying').style.display = 'none';

        if (data.success && data.data?.status === 'verified') {
          document.getElementById('ekyc-step-success').style.display = 'block';
          document.getElementById('ekyc-step-failed').style.display = 'none';
          const vid = document.getElementById('ekyc-verification-id');
          if (vid) vid.textContent = data.data.verificationId || 'EKYC-SANDBOX-' + Math.random().toString(36).slice(2,8).toUpperCase();
          state.ekycVerified = true;
        } else {
          document.getElementById('ekyc-step-failed').style.display = 'block';
          document.getElementById('ekyc-step-success').style.display = 'none';
          const reason = document.getElementById('ekyc-fail-reason');
          if (reason) reason.textContent = data.data?.details?.join('. ') || data.error || 'Verification failed. Please try again.';
        }
      } catch (err) {
        // API unavailable — sandbox auto-approve for demo
        await new Promise(r => setTimeout(r, 500));
        document.getElementById('ekyc-step-verifying').style.display = 'none';
        document.getElementById('ekyc-step-success').style.display = 'block';
        const vid = document.getElementById('ekyc-verification-id');
        if (vid) vid.textContent = 'EKYC-SANDBOX-' + Math.random().toString(36).slice(2,8).toUpperCase();
        state.ekycVerified = true;
      }
    });
  }

  if (ekycProceedBtn) {
    ekycProceedBtn.addEventListener('click', () => {
      navigateTo('quiz-screen');
    });
  }

  if (ekycRetryBtn) {
    ekycRetryBtn.addEventListener('click', () => {
      document.getElementById('ekyc-step-failed').style.display = 'none';
      document.getElementById('ekyc-step-input').style.display = 'block';
    });
  }
}

// Toggle Language Mode
function toggleLanguage() {
  state.currentLanguage = state.currentLanguage === 'en' ? 'hi' : 'en';
  
  // Update toggle button DOM state
  const enLabel = dom.langBtn.querySelector('[data-lang="en"]');
  const hiLabel = dom.langBtn.querySelector('[data-lang="hi"]');
  if (state.currentLanguage === 'en') {
    enLabel.classList.add('active');
    hiLabel.classList.remove('active');
  } else {
    enLabel.classList.remove('active');
    hiLabel.classList.add('active');
  }

  // Re-translate current view
  translateUI();
}

// Localized translation for static UI elements based on state.currentLanguage
function translateUI() {
  const t = UI_TRANSLATIONS[state.currentLanguage];
  
  // Welcome View
  dom.welcomeBadgeText.textContent = t.welcomeBadgeText;
  dom.welcomeTitleTop.textContent = t.welcomeTitleTop;
  dom.welcomeTitleBottom.textContent = t.welcomeTitleBottom;
  dom.welcomeSubtitle.textContent = t.welcomeSubtitle;
  dom.feature1Title.textContent = t.feature1Title;
  dom.feature1Desc.textContent = t.feature1Desc;
  dom.feature2Title.textContent = t.feature2Title;
  dom.feature2Desc.textContent = t.feature2Desc;
  dom.feature3Title.textContent = t.feature3Title;
  dom.feature3Desc.textContent = t.feature3Desc;
  dom.startBtnText.textContent = t.startBtnText;
  dom.privacyNotice.textContent = t.privacyNotice;
  
  // Consent View
  dom.consentRbiText.textContent = t.consentRbiText;
  dom.consentHeadline.textContent = t.consentHeadline;
  dom.consentSubtitle.textContent = t.consentSubtitle;
  
  dom.consentUpiTitle.textContent = t.consentUpiTitle;
  dom.consentUpiDesc.textContent = t.consentUpiDesc;
  dom.consentUpiDisclosure.textContent = t.consentUpiDisclosure;
  
  dom.consentBillsTitle.textContent = t.consentBillsTitle;
  dom.consentBillsDesc.textContent = t.consentBillsDesc;
  dom.consentBillsDisclosure.textContent = t.consentBillsDisclosure;
  
  dom.consentEcomTitle.textContent = t.consentEcomTitle;
  dom.consentEcomDesc.textContent = t.consentEcomDesc;
  dom.consentEcomDisclosure.textContent = t.consentEcomDisclosure;
  
  dom.consentLocationTitle.textContent = t.consentLocationTitle;
  dom.consentLocationDesc.textContent = t.consentLocationDesc;
  dom.consentLocationDisclosure.textContent = t.consentLocationDisclosure;
  
  dom.consentGstTitle.textContent = t.consentGstTitle;
  dom.consentGstDesc.textContent = t.consentGstDesc;
  dom.consentGstDisclosure.textContent = t.consentGstDisclosure;
  
  dom.signatureLabel.textContent = t.signatureLabel;
  dom.signatureInput.placeholder = t.signaturePlaceholder;
  dom.signatureDesc.textContent = t.signatureDesc;
  dom.reassuranceText.textContent = t.reassuranceText;
  dom.consentBtnText.textContent = t.consentBtnText;
  
  // Quiz View
  dom.saveIndicator.textContent = t.autoSaved;
  renderQuestion(); // Re-render question prompt & options with updated language
  
  // RBI Link View
  if (dom.rbiAaBadgeLbl) {
    dom.rbiAaBadgeLbl.textContent = t.rbiAaBadgeLbl;
    dom.rbiLinkTitle.textContent = t.rbiLinkTitle;
    dom.rbiLinkSubtitle.textContent = t.rbiLinkSubtitle;
    dom.lblSelectBank.textContent = t.lblSelectBank;
    dom.lblRbiAaHandle.textContent = t.lblRbiAaHandle;
    dom.rbiAaHint.textContent = t.rbiAaHint;
    dom.rbiBtnOtpText.textContent = t.rbiBtnOtpText;
    dom.lblEnterOtp.textContent = t.lblEnterOtp;
    dom.rbiOtpSentHint.textContent = t.rbiOtpSentHint;
    dom.rbiBtnVerifyText.textContent = t.rbiBtnVerifyText;
    dom.rbiBtnOtpBack.textContent = t.rbiBtnOtpBack;
    dom.rbiBtnProceedText.textContent = t.rbiProceedQuizBtn;
    dom.rbiFetchStatusTitle.textContent = t.rbiFetchStatusTitle;
    
    // Hindi/English toggle logs
    document.getElementById('rbi-log-step-1').textContent = t.rbiLogStep1;
    document.getElementById('rbi-log-step-2').textContent = t.rbiLogStep2;
    document.getElementById('rbi-log-step-3').textContent = t.rbiLogStep3;
    document.getElementById('rbi-log-step-4').textContent = t.rbiLogStep4;
  }
  
  // Processing View
  dom.processingHeadline.textContent = t.processingHeadline;
  dom.stepFdText.textContent = t.stepFdText;
  dom.stepRaText.textContent = t.stepRaText;
  dom.stepRiText.textContent = t.stepRiText;
  dom.stepScoringText.textContent = t.stepScoringText;
  
  // Result View
  dom.resultHeadline.textContent = t.resultHeadline;
  dom.resultTagline.textContent = t.resultTagline;
  dom.profileTierTitle.textContent = t.profileTierTitle;
  dom.limitLabel.textContent = t.limitLabel;
  dom.limitSub.textContent = t.limitSub;
  dom.breakdownHeadline.textContent = t.breakdownHeadline;
  dom.dimFdLabel.textContent = t.dimFdLabel;
  dom.dimRaLabel.textContent = t.dimRaLabel;
  dom.dimRiLabel.textContent = t.dimRiLabel;
  if (dom.applyBtnText) dom.applyBtnText.textContent = t.applyBtnText;
  dom.restartBtnText.textContent = t.restartBtnText;
  dom.rateLabel.textContent = t.rateLabel;
  dom.shapHeadline.textContent = t.shapHeadline;
  dom.improvementHeadline.textContent = t.improvementHeadline;



  if (dom.emiPlannerBtnText) {
    dom.emiPlannerBtnText.textContent = state.currentLanguage === 'en' ? 'EMI Calculator & Affordability Planner' : 'EMI कैलकुलेटर और वहनीयता प्लानर';
  }

  // EMI Planner Screen labels
  const emiPlanHeadline = document.getElementById('emi-plan-headline');
  if (emiPlanHeadline) {
    emiPlanHeadline.textContent = state.currentLanguage === 'en' ? 'Interactive EMI Planner' : 'इंटरैक्टिव EMI प्लानर';
    document.getElementById('emi-plan-tagline').textContent = state.currentLanguage === 'en' ? 'Structure your repayments and test loan affordability.' : 'अपने पुनर्भुगतान को व्यवस्थित करें और ऋण वहनीयता का परीक्षण करें।';
    document.getElementById('lbl-plan-amount').textContent = state.currentLanguage === 'en' ? 'Desired Loan Amount' : 'वांछित ऋण राशि';
    document.getElementById('lbl-plan-rate').textContent = state.currentLanguage === 'en' ? 'Interest Rate (% p.a.)' : 'ब्याज दर (% प्रति वर्ष)';
    document.getElementById('lbl-plan-tenure').textContent = state.currentLanguage === 'en' ? 'Loan Tenure Period (Months)' : 'ऋण अवधि (महीने)';
    document.getElementById('lbl-est-emi').textContent = state.currentLanguage === 'en' ? 'Estimated Monthly EMI' : 'अनुमानित मासिक किस्त (EMI)';
    document.getElementById('lbl-total-interest').textContent = state.currentLanguage === 'en' ? 'Total Interest' : 'कुल ब्याज';
    document.getElementById('lbl-total-payable').textContent = state.currentLanguage === 'en' ? 'Total Amount Payable' : 'कुल देय राशि';
    document.getElementById('lbl-legend-principal').textContent = state.currentLanguage === 'en' ? 'Principal' : 'मूलधन';
    document.getElementById('lbl-legend-interest').textContent = state.currentLanguage === 'en' ? 'Interest' : 'ब्याज';
    document.getElementById('lbl-affordability-title').textContent = state.currentLanguage === 'en' ? 'Can I Afford This?' : 'क्या मैं यह वहन कर सकता हूँ?';
    document.getElementById('lbl-affordability-subtitle').textContent = state.currentLanguage === 'en' ? 'Check your debt-to-income ratio based on your monthly income.' : 'अपनी मासिक आय के आधार पर अपने ऋण-से-आय अनुपात की जाँच करें।';
    document.getElementById('lbl-monthly-income').textContent = state.currentLanguage === 'en' ? 'Your Monthly Income' : 'आपकी मासिक आय';
    document.getElementById('lbl-emi-ratio').textContent = state.currentLanguage === 'en' ? 'EMI as % of Income:' : 'आय के प्रतिशत के रूप में EMI:';
    document.getElementById('lbl-status-verdict').textContent = state.currentLanguage === 'en' ? 'Affordability Status:' : 'वहनीयता स्थिति:';
    document.getElementById('lbl-schedule-title').textContent = state.currentLanguage === 'en' ? 'Amortization Schedule' : 'ऋणमुक्ति (अमोर्टाइजेशन) अनुसूची';
    document.getElementById('lbl-schedule-subtitle').textContent = state.currentLanguage === 'en' ? 'Month-by-month principal and interest breakdown.' : 'महीने-दर-महीने मूलधन और ब्याज का विवरण।';
    document.getElementById('th-sched-month').textContent = state.currentLanguage === 'en' ? 'Month' : 'महीना';
    document.getElementById('th-sched-emi').textContent = state.currentLanguage === 'en' ? 'EMI' : 'EMI';
    document.getElementById('th-sched-principal').textContent = state.currentLanguage === 'en' ? 'Principal' : 'मूलधन';
    document.getElementById('th-sched-interest').textContent = state.currentLanguage === 'en' ? 'Interest' : 'ब्याज';
    document.getElementById('th-sched-balance').textContent = state.currentLanguage === 'en' ? 'Balance' : 'शेष राशि';
    dom.planApplyBtnText.textContent = state.currentLanguage === 'en' ? 'Apply for this Loan' : 'इस ऋण के लिए आवेदन करें';
    dom.planBackBtnText.textContent = state.currentLanguage === 'en' ? '← Back to Score' : '← स्कोर पर वापस जाएं';
  }

  // Comparison Screen static labels
  if (dom.compHeadline) {
    dom.compHeadline.textContent = state.currentLanguage === 'en' ? 'Compare Loan Offers' : 'ऋण प्रस्तावों की तुलना करें';
    dom.compTagline.textContent = state.currentLanguage === 'en' ? 'Choose the best pre-approved offer matching your profile.' : 'अपनी प्रोफाइल से मेल खाता सर्वश्रेष्ठ प्री-एप्रूव्ड ऑफर चुनें।';
    dom.chartTitle.textContent = state.currentLanguage === 'en' ? 'Total Cost Comparison' : 'कुल ऋण लागत तुलना';
    dom.chartSubtitle.textContent = state.currentLanguage === 'en' ? 'Principal + Total Interest + Fees over tenure' : 'ऋण अवधि में मूलधन + कुल ब्याज + शुल्क की तुलना';
    dom.compBackBtnText.textContent = state.currentLanguage === 'en' ? '← Back to Score' : '← स्कोर पर वापस जाएं';
  }

  // Privacy Screen static labels
  if (dom.privacyBtnText) {
    dom.privacyBtnText.textContent = state.currentLanguage === 'en' ? 'How We Protect Your Data' : 'हम आपका डेटा कैसे सुरक्षित रखते हैं';
  }
  const flHeadline = document.getElementById('fl-headline');
  if (flHeadline) {
    const isHi = state.currentLanguage === 'hi';
    document.getElementById('fl-badge-text').textContent   = isHi ? 'फेडरेटेड लर्निंग आर्किटेक्चर' : 'Federated Learning Architecture';
    flHeadline.innerHTML                                   = isHi ? 'हम आपका डेटा<br>कैसे सुरक्षित रखते हैं' : 'How We Protect<br>Your Data';
    document.getElementById('fl-tagline').textContent      = isHi ? 'हर गणना आपके डिवाइस पर रहती है। केवल एन्क्रिप्टेड ग्रेडिएंट हमारे सर्वर पर जाते हैं।' : 'Every computation stays on your device. Only tiny encrypted gradients travel to our servers.';
    document.getElementById('fl-lbl-raw').textContent      = isHi ? 'सर्वर को भेजा गया रॉ डेटा' : 'Raw data transmitted to server';
    document.getElementById('fl-lbl-gradient').textContent = isHi ? 'प्रति राउंड ग्रेडिएंट आकार' : 'Gradient size per round';
    document.getElementById('fl-lbl-accuracy').textContent = isHi ? 'प्रति राउंड मॉडल सटीकता लाभ' : 'Model accuracy gain/round';
    document.getElementById('fl-split-toggle-label').textContent = isHi ? 'दिखाएं: क्या डिवाइस पर रहता है बनाम क्या जाता है' : 'Show me what stays on device vs. what leaves';
    document.getElementById('fl-split-phone-hdr').textContent    = isHi ? 'आपके फ़ोन पर रहता है' : 'Stays on Your Phone';
    document.getElementById('fl-split-server-hdr').textContent   = isHi ? 'आपके फ़ोन से जाता है' : 'Leaves Your Phone';
    document.getElementById('fl-split-note').textContent         = isHi ? '~48KB कुल · AES-256-GCM · कोई PII नहीं' : '~48KB total · AES-256-GCM · No PII';
    document.getElementById('fl-server-lbl').innerHTML    = isHi ? 'सहायक्रेडिट<br>सर्वर' : 'SahayCredit<br>Server';
    document.getElementById('fl-model-lbl').innerHTML     = isHi ? 'XGBoost<br>मॉडल' : 'XGBoost<br>Model';
    document.getElementById('fl-footer-text').innerHTML   = isHi
      ? 'इस आर्किटेक्चर को <strong>फेडरेटेड लर्निंग</strong> कहा जाता है। Google द्वारा विकसित। SahayCredit द्वारा <strong>19 करोड़ उधारकर्ताओं</strong> की सुरक्षा के लिए उपयोग किया जाता है।'
      : 'This architecture is called <strong>Federated Learning</strong>. Developed by Google. Used by SahayCredit to protect <strong>190M borrowers</strong>.';
    if (dom.flBackBtnText) dom.flBackBtnText.textContent = isHi ? '← स्कोर पर वापस जाएं' : '← Back to Score';
  }

  // Document Vault Screen static labels
  if (dom.docVaultBtnText) {
    dom.docVaultBtnText.textContent = state.currentLanguage === 'en' ? 'Document Vault & Data Lock' : 'दस्तावेज़ तिजोरी और डेटा लॉक';
  }
  const vaultHeadline = document.getElementById('vault-headline');
  if (vaultHeadline) {
    vaultHeadline.textContent = state.currentLanguage === 'en' ? 'Encrypted Document Vault' : 'एन्क्रिप्टेड दस्तावेज़ तिजोरी';
    document.getElementById('vault-tagline').textContent = state.currentLanguage === 'en' ? 'Manage your digital footprints and RBI Account Aggregator logs.' : 'अपने डिजिटल पदचिह्नों और आरबीआई खाता एग्रीगेटर लॉग को प्रबंधित करें।';
    document.getElementById('lbl-vault-completeness').textContent = state.currentLanguage === 'en' ? 'Profile Completeness' : 'प्रोफ़ाइल पूर्णता';
    document.getElementById('vault-suggestion-msg').textContent = state.currentLanguage === 'en' ? 'Adding your Aadhaar could increase your score by up to 18 points.' : 'आधार जोड़ने से आपका स्कोर 18 अंक तक बढ़ सकता है।';
    dom.vaultDeleteBtnText.textContent = state.currentLanguage === 'en' ? 'Delete All My Data' : 'मेरा सारा डेटा हटाएं';
    dom.vaultBackBtnText.textContent = state.currentLanguage === 'en' ? '← Back to Score' : '← स्कोर पर वापस जाएं';
  }

  // Personalized result details if score calculations already exist
  if (state.scoreData) {
    renderCalculatedResults();
    if (state.currentScreen === 'comparison-screen') {
      renderComparisonScreen();
    } else if (state.currentScreen === 'vault') {
      renderVaultUI();
    } else if (state.currentScreen === 'shap-screen') {
      renderSHAPScreen();
    }
  }

  if (dom.viewShapBtnText) {
    dom.viewShapBtnText.textContent = state.currentLanguage === 'en' ? 'Why did you get this score? →' : 'आपको यह स्कोर क्यों मिला? →';
  }
}

// API POST Submission (tries server first, falls back to client engine)
async function submitAnswersToAPI() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout for composite

    // Use the session borrower ID for consent tracking
    const borrowerId = state.borrowerId;

    // Check consent toggle states
    const ecomConsent = document.getElementById('consent-ecom-toggle')?.checked || false;
    const merchantConsent = document.getElementById('consent-gst-toggle')?.checked || false;
    const isMSME = merchantConsent; // Merchant toggle implies MSME

    // Grant consent via API for checked sources
    if (ecomConsent) {
      try {
        await fetch('/api/consent/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ borrowerId, sourceId: 'ecommerce' })
        });
      } catch (e) { /* non-fatal */ }
    }
    if (merchantConsent) {
      try {
        await fetch('/api/consent/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ borrowerId, sourceId: 'merchantRatings' })
        });
      } catch (e) { /* non-fatal */ }
    }

    // Build request body with optional alt-data
    const requestBody = {
      answers: state.answers,
      borrowerId,
      deviceFingerprint: state.deviceFingerprint
    };

    // Sample e-commerce data (Olist-schema compatible demo)
    if (ecomConsent) {
      requestBody.ecommerceData = [
        { date: '2025-06-01', amount: 1500, category: 'electronics', reviewScore: 5, wasLate: false },
        { date: '2025-07-10', amount: 850, category: 'clothing', reviewScore: 4, wasLate: false },
        { date: '2025-08-15', amount: 2200, category: 'groceries', reviewScore: 5, wasLate: false },
        { date: '2025-09-05', amount: 680, category: 'home', reviewScore: 3, wasLate: true },
        { date: '2025-10-20', amount: 1100, category: 'electronics', reviewScore: 4, wasLate: false },
        { date: '2025-11-12', amount: 950, category: 'personal_care', reviewScore: 5, wasLate: false },
        { date: '2025-12-01', amount: 3200, category: 'electronics', reviewScore: 4, wasLate: false },
        { date: '2026-01-18', amount: 750, category: 'clothing', reviewScore: 5, wasLate: false }
      ];
    }

    // Sample merchant review data (Yelp-schema compatible demo)
    if (merchantConsent) {
      requestBody.isMSME = true;
      requestBody.merchantData = [
        { date: '2025-04-01', rating: 4, text: 'Good service and quality products. Recommend.' },
        { date: '2025-05-15', rating: 5, text: 'Excellent experience, very professional and fast delivery.' },
        { date: '2025-06-20', rating: 3, text: 'Average quality, slow response to questions.' },
        { date: '2025-07-10', rating: 5, text: 'Amazing! Best in the area. Great customer care.' },
        { date: '2025-08-25', rating: 4, text: 'Reliable and consistent quality. Would buy again.' },
        { date: '2025-09-30', rating: 2, text: 'Wrong item sent, had to return. Disappointing.' },
        { date: '2025-10-15', rating: 5, text: 'Outstanding service, quick and efficient.' },
        { date: '2025-11-01', rating: 4, text: 'Good overall, friendly and helpful staff.' },
        { date: '2025-12-20', rating: 5, text: 'Perfect. Love this shop, best quality.' },
        { date: '2026-01-05', rating: 4, text: 'Great quality, comfortable and beautiful products.' }
      ];
    }

    const response = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const result = await response.json();
    if (result && result.success) {
      state.scoreData = result.data;
      return true;
    }
    return false;
  } catch (error) {
    // Network unavailable or timeout — client-side engine will handle it
    console.info('SahayCredit: API unavailable, client-side engine ready.');
    return false;
  }
}
// Sync segmented progress bar
function updateBorrowerProgress(screenId) {
  const steps = ['welcome-screen', 'consent-screen', 'rbi-link-screen', 'ekyc-screen', 'quiz-screen', 'processing-screen', 'result-screen', 'shap-screen', 'comparison-screen', 'emi-planner-screen'];
  const currentIdx = steps.indexOf(screenId);
  
  // Note: There are only 5 progress segments in the DOM, so comparison/planner screens are treated as phase 5 completed (fully filled progress)
  const segments = document.querySelectorAll('.progress-segment');
  segments.forEach((seg, idx) => {
    if (idx < currentIdx) {
      seg.className = 'progress-segment completed';
    } else if (idx === currentIdx) {
      seg.className = 'progress-segment active';
    } else {
      seg.className = 'progress-segment';
    }
  });
}

// Handle Page Navigation Routing
const SCREEN_ALIASES = {
  rbiLink:    'rbi-link-screen',
  ekyc:       'ekyc-screen',
  emiPlanner: 'emi-planner-screen',
  vault:      'vault-screen',
  privacy:    'privacy-screen',
  quiz:       'quiz-screen',
  processing: 'processing-screen',
  result:     'result-screen',
  shap:       'shap-screen',
  comparison: 'comparison-screen',
  welcome:    'welcome-screen',
  consent:    'consent-screen'
};

function navigateTo(screenId) {
  // Resolve any camelCase alias to canonical kebab-case element ID
  state.currentScreen = SCREEN_ALIASES[screenId] || screenId;
  renderScreen();
}

// Sync screens in DOM based on state.currentScreen
function renderScreen() {
  // Hide all screens, display active screen — state.currentScreen is always a canonical element ID
  Object.keys(dom.screens).forEach(key => {
    const screen = dom.screens[key];
    if (!screen) return;
    if (screen.id === state.currentScreen) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });

  // Sync top segmented progress bar
  updateBorrowerProgress(state.currentScreen);

  // Apply specific logic on route activations
  if (state.currentScreen === 'rbi-link-screen') {
    initRbiLinkingFlow();
  } else if (state.currentScreen === 'ekyc-screen') {
    // Reset to input step when entering eKYC screen
    const inp = document.getElementById('ekyc-step-input');
    const ver = document.getElementById('ekyc-step-verifying');
    const suc = document.getElementById('ekyc-step-success');
    const fail = document.getElementById('ekyc-step-failed');
    if (!state.ekycVerified) {
      if (inp) inp.style.display = 'block';
      if (ver) ver.style.display = 'none';
      if (suc) suc.style.display = 'none';
      if (fail) fail.style.display = 'none';
    } else {
      // Already verified - show success directly
      if (inp) inp.style.display = 'none';
      if (ver) ver.style.display = 'none';
      if (suc) suc.style.display = 'block';
      if (fail) fail.style.display = 'none';
    }
  } else if (state.currentScreen === 'quiz-screen') {
    renderQuestion();
  } else if (state.currentScreen === 'processing-screen') {
    startProcessingAnimation();
  } else if (state.currentScreen === 'result-screen') {
    renderCalculatedResults();
  } else if (state.currentScreen === 'shap-screen') {
    renderSHAPScreen();
  } else if (state.currentScreen === 'comparison-screen') {
    renderComparisonScreen();
  } else if (state.currentScreen === 'emi-planner-screen') {
    initPlannerState();
    updatePlannerUI();
  } else if (state.currentScreen === 'vault-screen') {
    initVaultState();
    renderVaultUI();
  } else if (state.currentScreen === 'privacy-screen') {
    startFLAnimation();
  }

  // Ensure overall UI translations are loaded
  translateUI();
}

// Render Questionnaire State
function renderQuestion() {
  const index = state.currentQuestionIndex;
  const q = QUESTIONS[index];
  const t = UI_TRANSLATIONS[state.currentLanguage];
  
  // Format question indicator (Question X of 15)
  const questionNumText = t.questionNumberLabel.replace('{num}', index + 1);
  dom.quizNumLabel.textContent = questionNumText;
  
  // Format Category tag
  dom.quizCatLabel.textContent = t[q.category] || q.category;
  
  // Update progress bar width
  const progressPct = ((index + 1) / QUESTIONS.length) * 100;
  dom.quizProgressFill.style.width = `${progressPct}%`;
  
  // Set question prompt text
  const langKey = state.currentLanguage;
  dom.questionText.textContent = q[langKey].question;
  
  // Set options text dynamically
  const options = q[langKey].options;
  const selectedIndex = state.answers[index];
  
  dom.optionsContainer.innerHTML = '';
  const optionMarkers = ['A', 'B', 'C', 'D'];
  
  options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-card';
    btn.setAttribute('data-index', idx);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', selectedIndex === idx ? 'true' : 'false');
    
    if (selectedIndex === idx) {
      btn.classList.add('selected');
    }
    
    btn.innerHTML = `
      <span class="option-marker">${optionMarkers[idx]}</span>
      <span class="option-content">${optText}</span>
    `;
    
    btn.addEventListener('click', () => {
      selectOption(idx);
    });
    
    dom.optionsContainer.appendChild(btn);
  });

  // Handle last question CTA: Calculate My Score
  const isLastQuestion = index === QUESTIONS.length - 1;
  const hasAnsweredLast = state.answers[index] !== null;
  
  if (isLastQuestion && hasAnsweredLast) {
    dom.saveIndicator.innerHTML = `
      <button id="calculate-score-btn" class="btn btn-primary btn-glow" style="padding: 10px 24px; font-size: 0.9rem; border-radius: 20px; font-weight: 700; width: 100%; border: none;">
        <span>${state.currentLanguage === 'en' ? 'Calculate My Score' : 'मेरा स्कोर प्राप्त करें'}</span>
      </button>
    `;
    
    // Bind click to navigate to processing screen
    document.getElementById('calculate-score-btn').addEventListener('click', () => {
      navigateTo('processing-screen');
    });
  } else {
    dom.saveIndicator.textContent = t.autoSaved;
  }

  // Show/Hide back button (first question doesn't need it)
  if (index === 0) {
    dom.backBtn.style.visibility = 'hidden';
  } else {
    dom.backBtn.style.visibility = 'visible';
  }
}

// Save Option Selection & Auto-Advance
function selectOption(optionIndex) {
  const index = state.currentQuestionIndex;
  state.answers[index] = optionIndex;
  
  // Re-render question immediately to show selection state
  renderQuestion();
  
  // Only auto-advance if it is not the last question
  if (index < QUESTIONS.length - 1) {
    // Animate card slide out & proceed
    setTimeout(() => {
      if (state.currentQuestionIndex < QUESTIONS.length - 1) {
        state.currentQuestionIndex++;
        
        // Trigger card slide in animation again
        dom.questionCard.style.animation = 'none';
        // Force reflow
        dom.questionCard.offsetHeight;
        dom.questionCard.style.animation = 'cardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        
        renderQuestion();
      }
    }, 350);
  }
}

// Handle Back Button Navigation
function handleBack() {
  if (state.currentQuestionIndex > 0) {
    state.currentQuestionIndex--;
    
    // Slide card backwards
    dom.questionCard.style.animation = 'none';
    dom.questionCard.offsetHeight;
    dom.questionCard.style.animation = 'cardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    
    renderQuestion();
  }
}

// Run Step-by-Step Processing Animations & POST Call
function startProcessingAnimation() {
  // Reset processing item visual states
  const steps = [dom.stepFd, dom.stepRa, dom.stepRi, dom.stepScoring];
  steps.forEach(step => {
    step.className = 'step-item';
    step.querySelector('.step-check').textContent = '○';
  });

  // Trigger POST API call in background
  const scorePromise = submitAnswersToAPI();

  // Simulated visual updates for 4 processing steps (approx 3.2s total)
  let currentStepIdx = 0;
  
  const intervalId = setInterval(() => {
    if (currentStepIdx > 0) {
      // Mark previous step as completed
      steps[currentStepIdx - 1].className = 'step-item completed';
      steps[currentStepIdx - 1].querySelector('.step-check').textContent = '✓';
    }
    
    if (currentStepIdx < steps.length) {
      // Highlight active step
      steps[currentStepIdx].className = 'step-item active';
      steps[currentStepIdx].querySelector('.step-check').textContent = '●';
      currentStepIdx++;
    } else {
      clearInterval(intervalId);
      
      // Verification stage: Ensure scoring data has loaded from API
      scorePromise.then(success => {
        if (success) {
          navigateTo('result-screen');
        } else {
          // API unavailable (GitHub Pages / offline) — use client-side engine
          console.info('SahayCredit: API unreachable, using client-side scoring engine.');
          state.scoreData = calculateScoreClientSide(state.answers);
          navigateTo('result-screen');
        }
      });
    }
  }, location.search.includes('test=true') ? 10 : 800);
}

// ── CLIENT-SIDE SCORING ENGINE (mirrors backend/scoring.js exactly) ────────
// Used as fallback when /api/score is unavailable (GitHub Pages, offline, etc.)
const _QUESTION_WEIGHTS = [
  [{fd:10,ra:2,ri:5},{fd:8,ra:1,ri:10},{fd:5,ra:4,ri:6},{fd:6,ra:9,ri:3}],
  [{fd:5,ra:3,ri:8},{fd:10,ra:5,ri:7},{fd:6,ra:7,ri:8},{fd:2,ra:8,ri:2}],
  [{fd:10,ra:3,ri:6},{fd:7,ra:4,ri:6},{fd:5,ra:6,ri:5},{fd:2,ra:8,ri:3}],
  [{fd:10,ra:3,ri:5},{fd:6,ra:5,ri:3},{fd:3,ra:6,ri:2},{fd:3,ra:6,ri:2}],
  [{fd:10,ra:2,ri:5},{fd:5,ra:5,ri:3},{fd:2,ra:4,ri:1},{fd:2,ra:4,ri:1}],
  [{fd:8,ra:2,ri:6},{fd:3,ra:10,ri:4},{fd:6,ra:7,ri:5},{fd:6,ra:7,ri:5}],
  [{fd:8,ra:2,ri:4},{fd:2,ra:10,ri:1},{fd:6,ra:6,ri:3},{fd:6,ra:6,ri:3}],
  [{fd:8,ra:1,ri:5},{fd:6,ra:5,ri:3},{fd:2,ra:10,ri:1},{fd:2,ra:10,ri:1}],
  [{fd:10,ra:3,ri:5},{fd:5,ra:5,ri:3},{fd:4,ra:8,ri:4},{fd:4,ra:8,ri:4}],
  [{fd:8,ra:3,ri:6},{fd:10,ra:5,ri:4},{fd:3,ra:8,ri:2},{fd:3,ra:8,ri:2}],
  [{fd:4,ra:2,ri:10},{fd:3,ra:2,ri:6},{fd:7,ra:3,ri:8},{fd:7,ra:3,ri:8}],
  [{fd:7,ra:3,ri:10},{fd:5,ra:2,ri:6},{fd:3,ra:5,ri:8},{fd:3,ra:5,ri:8}],
  [{fd:5,ra:1,ri:10},{fd:5,ra:2,ri:4},{fd:3,ra:8,ri:2},{fd:3,ra:8,ri:2}],
  [{fd:2,ra:2,ri:4},{fd:8,ra:1,ri:10},{fd:5,ra:2,ri:7},{fd:5,ra:2,ri:7}],
  [{fd:7,ra:1,ri:10},{fd:1,ra:6,ri:1},{fd:4,ra:7,ri:5},{fd:4,ra:7,ri:5}]
];
const _MAX = (() => {
  let fd=0,ra=0,ri=0;
  _QUESTION_WEIGHTS.forEach(q=>{
    fd+=Math.max(...q.map(o=>o.fd));
    ra+=Math.max(...q.map(o=>o.ra));
    ri+=Math.max(...q.map(o=>o.ri));
  });
  return {fd,ra,ri};
})();

function calculateScoreClientSide(answers) {
  let uFd=0, uRa=0, uRi=0;
  (answers||[]).forEach((opt,qi) => {
    const i = Math.min(Math.max(parseInt(opt)||0, 0), 3);
    const w = (_QUESTION_WEIGHTS[qi]||[])[i] || _QUESTION_WEIGHTS[qi][0];
    if (w) { uFd+=w.fd; uRa+=w.ra; uRi+=w.ri; }
  });
  const fdPct = Math.round((uFd/_MAX.fd)*100);
  const raPct = Math.round((uRa/_MAX.ra)*100);
  const riPct = Math.round((uRi/_MAX.ri)*100);
  // Score: weighted blend of three dimensions, mapped to 300-900
  const composite = (fdPct*0.40 + riPct*0.40 + raPct*0.20) / 100;
  const score = Math.min(900, Math.max(300, Math.round(300 + composite*600)));
  const eligible = score >= 600;
  const rate = score>=750?12:score>=700?14:score>=650?16:score>=600?18:22;
  const tier = score>=750?'A+':score>=700?'A':score>=650?'B+':score>=600?'B':'C';
  const limit = score>=750?350000:score>=700?200000:score>=650?120000:score>=600?60000:0;
  const partner = score>=700?'FinServe NBFC':score>=600?'GrowCapital':'—';
  const shapByFd = [
    {en:'Strong financial discipline score — consistent expense tracking (+62 pts)',hi:'मजबूत वित्तीय अनुशासन — नियमित खर्च ट्रैकिंग (+62 अंक)'},
    {en:'High repayment intent — debt obligations prioritised (+55 pts)',hi:'उच्च पुनर्भुगतान इरादा — ऋण दायित्वों को प्राथमिकता (+55 अंक)'},
    {en:'Stable UPI transaction patterns observed (+21 pts)',hi:'स्थिर यूपीआई लेनदेन पैटर्न (+21 अंक)'}
  ];
  const shapByRi = [
    {en:'Consistent mobile bill payments for 12+ months (+62 pts)',hi:'12+ महीनों से लगातार मोबाइल बिल भुगतान (+62 अंक)'},
    {en:'Stable home & work location for 6 months (+48 pts)',hi:'6 महीने से स्थिर घर और काम का स्थान (+48 अंक)'},
    {en:'Moderate UPI transaction volume (+21 pts)',hi:'मध्यम यूपीआई लेनदेन की मात्रा (+21 अंक)'}
  ];
  return {
    score, confidenceBand:15,
    eligibility: eligible?'Eligible':'Under Review',
    interestRate: rate, tier, creditLimit: limit, partnerName: partner,
    dimensions:{ financialDiscipline:fdPct, riskAttitude:raPct, repaymentIntent:riPct },
    profile:{
      name:{ en: score>=700?'Calculated Visionary':'Steady Builder', hi: score>=700?'संतुलित उद्यमी':'स्थिर निर्माता' },
      description:{
        en: score>=700
          ? 'Consistent cash flow driver with stable geo-coordinates and strong debt safety priority.'
          : 'Steady financial habits with moderate risk tolerance and growing credit footprint.',
        hi: score>=700
          ? 'स्थिर भौगोलिक स्थिति और ऋण सुरक्षा प्राथमिकता के साथ निरंतर कैश फ्लो।'
          : 'मध्यम जोखिम सहनशीलता और बढ़ते क्रेडिट फुटप्रिंट के साथ स्थिर वित्तीय आदतें।'
      }
    },
    shapFactors: riPct >= raPct ? shapByRi : shapByFd,
    improvementTips:[
      {en:'Increase UPI transaction frequency',hi:'यूपीआई लेनदेन की आवृत्ति बढ़ाएं'},
      {en:'Link your e-commerce account',hi:'अपना ई-कॉमर्स खाता लिंक करें'},
      {en:'Complete 3 more months of consistent mobile payments',hi:'लगातार मोबाइल भुगतान के 3 और महीने पूरे करें'}
    ]
  };
}


// Render Results Dashboard View
function renderCalculatedResults() {
  if (!state.scoreData) return;
  
  const data = state.scoreData;
  const lang = state.currentLanguage;
  const t = UI_TRANSLATIONS[lang];

  // Render text content
  dom.scoreVal.textContent = data.score;
  dom.confidenceBand.textContent = `±${data.confidenceBand}`;
  
  const minScore = data.score - data.confidenceBand;
  const maxScore = data.score + data.confidenceBand;
  dom.confidenceBoundsLabel.textContent = t.confidenceLabel
    .replace('{min}', minScore)
    .replace('{max}', maxScore);

  // Render Eligibility Flag
  if (data.eligibility === 'Eligible') {
    dom.eligibilityFlag.className = 'eligibility-badge eligible';
    dom.eligibilityFlag.textContent = t.eligibilityEligible;
  } else {
    dom.eligibilityFlag.className = 'eligibility-badge review';
    dom.eligibilityFlag.textContent = t.eligibilityReview;
  }

  // Recommended interest rate
  dom.rateValue.textContent = data.interestRate;

  dom.profileTierValue.textContent = data.tier;
  dom.profileName.textContent = data.profile.name[lang];
  dom.profileDesc.textContent = data.profile.description[lang];
  
  // Format credit limit with locale commas
  dom.limitValue.textContent = data.creditLimit.toLocaleString('en-IN');

  // Render pre-approved NBFC offer
  if (data.partnerName) {
    dom.limitSub.textContent = lang === 'en'
      ? `₹${data.creditLimit.toLocaleString('en-IN')} pre-approved offer from ${data.partnerName}`
      : `₹${data.creditLimit.toLocaleString('en-IN')} प्री-एप्रूव्ड ऑफर ${data.partnerName} से`;
  } else {
    dom.limitSub.textContent = t.limitSub;
  }

  // Render Composite Breakdown
  const compositeContainer = document.getElementById('composite-breakdown-container');
  const compositeList = document.getElementById('composite-breakdown-list');
  const compositeExplanation = document.getElementById('composite-explanation-text');

  if (compositeContainer && compositeList && compositeExplanation) {
    if (data.compositeBreakdown) {
      compositeContainer.style.display = 'block';
      compositeList.innerHTML = '';
      
      const isHi = lang === 'hi';
      document.getElementById('composite-breakdown-headline').textContent = isHi 
        ? 'कम्पोजिट स्कोर वेटेज विवरण' 
        : 'Composite Score Weights';

      Object.entries(data.compositeBreakdown).forEach(([key, value]) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';
        item.style.padding = '8px';
        item.style.background = 'rgba(255, 255, 255, 0.01)';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid rgba(255, 255, 255, 0.03)';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.fontSize = '0.78rem';
        header.style.fontWeight = '600';
        header.style.color = 'var(--text-main)';

        const label = document.createElement('span');
        label.textContent = value.label;
        
        const weightSpan = document.createElement('span');
        weightSpan.textContent = `${Math.round(value.weight * 100)}% weight`;
        weightSpan.style.color = 'var(--secondary)';

        header.appendChild(label);
        header.appendChild(weightSpan);
        item.appendChild(header);

        // Score info
        const scoreInfo = document.createElement('div');
        scoreInfo.style.display = 'flex';
        scoreInfo.style.justifyContent = 'space-between';
        scoreInfo.style.fontSize = '0.72rem';
        scoreInfo.style.color = 'var(--text-muted)';
        scoreInfo.style.marginTop = '2px';

        const scoreText = document.createElement('span');
        if (key === 'core') {
          scoreText.textContent = isHi ? `कोर वित्तीय स्कोर: ${value.score}` : `Core Financial Score: ${value.score}`;
        } else {
          scoreText.textContent = isHi ? `वैकल्पिक सब-स्कोर: ${value.subScore}/100` : `Alt Sub-Score: ${value.subScore}/100`;
        }

        scoreInfo.appendChild(scoreText);
        item.appendChild(scoreInfo);

        compositeList.appendChild(item);
      });

      compositeExplanation.textContent = isHi && data.compositeExplanation
        ? data.compositeExplanation.replace('Composite from', 'कम्पोजिट विवरण:').replace('Core model', 'कोर मॉडल').replace('E-commerce', 'ई-कॉमर्स').replace('Merchant ratings', 'व्यापारी रेटिंग').replace('Behaviour', 'व्यवहार जोखिम')
        : (data.compositeExplanation || '');
    } else {
      compositeContainer.style.display = 'none';
    }
  }

  // Render Data Sources Indicator (e.g. "Score based on 2 of 3 available data sources")
  const dsIndicator = document.getElementById('data-sources-indicator');
  const dsIndicatorText = document.getElementById('data-sources-indicator-text');
  if (dsIndicator && dsIndicatorText) {
    const isHi = lang === 'hi';
    const sourceCount = data.sourceCount || (data.compositeBreakdown ? Object.keys(data.compositeBreakdown).length : 1);
    const totalAvailable = 4; // core + ecommerce + merchant + behaviour
    dsIndicator.style.display = 'inline-block';
    dsIndicatorText.textContent = isHi
      ? `स्कोर ${totalAvailable} में से ${sourceCount} उपलब्ध डेटा स्रोतों पर आधारित`
      : `Score based on ${sourceCount} of ${totalAvailable} available data sources`;
  }

  // Render Manage Data Permissions Panel
  const permPanel = document.getElementById('manage-permissions-panel');
  const permList = document.getElementById('permissions-list');
  if (permPanel && permList && state.borrowerId) {
    const isHi = lang === 'hi';
    const ecomConsented = document.getElementById('consent-ecom-toggle')?.checked || false;
    const merchantConsented = document.getElementById('consent-gst-toggle')?.checked || false;
    const behaviourConsented = document.getElementById('consent-behaviour-toggle')?.checked || false;

    if (ecomConsented || merchantConsented || behaviourConsented) {
      permPanel.style.display = 'block';
      const permHeadline = document.getElementById('permissions-headline');
      if (permHeadline) {
        permHeadline.textContent = isHi ? 'डेटा अनुमतियाँ प्रबंधित करें' : 'Manage Data Permissions';
      }
      permList.innerHTML = '';

      const sources = [
        { id: 'ecommerce', active: ecomConsented, labelEn: 'E-Commerce Purchase History', labelHi: 'ई-कॉमर्स खरीद इतिहास' },
        { id: 'merchantRatings', active: merchantConsented, labelEn: 'Business/Merchant Ratings', labelHi: 'व्यापार/व्यापारी रेटिंग' },
        { id: 'behaviour', active: behaviourConsented, labelEn: 'Bank Transaction History (AA)', labelHi: 'बैंक लेनदेन इतिहास (एए)' }
      ];

      sources.forEach(src => {
        if (!src.active) return;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.01); border-radius:8px; border:1px solid rgba(255,255,255,0.03);';

        const info = document.createElement('div');
        info.style.cssText = 'display:flex; flex-direction:column; gap:2px;';
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-size:0.76rem; font-weight:600; color:var(--text-main);';
        nameSpan.textContent = isHi ? src.labelHi : src.labelEn;
        const statusSpan = document.createElement('span');
        statusSpan.style.cssText = 'font-size:0.68rem; color:var(--accent);';
        statusSpan.textContent = isHi ? '✓ सहमति दी गई' : '✓ Consent granted';
        info.appendChild(nameSpan);
        info.appendChild(statusSpan);

        const revokeBtn = document.createElement('button');
        revokeBtn.style.cssText = 'font-size:0.68rem; padding:4px 10px; border-radius:6px; border:1px solid rgba(255,100,100,0.3); background:rgba(255,100,100,0.08); color:#ff6b6b; cursor:pointer; font-weight:600; transition:all 0.2s;';
        revokeBtn.textContent = isHi ? 'वापस लें' : 'Revoke';
        revokeBtn.addEventListener('click', async () => {
          try {
            await fetch('/api/consent/revoke', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ borrowerId: state.borrowerId, sourceId: src.id })
            });
            statusSpan.textContent = isHi ? '✗ सहमति वापस ली गई' : '✗ Consent revoked';
            statusSpan.style.color = '#ff6b6b';
            revokeBtn.disabled = true;
            revokeBtn.style.opacity = '0.4';
          } catch (e) { /* non-fatal */ }
        });

        row.appendChild(info);
        row.appendChild(revokeBtn);
        permList.appendChild(row);
      });
    } else {
      permPanel.style.display = 'none';
    }
  }

  // Calculate and Render Confidence Score Components
  let confidence = 40; // base confidence
  if (data.compositeConfidence !== undefined) {
    confidence = data.compositeConfidence;
  } else if (state.consents) {
    if (state.consents.bills && state.simState.mobile >= 6) confidence += 15;
    if (state.consents.upi && state.simState.upi >= 10000) confidence += 15;
    if (state.consents.location && state.simState.geo === 'stable') confidence += 10;
    if (state.consents.ecom && (state.simState.ecom === 'low' || state.simState.ecom === 'high')) confidence += 10;
    if (state.consents.gst && state.simState.gst > 1) confidence += 5;
    const answeredCount = state.answers.filter(a => a !== null).length;
    if (answeredCount === 15) confidence += 5;
    // New footprint signals
    if (state.simState.salary_consistency >= 0.67) confidence += 8;
    if (state.simState.failed_tx_ratio === 1.0) confidence += 7;
    if (state.simState.merchant_diversity >= 0.67) confidence += 5;
    if (state.simState.refund_ratio >= 0.75) confidence += 5;
  }
  confidence = Math.min(95, confidence);

  if (dom.confidenceScoreText) {
    const isHi = lang === 'hi';
    dom.confidenceScoreText.textContent = isHi 
      ? `स्कोर विश्वसनीयता: ${confidence}%` 
      : `Score Confidence: ${confidence}%`;
    
    dom.confidenceTooltipDesc.textContent = isHi
      ? "विश्वसनीयता दर्शाती है कि आपकी प्रोफाइल का आकलन करने के लिए कितना डेटा उपलब्ध था। अधिक डेटा सिग्नल = उच्च विश्वसनीयता = बेहतर ऋण शर्तें।"
      : "Confidence reflects how much data was available to assess your profile. More data signals = higher confidence = better loan terms.";
    
    // Set bar width
    dom.confidenceBarFill.style.width = `${confidence}%`;
    
    // Color coding & Context messages
    dom.confidenceBarFill.classList.remove('green', 'amber', 'red');
    let contextText = '';
    if (confidence > 70) {
      dom.confidenceBarFill.classList.add('green');
      contextText = isHi 
        ? "उच्च विश्वसनीयता — पर्याप्त डेटा सिग्नल उपलब्ध हैं" 
        : "High confidence — sufficient data signals available";
    } else if (confidence >= 50) {
      dom.confidenceBarFill.classList.add('amber');
      contextText = isHi 
        ? "मध्यम विश्वसनीयता — अपने स्कोर को मजबूत करने के लिए अधिक डेटा जोड़ें" 
        : "Moderate confidence — add more data to strengthen your score";
    } else {
      dom.confidenceBarFill.classList.add('red');
      contextText = isHi 
        ? "कम विश्वसनीयता — ऋणदाता अतिरिक्त सत्यापन का अनुरोध कर सकते हैं" 
        : "Low confidence — lenders may request additional verification";
    }
    dom.confidenceContextText.textContent = contextText;
  }

  // --- Fraud Detection Engine ---
  let fraudFlags = [];
  if (state.consents) {
    const upi_monthly_avg = state.consents.upi ? state.simState.upi : 0;
    const mobile_payments = state.consents.bills ? state.simState.mobile : 0;
    const geo_stability = state.consents.location ? state.simState.geo : "unstable";
    
    let ecommerce_score = 0;
    if (state.consents.ecom) {
      if (state.simState.ecom === "high") ecommerce_score = 1.0;
      else if (state.simState.ecom === "low") ecommerce_score = 0.5;
    }
    
    const gst_rating = state.consents.gst ? state.simState.gst : 1;
    const psychometric_score = (data.score - 300) / 600;

    // Rule 1 — Sudden Income Spike
    if (upi_monthly_avg > 80000 && mobile_payments < 3) {
      fraudFlags.push("Unusual income spike with short payment history");
    }

    // Rule 2 — Inconsistent Geo + High Transactions
    if (geo_stability === "unstable" && upi_monthly_avg > 60000) {
      fraudFlags.push("High transactions despite unstable location pattern");
    }

    // Rule 3 — Perfect Psychometric
    if (psychometric_score === 1.0) {
      fraudFlags.push("Unusually perfect psychometric responses");
    }

    // Rule 4 — No Digital Footprint
    if (ecommerce_score === 0 && gst_rating === 1 && mobile_payments < 2) {
      fraudFlags.push("Minimal digital activity — possible synthetic profile");
    }

    // Rule 5 — Score Gaming Pattern
    if (mobile_payments === 12 && upi_monthly_avg === 100000 && geo_stability === "stable" && ecommerce_score === 1.0) {
      fraudFlags.push("All features at maximum — possible data manipulation");
    }

    // Rule 6 — Mismatched Signals
    if (psychometric_score > 0.8 && upi_monthly_avg < 5000) {
      fraudFlags.push("High financial discipline score inconsistent with low UPI activity");
    }
  }

  // Render Fraud Status Card
  if (dom.fraudStatusCard) {
    const isHi = lang === 'hi';
    const flagCount = fraudFlags.length;
    
    const FRAUD_TRANSLATIONS = {
      en: {
        rule1: "Unusual income spike with short payment history",
        rule2: "High transactions despite unstable location pattern",
        rule3: "Unusually perfect psychometric responses",
        rule4: "Minimal digital activity — possible synthetic profile",
        rule5: "All features at maximum — possible data manipulation",
        rule6: "High financial discipline score inconsistent with low UPI activity"
      },
      hi: {
        rule1: "कम भुगतान इतिहास के साथ असामान्य आय वृद्धि",
        rule2: "अस्थिर स्थान पैटर्न के बावजूद उच्च लेनदेन",
        rule3: "असामान्य रूप से परिपूर्ण साइकोमेट्रिक प्रतिक्रियाएं",
        rule4: "न्यूनतम डिजिटल गतिविधि — संभावित सिंथेटिक प्रोफाइल",
        rule5: "सभी विशेषताएं अधिकतम पर — संभावित डेटा हेरफेर",
        rule6: "कम यूपीआई गतिविधि के साथ असंगत उच्च वित्तीय अनुशासन स्कोर"
      }
    };
    
    if (flagCount === 0) {
      dom.fraudStatusIcon.textContent = "🛡️";
      dom.fraudStatusLabel.textContent = isHi ? "✅ कोई धोखाधड़ी संकेत नहीं मिला" : "✅ No Fraud Signals Detected";
      dom.fraudStatusLabel.style.color = "var(--secondary)";
      dom.fraudStatusDesc.textContent = isHi ? "सभी वैकल्पिक डेटा बिंदुओं को साफ रूप से सत्यापित किया गया है।" : "All alternate data points verified cleanly.";
      dom.fraudStatusCard.style.borderColor = "rgba(2, 195, 154, 0.25)";
      dom.fraudStatusCard.style.background = "rgba(2, 195, 154, 0.02)";
    } else if (flagCount === 1) {
      const ruleKey = fraudFlags[0] === "Unusual income spike with short payment history" ? "rule1"
                    : fraudFlags[0] === "High transactions despite unstable location pattern" ? "rule2"
                    : fraudFlags[0] === "Unusually perfect psychometric responses" ? "rule3"
                    : fraudFlags[0] === "Minimal digital activity — possible synthetic profile" ? "rule4"
                    : fraudFlags[0] === "All features at maximum — possible data manipulation" ? "rule5"
                    : "rule6";
      const localizedFlag = FRAUD_TRANSLATIONS[isHi ? 'hi' : 'en'][ruleKey];

      dom.fraudStatusIcon.textContent = "⚠️";
      dom.fraudStatusLabel.textContent = isHi ? "⚠️ 1 जोखिम संकेत — मैन्युअल समीक्षा का सुझाव" : "⚠️ 1 Risk Signal — Manual Review Suggested";
      dom.fraudStatusLabel.style.color = "#F4A261";
      dom.fraudStatusDesc.textContent = isHi 
        ? `जोखिम: ${localizedFlag}`
        : `Risk: ${localizedFlag}`;
      dom.fraudStatusCard.style.borderColor = "rgba(244, 162, 97, 0.25)";
      dom.fraudStatusCard.style.background = "rgba(244, 162, 97, 0.02)";
    } else {
      dom.fraudStatusIcon.textContent = "🚨";
      dom.fraudStatusLabel.textContent = isHi ? "🚨 एकाधिक जोखिम संकेत — समीक्षा के लिए चिह्नित" : "🚨 Multiple Risk Signals — Flagged for Review";
      dom.fraudStatusLabel.style.color = "#FF4D4D";
      dom.fraudStatusDesc.textContent = isHi 
        ? `${flagCount} सुरक्षा विसंगतियां पाई गईं। अतिरिक्त सत्यापन की आवश्यकता हो सकती है।`
        : `${flagCount} security anomalies detected. Additional verification may be required.`;
      dom.fraudStatusCard.style.borderColor = "rgba(255, 77, 77, 0.25)";
      dom.fraudStatusCard.style.background = "rgba(255, 77, 77, 0.02)";
    }
  }

  // Render sub-dimension values
  dom.dimFdVal.textContent = `${data.dimensions.financialDiscipline}%`;
  dom.dimFdBar.style.width = `${data.dimensions.financialDiscipline}%`;

  dom.dimRaVal.textContent = `${data.dimensions.riskAttitude}%`;
  dom.dimRaBar.style.width = `${data.dimensions.riskAttitude}%`;

  dom.dimRiVal.textContent = `${data.dimensions.repaymentIntent}%`;
  dom.dimRiBar.style.width = `${data.dimensions.repaymentIntent}%`;

  // Render SHAP factors list
  dom.shapFactorsList.innerHTML = '';
  data.shapFactors.forEach(factor => {
    const div = document.createElement('div');
    div.className = 'shap-item';
    div.innerHTML = `
      <span class="shap-bullet">✓</span>
      <span class="shap-text">${factor[lang]}</span>
    `;
    dom.shapFactorsList.appendChild(div);
  });

  // Render score improvement tips list
  dom.improvementTipsList.innerHTML = '';
  data.improvementTips.forEach(tip => {
    const div = document.createElement('div');
    div.className = 'tip-item';
    div.innerHTML = `
      <span class="tip-bullet">✦</span>
      <span class="tip-text">${tip[lang]}</span>
    `;
    dom.improvementTipsList.appendChild(div);
  });

  // Animate Dial Gauge if exists
  if (dom.gaugeFill) {
    const scorePercent = (data.score - 300) / 600;
    const dashOffset = 125.6 * (1 - scorePercent);
    setTimeout(() => {
      dom.gaugeFill.style.strokeDashoffset = dashOffset;
    }, 100);
  }
}

// Reset Assessment
function resetAssessment() {
  state.answers = Array(15).fill(null);
  state.currentQuestionIndex = 0;
  state.scoreData = null;
  state.signatureName = '';
  state.consents = { upi: true, bills: true, ecom: true, location: true, gst: true };
  
  // Reset Consent Screen DOM elements
  dom.signatureInput.value = '';
  dom.consentToggles.upi.checked = true;
  dom.consentToggles.bills.checked = true;
  dom.consentToggles.ecom.checked = true;
  dom.consentToggles.location.checked = true;
  dom.consentToggles.gst.checked = true;
  dom.consentProceedBtn.disabled = true;
  

  
  // Reset Document Vault
  state.vaultDocuments = null;

  navigateTo('welcome-screen');
}



// Render Loan Offer Comparison Screen
function renderComparisonScreen() {
  if (!state.scoreData) return;
  
  // Initialize default tenure settings if not already present
  if (!state.lenderTenures) {
    state.lenderTenures = { 0: 12, 1: 12, 2: 12, 3: 12 };
  }
  
  const limit = state.scoreData.creditLimit;
  const baseRate = state.scoreData.interestRate;
  const lang = state.currentLanguage;
  
  // Construct dynamic offers based on user's score-projected credit limit and suggested APR rate
  const offers = [
    {
      id: 0,
      name: "FinServe NBFC",
      logo: "🏢",
      amount: limit,
      rate: baseRate,
      feePercent: 1.5,
      feeText: { en: "1.5% fee", hi: "1.5% प्रसंस्करण शुल्क" }
    },
    {
      id: 1,
      name: "GrowCapital",
      logo: "🌱",
      amount: Math.round((limit * 0.95) / 5000) * 5000,
      rate: baseRate - 1.5,
      feePercent: 2.0,
      feeText: { en: "2.0% fee", hi: "2.0% प्रसंस्करण शुल्क" }
    },
    {
      id: 2,
      name: "BharatLend",
      logo: "🇮🇳",
      amount: Math.round((limit * 1.05) / 5000) * 5000,
      rate: baseRate + 1.0,
      feePercent: 0,
      feeText: { en: "Nil Fee", hi: "शून्य शुल्क" }
    },
    {
      id: 3,
      name: "QuickMudra",
      logo: "⚡",
      amount: Math.round((limit * 0.90) / 5000) * 5000,
      rate: baseRate + 3.5,
      feePercent: 0,
      feeText: { en: "Nil Fee", hi: "शून्य शुल्क" }
    }
  ];
  
  // Calculate EMI, Processing Fee, and Total cost for each lender offer
  offers.forEach(o => {
    const tenure = state.lenderTenures[o.id] || 12;
    o.emi = Math.round(calculateEMI(o.amount, o.rate, tenure));
    o.processingFee = Math.round(o.amount * (o.feePercent / 100));
    o.totalCost = (o.emi * tenure) + o.processingFee;
  });
  
  // Identify Best Match based on the lowest EMI for selected tenures
  let bestMatchId = 0;
  let lowestEmi = Infinity;
  offers.forEach(o => {
    if (o.emi < lowestEmi) {
      lowestEmi = o.emi;
      bestMatchId = o.id;
    }
  });
  
  // Render cards in DOM
  dom.lendersList.innerHTML = '';
  offers.forEach(o => {
    const isBest = o.id === bestMatchId;
    const selectedTenure = state.lenderTenures[o.id] || 12;
    const card = document.createElement('div');
    card.className = 'lender-card' + (isBest ? ' best-match-card' : '');
    
    const badgeHtml = isBest 
      ? `<span class="best-match-badge">${lang === 'en' ? 'Best Match' : 'सर्वोत्तम विकल्प'}</span>` 
      : '';
      
    card.innerHTML = `
      ${badgeHtml}
      <div class="lender-card-header">
        <span class="lender-logo">${o.logo}</span>
        <span class="lender-name">${o.name}</span>
      </div>
      <div class="lender-card-details">
        <div class="detail-row">
          <span class="detail-label">${lang === 'en' ? 'Offer Amount' : 'ऋण राशि'}</span>
          <span class="detail-value">₹${o.amount.toLocaleString('en-IN')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${lang === 'en' ? 'Interest Rate' : 'ब्याज दर'}</span>
          <span class="detail-value">${o.rate.toFixed(1)}% ${lang === 'en' ? 'p.a.' : 'प्रति वर्ष'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${lang === 'en' ? 'Processing Fee' : 'प्रसंस्करण शुल्क'}</span>
          <span class="detail-value">${o.feeText[lang]}</span>
        </div>
      </div>
      <div class="tenure-selector-box">
        <span class="tenure-label">${lang === 'en' ? 'Select Tenure' : 'ऋण अवधि चुनें (महीने)'}</span>
        <div class="tenure-btn-group" data-lender="${o.id}">
          <button class="tenure-btn ${selectedTenure === 12 ? 'active' : ''}" data-val="12">12</button>
          <button class="tenure-btn ${selectedTenure === 24 ? 'active' : ''}" data-val="24">24</button>
          <button class="tenure-btn ${selectedTenure === 36 ? 'active' : ''}" data-val="36">36</button>
        </div>
      </div>
      <div class="emi-box">
        <span class="emi-label">${lang === 'en' ? 'Monthly EMI' : 'मासिक किस्त (EMI)'}</span>
        <span class="emi-value">₹${o.emi.toLocaleString('en-IN')}</span>
      </div>
      <button class="btn btn-primary btn-glow sim-btn-apply" data-lender="${o.id}" style="width: 100%;">
        ${lang === 'en' ? 'Apply with ' + o.name : o.name + ' के साथ आवेदन करें'}
      </button>
    `;
    dom.lendersList.appendChild(card);
  });
  
  // Re-bind click event listeners on dynamically generated buttons
  document.querySelectorAll('.tenure-btn-group').forEach(group => {
    const lenderId = parseInt(group.getAttribute('data-lender'));
    group.querySelectorAll('.tenure-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tenureVal = parseInt(btn.getAttribute('data-val'));
        state.lenderTenures[lenderId] = tenureVal;
        renderComparisonScreen(); // Re-render updates EMI & Best Match Badge & Bar chart!
      });
    });
  });
  
  document.querySelectorAll('.sim-btn-apply').forEach(btn => {
    const lenderId = parseInt(btn.getAttribute('data-lender'));
    btn.addEventListener('click', () => {
      const lender = offers.find(o => o.id === lenderId);
      applyLender(lender);
    });
  });
  
  // Render horizontal bar chart comparison
  let maxCost = 0;
  let minCost = Infinity;
  offers.forEach(o => {
    if (o.totalCost > maxCost) maxCost = o.totalCost;
    if (o.totalCost < minCost) minCost = o.totalCost;
  });
  
  dom.costChartBars.innerHTML = '';
  offers.forEach(o => {
    const pct = (o.totalCost / maxCost) * 100;
    const isLowest = o.totalCost === minCost;
    const row = document.createElement('div');
    row.className = 'cost-chart-row';
    row.innerHTML = `
      <div class="chart-row-info">
        <span>${o.name}</span>
        <strong>₹${o.totalCost.toLocaleString('en-IN')}</strong>
      </div>
      <div class="chart-track">
        <div class="chart-bar-fill ${isLowest ? 'lowest-cost' : ''}" style="width: ${pct}%;"></div>
      </div>
    `;
    dom.costChartBars.appendChild(row);
  });
}

// Calculate standard EMI monthly installment
function calculateEMI(P, annualRate, months) {
  const r = annualRate / 12 / 100;
  if (r === 0) return P / months;
  return (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// Handle apply loan with selected lender
function applyLender(lender) {
  const tenure = state.lenderTenures[lender.id] || 12;
  const msg = state.currentLanguage === 'en'
    ? `Congratulations! Your loan of ₹${lender.amount.toLocaleString('en-IN')} at ${lender.rate}% p.a. for ${tenure} months has been pre-approved by ${lender.name}. Redirecting to bank disbursement...`
    : `बधाई हो! ${lender.name} द्वारा ${tenure} महीनों के लिए ${lender.rate}% प्रति वर्ष की दर पर ₹${lender.amount.toLocaleString('en-IN')} का आपका ऋण पूर्व-स्वीकृत कर दिया गया है। बैंक संवितरण के लिए आगे बढ़ रहे हैं...`;
  alert(msg);
  resetAssessment();
}

// Initialize EMI Planner state configuration
function initPlannerState() {
  if (!state.plannerState) {
    state.plannerState = {
      amount: 100000,
      rate: state.scoreData ? state.scoreData.interestRate : 14,
      tenure: 12,
      income: 35000
    };
  } else {
    // If state exists, keep inputs synced but update pre-filled rate if it changed
    if (state.scoreData && state.plannerState.rate === 14) {
      state.plannerState.rate = state.scoreData.interestRate;
    }
  }

  // Pre-fill inputs DOM state
  dom.planAmountInput.value = state.plannerState.amount;
  dom.planRateInput.value = state.plannerState.rate;
  dom.planIncomeInput.value = state.plannerState.income;
  
  // Set tenure active button state
  dom.planTenureGroup.querySelectorAll('.tenure-btn').forEach(btn => {
    const btnTenure = parseInt(btn.getAttribute('data-tenure'));
    btn.classList.toggle('active', btnTenure === state.plannerState.tenure);
  });
}

// Calculate and render all inputs & amortization tables dynamically
function updatePlannerUI() {
  if (!state.plannerState) return;

  const P = state.plannerState.amount;
  const rate = state.plannerState.rate;
  const N = state.plannerState.tenure;
  const income = state.plannerState.income;
  const lang = state.currentLanguage;

  // Monthly interest rate calculation
  const r = (rate / 12) / 100;
  
  // Compute Monthly EMI
  let emi = 0;
  if (r === 0) {
    emi = P / N;
  } else {
    emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
  }

  const totalPayable = emi * N;
  const totalInterest = totalPayable - P;

  // Update primary outcome figures
  dom.planAmountVal.textContent = '₹' + P.toLocaleString('en-IN');
  dom.planEmiOutput.textContent = '₹' + Math.round(emi).toLocaleString('en-IN');
  dom.planInterestOutput.textContent = '₹' + Math.round(totalInterest).toLocaleString('en-IN');
  dom.planPayableOutput.textContent = '₹' + Math.round(totalPayable).toLocaleString('en-IN');

  // Update Donut Chart
  const pctPrincipal = Math.max(1, Math.min(99, Math.round((P / totalPayable) * 100)));
  dom.planDonutChart.style.setProperty('--pct-principal', pctPrincipal + '%');
  dom.planDonutCenterVal.textContent = pctPrincipal + '%';
  document.getElementById('plan-donut-center-lbl').textContent = lang === 'en' ? 'Principal' : 'मूलधन';

  // Affordability Check
  let emiPercent = 0;
  if (income > 0) {
    emiPercent = (emi / income) * 100;
  }
  dom.planAffordRatio.textContent = emiPercent.toFixed(1) + '%';

  // Format verdict options
  let statusText = "";
  let statusClass = "";
  let cardBg = "";
  let pillBg = "";
  let pillColor = "";

  if (emiPercent < 30) {
    statusText = lang === 'en' ? "Highly Affordable" : "अत्यधिक वहन योग्य";
    statusClass = "status-approve";
    cardBg = "rgba(2, 195, 154, 0.04)";
    pillBg = "rgba(2, 195, 154, 0.12)";
    pillColor = "#02C39A";
  } else if (emiPercent <= 50) {
    statusText = lang === 'en' ? "Moderate Risk" : "मध्यम वहन जोखिम";
    statusClass = "status-review";
    cardBg = "rgba(2, 128, 144, 0.04)";
    pillBg = "rgba(2, 128, 144, 0.12)";
    pillColor = "#028090";
  } else {
    statusText = lang === 'en' ? "High Debt Burden" : "उच्च ऋण भार";
    statusClass = "status-reject";
    cardBg = "rgba(244, 162, 97, 0.04)";
    pillBg = "rgba(244, 162, 97, 0.12)";
    pillColor = "#F4A261";
  }

  dom.planAffordCard.style.background = cardBg;
  dom.planAffordStatus.className = `status-pill ${statusClass}`;
  dom.planAffordStatus.style.background = pillBg;
  dom.planAffordStatus.style.color = pillColor;
  dom.planAffordStatus.textContent = statusText;

  // Render Amortization table body
  dom.planScheduleBody.innerHTML = '';
  let balance = P;
  
  for (let month = 1; month <= N; month++) {
    const interestPaid = balance * r;
    const principalPaid = emi - interestPaid;
    balance = Math.max(0, balance - principalPaid);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${lang === 'en' ? 'Month' : 'महीना'} ${month}</td>
      <td style="font-weight: 600;">₹${Math.round(emi).toLocaleString('en-IN')}</td>
      <td style="color: var(--secondary);">₹${Math.round(principalPaid).toLocaleString('en-IN')}</td>
      <td style="color: var(--amber);">₹${Math.round(interestPaid).toLocaleString('en-IN')}</td>
      <td style="color: var(--text-muted);">₹${Math.round(balance).toLocaleString('en-IN')}</td>
    `;
    dom.planScheduleBody.appendChild(tr);
  }
}

// Initialize Document Vault state
function initVaultState() {
  if (!state.vaultDocuments) {
    state.vaultDocuments = [
      { id: "upi", type: "auto", name: { en: "UPI Transaction History", hi: "यूपीआई लेनदेन इतिहास" }, subtitle: { en: "Last 12 months", hi: "पिछले 12 महीने" }, icon: "📊", status: "verified", date: { en: "Updated: Today", hi: "अद्यतन: आज" }, share: false },
      { id: "mobile", type: "auto", name: { en: "Mobile Bill Records", hi: "मोबाइल बिल रिकॉर्ड" }, subtitle: { en: "Payment history logs", hi: "भुगतान इतिहास लॉग" }, icon: "📱", status: "verified", date: { en: "Updated: Today", hi: "अद्यतन: आज" }, share: false },
      { id: "bank", type: "auto", name: { en: "Bank Statement Summary", hi: "बैंक स्टेटमेंट सारांश" }, subtitle: { en: "RBI AA consolidated statement", hi: "आरबीआई एए समेकित विवरण" }, icon: "💼", status: "verified", date: { en: "Updated: Today", hi: "अद्यतन: आज" }, share: false },
      { id: "aadhaar", type: "manual", name: { en: "Aadhaar Card", hi: "आधार कार्ड" }, subtitle: { en: "National identity card", hi: "राष्ट्रीय पहचान पत्र" }, icon: "🆔", status: "missing", date: { en: "Not uploaded", hi: "अपलोड नहीं किया गया" }, share: false },
      { id: "pan", type: "manual", name: { en: "PAN Card (Optional)", hi: "पैन कार्ड (वैकल्पिक)" }, subtitle: { en: "Tax identity proof", hi: "कर पहचान प्रमाण" }, icon: "💳", status: "missing", date: { en: "Not uploaded", hi: "अपलोड नहीं किया गया" }, share: false },
      { id: "shop", type: "manual", name: { en: "Shop/Business Photo", hi: "दुकान/व्यवसाय फोटो" }, subtitle: { en: "For MSME verification", hi: "एमएसएमई सत्यापन के लिए" }, icon: "🏪", status: "missing", date: { en: "Not uploaded", hi: "अपलोड नहीं किया गया" }, share: false },
      { id: "gst", type: "manual", name: { en: "GST Certificate", hi: "जीएसटी प्रमाणपत्र" }, subtitle: { en: "Tax registration summary", hi: "कर पंजीकरण सारांश" }, icon: "📝", status: "missing", date: { en: "Not uploaded", hi: "अपलोड नहीं किया गया" }, share: false }
    ];
  }
}

// Render dynamic document vault slots grid
function renderVaultUI() {
  if (!state.vaultDocuments) return;

  const lang = state.currentLanguage;
  dom.vaultGridList.innerHTML = '';

  let completedCount = 0;

  state.vaultDocuments.forEach((doc, idx) => {
    const isCompleted = doc.status === 'verified' || doc.status === 'uploaded';
    if (isCompleted) completedCount++;

    const card = document.createElement('div');
    card.className = 'vault-card';

    // Status Pill
    let statusText = "";
    let statusClass = "";
    if (doc.status === 'verified') {
      statusText = lang === 'en' ? 'Verified ✓' : 'सत्यापित ✓';
      statusClass = 'vault-status-verified';
    } else if (doc.status === 'uploaded') {
      statusText = lang === 'en' ? 'Uploaded' : 'अपलोड किया गया';
      statusClass = 'vault-status-uploaded';
    } else {
      statusText = lang === 'en' ? 'Missing' : 'अनुपलब्ध';
      statusClass = 'vault-status-missing';
    }

    // Share Toggle
    const toggleChecked = doc.share ? 'checked' : '';

    // Manual Upload Box if manual slot
    let uploadBoxHtml = '';
    if (doc.type === 'manual') {
      const btnText = doc.status === 'missing' 
        ? (lang === 'en' ? 'Upload File' : 'फ़ाइल अपलोड करें') 
        : (lang === 'en' ? 'Change File' : 'फ़ाइल बदलें');
      
      uploadBoxHtml = `
        <div class="vault-upload-box">
          <span style="font-size: 0.75rem; color: var(--text-muted);">
            📷 ${lang === 'en' ? 'Camera / File' : 'कैमरा / फ़ाइल'}
          </span>
          <button class="vault-upload-btn" data-id="${doc.id}">
            <span>${btnText}</span>
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="vault-card-header">
        <span class="vault-card-title">${doc.icon} ${doc.name[lang]}</span>
        <span class="vault-card-status ${statusClass}">${statusText}</span>
      </div>
      
      <p style="font-size: 0.8rem; color: var(--text-sub); margin: 0; line-height: 1.3;">${doc.subtitle[lang]}</p>
      
      ${uploadBoxHtml}

      <div class="vault-card-info">
        <span class="vault-encrypt-badge">🔒 AES-256</span>
        <span>${doc.date[lang]}</span>
      </div>

      <div class="vault-toggle-container">
        <span class="vault-toggle-label">${lang === 'en' ? 'Share with NBFC Lenders' : 'NBFC ऋणदाताओं के साथ साझा करें'}</span>
        <label class="vault-switch">
          <input type="checkbox" class="vault-share-toggle" data-id="${doc.id}" ${toggleChecked}>
          <span class="vault-slider"></span>
        </label>
      </div>
    `;

    dom.vaultGridList.appendChild(card);
  });

  // Calculate profile completeness percent
  const percent = Math.round((completedCount / 7) * 100);
  dom.vaultCompletenessPct.textContent = percent + '%';
  dom.vaultCompletenessFill.style.width = percent + '%';

  // Bind live check events for manual upload buttons
  document.querySelectorAll('.vault-upload-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-id');
      simulateDocumentUpload(docId);
    });
  });

  // Bind live check events for share switches
  document.querySelectorAll('.vault-share-toggle').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const docId = chk.getAttribute('data-id');
      const doc = state.vaultDocuments.find(d => d.id === docId);
      if (doc) {
        doc.share = e.target.checked;
      }
    });
  });
}

// Simulate secure document upload on manual slot
function simulateDocumentUpload(docId) {
  const doc = state.vaultDocuments.find(d => d.id === docId);
  if (!doc) return;

  const lang = state.currentLanguage;
  const promptMsg = lang === 'en'
    ? `Simulating secure file upload. Please choose document for ${doc.name.en}:`
    : `सुरक्षित फ़ाइल अपलोड का अनुकरण कर रहे हैं। कृपया ${doc.name.hi} के लिए दस्तावेज़ चुनें:`;
  
  // Prompt user simulated input
  const fileName = prompt(promptMsg, `${doc.id}_scan.pdf`);
  if (fileName) {
    doc.status = 'uploaded';
    doc.date = {
      en: `Uploaded: Today (${fileName})`,
      hi: `अपलोड किया गया: आज (${fileName})`
    };
    renderVaultUI();
    
    // Simulate lock notification
    const successMsg = lang === 'en'
      ? `Document ${fileName} has been securely encrypted with AES-256-GCM and stored in device memory.`
      : `दस्तावेज़ ${fileName} को AES-256-GCM के साथ सुरक्षित रूप से एन्क्रिप्ट किया गया है और डिवाइस मेमोरी में सहेजा गया है।`;
    alert(successMsg);
  }
}

// Run app
document.addEventListener('DOMContentLoaded', init);

/* ================================================================
   FEDERATED LEARNING ANIMATION ENGINE
   5-phase repeating loop:
   Phase 1 — Phones glow: "Computing gradients locally..."
   Phase 2 — Encrypted packets fly phones → server (label visible)
   Phase 3 — Server aggregates: "Model Updated"
   Phase 4 — Updated weights return to phones
   Phase 5 — Red forbidden arrow + raw-data label flash, then reset
   ================================================================ */

let _flAnimTimer = null;   // holds setTimeout reference
let _flRound = 0;          // round counter

function startFLAnimation() {
  // Kill any running animation from a previous visit
  stopFLAnimation();
  _flRound = 0;
  flRunPhase(1);
}

function stopFLAnimation() {
  if (_flAnimTimer) { clearTimeout(_flAnimTimer); _flAnimTimer = null; }
  // Reset all visual state cleanly
  ['fl-phone-1','fl-phone-2','fl-phone-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('fl-glow-phone');
  });
  const srv = document.getElementById('fl-server');
  if (srv) srv.classList.remove('fl-glow-server');
  const mdl = document.getElementById('fl-model');
  if (mdl) mdl.classList.remove('fl-glow-model');
  flSetPacketsVisible(false);
  flSetReturnVisible(false);
  flSetForbiddenVisible(false);
}

function flRunPhase(phase) {
  // Guard: if privacy screen is no longer active, stop
  if (state.currentScreen !== 'privacy') return;

  const isHi = state.currentLanguage === 'hi';

  const PHASES = {
    en: [
      '',
      '📱 Computing gradients locally on each device...',
      '🔒 Sending encrypted gradients to server — 48KB only',
      '🖥️ Server aggregating gradients... Model Updated ✓',
      '📡 Improved model weights sent back to all devices',
      '🚫 Raw data (UPI, bills, location) NEVER left any phone'
    ],
    hi: [
      '',
      '📱 प्रत्येक डिवाइस पर स्थानीय रूप से ग्रेडिएंट की गणना हो रही है...',
      '🔒 एन्क्रिप्टेड ग्रेडिएंट सर्वर को भेजे जा रहे हैं — केवल 48KB',
      '🖥️ सर्वर ग्रेडिएंट एकत्र कर रहा है... मॉडल अपडेट हुआ ✓',
      '📡 बेहतर मॉडल वेट सभी डिवाइसों पर वापस भेजे गए',
      '🚫 रॉ डेटा (UPI, बिल, लोकेशन) किसी फ़ोन से बाहर नहीं गया'
    ]
  };

  const lang = isHi ? 'hi' : 'en';
  const bannerText = document.getElementById('fl-phase-text');
  const banner = document.getElementById('fl-phase-banner');
  if (bannerText && PHASES[lang][phase]) bannerText.textContent = PHASES[lang][phase];

  // Update node status helpers
  const phoneStatuses = [
    document.getElementById('fl-phone-status-1'),
    document.getElementById('fl-phone-status-2'),
    document.getElementById('fl-phone-status-3')
  ];
  const srvStatus  = document.getElementById('fl-server-status');
  const mdlStatus  = document.getElementById('fl-model-status');

  function setPhoneStatus(txt, cls) {
    phoneStatuses.forEach(el => {
      if (!el) return;
      el.textContent = txt;
      el.className = 'fl-node-status' + (cls ? ' ' + cls : '');
    });
  }
  function setSrvStatus(txt, cls) {
    if (!srvStatus) return;
    srvStatus.textContent = txt;
    srvStatus.className = 'fl-node-status' + (cls ? ' ' + cls : '');
  }
  function setMdlStatus(txt, cls) {
    if (!mdlStatus) return;
    mdlStatus.textContent = txt;
    mdlStatus.className = 'fl-node-status' + (cls ? ' ' + cls : '');
  }

  switch (phase) {
    case 1: // Phones glow
      ['fl-phone-1','fl-phone-2','fl-phone-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('fl-glow-phone');
      });
      document.getElementById('fl-server')?.classList.remove('fl-glow-server');
      document.getElementById('fl-model')?.classList.remove('fl-glow-model');
      setPhoneStatus(isHi ? 'गणना हो रही है...' : 'Computing...', 'active-status');
      setSrvStatus(isHi ? 'प्रतीक्षा में' : 'Waiting', '');
      setMdlStatus('v2.3.1', '');
      flSetPacketsVisible(false);
      flSetReturnVisible(false);
      flSetForbiddenVisible(false);
      if (banner) { banner.style.background = 'rgba(2,195,154,0.08)'; banner.style.borderColor = 'rgba(2,195,154,0.25)'; }
      _flAnimTimer = setTimeout(() => flRunPhase(2), 2200);
      break;

    case 2: // Packets fly phones → server
      flAnimatePackets({
        ids: ['fl-pkt-1','fl-pkt-2','fl-pkt-3'],
        routes: [
          [{x:72,y:52},{x:170,y:110}],
          [{x:72,y:110},{x:170,y:110}],
          [{x:72,y:168},{x:170,y:110}]
        ],
        duration: 1000,
        label: 'fl-pkt-label'
      });
      setPhoneStatus(isHi ? 'भेज रहा है' : 'Sending', 'active-status');
      setSrvStatus(isHi ? 'प्राप्त हो रहा है' : 'Receiving', 'server-active');
      if (banner) { banner.style.background = 'rgba(2,128,144,0.08)'; banner.style.borderColor = 'rgba(2,128,144,0.25)'; }
      _flAnimTimer = setTimeout(() => flRunPhase(3), 2400);
      break;

    case 3: // Server aggregates → model glows
      flSetPacketsVisible(false);
      document.getElementById('fl-server')?.classList.add('fl-glow-server');
      document.getElementById('fl-model')?.classList.add('fl-glow-model');
      setPhoneStatus(isHi ? 'प्रतीक्षा में' : 'Waiting', '');
      setSrvStatus(isHi ? 'एकत्रित हो रहा है' : 'Aggregating', 'server-active');
      setMdlStatus(isHi ? 'अपडेट हो रहा है' : 'Updating', 'model-active');
      // Animate server → model packet
      flAnimatePackets({
        ids: ['fl-model-pkt'],
        routes: [[ {x:170,y:110},{x:268,y:110} ]],
        duration: 800,
        label: null
      });
      if (banner) { banner.style.background = 'rgba(244,162,97,0.06)'; banner.style.borderColor = 'rgba(244,162,97,0.2)'; }
      _flAnimTimer = setTimeout(() => flRunPhase(4), 2000);
      break;

    case 4: // Weights return to phones
      document.getElementById('fl-server')?.classList.remove('fl-glow-server');
      document.getElementById('fl-model')?.classList.remove('fl-glow-model');
      flAnimatePackets({
        ids: ['fl-ret-1','fl-ret-2','fl-ret-3'],
        routes: [
          [{x:170,y:110},{x:72,y:52}],
          [{x:170,y:110},{x:72,y:110}],
          [{x:170,y:110},{x:72,y:168}]
        ],
        duration: 1000,
        label: 'fl-ret-label'
      });
      setSrvStatus(isHi ? 'वापस भेज रहा है' : 'Broadcasting', 'server-active');
      setPhoneStatus(isHi ? 'अपग्रेड हुआ' : 'Upgraded ✓', 'active-status');
      setMdlStatus('v2.3.1 +0.3%', 'model-active');
      if (banner) { banner.style.background = 'rgba(2,128,144,0.08)'; banner.style.borderColor = 'rgba(2,128,144,0.25)'; }
      _flAnimTimer = setTimeout(() => flRunPhase(5), 2600);
      break;

    case 5: // Red crossed arrow — raw data never leaves
      flSetReturnVisible(false);
      flSetForbiddenVisible(true);
      ['fl-phone-1','fl-phone-2','fl-phone-3'].forEach(id => {
        document.getElementById(id)?.classList.remove('fl-glow-phone');
      });
      setPhoneStatus(isHi ? 'सुरक्षित 🔒' : 'Secure 🔒', 'active-status');
      setSrvStatus(isHi ? 'कोई रॉ डेटा नहीं' : 'No Raw Data', '');
      if (banner) { banner.style.background = 'rgba(220,53,69,0.06)'; banner.style.borderColor = 'rgba(220,53,69,0.2)'; }
      // After showing, go back to phase 1
      _flAnimTimer = setTimeout(() => {
        flSetForbiddenVisible(false);
        _flRound++;
        flRunPhase(1);
      }, 2800);
      break;
  }
}

// Show/hide the outgoing gradient packets + their label
function flSetPacketsVisible(visible) {
  ['fl-pkt-1','fl-pkt-2','fl-pkt-3','fl-pkt-label'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = visible ? '1' : '0';
  });
}

// Show/hide the return model packets + label
function flSetReturnVisible(visible) {
  ['fl-ret-1','fl-ret-2','fl-ret-3','fl-ret-label'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = visible ? '1' : '0';
  });
}

// Show/hide the red forbidden overlay
function flSetForbiddenVisible(visible) {
  const opacity = visible ? '1' : '0';
  const forbidden = document.getElementById('fl-forbidden');
  const crossmark = document.getElementById('fl-crossmark');
  const rawLabel  = document.getElementById('fl-raw-label');
  if (forbidden) forbidden.style.opacity = opacity;
  if (crossmark) crossmark.style.opacity = opacity;
  if (rawLabel)  rawLabel.style.opacity  = opacity;
}

// Generic SVG packet animator — moves circles from start to end using requestAnimationFrame
function flAnimatePackets({ ids, routes, duration, label }) {
  // First make them visible at start positions
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el || !routes[i]) return;
    const [start] = routes[i];
    el.setAttribute('cx', start.x);
    el.setAttribute('cy', start.y);
    el.style.opacity = '1';
  });

  // Show the label immediately
  if (label) {
    const lblEl = document.getElementById(label);
    if (lblEl) lblEl.style.opacity = '1';
  }

  const startTime = performance.now();

  function frame(now) {
    // Guard: stop if screen changed
    if (state.currentScreen !== 'privacy') return;

    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease in-out
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el || !routes[i]) return;
      const [start, end] = routes[i];
      const cx = start.x + (end.x - start.x) * eased;
      const cy = start.y + (end.y - start.y) * eased;
      el.setAttribute('cx', cx);
      el.setAttribute('cy', cy);
    });

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      // Hide packets after they arrive
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '0';
      });
      if (label) {
        const lblEl = document.getElementById(label);
        if (lblEl) lblEl.style.opacity = '0';
      }
    }
  }

  requestAnimationFrame(frame);
}

/* ================================================================
   RBI ACCOUNT AGGREGATOR LINKING ENGINE
   ================================================================ */

state.rbiState = {
  bankSelected: null,
  aaHandle: '',
  otpRequested: false,
  otpVerified: false,
  fetchingComplete: false
};

function initRbiLinkingFlow() {
  // Reset state
  state.rbiState = {
    bankSelected: null,
    aaHandle: '',
    otpRequested: false,
    otpVerified: false,
    fetchingComplete: false
  };

  // Reset UI containers visibility
  document.getElementById('rbi-step-bank-selection').style.display = 'block';
  document.getElementById('rbi-step-otp-entry').style.display = 'none';
  document.getElementById('rbi-step-fetching').style.display = 'none';

  // Reset inputs
  document.getElementById('rbi-aa-input').value = '';
  document.querySelectorAll('.otp-input-field').forEach(input => input.value = '');

  // Reset bank active states
  document.querySelectorAll('.rbi-bank-btn').forEach(btn => btn.classList.remove('active'));

  // Reset loader & logs
  document.querySelector('.rbi-spinner').style.display = 'block';
  document.querySelector('.rbi-success-icon').style.display = 'none';
  document.getElementById('rbi-fetch-status-title').textContent = state.currentLanguage === 'hi' 
    ? 'खाते एक्सेस किए जा रहे हैं' 
    : 'Accessing Accounts';

  document.querySelectorAll('.rbi-log-line').forEach(line => {
    line.className = 'rbi-log-line';
  });

  // Reset buttons
  dom.rbiRequestOtpBtn.disabled = true;
  dom.rbiVerifyOtpBtn.disabled = true;
  dom.rbiProceedQuizBtn.disabled = true;
}

function bindRbiEvents() {
  // Bank selection buttons
  const bankButtons = document.querySelectorAll('.rbi-bank-btn');
  bankButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bankButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.rbiState.bankSelected = btn.getAttribute('data-bank');
      validateRbiBankSelectionInputs();
    });
  });

  // Account Aggregator ID inputs
  const aaInput = document.getElementById('rbi-aa-input');
  aaInput.addEventListener('input', (e) => {
    state.rbiState.aaHandle = e.target.value.trim();
    validateRbiBankSelectionInputs();
  });

  // OTP inputs keyboard navigation
  const otpFields = document.querySelectorAll('.otp-input-field');
  otpFields.forEach((field, index) => {
    field.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val && index < 5) {
        otpFields[index + 1].focus();
      }
      validateRbiOtpInputs();
    });

    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !field.value && index > 0) {
        otpFields[index - 1].focus();
      }
    });
  });

  // Request OTP click
  dom.rbiRequestOtpBtn.addEventListener('click', () => {
    state.rbiState.otpRequested = true;
    
    // Set custom subtitle with phone info
    const lastDigits = state.rbiState.aaHandle.replace(/[^0-9]/g, '');
    const displayedDigits = lastDigits.slice(-4) || '4321';
    
    const label = state.currentLanguage === 'hi'
      ? `चयनित बैंक खाते से जुड़े +91 ******${displayedDigits} पर भेजा गया`
      : `Sent via bank to +91 ******${displayedDigits} linked with selected account`;
    document.getElementById('rbi-otp-sent-hint').textContent = label;

    document.getElementById('rbi-step-bank-selection').style.display = 'none';
    document.getElementById('rbi-step-otp-entry').style.display = 'block';
    
    // Focus first OTP field
    setTimeout(() => {
      otpFields[0].focus();
    }, 100);
  });

  // Back button in OTP entry
  dom.rbiOtpBackBtn.addEventListener('click', () => {
    state.rbiState.otpRequested = false;
    document.getElementById('rbi-step-bank-selection').style.display = 'block';
    document.getElementById('rbi-step-otp-entry').style.display = 'none';
  });

  // Verify OTP click
  dom.rbiVerifyOtpBtn.addEventListener('click', () => {
    state.rbiState.otpVerified = true;
    document.getElementById('rbi-step-otp-entry').style.display = 'none';
    document.getElementById('rbi-step-fetching').style.display = 'block';
    startRbiFetchingSimulation();
  });

  // Proceed button click
  dom.rbiProceedQuizBtn.addEventListener('click', () => {
    navigateTo('ekyc-screen');
  });
}

function validateRbiBankSelectionInputs() {
  const activeBankBtn = document.querySelector('.rbi-bank-btn.active');
  const aaValue = document.getElementById('rbi-aa-input').value.trim();
  
  if (activeBankBtn && aaValue.length >= 5) {
    dom.rbiRequestOtpBtn.disabled = false;
  } else {
    dom.rbiRequestOtpBtn.disabled = true;
  }
}

function validateRbiOtpInputs() {
  const otpFields = document.querySelectorAll('.otp-input-field');
  let allFilled = true;
  otpFields.forEach(f => {
    if (!f.value || isNaN(f.value)) allFilled = false;
  });
  dom.rbiVerifyOtpBtn.disabled = !allFilled;
}

function startRbiFetchingSimulation() {
  const t = UI_TRANSLATIONS[state.currentLanguage];
  const logs = [
    { id: 'rbi-log-step-1', text: t.rbiLogStep1 },
    { id: 'rbi-log-step-2', text: t.rbiLogStep2 },
    { id: 'rbi-log-step-3', text: t.rbiLogStep3 },
    { id: 'rbi-log-step-4', text: t.rbiLogStep4 }
  ];

  let currentLogIdx = 0;
  
  const interval = setInterval(() => {
    if (currentLogIdx > 0) {
      document.getElementById(logs[currentLogIdx - 1].id).className = 'rbi-log-line completed';
    }
    
    if (currentLogIdx < logs.length) {
      const activeEl = document.getElementById(logs[currentLogIdx].id);
      activeEl.className = 'rbi-log-line active';
      currentLogIdx++;
    } else {
      clearInterval(interval);
      
      // Mark final log completed
      document.getElementById(logs[logs.length - 1].id).className = 'rbi-log-line completed';

      // Hide spinner, show success check
      document.querySelector('.rbi-spinner').style.display = 'none';
      document.querySelector('.rbi-success-icon').style.display = 'block';

      document.getElementById('rbi-fetch-status-title').textContent = state.currentLanguage === 'hi' 
        ? 'बैंक खाते सफलतापूर्वक लिंक हुए!' 
        : 'Bank Statements Linked!';

      // Enable proceed button
      dom.rbiProceedQuizBtn.disabled = false;
    }
  }, location.search.includes('test=true') ? 10 : 900);
}

/* ================================================================
   SHAP GRAPHICAL ATTRIBUTION ENGINE
   ================================================================ */

const SHAP_LOCATIONS = {
  en: {
    title: "Why did you get this score?",
    subtitle: "Detailed attribution of your profile features relative to average baseline.",
    mobile_payments: "Mobile Bill Payments",
    upi_monthly_avg: "UPI Monthly Average",
    geo_stability: "Geo Stability",
    ecom_activity: "E-Commerce Activity",
    psycho_score: "Psychometric Score",
    gst_rating: "GST Rating",
    salary_consistency: "Salary Consistency",
    failed_tx_ratio: "Failed Transactions",
    merchant_diversity: "Merchant Diversity",
    refund_ratio: "Refund Ratio",
    geo_vals: ["Unstable", "Moderate", "Stable"],
    ecom_vals: ["None", "Low", "High"],
    share_btn: "Share Score Report",
    offers_btn: "Compare Loan Offers",
    back_btn: "← Back to Score",
    report_copied: "Score report copied to clipboard!",
    baseline_info: "Baseline Score: 550"
  },
  hi: {
    title: "आपको यह स्कोर क्यों मिला?",
    subtitle: "आपके सहायक्रेडिट स्कोर में योगदान देने वाले कारकों का विस्तृत विवरण।",
    mobile_payments: "मोबाइल बिल भुगतान",
    upi_monthly_avg: "यूपीआई मासिक औसत",
    geo_stability: "भौगोलिक स्थिरता",
    ecom_activity: "ई-कॉमर्स गतिविधि",
    psycho_score: "साइकोमेट्रिक स्कोर",
    gst_rating: "जीएसटी रेटिंग",
    salary_consistency: "वेतन निरंतरता",
    failed_tx_ratio: "विफल लेनदेन",
    merchant_diversity: "व्यापारी विविधता",
    refund_ratio: "धनवापसी अनुपात",
    geo_vals: ["अस्थिर", "सामान्य", "स्थिर"],
    ecom_vals: ["कोई नहीं", "कम", "उच्च"],
    share_btn: "स्कोर रिपोर्ट साझा करें",
    offers_btn: "ऋण प्रस्तावों की तुलना करें",
    back_btn: "← स्कोर पर वापस जाएं",
    report_copied: "स्कोर रिपोर्ट क्लिपबोर्ड पर कॉपी हो गई!",
    baseline_info: "आधार स्कोर: 550"
  }
};

function calculateSHAPImpacts(score, dimensions) {
  const fdPct = dimensions.financialDiscipline || 50;
  const raPct = dimensions.riskAttitude || 50;
  const riPct = dimensions.repaymentIntent || 50;
  const composite = (fdPct * 0.4 + riPct * 0.4 + raPct * 0.2);
  const avgDim = (fdPct + raPct + riPct) / 3;

  const baseF = (score - 300) / 600;

  // Feature fraction estimators based on profile dimensions
  let F = {
    mobile_payments: baseF + (riPct - avgDim) / 100 * 0.15,
    upi_monthly_avg: baseF + (fdPct - avgDim) / 100 * 0.15,
    geo_stability: baseF + (riPct - avgDim) / 100 * 0.1,
    ecom_activity: baseF + (raPct - avgDim) / 100 * 0.1,
    psycho_score: baseF + (composite - avgDim) / 100 * 0.1,
    gst_rating: baseF + (fdPct - avgDim) / 100 * 0.1,
    salary_consistency: state.simState.salary_consistency !== undefined ? state.simState.salary_consistency : 1.0,
    failed_tx_ratio: state.simState.failed_tx_ratio !== undefined ? state.simState.failed_tx_ratio : 1.0,
    merchant_diversity: state.simState.merchant_diversity !== undefined ? state.simState.merchant_diversity : 1.0,
    refund_ratio: state.simState.refund_ratio !== undefined ? state.simState.refund_ratio : 1.0
  };

  const maxContrib = {
    mobile_payments: 80,
    upi_monthly_avg: 60,
    geo_stability: 50,
    ecom_activity: 40,
    psycho_score: 70,
    gst_rating: 50,
    salary_consistency: 55,
    failed_tx_ratio: 45,
    merchant_diversity: 35,
    refund_ratio: 30
  };

  const worstVal = {
    mobile_payments: 0,
    upi_monthly_avg: 0,
    geo_stability: 0,
    ecom_activity: 0,
    psycho_score: 0,
    gst_rating: 1,
    salary_consistency: 0.0,
    failed_tx_ratio: 0.0,
    merchant_diversity: 0.0,
    refund_ratio: 0.0
  };

  const bestVal = {
    mobile_payments: 12,
    upi_monthly_avg: 100000,
    geo_stability: 2,
    ecom_activity: 2,
    psycho_score: 100,
    gst_rating: 5,
    salary_consistency: 1.0,
    failed_tx_ratio: 1.0,
    merchant_diversity: 1.0,
    refund_ratio: 1.0
  };

  // Helper to compute impact for a single feature
  function getImpact(feature, fraction) {
    const clampedF = Math.min(1, Math.max(0, fraction));
    const max_c = maxContrib[feature];
    if (clampedF >= 0.35) {
      return (clampedF - 0.35) / 0.65 * max_c;
    } else {
      return (clampedF - 0.35) / 0.35 * (max_c * 250 / 350);
    }
  }

  // Binary search for adjustment d
  const targetSum = score - 550;
  let low = -1.5, high = 1.5, d = 0;
  for (let iter = 0; iter < 100; iter++) {
    d = (low + high) / 2;
    let sum = 0;
    for (const feat in F) {
      sum += getImpact(feat, F[feat] + d);
    }
    if (Math.abs(sum - targetSum) < 0.001) {
      break;
    }
    if (sum < targetSum) {
      low = d;
    } else {
      high = d;
    }
  }

  // Calculate final adjusted impacts and actual values
  const results = {};
  for (const feat in F) {
    const finalF = Math.min(1, Math.max(0, F[feat] + d));
    const rawVal = worstVal[feat] + finalF * (bestVal[feat] - worstVal[feat]);
    let actual_value = rawVal;
    
    // Format actual values nicely
    if (feat === 'mobile_payments') {
      actual_value = Math.round(rawVal);
    } else if (feat === 'upi_monthly_avg') {
      actual_value = Math.round(rawVal / 1000) * 1000;
    } else if (feat === 'geo_stability' || feat === 'ecom_activity') {
      actual_value = Math.round(rawVal);
    } else if (feat === 'psycho_score') {
      actual_value = Math.round(rawVal);
    } else if (feat === 'gst_rating') {
      actual_value = Math.round(rawVal * 2) / 2;
    } else if (feat === 'salary_consistency') {
      const opts = [1.0, 0.67, 0.33, 0.0];
      actual_value = opts.reduce((prev, curr) => Math.abs(curr - rawVal) < Math.abs(prev - rawVal) ? curr : prev);
    } else if (feat === 'failed_tx_ratio') {
      const opts = [1.0, 0.75, 0.35, 0.0];
      actual_value = opts.reduce((prev, curr) => Math.abs(curr - rawVal) < Math.abs(prev - rawVal) ? curr : prev);
    } else if (feat === 'merchant_diversity') {
      const opts = [1.0, 0.67, 0.33, 0.0];
      actual_value = opts.reduce((prev, curr) => Math.abs(curr - rawVal) < Math.abs(prev - rawVal) ? curr : prev);
    } else if (feat === 'refund_ratio') {
      const opts = [1.0, 0.75, 0.35, 0.0];
      actual_value = opts.reduce((prev, curr) => Math.abs(curr - rawVal) < Math.abs(prev - rawVal) ? curr : prev);
    }

    results[feat] = {
      value: actual_value,
      impact: Math.round(getImpact(feat, finalF))
    };
  }

  // Adjust one last time to ensure the rounded sum matches targetSum exactly
  let roundedSum = 0;
  for (const feat in results) {
    roundedSum += results[feat].impact;
  }
  let diff = targetSum - roundedSum;
  if (diff !== 0) {
    const keys = Object.keys(results).sort((a, b) => Math.abs(results[b].impact) - Math.abs(results[a].impact));
    let idx = 0;
    while (diff !== 0) {
      const key = keys[idx % keys.length];
      if (diff > 0) {
        results[key].impact += 1;
        diff--;
      } else {
        results[key].impact -= 1;
        diff++;
      }
      idx++;
    }
  }

  return results;
}

function renderSHAPScreen() {
  if (!state.scoreData) return;

  const score = state.scoreData.score;
  const lang = state.currentLanguage;
  const t = SHAP_LOCATIONS[lang];

  // Update titles
  dom.shapScreenTitle.textContent = t.title;
  dom.shapScreenSubtitle.textContent = t.subtitle;
  dom.shapFinalScoreVal.textContent = score;

  // Set actions translations
  dom.shareReportBtnText.textContent = t.share_btn;
  dom.shapCompareBtnText.textContent = t.offers_btn;
  dom.shapBackBtnText.textContent = t.back_btn;

  // Calculate impacts
  const shapResults = calculateSHAPImpacts(score, state.scoreData.dimensions);

  // Store calculated impacts in state so report sharing can access it
  state.shapResults = shapResults;

  // Render each feature row
  const features = [
    'mobile_payments', 'upi_monthly_avg', 'geo_stability', 'ecom_activity', 'psycho_score', 'gst_rating',
    'salary_consistency', 'failed_tx_ratio', 'merchant_diversity', 'refund_ratio'
  ];
  const ids = {
    mobile_payments: 'mobile',
    upi_monthly_avg: 'upi',
    geo_stability: 'geo',
    ecom_activity: 'ecom',
    psycho_score: 'psycho',
    gst_rating: 'gst',
    salary_consistency: 'sal-const',
    failed_tx_ratio: 'failed-tx',
    merchant_diversity: 'merch-div',
    refund_ratio: 'refund-ratio'
  };

  features.forEach(feat => {
    const result = shapResults[feat];
    const key = ids[feat];

    // 1. Label
    const labelEl = document.getElementById(`lbl-feat-${key}`);
    if (labelEl) labelEl.textContent = t[feat];

    // 2. Value Formatting
    const valEl = document.getElementById(`val-feat-${key}`);
    if (valEl) {
      let formattedVal = '';
      if (feat === 'mobile_payments') {
        formattedVal = lang === 'en' ? `${result.value} mos` : `${result.value} माह`;
      } else if (feat === 'upi_monthly_avg') {
        formattedVal = `₹${result.value.toLocaleString('en-IN')}/` + (lang === 'en' ? 'mo' : 'माह');
      } else if (feat === 'geo_stability') {
        formattedVal = t.geo_vals[result.value] || t.geo_vals[1];
      } else if (feat === 'ecom_activity') {
        formattedVal = t.ecom_vals[result.value] || t.ecom_vals[1];
      } else if (feat === 'psycho_score') {
        formattedVal = `${result.value}/100`;
      } else if (feat === 'gst_rating') {
        formattedVal = `${result.value.toFixed(1)}★`;
      } else if (feat === 'salary_consistency') {
        const mapping = { 1.0: 'Very Regular', 0.67: 'Mostly Regular', 0.33: 'Irregular', 0.0: 'None' };
        const mappingHi = { 1.0: 'अत्यंत नियमित', 0.67: 'आमतौर पर नियमित', 0.33: 'अनियमित', 0.0: 'कोई निश्चित नहीं' };
        formattedVal = lang === 'en' ? (mapping[result.value] || 'Very Regular') : (mappingHi[result.value] || 'अत्यंत नियमित');
      } else if (feat === 'failed_tx_ratio') {
        const mapping = { 1.0: '0', 0.75: '1-2', 0.35: '3-5', 0.0: '5+' };
        formattedVal = mapping[result.value] || '0';
      } else if (feat === 'merchant_diversity') {
        const mapping = { 1.0: 'Many', 0.67: 'Few', 0.33: 'One', 0.0: 'Rarely' };
        const mappingHi = { 1.0: 'एकाधिक प्रकार', 0.67: 'कुछ प्रकार', 0.33: 'केवल एक प्रकार', 0.0: 'शायद ही कभी' };
        formattedVal = lang === 'en' ? (mapping[result.value] || 'Many') : (mappingHi[result.value] || 'एकाधिक प्रकार');
      } else if (feat === 'refund_ratio') {
        const mapping = { 1.0: 'Rarely', 0.75: 'Occasionally', 0.35: 'Frequently', 0.0: 'Very Often' };
        const mappingHi = { 1.0: 'शायद ही कभी', 0.75: 'कभी-कभार', 0.35: 'अक्सर', 0.0: 'बहुत बार' };
        formattedVal = lang === 'en' ? (mapping[result.value] || 'Rarely') : (mappingHi[result.value] || 'शायद ही कभी');
      }
      valEl.textContent = formattedVal;
    }

    // 3. Impact Point Formatting
    const impactEl = document.getElementById(`impact-feat-${key}`);
    if (impactEl) {
      const sign = result.impact >= 0 ? '+' : '';
      impactEl.textContent = `${sign}${result.impact} pts`;
      impactEl.className = 'waterfall-impact-col ' + (result.impact >= 0 ? 'positive' : 'negative');
    }

    // 4. Bar Alignment & Length
    const barEl = document.getElementById(`bar-${key}`);
    if (barEl) {
      const isPositive = result.impact >= 0;
      const w = (Math.abs(result.impact) / 80) * 50; // max scale is 80 points
      
      barEl.style.width = `${w}%`;
      if (isPositive) {
        barEl.style.left = '50%';
        barEl.className = 'waterfall-bar positive';
      } else {
        barEl.style.left = `calc(50% - ${w}%)`;
        barEl.className = 'waterfall-bar negative';
      }
    }
  });
}

function shareScoreReport() {
  if (!state.scoreData || !state.shapResults) return;

  const score = state.scoreData.score;
  const tier = state.scoreData.tier;
  const name = state.signatureName || (state.currentLanguage === 'en' ? 'Valued Borrower' : 'सम्मानित उधारकर्ता');
  const dateStr = new Date().toLocaleDateString(state.currentLanguage === 'en' ? 'en-IN' : 'hi-IN');
  const t = SHAP_LOCATIONS[state.currentLanguage];

  const results = state.shapResults;

  // Build bilingual-friendly text report
  let report = '';
  if (state.currentLanguage === 'en') {
    report = `SAHAYCREDIT PROFILE SCORE REPORT
----------------------------------------
Name: ${name}
Score: ${score} / 900 (Tier ${tier})
Eligibility: ${state.scoreData.eligibility}
Suggested Rate: ${state.scoreData.interestRate}% p.a.
Approved Limit: ₹${state.scoreData.creditLimit.toLocaleString('en-IN')}
Date: ${dateStr}

WHY THIS SCORE? (SHAP Attribution Details)
----------------------------------------
• Baseline Score: 550
• Mobile Bill Payments: ${results.mobile_payments.value} mos (${results.mobile_payments.impact >= 0 ? '+' : ''}${results.mobile_payments.impact} pts)
• UPI Monthly Average: ₹${results.upi_monthly_avg.value.toLocaleString('en-IN')} (${results.upi_monthly_avg.impact >= 0 ? '+' : ''}${results.upi_monthly_avg.impact} pts)
• Geo Stability: ${t.geo_vals[results.geo_stability.value]} (${results.geo_stability.impact >= 0 ? '+' : ''}${results.geo_stability.impact} pts)
• E-Commerce Activity: ${t.ecom_vals[results.ecom_activity.value]} (${results.ecom_activity.impact >= 0 ? '+' : ''}${results.ecom_activity.impact} pts)
• Psychometric Score: ${results.psycho_score.value}/100 (${results.psycho_score.impact >= 0 ? '+' : ''}${results.psycho_score.impact} pts)
• GST Rating: ${results.gst_rating.value.toFixed(1)}★ (${results.gst_rating.impact >= 0 ? '+' : ''}${results.gst_rating.impact} pts)
----------------------------------------
Security: Verified by SahayCredit XGBoost Engine (RBI Account Aggregator).`;
  } else {
    report = `सहायक्रेडिट प्रोफ़ाइल स्कोर रिपोर्ट
----------------------------------------
नाम: ${name}
स्कोर: ${score} / 900 (टियर ${tier})
पात्रता: ${state.scoreData.eligibility === 'Eligible' ? 'पात्र' : 'समीक्षा के अधीन'}
प्रस्तावित दर: ${state.scoreData.interestRate}% प्रति वर्ष
स्वीकृत सीमा: ₹${state.scoreData.creditLimit.toLocaleString('en-IN')}
दिनांक: ${dateStr}

यह स्कोर क्यों मिला? (SHAP एट्रिब्यूशन विवरण)
----------------------------------------
• आधार स्कोर: 550
• मोबाइल बिल भुगतान: ${results.mobile_payments.value} माह (${results.mobile_payments.impact >= 0 ? '+' : ''}${results.mobile_payments.impact} अंक)
• यूपीआई मासिक औसत: ₹${results.upi_monthly_avg.value.toLocaleString('en-IN')} (${results.upi_monthly_avg.impact >= 0 ? '+' : ''}${results.upi_monthly_avg.impact} अंक)
• भौगोलिक स्थिरता: ${t.geo_vals[results.geo_stability.value]} (${results.geo_stability.impact >= 0 ? '+' : ''}${results.geo_stability.impact} अंक)
• ई-कॉमर्स गतिविधि: ${t.ecom_vals[results.ecom_activity.value]} (${results.ecom_activity.impact >= 0 ? '+' : ''}${results.ecom_activity.impact} अंक)
• साइकोमेट्रिक स्कोर: ${results.psycho_score.value}/100 (${results.psycho_score.impact >= 0 ? '+' : ''}${results.psycho_score.impact} अंक)
• जीएसटी रेटिंग: ${results.gst_rating.value.toFixed(1)}★ (${results.gst_rating.impact >= 0 ? '+' : ''}${results.gst_rating.impact} अंक)
----------------------------------------
सुरक्षा: सहायक्रेडिट XGBoost इंजन (आरबीआई अकाउंट एग्रीगेटर) द्वारा सत्यापित।`;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(report).then(() => {
    alert(t.report_copied);
  }).catch(err => {
    console.error('Failed to copy report: ', err);
  });

  // Display in screen preview box
  dom.reportText.textContent = report;
  dom.reportBox.style.display = 'block';
  
  // Scroll preview box into view smoothly
  dom.reportBox.scrollIntoView({ behavior: 'smooth' });
}
