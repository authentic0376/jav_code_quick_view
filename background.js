const ENABLED_ICON_PATH = "icon.svg";
const DISABLED_ICON_PATH = "icon-disabled.svg";

// --- Icon and State Management ---

function updateIcon() {
    browser.storage.local.get({ isEnabled: true }).then(result => {
        const path = result.isEnabled ? ENABLED_ICON_PATH : DISABLED_ICON_PATH;
        browser.action.setIcon({ path: path });
        console.log(`Background: Extension is ${result.isEnabled ? 'enabled' : 'disabled'}. Icon set to ${path}.`);
    });
}

// --- Event Listeners ---

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 옵션 페이지에서 아이콘 업데이트 요청
    if (request.action === "updateIcon") {
        updateIcon();
        return; 
    }

    // 컨텐츠 스크립트에서 검색 요청
    if (request.query) {
        browser.storage.local.get({ isEnabled: true }).then(result => {
            if (!result.isEnabled) {
                console.log("Background: Extension is disabled. Ignoring search query.");
                return; 
            }

            const searchQuery = request.query + ' jav'; 
            console.log(`Background: Starting search for '${searchQuery}'`);
            
            // 최신 구글 이미지 검색 URL
            const searchUrl = `https://www.google.com/search?udm=2&q=${encodeURIComponent(searchQuery)}`;

            fetch(searchUrl, {
                headers: {
                    // 구글에게 데스크탑 브라우저인척 속여서 HTML을 받습니다.
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
                .then(response => response.text())
                .then(html => {
                    const imageUrls = parseImageUrls(html);
                    console.log(`Background: Parsed ${imageUrls.length} image URLs.`);
                    
                    if (sender.tab && sender.tab.id) {
                        browser.tabs.sendMessage(sender.tab.id, { imageUrls: imageUrls.slice(0, 15) });
                    }
                })
                .catch(error => {
                    console.error("Background: A critical error occurred during fetch:", error);
                    if (sender.tab && sender.tab.id) {
                        browser.tabs.sendMessage(sender.tab.id, { imageUrls: [] });
                    }
                });
        });

        return true; // 비동기 응답 명시
    }
});

browser.runtime.onInstalled.addListener(() => {
    browser.storage.local.set({ isEnabled: true });
    updateIcon();
});

browser.runtime.onStartup.addListener(() => {
    updateIcon();
});

// 중요: 에러가 나던 browser.management.onEnabled 리스너는 제거했습니다.
// manifest에 권한이 없으면 스크립트가 죽습니다.

// --- Utility Functions ---

/**
 * 2025년형 구글 이미지 파싱 로직 (종합 선물세트)
 * 1. Base64 이미지 (사용자가 제공한 HTML 분석 결과 이것이 가장 많음)
 * 2. encrypted-tbn0 (전통적인 썸네일)
 * 3. http로 끝나는 일반 이미지 파일
 */
/**
 * 이미지 파싱 로직 (로고/아이콘 필터링 강화)
 */
function parseImageUrls(html) {
    const urls = new Set();
    
    // [전략 1] Base64 이미지 추출
    // 수정사항: 최소 길이를 100 -> 2000으로 대폭 늘림.
    // 이유: 사이트 로고나 아이콘은 보통 1KB 미만이라 문자열 길이가 짧습니다.
    // 표지 이미지는 화질이 낮아도 수천 자 이상입니다.
    const base64Regex = /(data:image\/(?:jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+)/g;
    let match;
    while ((match = base64Regex.exec(html)) !== null) {
        if (match[1].length > 2000) { 
            urls.add(match[1]);
        }
    }

    // [전략 2] 구글 썸네일 URL (encrypted-tbn0) 추출
    // 이건 구글이 생성한 이미지 썸네일이라 로고일 확률이 낮습니다.
    const thumbRegex = /(https?:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=tbn:[^"'\\]+)/g;
    while ((match = thumbRegex.exec(html)) !== null) {
        let cleanUrl = match[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&');
        urls.add(cleanUrl);
    }

    // [전략 3] 일반 이미지 URL 추출 (필터링 강화)
    // 수정사항: 'logo', 'icon', 'button' 등이 포함된 URL은 제외
    const fallbackRegex = /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
    while ((match = fallbackRegex.exec(html)) !== null) {
        const url = match[1].toLowerCase();
        // 구글/gstatic 제외 + 로고/아이콘/배너/UI요소 제외
        if (!url.includes('google.com') && 
            !url.includes('gstatic.com') &&
            !url.includes('logo') &&
            !url.includes('icon') &&
            !url.includes('favicon') &&
            !url.includes('avatar') &&
            !url.includes('assets')) {
            urls.add(match[1]);
        }
    }

    const resultList = Array.from(urls);

    if (resultList.length === 0) {
         console.warn("Background: No images found (after filtering).");
    }

    return resultList;
}
