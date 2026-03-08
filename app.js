/* app.js */
const i18n = {
    ko: {
        "nav-core": "ZiewCore",
        "nav-about": "About",
        "nav-solutions": "Solutions",
        "nav-technology": "Technology",
        "nav-contact": "Contact",
        "hero-title": "ZiewCore:<br><span class=\"highlight\">Alive and Evolving</span>",
        "hero-subtitle": "'살아있고 진화한다'는 의미로, ZiewCore의 진보적인 자가 학습(Self-learning) 인프라 특성을 직관적으로 보여줍니다.",
        "about-title": "Who We Are",
        "about-subtitle": "기업 환경에 최적화된 차세대 IT & AI 솔루션 제공자",
        "about-desc": "지와이즈(Ziewise)는 기존의 인프라, 보안, 운영 노하우를 바탕으로, 이제 최첨단 <strong>Edge MLOps OS (ZiewCore)</strong>를 통해 기업의 디지털 전환을 가속화합니다.<br>가상 PC, 스마트 CCTV, 프린트 보안 등 탄탄한 IT 인프라 솔루션 역량을 AI 기술과 결합하여 한 차원 높은 비즈니스 인텔리전스를 제공합니다.",
        "badge-iso": "ISO 27001 인증",
        "badge-venture": "벤처기업 인증",
        "badge-rnd": "기업부설연구소",
        "sol-title": "6대 핵심 비즈니스 쇼케이스",
        "sol-subtitle": "비즈니스 도메인별로 특화된 AI 플러그인이 어떻게 작동하는지 체험해 보세요.",
        "sol-hint": "💡 카드 위에 마우스를 올리면 시뮬레이션이 작동합니다.",
        "zieview-sub": "Smart Vision AI",
        "zieview-diff": "✓ 실시간 엣지 분석 및 모호 데이터 자가 재학습",
        "zieview-raw": "모호한 데이터",
        "zieview-trained": "재학습 완료",
        "neuro-sub": "AI Grid & Energy",
        "neuro-diff": "✓ 분산 에너지 자원의 실시간 연결 및 블록체인 기반 무결성 검증",
        "neuro-verify": "0x1C7... Verified",
        "mpulse-sub": "D2C Commerce AI",
        "mpulse-diff": "✓ 초개인화 AR 분석 및 고객 행동 기반 실시간 전환율 최적화",
        "mpulse-pop-title": "이탈 감지!",
        "mpulse-pop-desc": "🔥 10% 추가 할인 쿠폰 발급",
        "sigming-sub": "Smart Office AI",
        "sigming-diff": "✓ 심층 딥러닝 규정 검토 및 ERP 자동 전표화로 팩트체크 자동화",
        "sigming-receipt-1": "[식대] 구내식당 - 8,000원",
        "sigming-receipt-2": "[심야택시] 카카오T - 45,000원",
        "sigming-erp-label": "> 자동 전표 생성 중...",
        "ziewprint-sub": "Smart Print Security AI",
        "ziewprint-diff": "✓ 제조사명/모델 상관없이 전용 1-드라이버 출력 & 기존 프린터 교체 없는 스마트 보안, 워터마크/출력승인/통계 지원 (AI 장애 대화 지원)",
        "ziewprint-driver": "Universal Driver",
        "ziewprint-auth": "QR/PIN 인증",
        "ziewprint-watermark": "CONFIDENTIAL",
        "ziewprint-stats": "출력 승인 완료 | 실시간 추적 중",
        "ziewprint-chat": "장애 감지: 토너 5% 미만.<br>해결 방안 안내.",
        "observer-sub": "APM & NPM Insights",
        "observer-diff": "✓ 애플리케이션 및 네트워크 통합 3D 토폴로지 분석 및 사전 장애 감지",
        "obs-cpu": "CPU Load",
        "obs-net": "NET Traffic",
        "obs-lat": "Latency",
        "obs-anomaly": "Anomaly Detected",
        "form-company": "업체명",
        "form-name": "성명",
        "form-title": "직급",
        "form-email": "이메일 주소",
        "form-message": "문의내용을 입력해주세요.",
        "btn-send": "문의하기 (이메일 폼 전송)",
        "tech-title": "Core Technology 증명",
        "tech-desc": "Ziewise만의 시스템 구조적 우수성과 효율성",
        "tech-1-title": "능동적 스캐너",
        "tech-1-sub": "Active Learning Selective Collection",
        "tech-1-desc": "모든 데이터를 서버로 전송하지 않습니다. Edge 단에서 <strong>'모호한 데이터(Yellow Point)'만을 선별 수집</strong>하여 네트워크 트래픽과 클라우드 비용을 혁신적으로 절감합니다.",
        "tech-2-title": "무중단 핫스왑",
        "tech-2-sub": "Zero-Downtime Hot-Swap Architecture",
        "tech-2-desc": "AI 모델 업데이트 시 발생하는 다운타임을 원천 차단합니다. <strong>마이크로서비스 아키텍처(MSA)를 통해 실시간으로 신규 모델이 기존 모델을 대체</strong>하여 서비스의 연속성을 보장합니다.",
        "tech-2-old": "Legacy AI Model",
        "tech-2-new": "Optimized AI Model",
        "foot-1": "지와이즈 주식회사 | 대표이사 : 이승현 | 사업자등록번호: 392-87-02849",
        "foot-2": "서울특별시 금천구 가산디지털2로 165 백상스타타워2차 1206호",
        "foot-title": "Contact Us",
        "foot-copy": "Copyright (c) Since 2024 ZIEWISE. All rights reserved.",
        "sigming-live-text": " | 식대 | 8,000 | 승인"
    },
    en: {
        "nav-core": "ZiewCore",
        "nav-about": "About",
        "nav-solutions": "Solutions",
        "nav-technology": "Technology",
        "nav-contact": "Contact",
        "hero-title": "ZiewCore:<br><span class=\"highlight\">Alive and Evolving</span>",
        "hero-subtitle": "Signifying a living, evolving system, intuitively capturing ZiewCore's proactive self-learning infrastructure capabilities.",
        "about-title": "Who We Are",
        "about-subtitle": "Next-Generation IT & AI Solution Provider Optimized for Enterprise Environments",
        "about-desc": "Based on existing IT infrastructure, security, and operation know-how, Ziewise accelerates digital transformation of enterprises through the cutting-edge <strong>Edge MLOps OS (ZiewCore)</strong>.<br>We provide a higher level of business intelligence by combining AI technology with solid IT infrastructure solutions such as Virtual PC, Smart CCTV, and Print Security.",
        "badge-iso": "ISO 27001 Certified",
        "badge-venture": "Venture Certified",
        "badge-rnd": "R&D Center",
        "sol-title": "6 Core Business Showcases",
        "sol-subtitle": "Experience how domain-specific AI plugins work.",
        "sol-hint": "💡 Hover over the cards to activate simulations.",
        "zieview-sub": "Smart Vision AI",
        "zieview-diff": "✓ Real-time edge analysis and self-retraining of ambiguous data",
        "zieview-raw": "Ambiguous Data",
        "zieview-trained": "Retraining Complete",
        "neuro-sub": "AI Grid & Energy",
        "neuro-diff": "✓ Real-time connection of distributed energy resources and blockchain-based integrity validation",
        "neuro-verify": "0x1C7... Verified",
        "mpulse-sub": "D2C Commerce AI",
        "mpulse-diff": "✓ Hyper-personalized AR analysis and real-time conversion rate optimization based on customer behavior",
        "mpulse-pop-title": "Exit Intent Detected!",
        "mpulse-pop-desc": "🔥 10% Extra Discount Coupon Issued",
        "sigming-sub": "Smart Office AI",
        "sigming-diff": "✓ Fact-checking automation via deep learning regulation review and auto ERP vouchering",
        "sigming-receipt-1": "[Food] Cafeteria - $8.00",
        "sigming-receipt-2": "[Late Night Taxi] Uber - $45.00",
        "sigming-erp-label": "> Auto vouchering in progress...",
        "ziewprint-sub": "Smart Print Security AI",
        "ziewprint-diff": "✓ Universal 1-Driver independent of vendor/model & smart security without printer replacement, supporting watermarks, approval, and stats (AI troubleshooting chat)",
        "ziewprint-driver": "Universal Driver",
        "ziewprint-auth": "QR / PIN Login",
        "ziewprint-watermark": "CONFIDENTIAL",
        "ziewprint-stats": "Print Approved | Tracking Event",
        "ziewprint-chat": "Error: Toner < 5%.<br>Guiding solution...",
        "observer-sub": "APM & NPM Insights",
        "observer-diff": "✓ Integrated APM & NPM 3D topology analysis and predictive fault detection",
        "obs-cpu": "CPU Load",
        "obs-net": "NET Traffic",
        "obs-lat": "Latency",
        "obs-anomaly": "Anomaly Detected",
        "form-company": "Company Name",
        "form-name": "Your Name",
        "form-title": "Job Title",
        "form-email": "Email Address",
        "form-message": "Please enter your inquiry details here.",
        "btn-send": "Send Message (Email)",
        "tech-title": "Core Technology Proof",
        "tech-desc": "Structural excellence and efficiency unique to Ziewise",
        "tech-1-title": "Active Scanner",
        "tech-1-sub": "Active Learning Selective Collection",
        "tech-1-desc": "We do not send everything to the server. By <strong>selectively collecting only 'ambiguous data (Yellow Points)'</strong> at the Edge, we dramatically reduce network traffic and cloud costs.",
        "tech-2-title": "Zero-Downtime Hot-Swap",
        "tech-2-sub": "Zero-Downtime Hot-Swap Architecture",
        "tech-2-desc": "Fundamentally block downtime during AI model updates. <strong>Real-time replacement of legacy models with new ones via Microservices Architecture (MSA)</strong> ensures service continuity.",
        "tech-2-old": "Legacy AI Model",
        "tech-2-new": "Optimized AI Model",
        "foot-1": "Ziewise Co., Ltd. | CEO: Seunghyun Lee | Business Registration No.: 392-87-02849",
        "foot-2": "Suite 1206, Baeksang Star Tower 2, 165 Gasan digital 2-ro, Geumcheon-gu, Seoul",
        "foot-title": "Contact Us",
        "foot-copy": "Copyright (c) Since 2024 ZIEWISE. All rights reserved.",
        "sigming-live-text": " | Food | $8.00 | Approved",
        'form-sub-ph': 'Select an Inquiry Category',
        'form-sub-1': 'Zieview (Vision AI)',
        'form-sub-2': 'Neuro-VPP (Energy)',
        'form-sub-3': 'ZiewCore M-Pulse (Commerce)',
        'form-sub-4': 'SIGMING (Office AI)',
        'form-sub-5': 'ZiewPrint (Print Security)',
        'form-sub-6': 'ZiewCore Observer (Monitoring)',
        'form-sub-7': 'Other/General Inquiry',
        'qa-1': 'Security Vulnerability Scan (Sec Scan)',
        'qa-2': '100k+ Large Scale Load Test',
        'qa-3': 'Anomaly Traffic Detection',
        'qa-4': 'Zero-Downtime Deployment Approved'
    }
};

let currentLang = 'ko';

function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    
    // Toggle active classes on buttons
    document.getElementById('btn-ko').classList.toggle('active', lang === 'ko');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    
    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            el.innerHTML = i18n[lang][key];
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[lang][key]) {
            el.setAttribute('placeholder', i18n[lang][key]);
        }
    });

    // Update dynamic SIGMING text if currently visible
    const typingElement = document.getElementById('erp-typing');
    if (typingElement && typingElement.textContent !== "") {
        const today = new Date().toISOString().split('T')[0];
        typingElement.textContent = `${today}${i18n[currentLang]['sigming-live-text']}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // 0. Language Switcher Event Listeners
    document.getElementById('btn-ko').addEventListener('click', () => setLanguage('ko'));
    document.getElementById('btn-en').addEventListener('click', () => setLanguage('en'));

    // 1. Hyper-Warp smooth scrolling for nav links
    // Creates a visual "warp" overlay, scrolls instantly under the hood, then fades out.
    
    // Create warp overlay in DOM
    const warpOverlay = document.createElement('div');
    warpOverlay.className = 'warp-overlay';
    document.body.appendChild(warpOverlay);
    
    // Create star lines and planets for warp effect
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        // Randomly make some of them "planets" passing by quickly
        if (i % 15 === 0) {
            star.className = 'warp-star planet';
        } else {
            star.className = 'warp-star';
        }
        
        star.style.left = `${50 + (Math.random() - 0.5) * 100}%`;
        star.style.top = `${50 + (Math.random() - 0.5) * 100}%`;
        // Randomize direction and length for 3D depth
        star.style.setProperty('--angle', `${(Math.random() * 360)}deg`);
        star.style.setProperty('--delay', `${Math.random() * 0.4}s`);
        star.style.setProperty('--duration', `${0.4 + Math.random() * 0.6}s`);
        
        // Randomly add a blueish or yellowish tint to some stars
        if (Math.random() > 0.7) {
            star.style.boxShadow = '0 0 10px 2px rgba(240, 195, 48, 0.8), 0 0 20px 5px rgba(255, 255, 255, 0.4)';
        } else if (Math.random() > 0.4) {
             star.style.boxShadow = '0 0 10px 2px rgba(0, 159, 227, 0.8), 0 0 20px 5px rgba(255, 255, 255, 0.4)';
        }

        warpOverlay.appendChild(star);
    }

    // Section Isolation Logic
    const sections = ['#hero', '#about', '#solutions', '#technology', '#contact'];
    
    function showSection(targetId) {
        sections.forEach(id => {
            const el = document.querySelector(id);
            if (el) {
                if (id === targetId) {
                    el.style.display = (id === '#contact') ? 'flex' : 'flex';
                } else {
                    el.style.display = 'none';
                }
            }
        });
        
        // Highlight active nav link
        document.querySelectorAll('.nav-links a').forEach(a => {
            if (a.getAttribute('href') === targetId) {
                a.classList.add('active-nav');
            } else {
                a.classList.remove('active-nav');
            }
        });
        
        window.scrollTo(0, 0); // Reset scroll to top of the newly shown section
    }
    
    // Set initial section to Hero instead of showing all
    showSection('#hero');

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Only warp if switching to a different section
            const currentActive = document.querySelector('.nav-links a.active-nav');
            if (currentActive && currentActive.getAttribute('href') === targetId) return;

            // Trigger Hyper-warp
            warpOverlay.classList.add('active');
            
            setTimeout(() => {
                // Change the active section while the screen is "warping"
                showSection(targetId);
                
                // Remove warp effect
                setTimeout(() => {
                    warpOverlay.classList.remove('active');
                }, 150);
            }, 300); // 300ms is the peak of the warp fade-in
        });
    });

    // 2. Intersection Observer for fade-in animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                // Don't unobserve if we want hover effects to still work cleanly, 
                // but since we only control initial load transform here, it's fine.
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply init styles and observe for cards and hero content
    const animatedElements = document.querySelectorAll('.solution-card, .tech-card, .hero-content');
    animatedElements.forEach((el, index) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.8s ease-out ${index * 0.1}s, transform 0.8s ease-out ${index * 0.1}s`;
        fadeObserver.observe(el);
    });

    // We must ensure that the transition doesn't interfere with hover transforms later.
    // So after the animation completes, we remove the inline transition so the CSS stylesheet takes over.
    setTimeout(() => {
        animatedElements.forEach(el => {
            el.style.transition = ''; 
        });
    }, 2000);

    // 3. Dynamic typing simulation for SIGMING ERP
    const typingElement = document.getElementById('erp-typing');
    const sigmingCard = document.getElementById('card-sigming');
    let hasTyped = false;

    if (sigmingCard && typingElement) {
        sigmingCard.addEventListener('mouseenter', () => {
            if (!hasTyped) {
                // The actual typing effect is handled by CSS steps animation,
                // here we dynamically fill the text so it looks "live".
                const today = new Date().toISOString().split('T')[0];
                typingElement.textContent = `${today}${i18n[currentLang]['sigming-live-text']}`;
                hasTyped = true;
            }
        });

        sigmingCard.addEventListener('mouseleave', () => {
             // Reset so the animation can play again on next hover
             setTimeout(() => {
                 typingElement.textContent = "";
                 hasTyped = false;
             }, 500);
        });
    }

    // Contact Form MailTo Handler
    document.getElementById('contact-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const category = document.getElementById('req-subject').value || "일반 문의";
        const company = document.getElementById('req-company').value;
        const name = document.getElementById('req-name').value;
        const title = document.getElementById('req-title').value;
        const email = document.getElementById('req-email').value;
        const message = document.getElementById('req-message').value;

        const subject = encodeURIComponent(`[Ziewise 문의 - ${category}] ${company} - ${name}`);
        const body = encodeURIComponent(`문의 카테고리/Category: ${category}\n업체명/Company: ${company}\n성명/Name: ${name}\n직급/Title: ${title}\n이메일/Email: ${email}\n\n문의내용:\n${message}`);

        window.location.href = `mailto:info@ziewise.com?subject=${subject}&body=${body}`;
    });
});
