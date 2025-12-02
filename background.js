// 상태 저장 변수
let sourceTabId = null;
let targetTabId = null;
let lastSearchedCode = ""; // 중복 검색 방지용

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. 팝업에서 "이 탭을 감지 탭으로 설정" 클릭 시
  if (message.action === "SET_SOURCE") {
    sourceTabId = message.tabId;
    console.log(`Source Tab Set: ${sourceTabId}`);
    // 해당 탭에 알림 (선택 사항)
    browser.tabs.sendMessage(sourceTabId, { action: "ACTIVATE_SOURCE" });
  }

  // 2. 팝업에서 "이 탭을 검색 탭으로 설정" 클릭 시
  else if (message.action === "SET_TARGET") {
    targetTabId = message.tabId;
    console.log(`Target Tab Set: ${targetTabId}`);
  }

  // 3. 컨텐츠 스크립트에서 코드를 찾았을 때
  else if (message.action === "CODE_FOUND") {
    const code = message.code;

    // 타겟 탭이 설정되어 있고, 방금 검색한 코드가 아니라면 검색 수행
    if (targetTabId && code !== lastSearchedCode) {
      // 보낸 탭이 설정된 소스 탭인지 확인 (오작동 방지)
      if (sender.tab.id === sourceTabId) {
        lastSearchedCode = code;
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(code + " jav")}`;

        // 타겟 탭 업데이트
        browser.tabs
          .update(targetTabId, { url: searchUrl })
          .then(() => {
            console.log("Search updated successfully.");
          })
          .catch((error) => {
            console.error("Target tab error (closed?):", error);
            // 탭이 닫혔으면 ID를 초기화해서 불필요한 시도를 줄임
            targetTabId = null;
            console.log("Target tab ID reset. Please set a new target tab.");
          });
      }
    }
  }
});
