(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ResumeAutofillCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FIELD_RULES = [
    rule("fullName", "姓名", ["姓名", "真实姓名", "应聘者姓名", "name", "full name", "fullname", "candidate name"], 100),
    rule("firstName", "名", ["first name", "given name", "firstname", "名"], 106),
    rule("lastName", "姓", ["last name", "family name", "surname", "lastname", "姓"], 106),
    rule("phone", "手机号", ["手机号码", "移动电话", "联系方式", "手机", "联系电话", "联系电话号码", "电话号码", "phone", "mobile", "telephone", "tel"], 100),
    rule("email", "邮箱", ["电子邮箱", "电子邮件", "邮件地址", "邮箱地址", "邮箱", "e-mail", "email"], 100),
    rule("gender", "性别", ["性别", "gender", "sex"], 100),
    rule("birthday", "出生日期", ["出生年月日", "出生年月", "出生日期", "生日", "birthday", "date of birth", "birth date", "dob"], 100),
    rule("height", "身高", ["身高", "身高 cm", "height", "height cm", "height in cm"], 100),
    rule("weight", "体重", ["体重", "体重 kg", "weight", "weight kg", "weight in kg"], 100),
    rule("location", "现居地", ["现居住地", "当前城市", "所在城市", "现居地", "居住城市", "所在地", "location", "current city", "city of residence"], 100),
    rule("hometown", "籍贯", ["户籍所在地", "户口所在地", "籍贯", "户籍", "hometown", "native place"], 100),
    rule("idType", "证件类型", ["证件类型", "身份证件类型", "证件类别", "选择证件", "证件名称", "id type", "document type", "id kind"], 108),
    rule("idNumber", "证件号码", ["身份证号码", "身份证号", "证件号码", "证件号", "护照号", "护照号码", "id card", "identity number", "national id", "passport number"], 100),
    rule("wechat", "微信", ["微信号", "微信", "wechat", "weixin"], 100),
    rule("qq", "QQ", ["qq号", "qq号码", "qq"], 100),
    rule("address", "详细地址", ["联系地址", "通讯地址", "详细地址", "家庭住址", "address", "street address", "mailing address"], 100),
    rule("nationality", "国籍", ["国籍", "nationality", "citizenship"], 100),
    rule("ethnicity", "民族", ["民族", "民族类别", "所属民族", "ethnicity", "ethnic group", "race ethnicity"], 104),
    rule("politicalStatus", "政治面貌", ["政治面貌", "政治身份", "党派", "党派身份", "政治状态", "political status", "political affiliation"], 104),
    rule("religion", "宗教信仰", ["宗教信仰", "宗教", "个人信仰", "信仰", "religion", "religious belief", "faith"], 104),
    rule("familyRelationship", "家庭关系", ["家庭关系", "与本人关系", "家庭成员关系", "亲属关系", "成员称谓", "relationship to applicant", "family relationship"], 110),
    rule("familyName", "家庭成员姓名", ["家庭成员姓名", "家属姓名", "亲属姓名", "成员姓名", "family member name", "relative name"], 110),
    rule("familyGender", "家庭成员性别", ["家庭成员性别", "家属性别", "亲属性别", "family member gender", "relative gender"], 110),
    rule("familyCompany", "家庭成员工作单位", ["家庭成员工作单位", "家属工作单位", "亲属工作单位", "家庭成员单位", "family member employer", "relative employer"], 110),
    rule("maritalStatus", "婚姻状况", ["婚姻状况", "婚姻状态", "marital status"], 100),
    rule("website", "个人主页", ["个人网站", "个人主页", "作品集", "项目链接", "portfolio", "personal website", "homepage", "github", "linkedin"], 96),
    rule("degree", "最高学历", ["最高学历", "学历学位", "学历", "degree", "education level", "academic qualification"], 92),
    rule("school", "学校", ["毕业学校", "毕业院校", "学校名称", "就读学校", "学校", "院校", "请填写学校", "请输入学校", "school", "university", "college"], 104),
    rule("college", "学院", ["学院名称", "所属学院", "院系名称", "所属院系", "院系", "学院", "department", "faculty", "school department"], 104),
    rule("major", "专业", ["所学专业", "专业名称", "专业", "major", "field of study"], 92),
    rule("educationType", "学历性质", ["学历性质", "学习形式", "培养方式", "教育类型", "是否全日制", "education type", "study mode", "education mode", "full time status"], 104),
    rule("rankingPercentage", "专业排名", ["专业排名百分比", "专业排名", "成绩排名", "排名百分比", "class rank", "major rank", "ranking percentile"], 108),
    rule("hasFailedCourses", "是否有挂科", ["是否有挂科", "有无挂科", "挂科情况", "不及格情况", "是否存在不及格", "failed course", "failed courses", "course failure"], 108),
    rule("cet4Passed", "英语四级是否通过", ["英语四级是否通过", "四级是否通过", "英语四级状态", "四级状态", "cet4 status", "cet 4 status", "passed cet4"], 108),
    rule("cet4Score", "英语四级分数", ["英语四级分数", "英语四级成绩", "四级分数", "四级成绩", "cet4 score"], 108),
    rule("cet6Passed", "英语六级是否通过", ["英语六级是否通过", "六级是否通过", "英语六级状态", "六级状态", "cet6 status", "passed cet6"], 108),
    rule("cet6Score", "英语六级分数", ["英语六级分数", "英语六级成绩", "六级分数", "六级成绩", "cet6 score"], 108),
    rule("graduationDate", "毕业时间", ["毕业日期", "毕业时间", "graduation date", "graduation time"], 100),
    rule("educationStartDate", "入学时间", ["入学时间", "入学日期", "教育开始时间", "enrollment date"], 100),
    
    // 🌟 新增：最近公司
    rule("recentCompany", "最近公司", ["最近公司", "目前公司", "上一家公司", "recent company", "latest company"], 104),
    
    // 工作/实习
    rule("company", "公司 / 实习单位", ["公司名称", "任职公司", "工作单位", "实习单位", "实习公司", "实践单位", "雇主", "company", "employer", "organization"], 102),
    rule("jobTitle", "职位 / 实习岗位", ["最近职位", "职位名称", "岗位名称", "实习岗位", "实习职位", "实习职务", "实践岗位", "职务", "job title", "position", "title"], 104),
    rule("workType", "工作性质", ["工作性质", "职位类别", "经历类型", "工作类型", "是否实习", "employment type", "job type"], 108),
    rule("workStartDate", "工作开始时间", ["工作开始时间", "任职开始时间", "实习开始时间", "实践开始时间", "employment start date", "work start date"], 104),
    rule("workEndDate", "工作结束时间", ["工作结束时间", "离职时间", "任职结束时间", "实习结束时间", "实践结束时间", "employment end date", "work end date"], 104),
    rule("yearsOfExperience", "工作年限", ["工作年限", "工作经验", "从业年限", "years of experience", "work experience"], 100),
    rule("expectedSalary", "期望薪资", ["期望月薪", "期望薪资", "薪资要求", "expected salary", "salary expectation"], 100),
    rule("currentSalary", "当前薪资", ["当前薪资", "目前薪资", "现薪资", "当前月薪", "目前月薪", "current salary", "present salary"], 104),
    rule("expectedPosition", "期望职位", ["求职意向", "意向岗位", "应聘职位", "期望职位", "expected position"], 100),
    rule("expectedCity", "期望城市", ["期望城市", "意向城市", "期望工作地", "目标城市", "期望工作地点", "expected city"], 104),
    rule("availableDate", "到岗时间", ["可到岗时间", "到岗日期", "到岗时间", "available date"], 100),
    rule("workDescription", "工作 / 实习内容", ["工作内容", "工作描述", "主要工作", "实习内容", "实习描述", "实习工作", "实践内容", "工作职责", "描述", "work description", "job description", "responsibilities"], 106),
    rule("workCompanyIntro", "公司介绍", ["公司介绍", "企业简介", "公司简介", "企业介绍", "company introduction"], 104),
    
    // 项目经历 / 在校经历
    rule("projectName", "项目名称 / 活动名称", ["项目名称", "项目名", "在校经历", "活动名称", "实践项目", "项目经验", "project name", "project title"], 104),
    rule("projectRole", "担任角色", ["担任角色", "项目角色", "项目职位", "项目职务", "个人角色", "职责", "project role", "role in project"], 106),
    rule("projectStartDate", "项目起始时间", ["项目起始时间", "项目开始时间", "项目开始日期", "活动开始时间", "project start date"], 106),
    rule("projectEndDate", "项目结束时间", ["项目结束时间", "项目截止时间", "活动结束时间", "project end date"], 104),
    rule("projectDescription", "项目概括", ["项目概括", "项目概述", "项目简介", "项目总结", "项目描述", "项目介绍", "项目内容", "项目成果", "描述", "project summary", "project description"], 106),
    rule("projectGoals", "项目目标", ["项目目标", "项目目的", "预期成果", "project goals"], 106),
    rule("projectDuties", "项目中职责", ["项目中职责", "个人职责", "负责内容", "我的职责", "主要负责", "project responsibilities", "project duties"], 106),
    
    rule("awardName", "奖项名称", ["奖项名称", "获奖名称", "荣誉名称", "奖项荣誉", "award name", "honor name", "award title"], 104),
    rule("awardDate", "获奖时间", ["获奖时间", "获奖日期", "授予时间", "award date"], 104),
    rule("awardDescription", "奖项说明", ["奖项说明", "获奖说明", "获奖描述", "荣誉说明", "award description"], 104),
    rule("selfIntroduction", "个人简介", ["个人介绍", "自我介绍", "个人简介", "个人评价", "自我评价", "自我描述", "简介", "summary", "profile", "about me"], 100),    rule("skills", "技能", ["专业技能", "技能特长", "技能", "skills", "technical skills"], 96),
    rule("hobbies", "兴趣爱好", ["兴趣爱好", "兴趣特长", "个人爱好", "爱好", "hobbies", "interests"], 100)
  ];

  function rule(key, label, aliases, priority) { return { key, label, aliases, priority }; }
  function normalize(text) { return String(text || "").toLowerCase().replace(/[＊*：:()（）\[\]【】_\-\/\\]/g, " ").replace(/\s+/g, " ").trim(); }
  function compact(text) { return normalize(text).replace(/\s/g, ""); }

  function canonicalChoice(value) {
    const text = compact(value);
    const aliases = [
      [/^(非全日制|非全日|在职)$/, "非全日制"], [/^(全日制|全日)$/, "全日制"],
      [/^(大学本科|本科|学士)$/, "本科"], [/^(大学专科|专科|大专|高职)$/, "大专"],
      [/^(硕士研究生|研究生硕士|硕士)$/, "硕士"], [/^(博士研究生|研究生博士|博士)$/, "博士"],
      [/^(普通高中|高中)$/, "高中"], [/^(中等专业学校|中专)$/, "中专"],
      [/^(男性|男|male)$/, "男"], [/^(女性|女|female)$/, "女"],
      [/^(应届生|应届毕业生|无工作经验|无经验)$/, "应届生"]
    ];
    const matched = aliases.find(([pattern]) => pattern.test(text));
    return matched ? matched[1] : text;
  }

  function textSimilarity(left, right) {
    if (!left || !right) return 0;
    if (left === right) return 1;
    const grams = (text) => text.length < 2 ? new Set([text]) : new Set(Array.from({ length: text.length - 1 }, (_, index) => text.slice(index, index + 2)));
    const a = grams(left);
    const b = grams(right);
    const intersection = Array.from(a).filter((item) => b.has(item)).length;
    return (2 * intersection) / (a.size + b.size);
  }

  function choiceMatchScore(savedValue, optionValue) {
    const saved = compact(savedValue);
    const option = compact(optionValue);
    if (!saved || !option) return 0;
    if (saved === option) return 120;
    if (canonicalChoice(saved) === canonicalChoice(option)) return 112;

    if (/应届/.test(saved) && /应届/.test(option)) return 115;

    const yesNo = /^(是|有|yes|true)$/.test(option) ? "是" : /^(否|无|no|false)$/.test(option) ? "否" : "";
    if (yesNo) {
      if (/无挂科|没有挂科|未挂科/.test(saved) && yesNo === "否") return 112;
      if (/有挂科|存在挂科/.test(saved) && yesNo === "是") return 112;
      if (/未通过|不通过|未合格/.test(saved) && yesNo === "否") return 112;
      if (/已通过|^通过$|已合格/.test(saved) && yesNo === "是") return 112;
      if (/实习/.test(saved) && yesNo === "是") return 112;
      if (/正式|全职|工作/.test(saved) && yesNo === "否") return 112;
    }

    const savedPercent = parsePercentage(saved);
    const percentScore = savedPercent == null ? 0 : percentageOptionScore(savedPercent, optionValue);
    if (percentScore) return percentScore;

    const polarity = (text) => /非全日|在职/.test(text) ? "非全日制" : /全日/.test(text) ? "全日制" : "";
    const degree = (text) => /博士/.test(text) ? "博士" : /硕士|研究生/.test(text) ? "硕士" : /本科|学士/.test(text) ? "本科" : /大专|专科|高职/.test(text) ? "大专" : /中专/.test(text) ? "中专" : /高中/.test(text) ? "高中" : "";
    const gender = (text) => /女|female/.test(text) ? "女" : /男|male/.test(text) ? "男" : "";
    const passStatus = (text) => /未通过|不通过|未合格/.test(text) ? "未通过" : /已通过|^通过$|已合格/.test(text) ? "已通过" : /未参加|未报考/.test(text) ? "未参加" : "";
    const failedStatus = (text) => /无挂科|没有挂科|未挂科/.test(text) ? "无挂科" : /有挂科|存在挂科/.test(text) ? "有挂科" : "";
    
    if ([polarity, degree, gender, passStatus, failedStatus].some((extract) => {
      const left = extract(saved);
      const right = extract(option);
      return left && right && left !== right;
    })) return 0;

    const simplify = (text) => text.replace(/(特别行政区|自治区|专业|方向|类别|类型|学历|学位|省|市|区|县)$/g, "");
    const simpleSaved = simplify(saved);
    const simpleOption = simplify(option);
    if (simpleSaved === simpleOption && simpleSaved.length >= 2) return 102;
    if (Math.min(simpleSaved.length, simpleOption.length) >= 2 && (simpleSaved.includes(simpleOption) || simpleOption.includes(simpleSaved))) return 88;
    const similarity = textSimilarity(simpleSaved, simpleOption);
    return similarity >= 0.68 ? 70 + similarity * 20 : 0;
  }

  function calculateRankingPercentage(rank, cohortSize) {
    const rawRank = String(rank ?? "").trim();
    const rawSize = String(cohortSize ?? "").trim();
    if (!rawRank || !rawSize) return "";
    const numerator = Number(rawRank.replace(/[^\d.-]/g, ""));
    const denominator = Number(rawSize.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0 || numerator <= 0 || numerator > denominator) return "";
    const value = Math.min(100, Math.max(0, numerator / denominator * 100));
    return `${Number(value.toFixed(2))}%`;
  }

  function normalizeRankingPercentage(value) {
    const match = String(value ?? "").match(/(\d+(?:\.\d+)?)\s*%?/);
    if (!match) return "";
    const percentage = Number(match[1]);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) return "";
    return `${Number(percentage.toFixed(2))}%`;
  }

  function parsePercentage(value) {
    const match = String(value || "").match(/(-?\d+(?:\.\d+)?)\s*%/);
    return match ? Number(match[1]) : null;
  }

  function percentageOptionScore(value, optionText) {
    const text = String(optionText || "").toLowerCase().replace(/\s/g, "").replace(/[～—–]/g, "-");
    let match = text.match(/(\d+(?:\.\d+)?)%?(?:-|~|至|到)(\d+(?:\.\d+)?)%/);
    if (match) {
      const low = Number(match[1]);
      const high = Number(match[2]);
      return value >= Math.min(low, high) && value <= Math.max(low, high) ? 108 : 0;
    }
    match = text.match(/(\d+(?:\.\d+)?)%(以上|及以上|或以上)/);
    if (match) return value >= Number(match[1]) ? 106 : 0;
    match = text.match(/(\d+(?:\.\d+)?)%(以下|及以下|或以下)/);
    if (match) return value <= Number(match[1]) ? 106 : 0;
    match = text.match(/^前(\d+(?:\.\d+)?)%$/);
    if (match) return value <= Number(match[1]) ? 100 - Math.min(20, Number(match[1]) - value) : 0;
    match = text.match(/^(\d+(?:\.\d+)?)%$/);
    return match && Math.abs(value - Number(match[1])) < 0.01 ? 110 : 0;
  }

  function percentageOptionIndex(savedValue, optionValues) {
    const percentage = parsePercentage(normalizeRankingPercentage(savedValue));
    if (percentage == null) return -1;
    const options = optionValues.map((value, index) => ({ value: String(value || ""), index }));
    const scored = options.map((option) => ({ ...option, score: percentageOptionScore(percentage, option.value) }))
      .filter((option) => option.score > 0)
      .sort((left, right) => right.score - left.score);
    if (scored.length) return scored[0].index;

    const thresholds = options.map((option) => {
      const match = compact(option.value).match(/^前(\d+(?:\.\d+)?)%$/);
      return match ? Number(match[1]) : null;
    }).filter((value) => value != null);
    const maximum = thresholds.length ? Math.max(...thresholds) : null;
    if (maximum != null && percentage > maximum) {
      const other = options.find((option) => /^(其他|其它|other|others)$/.test(compact(option.value)));
      if (other) return other.index;
    }
    return -1;
  }

  function scoreAlias(source, alias) {
    const s = normalize(source);
    const a = normalize(alias);
    if (!s || !a) return 0;
    if (s === a) return 120;
    if (compact(s) === compact(a)) return 116;
    if (compact(a).length <= 1) return 0;
    if (s.startsWith(a) || s.endsWith(a)) return 88;
    if (s.includes(a)) return 76;
    const similarity = textSimilarity(compact(s), compact(a));
    if (Math.min(compact(s).length, compact(a).length) >= 4 && similarity >= 0.62) return 58 + similarity * 18;
    return 0;
  }

  function matchField(meta) {
    const contextualFamily = matchContextualFamily(meta);
    if (contextualFamily) return contextualFamily;
    const contextualDate = matchContextualDate(meta);
    if (contextualDate) return contextualDate;
    const sources = [
      { value: meta.label, weight: 1 },
      { value: meta.ariaLabel, weight: 0.98 },
      { value: meta.placeholder, weight: 0.92 },
      { value: meta.name, weight: 0.88 },
      { value: meta.id, weight: 0.82 },
      { value: meta.nearby, weight: 0.68 }
    ];
    let best = null;
    for (const field of FIELD_RULES) {
      let score = 0;
      for (const source of sources) {
        for (const alias of field.aliases) {
          score = Math.max(score, scoreAlias(source.value, alias) * source.weight);
        }
      }
      if (meta.type === "email" && field.key === "email") score = Math.max(score, 112);
      if (meta.type === "tel" && field.key === "phone") score = Math.max(score, 112);
      if (meta.autocomplete) {
        const autocompleteMap = {
          name: "fullName", "given-name": "firstName", "family-name": "lastName",
          email: "email", tel: "phone", bday: "birthday", sex: "gender",
          organization: "recentCompany", "organization-title": "jobTitle", url: "website"
        };
        if (autocompleteMap[meta.autocomplete] === field.key) score = Math.max(score, 118);
      }
      if (score >= 56 && (!best || score + field.priority / 1000 > best.score)) {
        best = { key: field.key, label: field.label, score: score + field.priority / 1000 };
      }
    }
    return best;
  }

  function matchContextualFamily(meta) {
    const context = normalize([meta.context, meta.nearby].join(" "));
    if (!/家庭成员|家庭关系|家庭情况|家属|亲属|主要社会关系|family member|family relationship|relative/.test(context)) return null;
    const directTarget = normalize([meta.label, meta.placeholder, meta.ariaLabel, meta.name, meta.id].join(" "));
    const target = directTarget || normalize(meta.nearby);
    if (/与本人关系|成员关系|亲属关系|关系|称谓|relationship/.test(target)) return { key: "familyRelationship", label: "家庭关系", score: 123 };
    if (/姓名|名字|name/.test(target)) return { key: "familyName", label: "家庭成员姓名", score: 123 };
    if (/性别|gender|sex/.test(target)) return { key: "familyGender", label: "家庭成员性别", score: 123 };
    if (/工作单位|任职单位|单位|公司|employer|company|organization/.test(target)) return { key: "familyCompany", label: "家庭成员工作单位", score: 123 };
    return null;
  }

  function matchContextualDate(meta) {
    const target = normalize([meta.label, meta.placeholder, meta.ariaLabel, meta.name, meta.id].join(" "));
    const context = normalize([meta.context, meta.nearby].join(" "));
    const dateLike = /时间|日期|年月|起止|开始|结束|截止|毕业时间|入学时间|date|time|month|year/.test(target) || ["date", "month", "datetime-local"].includes(String(meta.type || "").toLowerCase());
    if (!dateLike) return null;

    const isStart = /开始|起始|入学时间|起|start|from/.test(target);
    const isEnd = /结束|截止|毕业|止|end|to/.test(target);
    if (!isStart && !isEnd) return null;

    if (/项目|project|在校|活动|实践|校园|社团/.test(context)) {
      return { key: isStart ? "projectStartDate" : "projectEndDate", label: isStart ? "项目开始时间" : "项目结束时间", score: 121 };
    }
    if (/工作|任职|公司|职业|实习|实践|work|employment|company|internship/.test(context)) {
      return { key: isStart ? "workStartDate" : "workEndDate", label: isStart ? "工作开始时间" : "工作结束时间", score: 121 };
    }
    if (/教育|学历|学校|学院|学习|education|school|university/.test(context)) {
      return { key: isStart ? "educationStartDate" : "graduationDate", label: isStart ? "入学时间" : "毕业时间", score: 121 };
    }
    
    if (/项目|project/.test(target)) return { key: isStart ? "projectStartDate" : "projectEndDate", label: isStart ? "项目开始时间" : "项目结束时间", score: 120 };
    if (/工作|work/.test(target)) return { key: isStart ? "workStartDate" : "workEndDate", label: isStart ? "工作开始时间" : "工作结束时间", score: 120 };

    return null;
  }

  function flattenResume(resume) {
    const personal = resume.personal || {};
    const education = (resume.education || [])[0] || {};
    const work = (resume.work || [])[0] || {};
    const project = (resume.projects || [])[0] || (resume.schoolExperiences || [])[0] || {};
    const award = (resume.awards || [])[0] || {};
    const family = (resume.family || [])[0] || {};
    const preference = resume.preference || {};
    
    return {
      ...personal,
      // 🌟 最近公司兜底：如果没填，就取第一段工作经历
      recentCompany: personal.recentCompany || work.company || "",
      
      school: education.school || "",
      major: education.major || "",
      degree: education.degree || "",
      rankingPercentage: normalizeRankingPercentage(education.rankingPercentage) || calculateRankingPercentage(education.professionalRank, education.cohortSize),
      hasFailedCourses: education.hasFailedCourses || "",
      cet4Passed: education.cet4Passed || "",
      cet4Score: education.cet4Score || "",
      cet6Passed: education.cet6Passed || "",
      cet6Score: education.cet6Score || "",
      graduationDate: education.endDate || "",
      
      company: work.company || "",
      jobTitle: work.title || "",
      workType: work.isInternship ? "实习" : "全职",
      workDescription: work.description || "",
      workCompanyIntro: work.companyIntro || "", 
      workDuties: work.duties || "",
      
      projectName: project.name || "",
      projectRole: project.role || "",
      projectStartDate: project.startDate || "",
      projectEndDate: project.endDate || "",
      projectDescription: project.description || "",
      projectGoals: project.goals || "",
      projectDuties: project.duties || "", 
      
      awardName: award.name || "",
      awardDate: award.date || "",
      awardDescription: award.description || "",
      familyRelationship: family.relationship || "",
      familyName: family.name || "",
      familyGender: family.gender || "",
      familyCompany: family.company || "",
      yearsOfExperience: personal.yearsOfExperience || "",
      currentSalary: personal.currentSalary || preference.currentSalary || "", 
      expectedPosition: preference.expectedPosition || "",
      expectedCity: preference.expectedCity || "",
      expectedSalary: preference.expectedSalary || "",
      availableDate: preference.availableDate || "",
      selfIntroduction: resume.selfIntroduction || "",
      skills: Array.isArray(resume.skills) ? resume.skills.join("、") : (resume.skills || ""),
      hobbies: Array.isArray(resume.hobbies) ? resume.hobbies.join("、") : (resume.hobbies || "")
    };
  }

  const REPEATABLE_FIELDS = {
    school: ["education", "school"], college: ["education", "college"], major: ["education", "major"], degree: ["education", "degree"], educationType: ["education", "educationType"], rankingPercentage: ["education", "rankingPercentage"], hasFailedCourses: ["education", "hasFailedCourses"], cet4Passed: ["education", "cet4Passed"], cet4Score: ["education", "cet4Score"], cet6Passed: ["education", "cet6Passed"], cet6Score: ["education", "cet6Score"], educationStartDate: ["education", "startDate"], graduationDate: ["education", "endDate"],
    
    company: ["work", "company"], jobTitle: ["work", "title"], workType: ["work", "isInternship"], workStartDate: ["work", "startDate"], workEndDate: ["work", "endDate"], workDescription: ["work", "description"], workCompanyIntro: ["work", "companyIntro"], workDuties: ["work", "duties"], 
    
    projectName: ["projects", "name"], projectRole: ["projects", "role"], projectStartDate: ["projects", "startDate"], projectEndDate: ["projects", "endDate"], projectDescription: ["projects", "description"], projectGoals: ["projects", "goals"], projectDuties: ["projects", "duties"], 
    
    awardName: ["awards", "name"], awardDate: ["awards", "date"], awardDescription: ["awards", "description"],
    familyRelationship: ["family", "relationship"], familyName: ["family", "name"], familyGender: ["family", "gender"], familyCompany: ["family", "company"]
  };

  function isRepeatableKey(key) { return Boolean(REPEATABLE_FIELDS[key]); }

  function valuesForKey(resume, key, pageContext = "") {
    if (key === "rankingPercentage") return (resume?.education || []).map((item) => normalizeRankingPercentage(item?.rankingPercentage) || calculateRankingPercentage(item?.professionalRank, item?.cohortSize));
    
    const mapping = REPEATABLE_FIELDS[key];
    if (!mapping) return [flattenResume(resume || {})[key] || ""];
    
    let [collection, property] = mapping;

    if (collection === "work") {
      // 🌟 增加一个对 pageContext 的强判断
      const isInternshipContext = /实习|intern|practice/.test(pageContext);
      const isFullTimeContext = /工作|全职|任职|work|employment/.test(pageContext) && !isInternshipContext;
      
      if (isInternshipContext || isFullTimeContext) {
        return (resume?.work || []).filter(item => {
          const isIntern = item.isInternship === true || item.isInternship === "是";
          return isInternshipContext ? isIntern : !isIntern;
        }).map((item) => {
          if (property === "isInternship") return item.isInternship ? "实习" : "全职";
          return item?.[property] || "";
        });
      }
    }

    if (collection === "projects") {
      const projectsList = resume?.projects || [];
      const schoolList = resume?.schoolExperiences || [];
      const contextIsSchool = /在校|活动|学校|社团|班级|school|activity|club/.test(pageContext);
      
      if (contextIsSchool) {
        const targetList = schoolList.some(i => i.name) ? schoolList : projectsList;
        return targetList.map(item => item?.[property] || "");
      }
      
      const targetList = projectsList.some(i => i.name) ? projectsList : schoolList;
      return targetList.map(item => item?.[property] || "");
    }

    return (resume?.[collection] || []).map((item) => {
      if (property === "isInternship") return item.isInternship ? "实习" : "全职";
      return item?.[property] || "";
    });
  }

  function completion(resume) {
    const values = flattenResume(resume || {});
    const important = ["fullName", "phone", "email", "location", "school", "major", "degree", "company", "jobTitle", "projectName", "awardName", "expectedPosition", "selfIntroduction", "skills"];
    const done = important.filter((key) => String(values[key] || "").trim()).length;
    return Math.round((done / important.length) * 100);
  }

  const DEFAULT_RESUME = {
    personal: { 
      fullName: "", firstName: "", lastName: "", phone: "", email: "", gender: "", birthday: "", height: "", weight: "", location: "", hometown: "", address: "", nationality: "", ethnicity: "", politicalStatus: "", religion: "", maritalStatus: "", idNumber: "", wechat: "", qq: "", website: "", yearsOfExperience: "", currentSalary: "", recentCompany: ""
    },
    education: [{ school: "", college: "", major: "", degree: "", educationType: "", rankingPercentage: "", hasFailedCourses: "", cet4Passed: "", cet4Score: "", cet6Passed: "", cet6Score: "", startDate: "", endDate: "" }],
    work: [{ company: "", title: "", startDate: "", endDate: "", companyIntro: "", description: "", duties: "", isInternship: false }],
    projects: [{ name: "", role: "", startDate: "", endDate: "", goals: "", description: "", duties: "" }],
    schoolExperiences: [{ name: "", role: "", startDate: "", endDate: "", goals: "", description: "", duties: "" }],
    awards: [{ name: "", date: "", description: "" }],
    family: [{ relationship: "", name: "", gender: "", company: "" }],
    preference: { expectedPosition: "", expectedCity: "", availableDate: "", expectedSalary: "", currentSalary: "" },
    selfIntroduction: "",
    skills: [],
    hobbies: []
  };

  return { FIELD_RULES, DEFAULT_RESUME, normalize, canonicalChoice, choiceMatchScore, percentageOptionIndex, calculateRankingPercentage, normalizeRankingPercentage, matchField, flattenResume, isRepeatableKey, valuesForKey, completion };
});