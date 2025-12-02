// Regex 설명:
// [a-zA-Z0-9]{2,8} : 영문/숫자로 된 2~8자리 접두어 (예: DSVR, 3dsvr)
// [-]? : 하이픈이 있을 수도 없을 수도 있음
// [0-9]{3,6} : 3~6자리 숫자 (예: 1687, 00684)
// 'i' 플래그: 대소문자 구분 없음
const CODE_REGEX = /([a-zA-Z0-9]{2,8}[-]?[0-9]{3,6})/i;

let isSourceTab = false;

// 백그라운드로부터 "너는 소스 탭이야"라는 신호를 받으면 활성화
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "ACTIVATE_SOURCE") {
    isSourceTab = true;
    console.log("Code Searcher: This tab is now the Source.");
    alert("이 탭이 감지 탭으로 설정되었습니다.");
  }
});

document.addEventListener("mouseover", (event) => {
  // 소스 탭으로 지정되지 않았으면 작동 안 함
  if (!isSourceTab) return;

  // 마우스 오버된 요소가 링크(a 태그) 혹은 그 자식인지 확인
  const link = event.target.closest("a");
  
  if (link) {
    // 1. 링크의 텍스트와 href 속성 모두에서 검색 시도
    const textToCheck = link.innerText + " " + link.href;
    
    // 2. 정규식 매칭
    const match = textToCheck.match(CODE_REGEX);

    if (match) {
      const detectedCode = match[0]; // 매칭된 전체 문자열 (예: SDDE-486)
      console.log("Detected Code:", detectedCode);

      // 3. 백그라운드로 전송
      browser.runtime.sendMessage({
        action: "CODE_FOUND",
        code: detectedCode
      });
    }
  }
});
