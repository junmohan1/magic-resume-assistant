(function () {
  "use strict";
  const form = document.getElementById("resumeForm");
  const toast = document.getElementById("toast");
  let resume = clone(ResumeAutofillCore.DEFAULT_RESUME);
  let attachments = {};
  let saveTimer;
  const SELF_EVALUATION_TEMPLATES = {
    general: "本人具备良好的学习能力、沟通能力和团队协作意识，工作认真负责，能够快速理解业务需求并推进任务落地。面对新环境和新问题时适应能力较强，注重细节与执行效率，愿意持续学习并不断提升专业能力。",
    tech: "本人具备扎实的技术基础和良好的工程实践能力，能够独立分析问题、定位原因并推动解决。重视代码质量、系统稳定性和团队协作，对新技术保持持续学习，善于将技术方案与实际业务需求结合，并通过复盘不断优化工作方法。",
    product: "本人具备良好的用户意识、数据意识和跨团队协作能力，能够从业务目标出发分析需求、梳理流程并推动方案落地。善于沟通协调和总结复盘，对市场变化和用户反馈保持敏感，重视结果与执行效率，能够在多任务环境下保持清晰的优先级。",
    graduate: "本人学习态度认真，具备较强的学习能力和责任心。在校期间通过课程、项目和实践积累了相关专业基础，能够主动沟通并配合团队完成任务。对目标岗位有浓厚兴趣，愿意从基础工作做起，在实践中快速成长并持续提升专业能力。"
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function fields() { return Array.from(form.querySelectorAll("[data-path]")); }

  function getPath(object, path) {
    return path.split(".").reduce((value, key) => value == null ? "" : value[key], object);
  }

  function setPath(object, path, value) {
    const keys = path.split(".");
    let current = object;
    keys.slice(0, -1).forEach((key, index) => {
      const nextKey = keys[index + 1];
      if (current[key] == null) current[key] = /^\d+$/.test(nextKey) ? [] : {};
      current = current[key];
    });
    current[keys[keys.length - 1]] = value;
  }

  function mergeDefaults(stored) {
    const base = clone(ResumeAutofillCore.DEFAULT_RESUME);
    const mergeCollection = (name) => {
      const entries = Array.isArray(stored?.[name]) && stored[name].length ? stored[name] : base[name];
      return entries.map((entry) => {
        const merged = { ...base[name][0], ...(entry || {}) };
        if (name === "education") {
          if (!merged.rankingPercentage && entry?.professionalRank && entry?.cohortSize) merged.rankingPercentage = ResumeAutofillCore.calculateRankingPercentage(entry.professionalRank, entry.cohortSize);
          if (!merged.rankingPercentage && entry?.score && entry?.scoreScale) merged.rankingPercentage = ResumeAutofillCore.calculateRankingPercentage(entry.score, entry.scoreScale);
        }
        return merged;
      });
    };
    return {
      ...base, ...stored,
      personal: { ...base.personal, ...(stored?.personal || {}) },
      preference: { ...base.preference, ...(stored?.preference || {}) },
      education: mergeCollection("education"),
      work: mergeCollection("work"),
      projects: mergeCollection("projects"),
      schoolExperiences: mergeCollection("schoolExperiences"),
      awards: mergeCollection("awards"),
      family: mergeCollection("family")
    };
  }

  function render() {
    renderRepeatableSections();
    fields().forEach((field) => {
      const value = getPath(resume, field.dataset.path);
      if (field.type === "checkbox") {
        field.checked = !!value;
      } else {
        field.value = Array.isArray(value) ? value.join("，") : (value || "");
      }
    });
    updateStatus();
  }

  function readForm() {
    fields().forEach((field) => {
      let value;
      if (field.type === "checkbox") {
        value = field.checked;
      } else {
        value = field.value.trim();
        if (field.dataset.path === "skills" || field.dataset.path === "hobbies") value = value.split(/[，,、\n]/).map((item) => item.trim()).filter(Boolean);
      }
      setPath(resume, field.dataset.path, value);
    });
  }

  function entryShell(type, index, title, body) {
    const canRemove = resume[type].length > 1;
    return `<article class="entry-card"><h3 class="entry-title">${title} ${index + 1}</h3><button type="button" class="remove-entry" data-remove="${type}" data-index="${index}" ${canRemove ? "" : "hidden"}>删除本段</button><div class="field-grid">${body}</div></article>`;
  }

  function renderRepeatableSections() {
    document.getElementById("familyList").innerHTML = resume.family.map((item, index) => entryShell("family", index, "家庭成员", `
      <div class="field"><label for="family-relationship-${index}">与你的关系</label><input id="family-relationship-${index}" data-path="family.${index}.relationship" placeholder="例如：父亲、母亲、配偶"></div>
      <div class="field"><label for="family-name-${index}">姓名</label><input id="family-name-${index}" data-path="family.${index}.name"></div>
      <div class="field"><label for="family-gender-${index}">性别</label><select id="family-gender-${index}" data-path="family.${index}.gender"><option value="">请选择</option><option>男</option><option>女</option><option>其他</option></select></div>
      <div class="field"><label for="family-company-${index}">工作单位</label><input id="family-company-${index}" data-path="family.${index}.company" placeholder="无工作单位可填写“无”"></div>`)).join("");

    document.getElementById("educationList").innerHTML = resume.education.map((item, index) => entryShell("education", index, "教育经历", `
      <div class="field"><label for="school-${index}">学校名称</label><input id="school-${index}" data-path="education.${index}.school" placeholder="例如：浙江大学"></div>
      <div class="field"><label for="college-${index}">学院 / 院系</label><input id="college-${index}" data-path="education.${index}.college" placeholder="例如：计算机科学与技术学院"></div>
      <div class="field"><label for="major-${index}">所学专业</label><input id="major-${index}" data-path="education.${index}.major"></div>
      <div class="field"><label for="degree-${index}">学历</label><select id="degree-${index}" data-path="education.${index}.degree"><option value="">请选择</option><option>高中</option><option>中专</option><option>大专</option><option>本科</option><option>硕士</option><option>博士</option><option>其他</option></select></div>
      <div class="field"><label for="education-type-${index}">学历性质</label><select id="education-type-${index}" data-path="education.${index}.educationType"><option value="">请选择</option><option>全日制</option><option>非全日制</option><option>自考</option><option>成人教育</option><option>网络教育</option><option>其他</option></select></div>
      <div class="field"><label for="ranking-percentage-${index}">专业排名百分比</label><input id="ranking-percentage-${index}" data-path="education.${index}.rankingPercentage" inputmode="decimal" placeholder="例如：5、5% 或 前5%"><span class="hint">填写 5 表示专业排名前 5%</span></div>
      <div class="field"><label for="failed-courses-${index}">是否有挂科</label><select id="failed-courses-${index}" data-path="education.${index}.hasFailedCourses"><option value="">请选择</option><option>无挂科</option><option>有挂科</option></select></div>
      <div class="field"><label for="cet4-passed-${index}">英语四级是否通过</label><select id="cet4-passed-${index}" data-path="education.${index}.cet4Passed"><option value="">请选择</option><option>已通过</option><option>未通过</option><option>未参加</option></select></div>
      <div class="field"><label for="cet4-score-${index}">英语四级分数</label><input id="cet4-score-${index}" data-path="education.${index}.cet4Score" inputmode="numeric" placeholder="例如：520"></div>
      <div class="field"><label for="cet6-passed-${index}">英语六级是否通过</label><select id="cet6-passed-${index}" data-path="education.${index}.cet6Passed"><option value="">请选择</option><option>已通过</option><option>未通过</option><option>未参加</option></select></div>
      <div class="field"><label for="cet6-score-${index}">英语六级分数</label><input id="cet6-score-${index}" data-path="education.${index}.cet6Score" inputmode="numeric" placeholder="例如：460"></div>
      <div class="field"><label for="education-start-${index}">入学时间</label><input id="education-start-${index}" data-path="education.${index}.startDate" type="month"></div>
      <div class="field"><label for="education-end-${index}">毕业时间</label><input id="education-end-${index}" data-path="education.${index}.endDate" type="month"></div>`)).join("");

    document.getElementById("workList").innerHTML = resume.work.map((item, index) => entryShell("work", index, "工作 / 实习经历", `
      <div class="field"><label for="company-${index}">公司 / 实习单位</label><input id="company-${index}" data-path="work.${index}.company"></div>
      <div class="field"><label for="job-title-${index}">职位 / 实习岗位</label><input id="job-title-${index}" data-path="work.${index}.title"></div>
      <div class="field"><label for="work-is-intern-${index}"><input id="work-is-intern-${index}" data-path="work.${index}.isInternship" type="checkbox" style="margin-right: 6px; vertical-align: middle;">是否为实习经历？</label></div>
      <div class="field"><label for="work-start-${index}">开始时间</label><input id="work-start-${index}" data-path="work.${index}.startDate" type="month"></div>
      <div class="field"><label for="work-end-${index}">结束时间</label><input id="work-end-${index}" data-path="work.${index}.endDate" type="month"></div>
      <div class="field span-2"><label for="work-company-intro-${index}">公司介绍（部分奇葩网申需要）</label><textarea id="work-company-intro-${index}" data-path="work.${index}.companyIntro" placeholder="例如：行业领先的互联网公司，主要业务为..."></textarea></div>
      <div class="field span-2"><label for="work-duties-${index}">工作职责</label><textarea id="work-duties-${index}" data-path="work.${index}.duties" placeholder="负责了哪些核心业务模块"></textarea></div>
      <div class="field span-2"><label for="work-description-${index}">工作 / 实习内容总结</label><textarea id="work-description-${index}" data-path="work.${index}.description" placeholder="概括职责、项目和成果"></textarea></div>`)).join("");

    document.getElementById("projectsList").innerHTML = resume.projects.map((item, index) => entryShell("projects", index, "项目经历", `
      <div class="field"><label for="project-name-${index}">项目名称</label><input id="project-name-${index}" data-path="projects.${index}.name"></div>
      <div class="field"><label for="project-role-${index}">担任角色</label><input id="project-role-${index}" data-path="projects.${index}.role" placeholder="例如：项目负责人、核心开发者"></div>
      <div class="field"><label for="project-start-${index}">起始时间</label><input id="project-start-${index}" data-path="projects.${index}.startDate" type="month"></div>
      <div class="field"><label for="project-end-${index}">结束时间</label><input id="project-end-${index}" data-path="projects.${index}.endDate" type="month"></div>
      <div class="field span-2"><label for="project-goals-${index}">项目目标</label><textarea id="project-goals-${index}" data-path="projects.${index}.goals" placeholder="例如：为了解决xxx问题，提升xxx效率"></textarea></div>
      <div class="field span-2"><label for="project-duties-${index}">项目职责</label><textarea id="project-duties-${index}" data-path="projects.${index}.duties" placeholder="例如：我负责了前端架构搭建、核心模块开发"></textarea></div>
      <div class="field span-2"><label for="project-description-${index}">项目概括</label><textarea id="project-description-${index}" data-path="projects.${index}.description" placeholder="概括项目背景、目标、个人职责、采用的技术和量化成果"></textarea></div>`)).join("");

    document.getElementById("schoolExperiencesList").innerHTML = resume.schoolExperiences.map((item, index) => entryShell("schoolExperiences", index, "在校经历", `
      <div class="field"><label for="school-exp-name-${index}">活动 / 经历名称</label><input id="school-exp-name-${index}" data-path="schoolExperiences.${index}.name" placeholder="例如：学生会外联部部长"></div>
      <div class="field"><label for="school-exp-role-${index}">担任角色</label><input id="school-exp-role-${index}" data-path="schoolExperiences.${index}.role"></div>
      <div class="field"><label for="school-exp-start-${index}">起始时间</label><input id="school-exp-start-${index}" data-path="schoolExperiences.${index}.startDate" type="month"></div>
      <div class="field"><label for="school-exp-end-${index}">结束时间</label><input id="school-exp-end-${index}" data-path="schoolExperiences.${index}.endDate" type="month"></div>
      <div class="field span-2"><label for="school-exp-goals-${index}">活动目标</label><textarea id="school-exp-goals-${index}" data-path="schoolExperiences.${index}.goals"></textarea></div>
      <div class="field span-2"><label for="school-exp-duties-${index}">主要职责</label><textarea id="school-exp-duties-${index}" data-path="schoolExperiences.${index}.duties"></textarea></div>
      <div class="field span-2"><label for="school-exp-description-${index}">经历概括</label><textarea id="school-exp-description-${index}" data-path="schoolExperiences.${index}.description"></textarea></div>`)).join("");

    document.getElementById("awardsList").innerHTML = resume.awards.map((item, index) => entryShell("awards", index, "获奖经历", `
      <div class="field"><label for="award-name-${index}">奖项 / 荣誉名称</label><input id="award-name-${index}" data-path="awards.${index}.name"></div>
      <div class="field"><label for="award-date-${index}">获奖时间</label><input id="award-date-${index}" data-path="awards.${index}.date" type="month"></div>
      <div class="field span-2"><label for="award-description-${index}">奖项说明</label><textarea id="award-description-${index}" data-path="awards.${index}.description" placeholder="说明授予机构、奖项级别或成果"></textarea></div>`)).join("");
  }

  function addEntry(type) {
    readForm();
    const defaults = ResumeAutofillCore.DEFAULT_RESUME[type][0];
    resume[type].push(clone(defaults));
    render();
    scheduleSave();
  }

  function removeEntry(type, index) {
    readForm();
    if (!resume[type] || resume[type].length <= 1) return;
    resume[type].splice(index, 1);
    render();
    scheduleSave();
  }

  function applySelfEvaluationTemplate(templateName) {
    const content = SELF_EVALUATION_TEMPLATES[templateName];
    const textarea = document.getElementById("selfIntroduction");
    if (!content || !textarea) return;
    if (textarea.value.trim() && !confirm("当前已有自我评价，确定使用模板覆盖吗？")) return;
    textarea.value = content;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
    showToast("模板已应用，可继续修改");
  }

  function updateStatus() {
    readForm();
    const percent = ResumeAutofillCore.completion(resume);
    document.getElementById("completionText").textContent = `${percent}%`;
    document.getElementById("completionBar").style.width = `${percent}%`;
    document.getElementById("introCount").textContent = document.getElementById("selfIntroduction").value.length;
  }

  function setSaveState(text, saving) {
    const state = document.querySelector(".save-state");
    state.classList.toggle("saving", !!saving);
    document.getElementById("saveState").textContent = text;
  }

  async function save(showMessage) {
    clearTimeout(saveTimer);
    readForm();
    setSaveState("正在保存…", true);
    await chrome.storage.local.set({ resume, resumeUpdatedAt: Date.now() });
    setSaveState("已自动保存到本机", false);
    if (showMessage) showToast("简历资料已保存");
  }

  function scheduleSave() {
    updateStatus();
    setSaveState("有未保存的修改", true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save(false), 600);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  }

  async function clearResume() {
    if (!confirm("确定清空所有简历资料吗？此操作无法撤销。")) return;
    resume = clone(ResumeAutofillCore.DEFAULT_RESUME);
    attachments = {};
    render();
    renderAttachments();
    await chrome.storage.local.set({ resume, attachments, resumeUpdatedAt: Date.now() });
    showToast("已清空全部资料");
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, lastModified: file.lastModified, dataUrl: reader.result });
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsDataURL(file);
    });
  }

  function renderAttachments() {
    const resumeFile = attachments.resumeFile;
    const avatar = attachments.avatar;
    document.getElementById("resumeFileStatus").textContent = resumeFile ? `${resumeFile.name} · ${formatSize(resumeFile.size)}` : "尚未选择文件";
    document.getElementById("avatarStatus").textContent = avatar ? `${avatar.name} · ${formatSize(avatar.size)}` : "尚未选择图片";
    document.getElementById("removeResumeFile").hidden = !resumeFile;
    document.getElementById("removeAvatarFile").hidden = !avatar;
    const preview = document.getElementById("avatarPreview");
    preview.classList.toggle("has-image", !!avatar);
    preview.style.backgroundImage = avatar ? `url("${avatar.dataUrl}")` : "";
  }

  function formatSize(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;
  }

  function setImportStatus(message, type) {
    const status = document.getElementById("resumeImportStatus");
    status.textContent = message;
    status.className = type ? `import-${type}` : "";
  }

  async function extractResumeText(file) {
    const extension = file.name.toLowerCase().split(".").pop();
    if (["txt", "md"].includes(extension) || /^text\//.test(file.type)) return file.text();
    if (extension === "docx" || /officedocument\.wordprocessingml/.test(file.type)) {
      return ResumeImportParser.extractDocxText(await file.arrayBuffer());
    }
    if (extension === "pdf" || file.type === "application/pdf") {
      const pdfjs = await import(chrome.runtime.getURL("vendor/pdf.mjs"));
      pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.mjs");
      const documentTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
      const pdf = await documentTask.promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => `${item.str}${item.hasEOL ? "\n" : " "}`).join(""));
      }
      return pages.join("\n");
    }
    if (extension === "doc") throw new Error("旧版 DOC 无法可靠解析，请另存为 DOCX 或 PDF 后导入");
    throw new Error("暂不支持此文件格式，请使用 PDF、DOCX 或 TXT");
  }

  function hasContent(value) {
    if (Array.isArray(value)) return value.some(hasContent);
    if (value && typeof value === "object") return Object.values(value).some(hasContent);
    return String(value ?? "").trim() !== "";
  }

  function mergeImportedResume(imported) {
    let filled = 0;
    const fillObject = (target, source) => {
      Object.entries(source || {}).forEach(([key, value]) => {
        if (!hasContent(value) || hasContent(target[key])) return;
        target[key] = clone(value);
        filled++;
      });
    };
    fillObject(resume.personal, imported.personal);
    fillObject(resume.preference, imported.preference);
    if (!hasContent(resume.selfIntroduction) && hasContent(imported.selfIntroduction)) { resume.selfIntroduction = imported.selfIntroduction; filled++; }
    if (!hasContent(resume.skills) && hasContent(imported.skills)) { resume.skills = imported.skills; filled++; }
    if (!hasContent(resume.hobbies) && hasContent(imported.hobbies)) { resume.hobbies = imported.hobbies; filled++; }

    const identities = { education: "school", work: "company", projects: "name", schoolExperiences: "name", awards: "name", family: "name" };
    Object.entries(identities).forEach(([collection, identity]) => {
      const incoming = (imported[collection] || []).filter(hasContent);
      if (!incoming.length) return;
      const current = resume[collection] || [];
      const normalized = incoming.map((entry) => ({ ...clone(ResumeAutofillCore.DEFAULT_RESUME[collection][0]), ...entry }));
      if (current.length === 1 && !hasContent(current[0])) {
        resume[collection] = normalized;
        filled += normalized.reduce((count, entry) => count + Object.values(entry).filter(hasContent).length, 0);
        return;
      }
      normalized.forEach((entry) => {
        const duplicate = current.some((existing) => CoreNormalize(existing[identity]) === CoreNormalize(entry[identity]) && CoreNormalize(entry[identity]));
        if (!duplicate) { current.push(entry); filled += Object.values(entry).filter(hasContent).length; }
      });
    });
    return filled;
  }

  function CoreNormalize(value) { return ResumeAutofillCore.normalize(value); }

  async function importResumeFile(file) {
    setImportStatus("正在本地解析简历…", "");
    const text = await extractResumeText(file);
    if (text.trim().length < 20) throw new Error("没有从附件中提取到足够文字，可能是扫描版图片简历");
    const imported = ResumeImportParser.parseResumeText(text);
    const filled = mergeImportedResume(imported);
    if (!filled) {
      setImportStatus("已解析，但没有发现可补充的空白资料", "success");
      return 0;
    }
    render();
    await save(false);
    setImportStatus(`预填写完成：补充了 ${filled} 项，请核对后使用`, "success");
    return filled;
  }

  async function selectAttachment(kind, file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return showToast("文件不能超过 10MB");
    try {
      attachments[kind] = await readFile(file);
      await chrome.storage.local.set({ attachments });
      renderAttachments();
      if (kind === "resumeFile") {
        try {
          const filled = await importResumeFile(file);
          showToast(filled ? `附件已保存，并预填写 ${filled} 项` : "附件已保存");
        } catch (error) {
          setImportStatus(`附件已保存，但预填写失败：${error.message}`, "error");
          showToast("附件已保存，预填写未完成");
        }
      } else showToast("头像已保存");
    } catch (error) { showToast(error.message); }
  }

  async function removeAttachment(kind) {
    delete attachments[kind];
    await chrome.storage.local.set({ attachments });
    renderAttachments();
    showToast("文件已移除");
  }

  form.addEventListener("input", scheduleSave);
  form.addEventListener("change", scheduleSave);
  form.addEventListener("submit", async (event) => { event.preventDefault(); await save(true); });
  form.addEventListener("click", (event) => {
    const templateButton = event.target.closest("[data-self-template]");
    if (templateButton) return applySelfEvaluationTemplate(templateButton.dataset.selfTemplate);
    const addButton = event.target.closest("[data-add]");
    if (addButton) return addEntry(addButton.dataset.add);
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) removeEntry(removeButton.dataset.remove, Number(removeButton.dataset.index));
  });
  document.getElementById("clearButton").addEventListener("click", clearResume);
  document.getElementById("resumeFile").addEventListener("change", (event) => selectAttachment("resumeFile", event.target.files[0]));
  document.getElementById("avatarFile").addEventListener("change", (event) => selectAttachment("avatar", event.target.files[0]));
  document.getElementById("removeResumeFile").addEventListener("click", () => removeAttachment("resumeFile"));
  document.getElementById("removeAvatarFile").addEventListener("click", () => removeAttachment("avatar"));

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    document.querySelectorAll("nav a").forEach((link) => link.classList.toggle("active", link.hash === `#${visible.target.id}`));
  }, { rootMargin: "-90px 0px -55%", threshold: [0, .2, .5] });
  document.querySelectorAll(".form-section").forEach((section) => observer.observe(section));

  chrome.storage.local.get(["resume", "attachments"]).then(({ resume: stored, attachments: storedAttachments }) => {
    resume = mergeDefaults(stored);
    attachments = storedAttachments || {};
    render();
    renderAttachments();
  });
})();