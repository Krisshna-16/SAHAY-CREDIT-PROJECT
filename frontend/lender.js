// SahayCredit Partner Portal - Lender Dashboard Logic

// Localization Dictionaries
const LENDER_TRANSLATIONS = {
  en: {
    portalTitle: "LENDER PORTAL",
    partnerBadge: "Partner NBFC: FinServe NBFC",
    statTotal: "Total Applications",
    statAvgScore: "Avg Score",
    statApprovalRate: "Approval Rate",
    statAvgLoan: "Avg Loan Size",
    workspaceTitle: "Incoming Application Pool",
    searchPlaceholder: "Search by name...",
    filterAll: "All Statuses",
    filterApproved: "Approved",
    filterReview: "In Review",
    filterRejected: "Rejected",
    colName: "Name",
    colScore: "Score",
    colConfidence: "Confidence",
    colLoan: "Loan Requested",
    colRate: "Suggested Rate",
    colSignals: "Signals Used",
    colFraud: "Fraud Risk",
    colStatus: "Status",
    noticeTitle: "Select an Applicant",
    noticeDesc: "Click any row in the pool table to load their alternate credit details, SHAP indicators, and local audit trail logs.",
    btnApprove: "Approve",
    btnReview: "Flag for Review",
    btnReject: "Reject",
    scoreTitle: "Sahay Score",
    pricingTitle: "Suggested Pricing",
    scoreRange: "Score Range: {min}–{max}",
    aprRec: "APR (Recommended)",
    shapTitle: "Top 3 Credit Drivers (SHAP Factors)",
    signalsTitle: "Alternate Data Signals (Horizontal Bar Chart)",
    psychTitle: "Psychometric Summary",
    riskLevelLabel: "Risk Attitude Level:",
    riskLow: "Low",
    riskMedium: "Medium",
    riskHigh: "High",
    auditTitle: "RBI AA Audit Trail Logs",
    btnExport: "📄 Export Report",
    exportNotice: "Instant local export generated in CSV format (under 2 seconds guaranteed).",
    lblTotalDecisions: "Total Decisions Made",
    lblAvgExplainability: "Avg Explainability Score",
    lblAuditableLatency: "Auditable in <2s",
    lblConsentObtained: "RBI AA Consent Obtained",
    lblAuditLogTitle: "RBI Compliance Audit Logs",
    lblSearchAppPlaceholder: "Search Application ID...",
    optAuditAll: "All Decisions",
    optAuditApproved: "Approved",
    optAuditReview: "Under Review",
    optAuditRejected: "Rejected",
    lblScoreRange: "Score:",
    lblSignalRange: "Signals (Min):",
    lblExportCsv: "Export CSV Log",
    thAuditId: "Application ID",
    thAuditTime: "Date & Time",
    thAuditScore: "Score",
    thAuditModel: "Model Version",
    thAuditSignals: "Signals",
    thAuditShap: "Top 3 SHAP Drivers",
    thAuditDecision: "Decision",
    thAuditLatency: "Latency",
    tabModelText: "Model Validation",
    valSec1Title: "Why XGBoost? We tested 2 models.",
    valThMetric: "Metric",
    valThLr: "Logistic Regression",
    valThXgb: "XGBoost (Our Model)",
    valCellLrExp: "Linear coefficients only",
    valCellXgbExp: "SHAP values ✅",
    valCellLrRbi: "Partial",
    valCellXgbRbi: "Full ✅",
    valCalloutDesc: "XGBoost outperforms Logistic Regression by +20% AUC while providing full SHAP explainability — required for RBI-compliant lending.",
    valSec2Title: "Validation Methodology",
    valCard1Title: "Dataset",
    valCard1Desc: "5,000 synthetic borrower profiles modeled on Home Credit Default Risk feature structure. Production will use RBI AA consent-based UPI data.",
    valCard2Title: "Split",
    valCard2Desc: "80% training / 20% test, stratified by risk grade to prevent class imbalance leakage.",
    valCard3Title: "Cross-validation",
    valCard3Desc: "5-fold Stratified K-Fold CV. Mean AUC: 0.91 ± 0.02",
    valCard4Title: "Limitations",
    valCard4Desc: "Synthetic data has no real-world default validation loop. We disclose this proactively. Live deployment would require 6-month NPL backtesting.",
    valSec3Title: "Confusion Matrix (visual)",
    valMatLblPos: "Predicted Positive",
    valMatLblNeg: "Predicted Negative",
    valMatLblTruepos: "Actual Positive",
    valMatLblTrueneg: "Actual Negative",
    valMatCellTp: "True Positive (TP)",
    valMatCellFn: "False Negative (FN)",
    valMatCellFp: "False Positive (FP)",
    valMatCellTn: "True Negative (TN)",
    valMatCaption: "False negative rate kept intentionally low — missing a bad borrower costs more than missing a good one.",
    valSecPerfTitle: "Model Performance",
    valKsTitle: "Kolmogorov-Smirnov (KS) Statistic",
    valKsDesc: "KS > 0.4 = Strong model. Industry benchmark for credit scoring.",
    valCalTitle: "Calibration Plot (Reliability Diagram)",
    valCalCaption: "Well-calibrated model — predicted probabilities closely match observed default rates. Applied Platt scaling post-training.",
    valFairTitle: "Fairness Check",
    valFairIntro: "Score distribution across income brackets",
    valFairThBracket: "Income Band",
    valFairThScore: "Avg Score",
    valFairThDefault: "Default Rate",
    valFairThSample: "Sample Size",
    valFairNote: "Score correlates with income as expected, but model does not use income as a direct feature — it is inferred from behavioral signals, reducing socioeconomic bias."
  },
  hi: {
    portalTitle: "ऋणदाता पोर्टल",
    partnerBadge: "साझेदार NBFC: फिनसर्व NBFC",
    statTotal: "कुल आवेदन",
    statAvgScore: "औसत स्कोर",
    statApprovalRate: "स्वीकृति दर",
    statAvgLoan: "औसत ऋण राशि",
    workspaceTitle: "आगमन आवेदन पूल",
    searchPlaceholder: "नाम से खोजें...",
    filterAll: "सभी स्थितियाँ",
    filterApproved: "स्वीकृत",
    filterReview: "समीक्षा में",
    filterRejected: "अस्वीकृत",
    colName: "नाम",
    colScore: "स्कोर",
    colConfidence: "कन्फिडेंस",
    colLoan: "ऋण राशि",
    colRate: "अनुशंसित दर",
    colSignals: "उपयोग किए गए सिग्नल",
    colFraud: "धोखाधड़ी जोखिम",
    colStatus: "स्थिति",
    noticeTitle: "एक आवेदक चुनें",
    noticeDesc: "विवरण, SHAP और स्थानीय ऑडिट ट्रेल लोड करने के लिए पूल तालिका में किसी भी पंक्ति पर क्लिक करें।",
    btnApprove: "स्वीकृत करें",
    btnReview: "समीक्षा के लिए चिह्नित करें",
    btnReject: "अस्वीकृत करें",
    scoreTitle: "सहाय स्कोर",
    pricingTitle: "अनुशंसित मूल्य निर्धारण",
    scoreRange: "स्कोर सीमा: {min}–{max}",
    aprRec: "APR (अनुशंसित)",
    shapTitle: "शीर्ष 3 क्रेडिट चालक (SHAP कारक)",
    signalsTitle: "वैकल्पिक डेटा सिग्नल (क्षैतिज बार चार्ट)",
    psychTitle: "साइकोमेट्रिक सारांश",
    riskLevelLabel: "जोखिम दृष्टिकोण स्तर:",
    riskLow: "निम्न",
    riskMedium: "मध्यम",
    riskHigh: "उच्च",
    auditTitle: "आरबीआई एए ऑडिट ट्रेल लॉग",
    btnExport: "📄 रिपोर्ट निर्यात करें",
    exportNotice: "CSV प्रारूप में उत्पन्न त्वरित स्थानीय निर्यात (2 सेकंड के भीतर गारंटीकृत)।",
    lblTotalDecisions: "कुल लिए गए निर्णय",
    lblAvgExplainability: "औसत स्पष्टीकरण स्कोर",
    lblAuditableLatency: "<2 सेकंड में ऑडिट योग्य",
    lblConsentObtained: "आरबीआई एए सहमति प्राप्त",
    lblAuditLogTitle: "आरबीआई अनुपालन ऑडिट लॉग",
    lblSearchAppPlaceholder: "आवेदक आईडी खोजें...",
    optAuditAll: "सभी निर्णय",
    optAuditApproved: "स्वीकृत",
    optAuditReview: "समीक्षा में",
    optAuditRejected: "अस्वीकृत",
    lblScoreRange: "स्कोर:",
    lblSignalRange: "सिग्नल (न्यूनतम):",
    lblExportCsv: "CSV लॉग निर्यात करें",
    thAuditId: "आवेदन आईडी",
    thAuditTime: "दिनांक और समय",
    thAuditScore: "स्कोर",
    thAuditModel: "मॉडल संस्करण",
    thAuditSignals: "सिग्नल",
    thAuditShap: "शीर्ष 3 SHAP चालक",
    thAuditDecision: "निर्णय",
    thAuditLatency: "विलंबता",
    tabModelText: "मॉडल सत्यापन",
    valSec1Title: "XGBoost क्यों? हमने 2 मॉडलों का परीक्षण किया।",
    valThMetric: "मीट्रिक",
    valThLr: "लॉजिस्टिक रिग्रेशन",
    valThXgb: "XGBoost (हमारा मॉडल)",
    valCellLrExp: "केवल रैखिक गुणांक",
    valCellXgbExp: "SHAP मान ✅",
    valCellLrRbi: "आंशिक",
    valCellXgbRbi: "पूर्ण ✅",
    valCalloutDesc: "XGBoost पूर्ण SHAP स्पष्टता प्रदान करते हुए लॉजिस्टिक रिग्रेशन से +20% AUC बेहतर प्रदर्शन करता है — जो RBI-अनुपालक ऋण देने के लिए आवश्यक है।",
    valSec2Title: "सत्यापन पद्धति",
    valCard1Title: "डेटासेट",
    valCard1Desc: "5,000 सिंथेटिक उधारकर्ता प्रोफाइल होम क्रेडिट डिफॉल्ट रिस्क फीचर संरचना पर मॉडल किए गए हैं। उत्पादन RBI AA सहमति-आधारित UPI डेटा का उपयोग करेगा।",
    valCard2Title: "विभाजन",
    valCard2Desc: "80% प्रशिक्षण / 20% परीक्षण, वर्ग असंतुलन रिसाव को रोकने के लिए जोखिम ग्रेड द्वारा स्तरीकृत।",
    valCard3Title: "क्रॉस-सत्यापन",
    valCard3Desc: "5-गुना स्तरीकृत के-फोल्ड सीवी। औसत एयूसी: 0.91 ± 0.02",
    valCard4Title: "सीमाएं",
    valCard4Desc: "सिंथेटिक डेटा में कोई वास्तविक दुनिया डिफ़ॉल्ट सत्यापन लूप नहीं है। हम इसे सक्रिय रूप से प्रकट करते हैं। लाइव परिनियोजन के लिए 6-महीने के एनपीएल बैकटेस्टिंग की आवश्यकता होगी।",
    valSec3Title: "भ्रम मैट्रिक्स (दृश्य)",
    valMatLblPos: "अनुमानित सकारात्मक",
    valMatLblNeg: "अनुमानित नकारात्मक",
    valMatLblTruepos: "वास्तविक सकारात्मक",
    valMatLblTrueneg: "वास्तविक नकारात्मक",
    valMatCellTp: "सच्चा सकारात्मक (TP)",
    valMatCellFn: "झूठा नकारात्मक (FN)",
    valMatCellFp: "झूठा सकारात्मक (FP)",
    valMatCellTn: "सच्चा नकारात्मक (TN)",
    valMatCaption: "गलत नकारात्मक दर जानबूझकर कम रखी गई है — एक खराब उधारकर्ता को छोड़ना एक अच्छे को छोड़ने की तुलना में अधिक खर्चीला है।",
    valSecPerfTitle: "मॉडल प्रदर्शन",
    valKsTitle: "कोलमोगोरोव-स्मिरनोव (KS) सांख्यिकी",
    valKsDesc: "KS > 0.4 = मजबूत मॉडल। क्रेडिट स्कोरिंग के लिए उद्योग बेंचमार्क।",
    valCalTitle: "अंशांकन प्लॉट (विश्वसनीयता आरेख)",
    valCalCaption: "सुव्यवस्थित मॉडल — अनुमानित संभावनाएं देखी गई डिफ़ॉल्ट दरों से निकटता से मेल खाती हैं। प्रशिक्षण के बाद प्लैट स्केलिंग लागू की गई।",
    valFairTitle: "निष्पक्षता जांच",
    valFairIntro: "आय श्रेणियों में स्कोर का वितरण",
    valFairThBracket: "आय श्रेणी",
    valFairThScore: "औसत स्कोर",
    valFairThDefault: "डिफ़ॉल्ट दर",
    valFairThSample: "नमूना आकार",
    valFairNote: "स्कोर उम्मीद के मुताबिक आय के साथ सहसंबद्ध है, लेकिन मॉडल प्रत्यक्ष रूप से आय का उपयोग नहीं करता है — यह व्यवहार संकेतों से अनुमानित होता है, जिससे सामाजिक-आर्थिक पूर्वाग्रह कम होता है।"
  }
};

const CONTENT_TRANSLATIONS = {
  // SHAP Factors
  "Consistent mobile bill payments for 12+ months (+62 pts)": "12+ महीनों से लगातार मोबाइल बिल भुगतान (+62 अंक)",
  "Stable home & work location for 6 months (+48 pts)": "6 महीने से स्थिर घर और काम का स्थान (+48 अंक)",
  "Moderate UPI transaction volume (+21 pts)": "मध्यम यूपीआई लेनदेन की मात्रा (+21 अंक)",
  "Moderate UPI business inflows (+32 pts)": "मध्यम यूपीआई व्यावसायिक प्रवाह (+32 अंक)",
  "Occasional delayed mobile bill payments (-18 pts)": "कभी-कभार देरी से मोबाइल बिल भुगतान (-18 अंक)",
  "Short e-commerce checkout history (+15 pts)": "लघु ई-कॉमर्स खरीद इतिहास (+15 अंक)",
  "Flawless mobile bill history for 18 months (+88 pts)": "18 महीनों के लिए दोषरहित मोबाइल बिल इतिहास (+88 अंक)",
  "Consistent high-volume UPI business receipts (+78 pts)": "लगातार उच्च मात्रा में यूपीआई व्यावसायिक प्राप्तियां (+78 अंक)",
  "Exceptional GST tax compliance history (+62 pts)": "असाधारण जीएसटी कर अनुपालन इतिहास (+62 अंक)",
  "Volatile UPI cash flows with multiple overdraft warnings (-48 pts)": "कई ओवरड्राफ्ट चेतावनियों के साथ अस्थिर यूपीआई कैश फ्लो (-48 अंक)",
  "Frequent geographic location changes over 3 months (-32 pts)": "3 महीनों में बार-बार भौगोलिक स्थान परिवर्तन (-32 अंक)",
  "Conservative behavioral debt safety score (-20 pts)": "रूढ़िवादी व्यवहारिक ऋण सुरक्षा स्कोर (-20 अंक)",
  "Stable home location verified for 12 months (+45 pts)": "12 महीनों के लिए सत्यापित स्थिर घरेलू स्थान (+45 अंक)",
  "Steady utility bill payments (+38 pts)": "नियमित उपयोगिता बिल भुगतान (+38 अंक)",
  "Moderate business transaction activity on UPI (+22 pts)": "यूपीआई पर मध्यम व्यावसायिक लेनदेन गतिविधि (+22 अंक)",
  "Stable business location coordinate matching (+58 pts)": "स्थिर व्यावसायिक स्थान निर्देशांक मिलान (+58 अंक)",
  "Strong UPI sales transaction volume (+52 pts)": "मजबूत यूपीआई बिक्री लेनदेन मात्रा (+52 अंक)",
  "High behavioral planning score (+35 pts)": "उच्च व्यवहारिक योजना स्कोर (+35 अंक)",

  // Signal Details
  "Consistent monthly post-paid payment cycles for 12+ months.": "12+ महीनों के लिए लगातार मासिक पोस्ट-पेड भुगतान चक्र।",
  "Stable customer transaction history, active UPI business inflows.": "स्थिर ग्राहक लेनदेन इतिहास, सक्रिय यूपीआई व्यावसायिक प्रवाह।",
  "Excellent home and kirana shop location match for 6 months.": "6 महीने के लिए उत्कृष्ट घरेलू और किराना दुकान स्थान मिलान।",
  "Moderate risk attitude, positive financial repayment attitude.": "मध्यम जोखिम दृष्टिकोण, सकारात्मक वित्तीय पुनर्भुगतान दृष्टिकोण।",
  "Not shared / Opted out": "साझा नहीं किया गया / बाहर कर दिया गया",
  "Occasional delayed prepaid refills, medium payment reliability.": "कभी-कभार प्रीपेड रीफिल में देरी, मध्यम भुगतान विश्वसनीयता।",
  "Moderate business receipts, average active balance is low.": "मध्यम व्यावसायिक प्राप्तियां, औसत सक्रिय शेष राशि कम है।",
  "Balanced decision metrics, average repayment intent.": "संतुलित निर्णय मेट्रिक्स, औसत पुनर्भुगतान इरादा।",
  "Recent online purchase activity on Flipkart/Meesho.": "फ्लिपकार्ट/मीशो पर हालिया ऑनलाइन खरीद गतिविधि।",
  "Perfect post-paid utility payment cycles over 18 months.": "18 महीनों में उत्तम पोस्ट-पेड उपयोगिता भुगतान चक्र।",
  "Consistent daily merchant receipt volume and high balance safety.": "लगातार दैनिक मर्चेंट रसीद मात्रा और उच्च शेष राशि सुरक्षा।",
  "Stable coordinates match: verified store & home match.": "स्थिर निर्देशांक मिलान: सत्यापित स्टोर और होम मिलान।",
  "Outstanding moral repayment priority and safe growth focus.": "उत्कृष्ट नैतिक पुनर्भुगतान प्राथमिकता और सुरक्षित विकास फोकस।",
  "Frequent online business inventory orders on Meesho.": "मीशो पर बार-बार ऑनलाइन व्यावसायिक इन्वेंट्री ऑर्डर।",
  "4.8/5 supplier network rating and positive peer reviews.": "4.8/5 आपूर्तिकर्ता नेटवर्क रेटिंग और सकारात्मक सहकर्मी समीक्षा।",
  "Frequent prepaid recharges with delayed intervals.": "देरी के अंतराल के साथ बार-बार प्रीपेड रिचार्ज।",
  "Highly volatile inflow patterns, regular near-zero balances.": "अत्यधिक अस्थिर इनफ्लो पैटर्न, नियमित रूप से शून्य के करीब शेष राशि।",
  "Frequent shop coordinate migrations over a 3-month period.": "3 महीने की अवधि में बार-बार दुकान निर्देशांक का स्थानांतरण।",
  "Short planning horizons, lower credit prioritization.": "लघु योजना क्षितिज, कम क्रेडिट प्राथमिकता।",
  "Steady payment intervals, no post-paid payment default.": "स्थिर भुगतान अंतराल, कोई पोस्ट-पेड भुगतान डिफ़ॉल्ट नहीं।",
  "Regular consumer receipts, average cash buffer is stable.": "नियमित उपभोक्ता रसीदें, औसत नकद बफर स्थिर है।",
  "Verified home coordinate stability matched for 12 months.": "सत्यापित घरेलू निर्देशांक स्थिरता 12 महीनों के लिए मेल खाती है।",
  "Conservative builder profile, prefers cash to large credit lines.": "रूढ़िवादी बिल्डर प्रोफाइल, बड़ी क्रेडिट लाइनों के मुकाबले नकदी पसंद करते हैं।",
  "Consistent purchases of household supplies.": "घरेलू सामानों की लगातार खरीदारी।",
  "Regular payment history, zero default record.": "नियमित भुगतान इतिहास, शून्य डिफ़ॉल्ट रिकॉर्ड।",
  "Consistent high-value merchant inflows, robust cash flow safety.": "लगातार उच्च मूल्य के मर्चेंट इनफ्लो, मजबूत कैश फ्लो सुरक्षा।",
  "Consistent coordinate patterns for 9 months.": "9 महीनों के लिए लगातार निर्देशांक पैटर्न।",
  "Active business manager, disciplined loan priority.": "सक्रिय व्यावसायिक प्रबंधक, अनुशासित ऋण प्राथमिकता।",
  "Frequent online business inventory sourcing online.": "ऑनलाइन लगातार ऑनलाइन व्यावसायिक इन्वेंट्री सोर्सिंग।",

  // Audit Logs
  "RBI AA Framework: UPI transaction stream pull succeeded": "आरबीआई एए फ्रेमवर्क: यूपीआई लेनदेन स्ट्रीम पुल सफल रहा",
  "RBI AA Framework: Mobile payment records pulled successfully": "आरबीआई एए फ्रेमवर्क: मोबाइल भुगतान रिकॉर्ड सफलतापूर्वक खींचे गए",
  "On-Device: Encrypted coordinates location matching complete": "ऑन-डिवाइस: एन्क्रिप्टेड निर्देशांक स्थान मिलान पूरा हुआ",
  "On-Device: Psychometric evaluation compiled under XGBoost v2.4.1": "ऑन-डिवाइस: साइकोमेट्रिक मूल्यांकन XGBoost v2.4.1 के तहत संकलित",
  "Model Engine: SHAP explainable weights generated successfully": "मॉडल इंजन: SHAP स्पष्टीकरण योग्य भार सफलतापूर्वक उत्पन्न",
  "RBI AA Framework: UPI transactions pull succeeded": "आरबीआई एए फ्रेमवर्क: यूपीआई लेनदेन खिंचाव सफल रहा",
  "RBI AA Framework: Mobile records pull succeeded": "आरबीआई एए फ्रेमवर्क: मोबाइल रिकॉर्ड खिंचाव सफल रहा",
  "On-Device: E-commerce purchase volumes computed": "ऑन-डिवाइस: ई-कॉमर्स खरीद मात्रा की गणना की गई",
  "On-Device: Psychometric outputs compiled under XGBoost v2.4.1": "ऑन-डिवाइस: साइकोमेट्रिक आउटपुट XGBoost v2.4.1 के तहत संकलित",
  "RBI AA Framework: Mobile logs pulled successfully": "आरबीआई एए फ्रेमवर्क: मोबाइल लॉग सफलतापूर्वक खींचे गए",
  "On-Device: Coordinate encryption mask complete": "ऑन-डिवाइस: निर्देशांक एन्क्रिप्शन मास्क पूर्ण",
  "On-Device: E-commerce inventory matching complete": "ऑन-डिवाइस: ई-कॉमर्स इन्वेंट्री मिलान पूर्ण",
  "GST Portal: Merchant tax compliance rating retrieved": "जीएसटी पोर्टल: मर्चेंट कर अनुपालन रेटिंग प्राप्त की गई",
  "On-Device: Geographic coordinates checked": "ऑन-डिवाइस: भौगोलिक निर्देशांक की जाँच की गई",
  "On-Device: Psychometric models run under XGBoost v2.4.1": "ऑन-डिवाइस: साइकोमेट्रिक मॉडल XGBoost v2.4.1 के तहत चलाए गए",
  "On-Device: Geolocation matching complete": "ऑन-डिवाइस: जियोलोकेशन मिलान पूर्ण",
  "On-Device: E-commerce purchase matching complete": "ऑन-डिवाइस: ई-कॉमर्स खरीद मिलान पूर्ण",
  "On-Device: Psychometric answers verified under XGBoost v2.4.1": "ऑन-डिवाइस: साइकोमेट्रिक उत्तर XGBoost v2.4.1 के तहत सत्यापित",
  "On-Device: Coordinate tracking masking complete": "ऑन-डिवाइस: निर्देशांक ट्रैकिंग मास्किंग पूर्ण",
  "On-Device: E-commerce inventory check succeeded": "ऑन-डिवाइस: ई-कॉमर्स इन्वेंट्री जांच सफल रही"
};

function translateText(txt, lang) {
  if (lang === 'hi' && CONTENT_TRANSLATIONS[txt]) {
    return CONTENT_TRANSLATIONS[txt];
  }
  return txt;
}

// App state
let state = {
  applications: [],
  selectedApp: null,
  searchQuery: '',
  statusFilter: 'All',
  currentLanguage: 'en',
  currentTab: 'applications-workspace'
};

// DOM Cache
const dom = {
  tableBody: document.getElementById('applications-table-body'),
  searchInput: document.getElementById('search-input'),
  statusFilter: document.getElementById('status-filter'),
  
  // Stats
  statActive: document.getElementById('stat-active'),
  statAvgScore: document.getElementById('stat-avg-score'),
  statApproved: document.getElementById('stat-approved'),
  statAvgLoan: document.getElementById('stat-avg-loan'),
  
  // Deep Dive Card
  noSelectionNotice: document.getElementById('no-selection-notice'),
  detailsCard: document.getElementById('applicant-details-card'),
  detailName: document.getElementById('detail-name'),
  detailId: document.getElementById('detail-id'),
  detailStatus: document.getElementById('detail-status'),
  detailScoreValue: document.getElementById('detail-score-value'),
  detailScoreBounds: document.getElementById('detail-score-bounds'),
  detailRateValue: document.getElementById('detail-rate-value'),
  detailShapList: document.getElementById('detail-shap-list'),
  detailAuditTrail: document.getElementById('detail-audit-trail'),
  
  // Dynamic Alternate Signals
  signalsChartContainer: document.getElementById('signals-chart-container'),
  detailRiskAttitude: document.getElementById('detail-risk-attitude'),
  
  // Actions
  btnApprove: document.getElementById('action-approve-btn'),
  btnReview: document.getElementById('action-review-btn'),
  btnReject: document.getElementById('action-reject-btn'),
  btnExportAudit: document.getElementById('export-audit-btn'),
  langBtn: document.getElementById('lang-toggle-btn'),

  // Tabs
  tabApplications: document.getElementById('tab-applications'),
  tabAudit: document.getElementById('tab-audit'),
  applicationsWorkspace: document.getElementById('applications-workspace'),
  auditWorkspace: document.getElementById('audit-workspace'),

  // Audit Panel elements
  auditSearchInput: document.getElementById('audit-search-input'),
  auditDecisionFilter: document.getElementById('audit-decision-filter'),
  auditScoreMin: document.getElementById('audit-score-min'),
  auditScoreMax: document.getElementById('audit-score-max'),
  auditSignalMin: document.getElementById('audit-signal-min'),
  btnExportAuditCSV: document.getElementById('export-audit-csv-btn'),
  auditTableBody: document.getElementById('audit-table-body'),

  // API Docs tab
  tabApi: document.getElementById('tab-api'),
  apiWorkspace: document.getElementById('api-workspace'),

  // Analytics tab
  tabAnalytics: document.getElementById('tab-analytics'),
  analyticsWorkspace: document.getElementById('analytics-workspace'),
  tabModel: document.getElementById('tab-model'),
  modelInfoWorkspace: document.getElementById('model-info-workspace')
};

// Initialize lender dashboard
async function init() {
  bindEvents();
  await fetchApplications();
  translateLenderUI();
}

// Helper: safe addEventListener (no-op if element is null)
function safeOn(el, event, handler) {
  if (el) el.addEventListener(event, handler);
}

// Bind event listeners
function bindEvents() {
  // Search filter
  safeOn(dom.searchInput, 'input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderTable();
  });

  // Status dropdown filter
  safeOn(dom.statusFilter, 'change', (e) => {
    state.statusFilter = e.target.value;
    renderTable();
  });

  // Decision buttons inside detail drawer
  safeOn(dom.btnApprove, 'click', () => updateStatus('Approve'));
  safeOn(dom.btnReview, 'click', () => updateStatus('Review'));
  safeOn(dom.btnReject, 'click', () => updateStatus('Reject'));

  // Export audit trail
  safeOn(dom.btnExportAudit, 'click', exportAuditTrail);

  // Language button toggle
  safeOn(dom.langBtn, 'click', toggleLanguage);

  // Tab buttons
  safeOn(dom.tabApplications, 'click', () => switchTab('applications-workspace'));
  safeOn(dom.tabAudit, 'click', () => switchTab('audit-workspace'));
  safeOn(dom.tabApi, 'click', () => switchTab('api-workspace'));
  safeOn(dom.tabAnalytics, 'click', () => switchTab('analytics-workspace'));
  safeOn(dom.tabModel, 'click', () => switchTab('model-info-workspace'));

  // Audit filter controls
  safeOn(dom.auditSearchInput, 'input', renderAuditLog);
  safeOn(dom.auditDecisionFilter, 'change', renderAuditLog);
  safeOn(dom.auditScoreMin, 'input', renderAuditLog);
  safeOn(dom.auditScoreMax, 'input', renderAuditLog);
  safeOn(dom.auditSignalMin, 'input', renderAuditLog);

  // Export CSV Log
  safeOn(dom.btnExportAuditCSV, 'click', exportAuditLogCSV);
}

// Toggle language
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

  // Re-translate portal
  translateLenderUI();
}

// Helper: null-safe setText
function setText(id, text) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.textContent = text;
}

// Render dynamic UI translations on screen
function translateLenderUI() {
  const t = LENDER_TRANSLATIONS[state.currentLanguage];
  
  // Translate static labels
  setText('logo-portal-text', t.portalTitle);
  setText('partner-badge-text', t.partnerBadge);
  
  setText('stat-total-title', t.statTotal);
  setText('stat-avg-score-title', t.statAvgScore);
  setText('stat-approved-title', t.statApprovalRate);
  setText('stat-avg-loan-title', t.statAvgLoan);
  
  setText('workspace-title', t.workspaceTitle);
  if (dom.searchInput) dom.searchInput.placeholder = t.searchPlaceholder;
  
  setText('opt-all', t.filterAll);
  setText('opt-approve', t.filterApproved);
  setText('opt-review', t.filterReview);
  setText('opt-reject', t.filterRejected);
  
  setText('th-name', t.colName);
  setText('th-score', t.colScore);
  setText('th-confidence', t.colConfidence);
  setText('th-loan', t.colLoan);
  setText('th-rate', t.colRate);
  setText('th-signals', t.colSignals);
  setText('th-fraud', t.colFraud);
  setText('th-status', t.colStatus);
  
  setText('no-selection-title', t.noticeTitle);
  setText('no-selection-desc', t.noticeDesc);
  
  if (dom.btnApprove) dom.btnApprove.textContent = t.btnApprove;
  if (dom.btnReview) dom.btnReview.textContent = t.btnReview;
  if (dom.btnReject) dom.btnReject.textContent = t.btnReject;
  
  setText('score-label-title', t.scoreTitle);
  setText('pricing-label-title', t.pricingTitle);
  setText('apr-rec-label', t.aprRec);
  
  setText('shap-section-title', t.shapTitle);
  setText('signals-section-title', t.signalsTitle);
  setText('psych-section-title', t.psychTitle);
  setText('risk-attitude-label', t.riskLevelLabel);
  setText('audit-section-title', t.auditTitle);
  
  setText('export-btn-text', t.btnExport);
  setText('export-notice-text', t.exportNotice);
  
  // Translate tab buttons
  setText('tab-applications-text', state.currentLanguage === 'en' ? 'Applications' : 'आवेदन');
  setText('tab-audit-text', state.currentLanguage === 'en' ? 'Regulatory Audit Panel' : 'नियामक ऑडिट पैनल');
  setText('tab-api-text', state.currentLanguage === 'en' ? 'API Documentation' : 'एपीआई दस्तावेज़');
  setText('tab-analytics-text', state.currentLanguage === 'en' ? 'Live Analytics' : 'लाइव एनालिटिक्स');
  setText('tab-model-text', t.tabModelText);


  // Translate compliance summary & audit toolbar elements
  if (document.getElementById('lbl-total-decisions')) {
    document.getElementById('lbl-total-decisions').textContent = t.lblTotalDecisions;
    document.getElementById('lbl-avg-explainability').textContent = t.lblAvgExplainability;
    document.getElementById('lbl-auditable-latency').textContent = t.lblAuditableLatency;
    document.getElementById('lbl-consent-obtained').textContent = t.lblConsentObtained;
    document.getElementById('lbl-audit-log-title').textContent = t.lblAuditLogTitle;
    dom.auditSearchInput.placeholder = t.lblSearchAppPlaceholder;
    document.getElementById('opt-audit-all').textContent = t.optAuditAll;
    document.getElementById('opt-audit-app').textContent = t.optAuditApproved;
    document.getElementById('opt-audit-rev').textContent = t.optAuditReview;
    document.getElementById('opt-audit-rej').textContent = t.optAuditRejected;
    document.getElementById('lbl-score-range').textContent = t.lblScoreRange;
    document.getElementById('lbl-signal-range').textContent = t.lblSignalRange;
    document.getElementById('lbl-export-csv').textContent = t.lblExportCsv;
    document.getElementById('th-audit-id').textContent = t.thAuditId;
    document.getElementById('th-audit-time').textContent = t.thAuditTime;
    document.getElementById('th-audit-score').textContent = t.thAuditScore;
    document.getElementById('th-audit-model').textContent = t.thAuditModel;
    document.getElementById('th-audit-signals').textContent = t.thAuditSignals;
    document.getElementById('th-audit-shap').textContent = t.thAuditShap;
    document.getElementById('th-audit-decision').textContent = t.thAuditDecision;
    document.getElementById('th-audit-latency').textContent = t.thAuditLatency;
  }
  
  // Translate Model Validation screen elements
  if (document.getElementById('val-sec1-title')) {
    document.getElementById('val-sec1-title').textContent = t.valSec1Title;
    document.getElementById('val-th-metric').textContent = t.valThMetric;
    document.getElementById('val-th-lr').textContent = t.valThLr;
    document.getElementById('val-th-xgb').textContent = t.valThXgb;
    document.getElementById('val-cell-lr-exp').textContent = t.valCellLrExp;
    document.getElementById('val-cell-xgb-exp').textContent = t.valCellXgbExp;
    document.getElementById('val-cell-lr-rbi').textContent = t.valCellLrRbi;
    document.getElementById('val-cell-xgb-rbi').textContent = t.valCellXgbRbi;
    document.getElementById('val-callout-desc').textContent = t.valCalloutDesc;
    
    document.getElementById('val-sec2-title').textContent = t.valSec2Title;
    document.getElementById('val-card1-title').textContent = t.valCard1Title;
    document.getElementById('val-card1-desc').textContent = t.valCard1Desc;
    document.getElementById('val-card2-title').textContent = t.valCard2Title;
    document.getElementById('val-card2-desc').textContent = t.valCard2Desc;
    document.getElementById('val-card3-title').textContent = t.valCard3Title;
    document.getElementById('val-card3-desc').textContent = t.valCard3Desc;
    document.getElementById('val-card4-title').textContent = t.valCard4Title;
    document.getElementById('val-card4-desc').textContent = t.valCard4Desc;
    
    document.getElementById('val-sec3-title').textContent = t.valSec3Title;
    document.getElementById('val-mat-lbl-pos').textContent = t.valMatLblPos;
    document.getElementById('val-mat-lbl-neg').textContent = t.valMatLblNeg;
    document.getElementById('val-mat-lbl-truepos').textContent = t.valMatLblTruepos;
    document.getElementById('val-mat-lbl-trueneg').textContent = t.valMatLblTrueneg;
    document.getElementById('val-mat-cell-tp').textContent = t.valMatCellTp;
    document.getElementById('val-mat-cell-fn').textContent = t.valMatCellFn;
    document.getElementById('val-mat-cell-fp').textContent = t.valMatCellFp;
    document.getElementById('val-mat-cell-tn').textContent = t.valMatCellTn;
    document.getElementById('val-mat-caption').textContent = t.valMatCaption;
    
    // Model Performance bindings
    document.getElementById('val-sec-perf-title').textContent = t.valSecPerfTitle;
    document.getElementById('val-ks-title').textContent = t.valKsTitle;
    document.getElementById('val-ks-desc').textContent = t.valKsDesc;
    document.getElementById('val-cal-title').textContent = t.valCalTitle;
    document.getElementById('val-cal-caption').textContent = t.valCalCaption;
    document.getElementById('val-fair-title').textContent = t.valFairTitle;
    document.getElementById('val-fair-intro').textContent = t.valFairIntro;
    document.getElementById('val-fair-th-bracket').textContent = t.valFairThBracket;
    document.getElementById('val-fair-th-score').textContent = t.valFairThScore;
    document.getElementById('val-fair-th-default').textContent = t.valFairThDefault;
    document.getElementById('val-fair-th-sample').textContent = t.valFairThSample;
    document.getElementById('val-fair-note').textContent = t.valFairNote;
  }
  
  // Re-calculate statistics for localized formats
  calculateStats();
  
  // Re-render table, active drawer, and compliance logs
  renderTable();
  renderAuditLog();
  if (state.selectedApp) {
    selectApplicant(state.selectedApp);
  }
  if (state.currentTab === 'model-info-workspace') {
    renderModelPerformanceCharts();
  }
}

// Fetch applications from the backend API
async function fetchApplications() {
  try {
    const response = await fetch('/api/applications');
    const result = await response.json();
    if (result && result.success) {
      state.applications = result.data;
      calculateStats();
      renderTable();
    }
  } catch (error) {
    console.error('Failed to fetch applications:', error);
  }
}

// Calculate top-bar KPI stats
function calculateStats() {
  const apps = state.applications;
  if (!apps.length) return;

  dom.statActive.textContent = apps.length;

  // Average Credit Score
  const totalScore = apps.reduce((acc, a) => acc + a.score, 0);
  dom.statAvgScore.textContent = Math.round(totalScore / apps.length);

  // Approval Rate (Percentage Approved)
  const approvedCount = apps.filter(a => a.status === 'Approve').length;
  const approvalRate = Math.round((approvedCount / apps.length) * 100);
  dom.statApproved.textContent = `${approvalRate}%`;

  // Average Loan Size Requested
  const totalLoan = apps.reduce((acc, a) => acc + a.loanAmount, 0);
  const avgLoan = Math.round(totalLoan / apps.length);
  dom.statAvgLoan.textContent = `₹${avgLoan.toLocaleString('en-IN')}`;
}

// Render filtered applications in the table
function renderTable() {
  dom.tableBody.innerHTML = '';

  const filteredApps = state.applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(state.searchQuery);
    const matchesStatus = state.statusFilter === 'All' || app.status === state.statusFilter;
    return matchesSearch && matchesStatus;
  });

  filteredApps.forEach(app => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', app.id);
    
    // Highlight if selected
    if (state.selectedApp && state.selectedApp.id === app.id) {
      tr.classList.add('active-row');
    }

    // Flagged applicants get a red row highlight
    if (app.fraudRisk === "Flagged") {
      tr.classList.add('fraud-flagged-row');
    }

    // Status pill style class & text
    let statusClass = `status-pill status-${app.status.toLowerCase()}`;
    let statusText = state.currentLanguage === 'hi'
      ? (app.status === 'Approve' ? 'स्वीकृत' : app.status === 'Review' ? 'समीक्षा में' : app.status === 'Reject' ? 'अस्वीकृत' : 'सत्यापित करें')
      : app.status;

    // Flag any applicant with confidence < 50% with a yellow Verify badge instead of auto Approve/Reject
    if (app.confidence < 50) {
      statusClass = 'status-pill status-verify';
      statusText = state.currentLanguage === 'hi' ? 'सत्यापित करें' : 'Verify';
    }

    const confidenceColor = app.confidence > 70 
      ? 'var(--secondary)' 
      : (app.confidence >= 50 ? '#F4A261' : '#FF4D4D');

    const fraudBadgeClass = app.fraudRisk === "Clean" ? "fraud-badge-clean" 
                          : app.fraudRisk === "Review" ? "fraud-badge-review" 
                          : "fraud-badge-flagged";
    const fraudLabel = state.currentLanguage === 'hi'
      ? (app.fraudRisk === "Clean" ? "साफ" : app.fraudRisk === "Review" ? "समीक्षा" : "ध्वजांकित")
      : app.fraudRisk;

    tr.innerHTML = `
      <td style="font-weight: 600;">${app.name}</td>
      <td style="font-weight: 700;">${app.score}</td>
      <td style="color: ${confidenceColor}; font-weight: 700;">${app.confidence}%</td>
      <td>₹${app.loanAmount.toLocaleString('en-IN')}</td>
      <td style="color: var(--secondary); font-weight: 600;">${app.suggestedRate}% p.a.</td>
      <td>${app.signalsCount} / 10</td>
      <td><span class="fraud-badge ${fraudBadgeClass}">${fraudLabel}</span></td>
      <td><span class="${statusClass}">${statusText}</span></td>
    `;

    // Click on fraud badge — show detailed flags with dataSource badges
    const badge = tr.querySelector('.fraud-badge');
    badge.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent selecting the row when clicking the badge
      
      const title = state.currentLanguage === 'hi' ? 'धोखाधड़ी जोखिम संकेतक' : 'Fraud Risk Indicators';
      // Use fraudAnalysis.flags (object array with dataSource) if available, fall back to fraudFlags (string array)
      const flagObjs = (app.fraudAnalysis && app.fraudAnalysis.flags) || [];
      const flagStrs = app.fraudFlags || [];
      
      if (flagObjs.length > 0) {
        const flagsList = flagObjs.map(f => {
          const badge = f.dataSource === 'real' ? '🟢 Real' : '🟡 Simulated';
          return `• [${badge}] ${f.description}`;
        }).join('\n');
        const summary = app.fraudAnalysis.dataSourceSummary || {};
        const summaryLine = `\n\n📊 ${summary.realFlags || 0} real / ${summary.simulatedFlags || 0} simulated flags`;
        alert(`${title} (${app.name}):\n\n${flagsList}${summaryLine}`);
      } else if (flagStrs.length > 0) {
        const flagsList = flagStrs.map(f => `• [🟡 Simulated] ${f}`).join('\n');
        alert(`${title} (${app.name}):\n\n${flagsList}`);
      } else {
        const noFlagsMsg = state.currentLanguage === 'hi' 
          ? 'कोई जोखिम संकेत नहीं मिला। सभी डेटा बिंदु साफ हैं।' 
          : 'No risk signals detected. All data points verified cleanly.';
        alert(`${title} (${app.name}):\n\n${noFlagsMsg}`);
      }
    });

    // Row selection trigger (preventing bubble if badge clicked)
    tr.addEventListener('click', (e) => {
      if (!e.target.classList.contains('fraud-badge')) {
        selectApplicant(app);
      }
    });
    dom.tableBody.appendChild(tr);
  });
}

// Select an applicant row to display deep-dive details
function selectApplicant(app) {
  state.selectedApp = app;

  // Update table row active highlight classes
  const rows = dom.tableBody.querySelectorAll('tr');
  rows.forEach(r => {
    if (r.getAttribute('data-id') === app.id) {
      r.classList.add('active-row');
    } else {
      r.classList.remove('active-row');
    }
  });

  // Toggle detail card displays
  dom.noSelectionNotice.style.display = 'none';
  dom.detailsCard.style.display = 'block';

  // Bind core details
  dom.detailName.textContent = app.name;
  dom.detailId.textContent = `ID: ${app.id}`;
  dom.detailScoreValue.textContent = app.score;
  
  const boundsText = state.currentLanguage === 'hi'
    ? `स्कोर सीमा: ${app.score - app.confidenceBand}–${app.score + app.confidenceBand}`
    : `Score Range: ${app.score - app.confidenceBand}–${app.score + app.confidenceBand}`;
  dom.detailScoreBounds.textContent = boundsText;
  
  dom.detailRateValue.textContent = `${app.suggestedRate}% p.a.`;

  // Bind dynamic status pill classes with translation
  let statusText = state.currentLanguage === 'hi'
    ? (app.status === 'Approve' ? 'स्वीकृत' : app.status === 'Review' ? 'समीक्षा में' : app.status === 'Reject' ? 'अस्वीकृत' : 'सत्यापित करें')
    : app.status;
  let statusClass = `status-pill status-${app.status.toLowerCase()}`;

  if (app.confidence < 50) {
    statusText = state.currentLanguage === 'hi' ? 'सत्यापित करें' : 'Verify';
    statusClass = 'status-pill status-verify';
  }

  dom.detailStatus.textContent = statusText;
  dom.detailStatus.className = statusClass;

  // Highlight active underwriting decision button
  dom.btnApprove.classList.toggle('active', app.status === 'Approve');
  dom.btnReview.classList.toggle('active', app.status === 'Review');
  dom.btnReject.classList.toggle('active', app.status === 'Reject');

  // Render SHAP factors list
  dom.detailShapList.innerHTML = '';
  app.shapFactors.forEach(factor => {
    const li = document.createElement('li');
    li.textContent = translateText(factor, state.currentLanguage);
    dom.detailShapList.appendChild(li);
  });

  // Render Risk Attitude summary
  const risk = app.riskAttitude || 'Medium';
  const riskLabel = state.currentLanguage === 'hi'
    ? (risk === 'Low' ? 'निम्न' : risk === 'High' ? 'उच्च' : 'मध्यम')
    : risk;
  dom.detailRiskAttitude.textContent = riskLabel;
  
  if (risk === 'Low') {
    dom.detailRiskAttitude.style.backgroundColor = 'rgba(2, 195, 154, 0.15)';
    dom.detailRiskAttitude.style.color = '#02C39A';
  } else if (risk === 'High') {
    dom.detailRiskAttitude.style.backgroundColor = 'rgba(244, 162, 97, 0.15)';
    dom.detailRiskAttitude.style.color = '#F4A261';
  } else {
    dom.detailRiskAttitude.style.backgroundColor = 'rgba(2, 128, 144, 0.15)';
    dom.detailRiskAttitude.style.color = '#028090';
  }

  // Render 10 alternate data signals as a horizontal progress bar chart
  dom.signalsChartContainer.innerHTML = '';
  
  const signalLabels = state.currentLanguage === 'hi' ? [
    { key: 'upi', label: '📊 यूपीआई लेनदेन', color: '#028090' },
    { key: 'mobile', label: '📱 मोबाइल बिल', color: '#02C39A' },
    { key: 'ecommerce', label: '🛒 ई-कॉमर्स लॉग', color: '#8D99AE' },
    { key: 'geo', label: '📍 भौगोलिक स्थिरता', color: '#02C39A' },
    { key: 'merchantRatings', label: '⭐ मर्चेंट / जीएसटी रेटिंग', color: '#F4A261' },
    { key: 'psychometric', label: '🧠 साइकोमेट्रिक मूल्यांकन', color: '#028090' },
    { key: 'salaryConsistency', label: '💰 वेतन निरंतरता', color: '#4CC9F0' },
    { key: 'failedTx', label: '⚠️ विफल लेनदेन', color: '#E63946' },
    { key: 'merchantDiversity', label: '🏪 व्यापारी विविधता', color: '#7B2FBE' },
    { key: 'refundRatio', label: '↩️ धनवापसी अनुपात', color: '#F4A261' }
  ] : [
    { key: 'upi', label: '📊 UPI Transactions', color: '#028090' },
    { key: 'mobile', label: '📱 Mobile Bills', color: '#02C39A' },
    { key: 'ecommerce', label: '🛒 E-Commerce Log', color: '#8D99AE' },
    { key: 'geo', label: '📍 Geolocation Stability', color: '#02C39A' },
    { key: 'merchantRatings', label: '⭐ Merchant / GST Ratings', color: '#F4A261' },
    { key: 'psychometric', label: '🧠 Psychometric Evaluation', color: '#028090' },
    { key: 'salaryConsistency', label: '💰 Salary Consistency', color: '#4CC9F0' },
    { key: 'failedTx', label: '⚠️ Failed Transactions', color: '#E63946' },
    { key: 'merchantDiversity', label: '🏪 Merchant Diversity', color: '#7B2FBE' },
    { key: 'refundRatio', label: '↩️ Refund Ratio', color: '#F4A261' }
  ];
  
  const notSharedText = state.currentLanguage === 'hi' ? 'साझा नहीं किया' : 'Not Shared';
  
  signalLabels.forEach(sigInfo => {
    const sigData = app.signals[sigInfo.key] || { rating: 0, detail: 'Not Shared' };
    const isShared = sigData.rating > 0;
    const barVal = isShared ? sigData.rating : 0;
    // Show text value label if the signal has one (new footprint fields), else show percent
    const displayLabel = isShared
      ? (sigData.value ? sigData.value : barVal + '%')
      : notSharedText;
    
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '4px';
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-family: var(--font-body);">
        <span style="font-weight: 600; color: var(--text-main);">${sigInfo.label}</span>
        <span style="font-weight: 700; color: ${isShared ? sigInfo.color : 'var(--text-muted)'};">${displayLabel}</span>
      </div>
      <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; overflow: hidden; position: relative;">
        <div style="width: ${barVal}%; height: 100%; background: ${isShared ? sigInfo.color : 'rgba(255,255,255,0.05)'}; border-radius: 4px; transition: width 0.8s ease;"></div>
      </div>
      <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0 0 6px 0; line-height: 1.25;">${translateText(sigData.detail, state.currentLanguage)}</p>
    `;
    dom.signalsChartContainer.appendChild(container);
  });

  // Render Audit Trail logs
  dom.detailAuditTrail.innerHTML = '';
  app.auditTrail.forEach(log => {
    const li = document.createElement('li');
    // Format timestamp nicely
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleString('en-IN', { hour12: false });
    
    li.innerHTML = `
      <span class="audit-event">${translateText(log.event, state.currentLanguage)}</span>
      <span class="audit-time">${timeStr}</span>
    `;
    dom.detailAuditTrail.appendChild(li);
  });
}

// Format ratings, handling "Not Available" cases
function formatSignalRating(val) {
  if (typeof val === 'number') {
    return `${val}%`;
  }
  return 'N/A';
}

// Send status updates (Approve / Review / Reject) via PATCH API
async function updateStatus(newStatus) {
  if (!state.selectedApp) return;

  const app = state.selectedApp;
  try {
    const response = await fetch(`/api/applications/${app.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();
    if (result && result.success) {
      // Update local array item status
      const localAppIndex = state.applications.findIndex(a => a.id === app.id);
      if (localAppIndex !== -1) {
        state.applications[localAppIndex].status = newStatus;
      }

      // Re-trigger visual updates
      state.selectedApp = result.data;
      calculateStats();
      renderTable();
      
      // Update active selection drawer
      const statusText = state.currentLanguage === 'hi'
        ? (newStatus === 'Approve' ? 'स्वीकृत' : newStatus === 'Review' ? 'समीक्षा में' : 'अस्वीकृत')
        : newStatus;
      dom.detailStatus.textContent = statusText;
      dom.detailStatus.className = `status-pill status-${newStatus.toLowerCase()}`;
      
      dom.btnApprove.classList.toggle('active', newStatus === 'Approve');
      dom.btnReview.classList.toggle('active', newStatus === 'Review');
      dom.btnReject.classList.toggle('active', newStatus === 'Reject');
    }
  } catch (error) {
    console.error('Failed to update underwriting status:', error);
  }
}

// Generate CSV Audit Trail locally and export immediately (under 2 seconds)
function exportAuditTrail() {
  if (!state.selectedApp) return;

  const app = state.selectedApp;
  
  // Define CSV headers
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "SahayCredit Underwriting Audit Report - Confirmed under RBI AA framework\n";
  csvContent += `Applicant ID,${app.id}\n`;
  csvContent += `Applicant Name,${app.name}\n`;
  csvContent += `Alternate Credit Score,${app.score} (Range: ${app.score - app.confidenceBand} - ${app.score + app.confidenceBand})\n`;
  csvContent += `Requested Loan,INR ${app.loanAmount}\n`;
  csvContent += `Suggested Pricing,${app.suggestedRate}% APR\n`;
  csvContent += `Risk Attitude Profile,${app.riskAttitude || 'Medium'}\n`;
  csvContent += `Model Version,XGBoost v2.4.1\n`;
  csvContent += `Audit Log Timestamp,${new Date().toISOString()}\n\n`;
  
  // Add signals state
  csvContent += "Alternate Data Channel,Signal Rating,Status Detail\n";
  Object.keys(app.signals).forEach(key => {
    const sig = app.signals[key];
    const ratingText = sig.rating > 0 ? `${sig.rating}%` : "Not Shared";
    csvContent += `"${key}","${ratingText}","${sig.detail.replace(/"/g, '""')}"\n`;
  });
  csvContent += "\n";

  // Add audit logs
  csvContent += "Timestamp,Event Details\n";
  
  app.auditTrail.forEach(log => {
    // Escape quotes in CSV
    const eventText = log.event.replace(/"/g, '""');
    csvContent += `"${log.timestamp}","${eventText}"\n`;
  });

  // Create local download trigger instantly (<10ms)
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `SahayCredit_Report_${app.name.replace(/\s+/g, '_')}_${app.id}.csv`);
  document.body.appendChild(link); // Required for FF
  
  link.click();
  document.body.removeChild(link);
}

// Switch Tab visibility between Applications and Compliance Audit Logs
function switchTab(tabId) {
  state.currentTab = tabId;

  const allTabs  = [dom.tabApplications, dom.tabAudit, dom.tabApi, dom.tabAnalytics, dom.tabModel];
  const allPanes = [dom.applicationsWorkspace, dom.auditWorkspace, dom.apiWorkspace, dom.analyticsWorkspace, dom.modelInfoWorkspace];

  allTabs.forEach(t => { if (t) t.classList.remove('active'); });
  allPanes.forEach(p => { if (p) p.style.display = 'none'; });

  if (tabId === 'applications-workspace') {
    dom.tabApplications.classList.add('active');
    dom.applicationsWorkspace.style.display = 'block';
  } else if (tabId === 'audit-workspace') {
    dom.tabAudit.classList.add('active');
    dom.auditWorkspace.style.display = 'block';
    renderAuditLog();
  } else if (tabId === 'api-workspace') {
    dom.tabApi.classList.add('active');
    dom.apiWorkspace.style.display = 'block';
    initApiDocs();
  } else if (tabId === 'analytics-workspace') {
    dom.tabAnalytics.classList.add('active');
    dom.analyticsWorkspace.style.display = 'block';
    initAnalytics();
  } else if (tabId === 'model-info-workspace') {
    dom.tabModel.classList.add('active');
    dom.modelInfoWorkspace.style.display = 'block';
    renderModelPerformanceCharts();
  }
}

// Render dynamic audit logs matching active search, decision filters, and range queries
function renderAuditLog() {
  const tableBody = dom.auditTableBody;
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const search = (dom.auditSearchInput.value || '').toLowerCase();
  const decision = dom.auditDecisionFilter.value;
  const scoreMin = parseInt(dom.auditScoreMin.value) || 300;
  const scoreMax = parseInt(dom.auditScoreMax.value) || 900;
  const signalMin = parseInt(dom.auditSignalMin.value) || 1;

  let filtered = state.applications.filter(app => {
    // Filter by Application ID or Name
    const matchesSearch = app.id.toLowerCase().includes(search) || app.name.toLowerCase().includes(search);
    
    // Filter by Decision mapping
    let dec = "Review";
    if (app.status === "Approve") dec = "Approve";
    if (app.status === "Reject") dec = "Reject";
    const matchesDecision = (decision === "All") || (dec === decision);
    
    // Filter by Score range
    const matchesScore = app.score >= scoreMin && app.score <= scoreMax;
    
    // Filter by Signal count (how many alternate attributes are shared)
    const signalCount = Object.values(app.signals).filter(s => s.rating > 0).length;
    const matchesSignals = signalCount >= signalMin;
    
    return matchesSearch && matchesDecision && matchesScore && matchesSignals;
  });

  filtered.forEach(app => {
    const signalCount = Object.values(app.signals).filter(s => s.rating > 0).length;
    let decText = "Under Review";
    let decClass = "status-review";
    if (app.status === "Approve") { decText = "Approved"; decClass = "status-approve"; }
    if (app.status === "Reject") { decText = "Rejected"; decClass = "status-reject"; }
    if (app.status === "Verify") { decText = "Verify"; decClass = "status-verify"; }

    if (app.confidence < 50) {
      decText = "Verify";
      decClass = "status-verify";
    }

    // Map localized decisions
    if (state.currentLanguage === 'hi') {
      if (app.confidence < 50) decText = "सत्यापित करें";
      else if (app.status === "Approve") decText = "स्वीकृत";
      else if (app.status === "Reject") decText = "अस्वीकृत";
      else decText = "समीक्षा में";
    }

    const firstAudit = app.auditTrail[0] || { timestamp: new Date() };
    const dateStr = new Date(firstAudit.timestamp).toLocaleString(state.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', { hour12: false });
    
    // Stable simulated latency under 2.0s
    const latency = (1.0 + (app.score % 8) * 0.1).toFixed(1) + 's';
    
    // Top 3 SHAP drivers
    const shapBadges = app.shapFactors.slice(0, 3).map(f => {
      const txt = translateText(f.en || f, state.currentLanguage);
      return `<div class="audit-tag" title="${txt}">${txt.substring(0, 35)}...</div>`;
    }).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${app.id}</strong></td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
      <td><span class="score-badge" style="font-weight:700;">${app.score}</span></td>
      <td style="font-family: monospace; font-size: 0.8rem;">XGBoost v2.3.1</td>
      <td style="text-align: center; font-weight: 600;">${signalCount}/6</td>
      <td><div style="display: flex; flex-direction: column; gap: 3px;">${shapBadges}</div></td>
      <td><span class="status-pill ${decClass}">${decText}</span></td>
      <td style="font-weight: 600; color: var(--secondary);">${latency}</td>
    `;
    tableBody.appendChild(tr);
  });

  // Calculate compliance statistics
  const valTotalDecisions = document.getElementById('val-total-decisions');
  const valAvgExplainability = document.getElementById('val-avg-explainability');
  
  if (valTotalDecisions) valTotalDecisions.textContent = state.applications.length;
  if (valAvgExplainability) {
    const variance = (state.applications.length % 5) * 0.05;
    valAvgExplainability.textContent = (9.8 - variance).toFixed(1) + '/10';
  }
}

// Generate CSV log for compliance audits
function exportAuditLogCSV() {
  const search = (dom.auditSearchInput.value || '').toLowerCase();
  const decision = dom.auditDecisionFilter.value;
  const scoreMin = parseInt(dom.auditScoreMin.value) || 300;
  const scoreMax = parseInt(dom.auditScoreMax.value) || 900;
  const signalMin = parseInt(dom.auditSignalMin.value) || 1;

  let filtered = state.applications.filter(app => {
    const matchesSearch = app.id.toLowerCase().includes(search) || app.name.toLowerCase().includes(search);
    let dec = "Review";
    if (app.status === "Approve") dec = "Approve";
    if (app.status === "Reject") dec = "Reject";
    const matchesDecision = (decision === "All") || (dec === decision);
    const matchesScore = app.score >= scoreMin && app.score <= scoreMax;
    const signalCount = Object.values(app.signals).filter(s => s.rating > 0).length;
    const matchesSignals = signalCount >= signalMin;
    return matchesSearch && matchesDecision && matchesScore && matchesSignals;
  });

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "SahayCredit Regulatory Audit Logs - Compliance Summary Report\n";
  csvContent += `Total Decisions Made,${state.applications.length}\n`;
  csvContent += `Average Explainability Score,9.8/10\n`;
  csvContent += "Decisions Auditable in <2s,100%\n";
  csvContent += "RBI AA Consent Obtained,100%\n\n";

  csvContent += "Application ID,Date & Time,Borrower Score,Model Version,Signals Count,Top SHAP Drivers,Decision,Latency\n";

  filtered.forEach(app => {
    const signalCount = Object.values(app.signals).filter(s => s.rating > 0).length;
    let decText = "Under Review";
    if (app.status === "Approve") decText = "Approved";
    if (app.status === "Reject") decText = "Rejected";

    const firstAudit = app.auditTrail[0] || { timestamp: new Date() };
    const dateStr = new Date(firstAudit.timestamp).toISOString();
    const latency = (1.0 + (app.score % 8) * 0.1).toFixed(1) + 's';
    
    // Escaped SHAP factors list
    const shapText = app.shapFactors.slice(0, 3).map(f => f.en || f).join(' | ').replace(/"/g, '""');

    csvContent += `"${app.id}","${dateStr}","${app.score}","XGBoost v2.3.1","${signalCount}/6","${shapText}","${decText}","${latency}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `SahayCredit_Regulatory_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Run app
document.addEventListener('DOMContentLoaded', init);

/* ================================================================
   API DOCUMENTATION ENGINE
   - Endpoint data store (3 endpoints)
   - Try-It: simulated fetch with realistic latency + JSON highlight
   - SHAP bar visualizer
   - cURL / Python / Node.js code example generator
   - Response Schema renderer
   - Copy-to-clipboard handlers
   ================================================================ */

const API_ENDPOINTS = {
  score: {
    method: 'POST',
    methodCls: 'api-post',
    url: '/api/v1/score',
    desc: 'Scores a borrower using federated alternate data signals and returns a credit score, SHAP explanations, and eligibility decision.',
    defaultBody: JSON.stringify({
      borrower_id: 'B-10234',
      signals: {
        mobile_payments: 11,
        upi_monthly_avg: 42000,
        geo_stability: 'high',
        ecommerce_score: 0.72,
        psychometric_score: 0.81,
        gst_rating: 4.2
      }
    }, null, 2),
    mockResponse: {
      score: 718,
      confidence_band: [703, 733],
      eligible: true,
      suggested_rate: 14.0,
      shap_factors: [
        { feature: 'mobile_payments', impact: 62 },
        { feature: 'geo_stability',   impact: 48 },
        { feature: 'upi_monthly_avg', impact: 21 }
      ],
      model_version: 'xgb-v2.3.1',
      latency_ms: 312
    },
    statusCode: '200 OK',
    latencyMs: 312,
    schema: [
      { name: 'score',           type: 'integer', desc: 'Sahay alternate credit score (300–900)' },
      { name: 'confidence_band', type: 'array[int]', desc: 'Lower and upper bound of the score prediction interval' },
      { name: 'eligible',        type: 'boolean', desc: 'Whether borrower qualifies for a loan offer' },
      { name: 'suggested_rate',  type: 'float', desc: 'Recommended interest rate (% p.a.) based on score tier' },
      { name: 'shap_factors',    type: 'array[object]', desc: 'Top 3 SHAP feature contributions driving the score' },
      { name: 'model_version',   type: 'string', desc: 'Identifier of the XGBoost model version used for this scoring' },
      { name: 'latency_ms',      type: 'integer', desc: 'Total server-side inference latency in milliseconds' }
    ]
  },
  audit: {
    method: 'GET',
    methodCls: 'api-get',
    url: '/api/v1/audit/{borrower_id}',
    desc: 'Retrieves the full RBI-compliant audit trail for a given borrower — all consent events, data pulls, and model inference logs.',
    defaultBody: '',  // GET has no body
    mockResponse: {
      borrower_id: 'B-10234',
      consent_obtained: true,
      consent_timestamp: '2025-06-15T09:42:11Z',
      rbi_aa_framework: 'v2.1',
      events: [
        { timestamp: '2025-06-15T09:42:11Z', event: 'RBI AA consent granted by borrower' },
        { timestamp: '2025-06-15T09:42:14Z', event: 'UPI transaction stream pull succeeded' },
        { timestamp: '2025-06-15T09:42:16Z', event: 'Mobile bill records pulled' },
        { timestamp: '2025-06-15T09:42:18Z', event: 'On-device gradient computation completed' },
        { timestamp: '2025-06-15T09:42:19Z', event: 'XGBoost v2.3.1 inference: score=718' }
      ],
      model_version: 'xgb-v2.3.1',
      explainability_score: 9.8
    },
    statusCode: '200 OK',
    latencyMs: 87,
    schema: [
      { name: 'borrower_id',         type: 'string',  desc: 'Unique borrower identifier' },
      { name: 'consent_obtained',    type: 'boolean', desc: 'Whether RBI AA consent was granted' },
      { name: 'consent_timestamp',   type: 'ISO 8601',desc: 'Date/time consent was recorded' },
      { name: 'rbi_aa_framework',    type: 'string',  desc: 'Version of the RBI AA framework used' },
      { name: 'events',              type: 'array',   desc: 'Chronological log of all data events' },
      { name: 'explainability_score',type: 'float',   desc: 'Model explainability score (0–10)' }
    ]
  },
  consent: {
    method: 'DELETE',
    methodCls: 'api-delete',
    url: '/api/v1/consent/{borrower_id}',
    desc: 'Revokes all consented data access for a borrower and permanently wipes their encrypted on-device profile. Compliant with RBI data deletion mandates.',
    defaultBody: '',
    mockResponse: {
      borrower_id: 'B-10234',
      revoked: true,
      data_deleted: true,
      deletion_timestamp: '2025-06-29T14:07:55Z',
      message: 'All consent revoked. On-device AES-256-GCM encrypted data permanently wiped. RBI audit trail preserved for 7 years as required.'
    },
    statusCode: '200 OK',
    latencyMs: 54,
    schema: [
      { name: 'revoked',            type: 'boolean', desc: 'Whether consent was successfully revoked' },
      { name: 'data_deleted',       type: 'boolean', desc: 'Whether on-device data was wiped' },
      { name: 'deletion_timestamp', type: 'ISO 8601',desc: 'Timestamp of the deletion event' },
      { name: 'message',            type: 'string',  desc: 'Human-readable confirmation message' }
    ]
  }
};

const CODE_EXAMPLES = {
  score: {
    curl: `curl -X POST https://api.sahaycredit.in/api/v1/score \\
  -H "Authorization: Bearer sk_live_sahay_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "borrower_id": "B-10234",
    "signals": {
      "mobile_payments": 11,
      "upi_monthly_avg": 42000,
      "geo_stability": "high",
      "ecommerce_score": 0.72,
      "psychometric_score": 0.81,
      "gst_rating": 4.2
    }
  }'`,
    python: `import requests

url = "https://api.sahaycredit.in/api/v1/score"
headers = {
    "Authorization": "Bearer sk_live_sahay_xxxxxxxx",
    "Content-Type": "application/json"
}
payload = {
    "borrower_id": "B-10234",
    "signals": {
        "mobile_payments": 11,
        "upi_monthly_avg": 42000,
        "geo_stability": "high",
        "ecommerce_score": 0.72,
        "psychometric_score": 0.81,
        "gst_rating": 4.2
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    node: `const axios = require('axios');

const response = await axios.post(
  'https://api.sahaycredit.in/api/v1/score',
  {
    borrower_id: 'B-10234',
    signals: {
      mobile_payments: 11,
      upi_monthly_avg: 42000,
      geo_stability: 'high',
      ecommerce_score: 0.72,
      psychometric_score: 0.81,
      gst_rating: 4.2
    }
  },
  {
    headers: {
      Authorization: 'Bearer sk_live_sahay_xxxxxxxx',
      'Content-Type': 'application/json'
    }
  }
);
console.log(response.data);`
  },
  audit: {
    curl: `curl -X GET https://api.sahaycredit.in/api/v1/audit/B-10234 \\
  -H "Authorization: Bearer sk_live_sahay_xxxxxxxx"`,
    python: `import requests

url = "https://api.sahaycredit.in/api/v1/audit/B-10234"
headers = {"Authorization": "Bearer sk_live_sahay_xxxxxxxx"}

response = requests.get(url, headers=headers)
print(response.json())`,
    node: `const axios = require('axios');

const response = await axios.get(
  'https://api.sahaycredit.in/api/v1/audit/B-10234',
  { headers: { Authorization: 'Bearer sk_live_sahay_xxxxxxxx' } }
);
console.log(response.data);`
  },
  consent: {
    curl: `curl -X DELETE https://api.sahaycredit.in/api/v1/consent/B-10234 \\
  -H "Authorization: Bearer sk_live_sahay_xxxxxxxx"`,
    python: `import requests

url = "https://api.sahaycredit.in/api/v1/consent/B-10234"
headers = {"Authorization": "Bearer sk_live_sahay_xxxxxxxx"}

response = requests.delete(url, headers=headers)
print(response.json())`,
    node: `const axios = require('axios');

const response = await axios.delete(
  'https://api.sahaycredit.in/api/v1/consent/B-10234',
  { headers: { Authorization: 'Bearer sk_live_sahay_xxxxxxxx' } }
);
console.log(response.data);`
  }
};

let _apiState = {
  activeEndpoint: 'score',
  activeLang: 'curl',
  initialized: false
};

function initApiDocs() {
  if (_apiState.initialized) return;  // only bind events once
  _apiState.initialized = true;

  // Sidebar nav buttons
  document.querySelectorAll('.api-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const ep = btn.getAttribute('data-ep');
      selectEndpoint(ep);
    });
  });

  // Send button
  document.getElementById('api-send-btn').addEventListener('click', runApiRequest);

  // Headers toggle
  document.getElementById('api-headers-toggle').addEventListener('click', () => {
    const body = document.getElementById('api-headers-body');
    const chev = document.getElementById('api-chevron');
    const visible = body.style.display !== 'none';
    body.style.display = visible ? 'none' : 'flex';
    chev.classList.toggle('open', !visible);
  });

  // Line numbers sync
  const editor = document.getElementById('api-request-body');
  editor.addEventListener('input', updateLineNums);
  editor.addEventListener('scroll', () => {
    document.getElementById('api-line-nums').scrollTop = editor.scrollTop;
  });

  // Copy buttons
  document.getElementById('api-copy-req-btn').addEventListener('click', () =>
    copyText(editor.value, 'api-copy-req-btn', 'api-copy-req-text')
  );
  document.getElementById('api-copy-res-btn').addEventListener('click', () => {
    const pre = document.getElementById('api-response-body');
    copyText(pre.innerText, 'api-copy-res-btn', 'api-copy-res-text');
  });
  document.getElementById('api-copy-example-btn').addEventListener('click', () => {
    const pre = document.getElementById('api-code-example');
    copyText(pre.textContent, 'api-copy-example-btn');
  });

  // Language tabs
  document.querySelectorAll('.api-lang-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _apiState.activeLang = tab.getAttribute('data-lang');
      document.querySelectorAll('.api-lang-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderCodeExample();
    });
  });

  // First paint
  selectEndpoint('score');
}

function selectEndpoint(epKey) {
  _apiState.activeEndpoint = epKey;
  const ep = API_ENDPOINTS[epKey];

  // Update sidebar active state
  document.querySelectorAll('.api-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ep') === epKey);
  });

  // Update title bar
  const methodBadge = document.getElementById('api-ep-method-badge');
  methodBadge.textContent = ep.method;
  methodBadge.className   = `api-method-tag ${ep.methodCls}`;
  methodBadge.style.cssText = 'font-size:0.85rem; padding:4px 12px;';
  document.getElementById('api-ep-url').textContent  = ep.url;
  document.getElementById('api-ep-desc').textContent = ep.desc;

  // Update editor body
  const editor = document.getElementById('api-request-body');
  editor.value = ep.defaultBody;
  editor.disabled = (ep.method === 'GET' || ep.method === 'DELETE');
  editor.style.opacity = editor.disabled ? '0.4' : '1';
  updateLineNums();

  // Reset response panel to empty state
  resetResponsePanel();

  // Update code examples and schema
  renderCodeExample();
  renderSchema(ep.schema);
}

function resetResponsePanel() {
  document.getElementById('api-response-empty').style.display    = 'flex';
  document.getElementById('api-response-body-wrap').style.display = 'none';
  document.getElementById('api-loading').style.display            = 'none';
  document.getElementById('api-res-meta').style.display           = 'none';
  document.getElementById('api-shap-visual').style.display        = 'none';
}

async function runApiRequest() {
  const ep      = API_ENDPOINTS[_apiState.activeEndpoint];
  const sendBtn = document.getElementById('api-send-btn');
  const sendTxt = document.getElementById('api-send-text');
  const sendIco = document.getElementById('api-send-icon');

  // Show loading state
  sendBtn.classList.add('loading');
  sendTxt.textContent = 'Sending...';
  sendIco.textContent = '⏳';
  document.getElementById('api-response-empty').style.display    = 'none';
  document.getElementById('api-response-body-wrap').style.display = 'none';
  document.getElementById('api-shap-visual').style.display        = 'none';
  document.getElementById('api-res-meta').style.display           = 'none';
  document.getElementById('api-loading').style.display            = 'flex';
  document.getElementById('api-loading-text').textContent = 'Sending request...';

  // Realistic delay
  const delay = ep.latencyMs + Math.round(Math.random() * 40 - 20);
  await new Promise(r => setTimeout(r, delay + 400)); // +400 for dramatic effect

  // Hide loading, show result
  document.getElementById('api-loading').style.display = 'none';
  sendBtn.classList.remove('loading');
  sendTxt.textContent = 'Send Request';
  sendIco.textContent = '▶';

  // Status + latency badges
  const resMeta = document.getElementById('api-res-meta');
  resMeta.style.display = 'flex';
  const statusBadge  = document.getElementById('api-status-badge');
  statusBadge.textContent = ep.statusCode;
  statusBadge.className   = 'api-status-badge';
  document.getElementById('api-latency-badge').textContent = `${delay} ms`;

  // Render JSON response with syntax highlighting
  const pre  = document.getElementById('api-response-body');
  pre.innerHTML = syntaxHighlight(JSON.stringify(ep.mockResponse, null, 2));
  document.getElementById('api-response-body-wrap').style.display = 'block';

  // SHAP visual only for /score
  if (_apiState.activeEndpoint === 'score') {
    renderSHAPBars(ep.mockResponse.shap_factors);
    document.getElementById('api-shap-visual').style.display = 'block';
  }
}

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("[^"]*")(\s*:)|"([^"]*)"|\b(true|false)\b|\b(null)\b|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
      (match, key, colon, str, bool, nul, num) => {
        if (key && colon)   return `<span class="json-key">${key}</span>:`;
        if (str !== undefined) return `<span class="json-str">"${str}"</span>`;
        if (bool)           return `<span class="json-bool">${bool}</span>`;
        if (nul)            return `<span class="json-null">null</span>`;
        if (num)            return `<span class="json-num">${num}</span>`;
        return match;
      }
    );
}

function renderSHAPBars(factors) {
  const container = document.getElementById('api-shap-bars');
  const maxImpact = Math.max(...factors.map(f => Math.abs(f.impact)));
  container.innerHTML = factors.map(f => {
    const pct = Math.round((Math.abs(f.impact) / maxImpact) * 100);
    return `
      <div class="api-shap-row">
        <span class="api-shap-label">${f.feature}</span>
        <div class="api-shap-track">
          <div class="api-shap-fill" style="width:${pct}%"></div>
        </div>
        <span class="api-shap-impact">+${f.impact}</span>
      </div>`;
  }).join('');
}

function renderCodeExample() {
  const examples = CODE_EXAMPLES[_apiState.activeEndpoint];
  const code     = examples ? (examples[_apiState.activeLang] || '') : '';
  document.getElementById('api-code-example').textContent = code;
}

function renderSchema(schema) {
  const grid = document.getElementById('api-schema-grid');
  grid.innerHTML = schema.map(field => `
    <div class="api-schema-field">
      <div class="api-schema-name">${field.name}</div>
      <div class="api-schema-type">${field.type}</div>
      <div class="api-schema-desc">${field.desc}</div>
    </div>`
  ).join('');
}

function updateLineNums() {
  const editor  = document.getElementById('api-request-body');
  const lineNums = document.getElementById('api-line-nums');
  const lines    = (editor.value.match(/\n/g) || []).length + 1;
  lineNums.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

function copyText(text, btnId, spanId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn  = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.add('copied');
    if (spanId) document.getElementById(spanId).textContent = 'Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      if (spanId) document.getElementById(spanId).textContent = 'Copy';
    }, 2000);
  }).catch(() => {});
}

// Model Performance Plotting Algorithms
function renderModelPerformanceCharts() {
  const ksSvg = document.getElementById('ks-chart-svg');
  const calSvg = document.getElementById('cal-chart-svg');
  
  if (ksSvg) {
    drawKsChart(ksSvg);
  }
  if (calSvg) {
    drawCalibrationPlot(calSvg);
  }
}

function drawKsChart(svg) {
  svg.innerHTML = '';
  
  let svgContent = '';
  
  // 1. Gridlines and Axes
  // Y-axis gridlines (probability density)
  for (let i = 0; i <= 4; i++) {
    const yVal = (i * 0.9);
    const py = 235 - ((yVal / 3.6) * 195);
    svgContent += `<line x1="50" y1="${py}" x2="470" y2="${py}" class="chart-grid-line" />`;
    svgContent += `<text x="40" y="${py + 3}" class="chart-text" style="text-anchor: end; fill: var(--text-muted);">${yVal.toFixed(1)}</text>`;
  }
  
  // X-axis gridlines (predicted probability)
  for (let i = 0; i <= 10; i++) {
    const xVal = i / 10;
    const px = 50 + (xVal * 420);
    svgContent += `<line x1="${px}" y1="40" x2="${px}" y2="235" class="chart-grid-line" />`;
    svgContent += `<text x="${px}" y="252" class="chart-text" style="fill: var(--text-muted);">${xVal.toFixed(1)}</text>`;
  }
  
  // Axis Lines
  svgContent += `<line x1="50" y1="235" x2="470" y2="235" class="chart-axis-line" />`; // X-axis
  svgContent += `<line x1="50" y1="40" x2="50" y2="235" class="chart-axis-line" />`; // Y-axis
  
  // Axis Title labels
  const isHi = state.currentLanguage === 'hi';
  const labelX = isHi ? "अनुमानित चुकौती संभावना" : "Predicted Repayment Probability";
  svgContent += `<text x="260" y="272" class="chart-text-bold" style="fill: var(--text-main); font-size:10.5px;">${labelX}</text>`;
  
  // 2. Generate curve paths
  let goodPath = '';
  let defPath = '';
  
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const px = 50 + (x * 420);
    
    // Good Borrowers (mean = 0.78, std = 0.12)
    const yGood = normalPdf(x, 0.78, 0.12);
    const pyGood = 235 - ((yGood / 3.6) * 195);
    goodPath += (i === 0 ? 'M' : 'L') + `${px.toFixed(1)},${pyGood.toFixed(1)}`;
    
    // Defaulters (mean = 0.34, std = 0.14)
    const yDef = normalPdf(x, 0.34, 0.14);
    const pyDef = 235 - ((yDef / 3.6) * 195);
    defPath += (i === 0 ? 'M' : 'L') + `${px.toFixed(1)},${pyDef.toFixed(1)}`;
  }
  
  // Render Curve Paths
  svgContent += `<path d="${goodPath}" class="chart-curve-good" />`;
  svgContent += `<path d="${defPath}" class="chart-curve-default" />`;
  
  // 3. Vertical Threshold dashed separator (maximum distance)
  const threshX = 0.56;
  const pxThresh = 50 + (threshX * 420);
  svgContent += `<line x1="${pxThresh}" y1="50" x2="${pxThresh}" y2="235" class="chart-threshold-line" />`;
  
  // Text label for KS statistic
  svgContent += `<rect x="${pxThresh - 60}" y="55" width="120" height="22" rx="4" fill="rgba(0, 0, 0, 0.85)" stroke="#ffbd59" stroke-width="1" />`;
  svgContent += `<text x="${pxThresh}" y="70" class="chart-text" style="fill: #ffbd59; font-weight: 700; font-size: 10.5px;">KS Statistic: 0.61</text>`;
  
  // 4. Legends
  const legendGoodText = isHi ? "अच्छे उधारकर्ता (PDF)" : "Good Borrowers (PDF)";
  const legendDefText = isHi ? "डिफॉल्टर (PDF)" : "Defaulters (PDF)";
  
  // Good borrowers legend
  svgContent += `<rect x="65" y="15" width="12" height="12" rx="2" fill="#4CC9F0" />`;
  svgContent += `<text x="83" y="25" class="chart-text" style="text-anchor: start; fill: var(--text-main); font-weight: 600; font-size: 10px;">${legendGoodText}</text>`;
  
  // Defaulters legend
  svgContent += `<rect x="250" y="15" width="12" height="12" rx="2" fill="#E63946" />`;
  svgContent += `<text x="268" y="25" class="chart-text" style="text-anchor: start; fill: var(--text-main); font-weight: 600; font-size: 10px;">${legendDefText}</text>`;
  
  svg.innerHTML = svgContent;
}

function drawCalibrationPlot(svg) {
  svg.innerHTML = '';
  
  let svgContent = '';
  const isHi = state.currentLanguage === 'hi';
  
  // 1. Gridlines and Axes
  // Y-axis gridlines (observed frequency)
  for (let i = 0; i <= 5; i++) {
    const yVal = i / 5;
    const py = 235 - (yVal * 195);
    svgContent += `<line x1="50" y1="${py}" x2="470" y2="${py}" class="chart-grid-line" />`;
    svgContent += `<text x="40" y="${py + 3}" class="chart-text" style="text-anchor: end; fill: var(--text-muted);">${(yVal * 100).toFixed(0)}%</text>`;
  }
  
  // X-axis gridlines (mean predicted probability)
  for (let i = 0; i <= 5; i++) {
    const xVal = i / 5;
    const px = 50 + (xVal * 420);
    svgContent += `<line x1="${px}" y1="40" x2="${px}" y2="235" class="chart-grid-line" />`;
    svgContent += `<text x="${px}" y="252" class="chart-text" style="fill: var(--text-muted);">${(xVal * 100).toFixed(0)}%</text>`;
  }
  
  // Axis Lines
  svgContent += `<line x1="50" y1="235" x2="470" y2="235" class="chart-axis-line" />`; // X-axis
  svgContent += `<line x1="50" y1="40" x2="50" y2="235" class="chart-axis-line" />`; // Y-axis
  
  // Labels
  const labelX = isHi ? "औसत अनुमानित संभावना" : "Mean Predicted Probability";
  const labelY = isHi ? "देखी गई आवृत्ति" : "Observed Frequency";
  svgContent += `<text x="260" y="272" class="chart-text-bold" style="fill: var(--text-main); font-size:10.5px;">${labelX}</text>`;
  svgContent += `<text x="15" y="137" class="chart-text-bold" style="fill: var(--text-main); font-size:10.5px;" transform="rotate(-90 15 137)">${labelY}</text>`;
  
  // 2. Diagonal perfect calibration line
  svgContent += `<line x1="50" y1="235" x2="470" y2="40" class="chart-cal-diagonal" />`;
  
  // 3. Connect our model points
  const points = [
    { x: 0.05, y: 0.04 },
    { x: 0.15, y: 0.13 },
    { x: 0.25, y: 0.22 },
    { x: 0.35, y: 0.31 },
    { x: 0.45, y: 0.43 },
    { x: 0.55, y: 0.52 },
    { x: 0.65, y: 0.61 },
    { x: 0.75, y: 0.72 },
    { x: 0.85, y: 0.83 },
    { x: 0.95, y: 0.94 }
  ];
  
  let linePath = '';
  points.forEach((pt, index) => {
    const px = 50 + (pt.x * 420);
    const py = 235 - (pt.y * 195);
    linePath += (index === 0 ? 'M' : 'L') + `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  
  // Draw calibration line
  svgContent += `<path d="${linePath}" class="chart-cal-line" />`;
  
  // Draw dots on each calibration point
  points.forEach(pt => {
    const px = 50 + (pt.x * 420);
    const py = 235 - (pt.y * 195);
    svgContent += `<circle cx="${px}" cy="${py}" r="4" class="chart-cal-dot" />`;
  });
  
  // 4. Legends
  const legendIdealText = isHi ? "आदर्श अंशांकन (आइडियल)" : "Perfect Calibration (Ideal)";
  const legendModelText = isHi ? "XGBoost (प्लैट स्केल)" : "XGBoost (Platt Scaled)";
  
  // Perfect calibration legend (dashed white line)
  svgContent += `<line x1="65" y1="20" x2="85" y2="20" class="chart-cal-diagonal" />`;
  svgContent += `<text x="93" y="23" class="chart-text" style="text-anchor: start; fill: var(--text-main); font-weight: 600; font-size: 10px;">${legendIdealText}</text>`;
  
  // Our model legend (solid teal line with dot)
  svgContent += `<line x1="250" y1="20" x2="270" y2="20" class="chart-cal-line" />`;
  svgContent += `<circle cx="260" cy="20" r="3.5" class="chart-cal-dot" />`;
  svgContent += `<text x="278" y="23" class="chart-text" style="text-anchor: start; fill: var(--text-main); font-weight: 600; font-size: 10px;">${legendModelText}</text>`;
  
  svg.innerHTML = svgContent;
}

function normalPdf(x, mean, std) {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
}
