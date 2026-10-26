(function () {
  const $ = (id) => document.getElementById(id);
  let activeTab;
  let resume = ResumeAutofillCore.DEFAULT_RESUME;
  let attachments = {};
  let pageAccessible = false;

  async function send(message) {
    if (!activeTab?.id) throw new Error("无法读取当前标签页");
    try {
      return await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
      if (!/^https?:|^file:/.test(activeTab.url || "")) throw new Error("此页面受浏览器保护，无法自动填写");
      await chrome.scripting.executeScript({ target: { tabId: activeTab.id, allFrames: false }, files: ["core.js", "content.js"] });
      return chrome.tabs.sendMessage(activeTab.id, message);
    }
  }

  function openOptions() { chrome.runtime.openOptionsPage(); }

  async function init() {
    const stored = await chrome.storage.local.get(["resume", "attachments", "preserveExisting"]);
    resume = stored.resume || ResumeAutofillCore.DEFAULT_RESUME;
    attachments = stored.attachments || {};
    const percent = ResumeAutofillCore.completion(resume);
    $("profileName").textContent = resume.personal?.fullName || "还未填写简历";
    $("progressText").textContent = `${percent}%`;
    $("progressBar").style.width = `${percent}%`;
    $("preserveExisting").checked = stored.preserveExisting !== false;
    [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const result = await send({ type: "RESUME_AUTOFILL_DETECT" });
      pageAccessible = true;
      if (!result?.total) return showPage(true, "等待开始检测", "点击下方按钮，将重新扫描当前页面并尝试填写");
      const names = result.fields.slice(0, 4).map((item) => item.label).join("、");
      showPage(true, `发现 ${result.total} 个可填写字段`, names + (result.fields.length > 4 ? "等" : ""));
    } catch (error) {
      pageAccessible = false;
      showPage(false, "当前页面无法填写", error.message);
    }
  }

  function showPage(supported, title, detail) {
    $("pageCard").className = `page-card ${supported ? "" : "unsupported"}`;
    $("statusIcon").textContent = supported ? "✓" : "!";
    $("pageStatus").textContent = title;
    $("pageDetail").textContent = detail;
    $("startFill").disabled = !supported;
  }

  async function fill() {
    if (!resume.personal?.fullName && ResumeAutofillCore.completion(resume) === 0) return openOptions();
    const button = $("startFill");
    button.disabled = true;
    button.querySelector("span").textContent = "正在检测页面…";
    $("result").hidden = true;
    try {
      const detection = await send({ type: "RESUME_AUTOFILL_DETECT" });
      if (!detection?.total) {
        showPage(true, "未发现可填写字段", "请展开网申表单后再次点击开始");
        $("result").className = "result error";
        $("result").textContent = "当前页面没有识别到简历字段，请确认已打开具体的申请表单。";
        $("result").hidden = false;
        button.querySelector("span").textContent = "重新检测并填写";
        return;
      }
      const names = detection.fields.slice(0, 4).map((item) => item.label).join("、");
      showPage(true, `发现 ${detection.total} 个可填写字段`, names + (detection.fields.length > 4 ? "等" : ""));
      button.disabled = true;
      button.querySelector("span").textContent = "正在填写…";
      const result = await send({ type: "RESUME_AUTOFILL_FILL", resume, attachments, overwrite: !$("preserveExisting").checked });
      if (result?.ok === false) throw new Error(result.error || "填写失败");
      $("result").className = "result";
      $("result").textContent = result.filled || result.uploaded || result.unmatched
        ? `已填写 ${result.filled} 项${result.uploaded ? `，上传 ${result.uploaded} 个文件` : ""}${result.skipped ? `，跳过 ${result.skipped} 项已有内容` : ""}${result.unmatched ? `，无匹配选项跳过 ${result.unmatched} 项` : ""}${result.unavailable?.length ? `。${result.unavailable.join("；")}` : ""}`
        : "没有可填写的内容，请先完善简历或检查页面已有内容。";
      $("result").hidden = false;
      button.querySelector("span").textContent = "再次检测并填写";
    } catch (error) {
      $("result").className = "result error";
      $("result").textContent = error.message || "填写失败，请刷新页面后重试";
      $("result").hidden = false;
      button.querySelector("span").textContent = "重新检测并填写";
    } finally { button.disabled = !pageAccessible; }
  }

  $("settings").addEventListener("click", openOptions);
  $("editResume").addEventListener("click", openOptions);
  $("startFill").addEventListener("click", fill);
  $("preserveExisting").addEventListener("change", (event) => chrome.storage.local.set({ preserveExisting: event.target.checked }));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.resume || changes.attachments)) init();
  });
  init();
})();
