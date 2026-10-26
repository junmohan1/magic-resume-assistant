console.log("========== 🚀 终极豪华全量版 (v1.3.4) 已注入 ==========");
(function () {
  "use strict";
  if (globalThis.__resumeAutofillLoaded) return;
  globalThis.__resumeAutofillLoaded = true;

  const Core = globalThis.ResumeAutofillCore;
  const selector = "input:not([type=hidden]):not([type=password]):not([type=file]), textarea, [contenteditable=true], [role=textbox], select";

  // ==========================================
  // 基础判断与上下文抓取函数
  // ==========================================
  function isVisible(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    if (element.tagName === 'INPUT' && (element.type === 'hidden' || element.type === 'password' || element.type === 'file')) {
        return false;
    }
    return true; 
  }

  function getLabel(element) {
    const labels = [];
    
    // 优先读取自研框架的 data 属性
    const dataI18n = element.getAttribute("data-form-field-i18n-name");
    if (dataI18n) labels.push(dataI18n);
    const dataName = element.getAttribute("data-form-field-name");
    if (dataName) labels.push(dataName);

    if (element.labels) {
        labels.push(...Array.from(element.labels).map((item) => item.innerText));
    }
    
    const parentLabel = element.closest("label");
    if (parentLabel) labels.push(parentLabel.innerText);
    
    const prevSibling = element.previousElementSibling;
    if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN' || prevSibling.tagName === 'DIV')) {
      labels.push(prevSibling.innerText);
    }
    
    if (element.parentElement) {
      const parentPrevSibling = element.parentElement.previousElementSibling;
      if (parentPrevSibling) {
        labels.push(parentPrevSibling.innerText);
      }
    }
    return labels.join(" ");
  }

  function getNearby(element) {
    let current = element;
    let text = "";
    for (let i = 0; i < 4 && current; i++) {
      const parent = current.parentElement;
      if (parent) text += " " + parent.innerText;
      current = parent;
    }
    return text.slice(0, 200);
  }

  function getContext(element) {
    let current = element.parentElement;
    let fallback = "";
    for (let depth = 0; current && depth < 8; depth++, current = current.parentElement) {
      const text = String(current.innerText || "").slice(0, 1500);
      if (/家庭|家属|亲属|社会关系|family|relative/i.test(text)) return text;
      if (!fallback && /教育|学历|学校|学院|学习|工作|任职|公司|实习|实践|项目|获奖|荣誉|education|school|work|employment|internship|project|award|honor|校园|社团|club/i.test(text)) {
          fallback = text;
      }
    }
    return fallback;
  }

  function getMetadata(element) {
    return {
      label: getLabel(element),
      ariaLabel: element.getAttribute("aria-label") || "",
      placeholder: element.getAttribute("placeholder") || "",
      name: element.getAttribute("name") || element.getAttribute("data-form-field-name") || "",
      id: element.id || "",
      nearby: getNearby(element),
      context: getContext(element),
      type: String(element.type || "").toLowerCase(),
      autocomplete: String(element.autocomplete || "").toLowerCase()
    };
  }

  function queryAll(root, requestedSelector = selector) {
    const elements = Array.from(root.querySelectorAll(requestedSelector));
    for (const host of root.querySelectorAll("*")) {
      if (host.shadowRoot) {
        elements.push(...queryAll(host.shadowRoot, requestedSelector));
      }
    }
    return elements;
  }

  // ==========================================
  // 核心匹配逻辑
  // ==========================================
  function candidates() {
    return queryAll(document)
      .filter((element) => isVisible(element) && !element.disabled)
      .map((element) => {
        const meta = getMetadata(element);
        let match = Core.matchField(meta);
        
        // 大文本框兜底
        if (!match && element.tagName === 'TEXTAREA') {
          const text = (meta.nearby + meta.context).toLowerCase();
          if (/工作职责|工作内容/.test(text)) match = { key: "workDescription", label: "工作职责" };
          else if (/项目描述|项目概括/.test(text)) match = { key: "projectDescription", label: "项目描述" };
          else if (/自我描述|自我评价|简介/.test(text)) match = { key: "selfIntroduction", label: "自我描述" };
        }
        
        // 最近公司拦截
        if (!match && /最近公司|目前公司|上一家公司/.test(meta.label + meta.placeholder + meta.nearby)) {
          match = { key: "recentCompany", label: "最近公司" };
        }

        return { element, match, meta };
      })
      .filter((item) => item.match);
  }

  // ==========================================
  // 事件派发与输入逻辑
  // ==========================================
  function ultimateClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    
    element.focus();
    element.dispatchEvent(new PointerEvent('pointerdown', opts));
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    element.dispatchEvent(new PointerEvent('pointerup', opts));
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    element.dispatchEvent(new MouseEvent('click', opts));
  }

  function forceFillInput(element, value) {
    try {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        const tracker = element._valueTracker;
        if (tracker) tracker.setValue("");
        
        const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(element, value);
        else element.value = value;
      } else {
        element.innerText = value;
        element.textContent = value;
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
      element.blur();
    } catch (error) {
      console.warn("强塞值失败:", error);
    }
  }

  function wait(ms) { 
    return new Promise((resolve) => setTimeout(resolve, ms)); 
  }

  // ==========================================
  // 下拉框与分离时间处理
  // ==========================================
  async function chooseCustomOption(element, value) {
    try {
      const wantedValue = Core.normalize(value);
      
      ultimateClick(element);
      await wait(1000); 

      let options = Array.from(document.querySelectorAll('li, [role="option"], .sd-select-option, .sd-Select-common-item, .moka-select-option, div'));
      
      let targetOption = options.find(option => {
        return option.innerText && Core.normalize(option.innerText) === wantedValue && option.offsetParent !== null;
      });
      
      if (!targetOption) {
        targetOption = options.find(option => {
          return option.innerText && option.innerText.includes(wantedValue) && option.offsetParent !== null;
        });
      }

      if (targetOption) {
        ultimateClick(targetOption);
        await wait(600); 
        return true;
      }
      
      element.blur();
      return false;
    } catch(error) { 
      return false; 
    }
  }

  async function handleSeparatedDate(element, value) {
    const match = String(value).match(/^(\d{4})[-/.年](\d{1,2})/);
    if (!match) return false;
    
    const year = match[1];
    const month = String(Number(match[2])).padStart(2, "0");

    const contextText = (getLabel(element) + element.placeholder + getNearby(element)).toLowerCase();
    const isYear = /年|year/.test(contextText);
    const isMonth = /月|month/.test(contextText);

    let targetValue = "";
    if (isYear) targetValue = year;
    else if (isMonth) targetValue = month;
    else return false; 

    if (element.tagName === 'SELECT') {
      const options = Array.from(element.options);
      const option = options.find(o => Core.normalize(o.value) === targetValue || Core.normalize(o.textContent) === targetValue);
      if (option) {
        element.value = option.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    } else {
      return await chooseCustomOption(element, targetValue);
    }
  }

  async function fillElement(element, value, match) {
    try {
      const stringValue = String(value ?? "").trim();
      if (!stringValue) return false;
      
      element.scrollIntoView({ block: "center", behavior: "auto" });
      
      const role = element.getAttribute("role");
      const contextText = (getLabel(element) + element.placeholder).toLowerCase();
      
      if (match.key.includes("Date") || /年|月/.test(contextText)) {
        const handled = await handleSeparatedDate(element, stringValue);
        if (handled) return true;
      }

      const isStrictSelect = element instanceof HTMLSelectElement;
      const isExplicitDropdown = role === "combobox" || element.getAttribute("aria-haspopup") === "true";
      const isMokaDropdownField = element.readOnly && /工作经验|学历|性别|婚姻|国籍|民族|政治面貌|语言能力/.test(match.label);

      if (isStrictSelect) {
        const options = Array.from(element.options);
        const option = options.find(o => Core.normalize(o.value) === Core.normalize(stringValue) || Core.normalize(o.textContent) === Core.normalize(stringValue));
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      } else if (isExplicitDropdown || isMokaDropdownField) {
        return await chooseCustomOption(element, stringValue);
      } else {
        let finalValue = stringValue;
        if (match.key === "idNumber") {
          if (finalValue.length < 10) return false; 
          finalValue = finalValue.replace(/[^0-9Xx]/g, "");
        }
        forceFillInput(element, "");
        forceFillInput(element, finalValue);
      }
      return true;
    } catch(error) { 
      return false; 
    }
  }

  function getCurrentValue(element) {
    try {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
          return element.value || "";
      }
      if (element.isContentEditable) return element.textContent || "";
      return element.getAttribute("data-value") || "";
    } catch(error) { 
      return ""; 
    }
  }

  // ==========================================
  // 自动展开经历（全量保留）
  // ==========================================
  async function expandRepeatableGroups(resume) {
    const groups = [
      { collection: "education", key: "school", titles: ["教育背景", "教育经历"], name: "教育背景" },
      { collection: "work", key: "company", titles: ["工作经历", "实习经历"], name: "工作经历" },
      { collection: "projects", key: "projectName", titles: ["项目经验", "项目经历", "在校经历"], name: "项目经验" }
    ];
    
    for (const group of groups) {
      let requiredCount = (resume?.[group.collection] || []).filter((item) => Object.values(item || {}).some((value) => String(value || "").trim())).length;
      
      if (group.collection === "projects" && !requiredCount) {
        requiredCount = (resume?.schoolExperiences || []).filter((item) => Object.values(item || {}).some((value) => String(value || "").trim())).length;
      }
      
      if (requiredCount <= 1) continue; 
      
      let existingCount = candidates().filter((item) => item.match.key === group.key).length;
      let attempts = 0;
      
      while (existingCount < requiredCount && attempts < 5) {
        const controls = Array.from(document.querySelectorAll("button, a, [role=button], span, div")).filter(isVisible);
        
        const addButton = controls.find((control) => {
          const text = Core.normalize(control.innerText || control.getAttribute("aria-label") || control.title);
          if (group.titles.some(t => text.includes(t)) && text.length < 20) return true;
          
          if (/^\+?\s*添加$|^\+?\s*新增$|^添加$|^新增$/.test(text) || (text.includes("+") && text.includes("添加"))) {
            let parent = control.parentElement;
            for (let i = 0; i < 5 && parent; i++) {
              const parentText = parent.innerText || "";
              if (group.titles.some(t => parentText.includes(t))) {
                if (parentText.length < 3000) return true; 
              }
              parent = parent.parentElement;
            }
          }
          return false;
        });
        
        if (!addButton) break; 
        
        ultimateClick(addButton);
        attempts++;
        await wait(1200); 
        
        let newExistingCount = candidates().filter((item) => item.match.key === group.key).length;
        if (newExistingCount === existingCount) break; 
        existingCount = newExistingCount;
      }
    }
  }

  // ==========================================
  // 全局填充入口
  // ==========================================
  async function fill(resume, attachments, overwrite) {
    console.log("====== [终极豪华全量版] 开始执行 ======");
    try {
      await expandRepeatableGroups(resume || {});
      
      const flattenedResume = Core.flattenResume(resume || {});
      const foundFields = candidates();
      
      console.log(`[终极豪华全量版] 识别到 ${foundFields.length} 个字段`);
      
      const result = { filled: 0, uploaded: 0, skipped: 0, unmatched: 0, missing: 0, fields: [], unavailable: [] };
      const handledRadioNames = new Set();
      const occurrenceMap = new Map();

      for (const item of foundFields) {
        try {
          const { element, match, meta } = item;
          
          if (match.key === "recentCompany") {
            if (!overwrite && String(getCurrentValue(element)).trim()) continue;
            const recentCompanyValue = flattenedResume.recentCompany;
            if (recentCompanyValue) {
               await fillElement(element, recentCompanyValue, match);
               result.filled++;
            }
            continue; 
          }

          if (match.key === "idNumber") {
            const isSelect = element instanceof HTMLSelectElement;
            const isCustomSelect = element.readOnly || element.getAttribute("role") === "combobox";
            const isSmallBox = element.getBoundingClientRect().width < 150;
            if (isSelect || isCustomSelect || isSmallBox) { 
                result.unmatched++; 
                continue; 
            }
          }

          if ((element.type === "radio" || element.type === "checkbox") && element.name && handledRadioNames.has(element.name)) continue;
          
          const blockText = meta.context.toLowerCase();
          let dynamicContext = meta.context + " " + meta.label + " " + meta.nearby;
          
          if (match.key.includes("work") || match.key === "company" || match.key === "jobTitle") {
            if (/实习|intern/.test(blockText) && !/工作经历|work/.test(blockText)) {
              dynamicContext += " 实习";
            } else if (/工作经历|work/.test(blockText)) {
              dynamicContext += " 全职 正式";
            }
          }

          const occurrence = occurrenceMap.get(match.key) || 0;
          const values = Core.valuesForKey(resume || {}, match.key, dynamicContext);
          let value = Core.isRepeatableKey(match.key) ? values[occurrence] : flattenedResume[match.key];
          
          if (Core.isRepeatableKey(match.key)) occurrenceMap.set(match.key, occurrence + 1);
          
          if (!String(value ?? "").trim()) { result.missing++; continue; }
          if (!overwrite && String(getCurrentValue(element)).trim()) { result.skipped++; continue; }
          
          console.log(`准备填充: [${match.label}] (第${occurrence + 1}段) -> ${String(value).substring(0, 15)}...`);
          
          if (await fillElement(element, value, match)) {
            result.filled++;
            result.fields.push(match.label);
          } else {
            result.unmatched++;
          }
          
          if (match.key.includes("Date") || /年|月/.test(element.placeholder || "")) {
            await wait(1500);
          }
          
        } catch (err) {
          console.warn("[单字段填充异常]", err);
        }
      }
      
      // 文件上传
      try {
        const fileInputs = queryAll(document, "input[type=file]").filter((element) => !element.disabled);
        for (const input of fileInputs) {
          const meta = getMetadata(input);
          const text = Core.normalize([meta.label, meta.ariaLabel, meta.name, meta.id, meta.nearby].join(" "));
          if (/证书|资格|奖状|材料|certificate/i.test(text)) continue; 
          if (!overwrite && input.files?.length) { result.skipped++; continue; }
          
          let kind = null;
          if (/个人简历|简历附件|上传简历|resume/i.test(text)) kind = "resumeFile";
          else if (/头像|证件照|个人照片|headshot/i.test(text)) kind = "avatar";
          if (!kind) continue;

          const stored = kind === "avatar" ? attachments?.avatar : attachments?.resumeFile;
          if (!stored?.dataUrl) continue;
          
          try {
            const parts = stored.dataUrl.split(",");
            const binary = atob(parts[1]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const file = new File([bytes], stored.name, { type: stored.type || "application/octet-stream" });
            const transfer = new DataTransfer();
            transfer.items.add(file);
            input.files = transfer.files;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            result.uploaded++;
          } catch(error) {}
        }
      } catch(error) {}

      console.log("====== [终极豪华全量版] 执行完毕，填充数:", result.filled, "=====");
      return result;
    } catch (err) {
      console.error("全局执行错误:", err);
      return { filled: 0, uploaded: 0, skipped: 0, unmatched: 0, missing: 0, fields: [], unavailable: [] };
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "RESUME_AUTOFILL_PING") sendResponse({ ok: true });
    if (message.type === "RESUME_AUTOFILL_DETECT") {
      try {
        const found = candidates();
        sendResponse({ ok: true, total: found.length, fields: [] });
      } catch(error) { 
        sendResponse({ ok: true, total: 0, fields: [] }); 
      }
    }
    if (message.type === "RESUME_AUTOFILL_FILL") {
      fill(message.resume, message.attachments, message.overwrite)
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
    }
    return true;
  });
})();