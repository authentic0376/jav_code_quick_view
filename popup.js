document.getElementById("setSource").addEventListener("click", async () => {
  // 현재 활성화된 탭 정보 가져오기
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTabId = tabs[0].id;

  // 백그라운드에 설정 요청
  browser.runtime.sendMessage({ action: "SET_SOURCE", tabId: currentTabId });
  window.close(); // 팝업 닫기
});

document.getElementById("setTarget").addEventListener("click", async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTabId = tabs[0].id;

  browser.runtime.sendMessage({ action: "SET_TARGET", tabId: currentTabId });
  window.close();
});
