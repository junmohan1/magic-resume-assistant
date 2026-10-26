(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ResumeImportParser = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clean(value) {
    return String(value || "").replace(/[\u00a0\t]+/g, " ").replace(/ +/g, " ").trim();
  }

  async function extractDocxText(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    let eocd = -1;
    for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index--) {
      if (view.getUint32(index, true) === 0x06054b50) { eocd = index; break; }
    }
    if (eocd < 0) throw new Error("DOCX 文件结构无效");
    const entryCount = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);
    const decoder = new TextDecoder();
    let target = null;
    for (let entry = 0; entry < entryCount && offset + 46 <= bytes.length; entry++) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      if (name === "word/document.xml") target = { method, compressedSize, localOffset };
      offset += 46 + nameLength + extraLength + commentLength;
    }
    if (!target) throw new Error("DOCX 中没有找到正文内容");
    const localNameLength = view.getUint16(target.localOffset + 26, true);
    const localExtraLength = view.getUint16(target.localOffset + 28, true);
    const dataStart = target.localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + target.compressedSize);
    let xmlBytes;
    if (target.method === 0) xmlBytes = compressed;
    else if (target.method === 8) {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error("DOCX 使用了暂不支持的压缩方式");
    return decoder.decode(xmlBytes)
      .replace(/<w:(?:p|br|cr)[^>]*>/g, "\n")
      .replace(/<w:tab[^>]*\/>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  }

  function linesOf(text) {
    return String(text || "").replace(/\r/g, "\n").split(/\n+/).map(clean).filter(Boolean);
  }

  function labeled(lines, labels) {
    const pattern = new RegExp(`^(?:${labels.join("|")})\\s*[：:]?\\s*(.+)$`, "i");
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && clean(match[1])) return clean(match[1]);
    }
    return "";
  }

  function dateRange(text) {
    const match = String(text).match(/(20\d{2}|19\d{2})[.年\/-]?(\d{1,2})?\s*(?:至|到|—|–|-|~|～)\s*((?:20\d{2}|19\d{2})[.年\/-]?(?:\d{1,2})?|至今|现在)/);
    if (!match) return { startDate: "", endDate: "" };
    const format = (year, month) => month ? `${year}-${String(month).padStart(2, "0")}` : year;
    return { startDate: format(match[1], match[2]), endDate: /至今|现在/.test(match[3]) ? "至今" : match[3].replace(/[.年/]/g, "-").replace(/-$/, "") };
  }

  function section(lines, headings) {
    const allHeadings = /^(教育经历|教育背景|工作经历|任职经历|实习经历|实践经历|项目经历|项目经验|获奖经历|奖项荣誉|荣誉奖项|技能|专业技能|自我评价|个人评价|自我介绍|求职意向)$/;
    const start = lines.findIndex((line) => headings.some((heading) => line === heading || line.startsWith(`${heading} `)));
    if (start < 0) return [];
    const result = [];
    for (let index = start + 1; index < lines.length; index++) {
      if (allHeadings.test(lines[index])) break;
      result.push(lines[index]);
    }
    return result;
  }

  function allSections(lines, headings) {
    const allHeadings = /^(教育经历|教育背景|工作经历|实习经历|实践经历|任职经历|项目经历|项目经验|获奖经历|奖项荣誉|荣誉奖项|技能|专业技能|自我评价|个人评价|自我介绍|求职意向)$/;
    const result = [];
    for (let index = 0; index < lines.length; index++) {
      if (!headings.some((heading) => lines[index] === heading || lines[index].startsWith(`${heading} `))) continue;
      for (let cursor = index + 1; cursor < lines.length && !allHeadings.test(lines[cursor]); cursor++) result.push(lines[cursor]);
    }
    return result;
  }

  function educationEntries(lines) {
    const part = section(lines, ["教育经历", "教育背景"]);
    if (!part.length) return [];
    const schools = [];
    part.forEach((line, index) => {
      const explicit = line.match(/^(?:毕业学校|学校|院校)\s*[：:]\s*(.+)$/);
      const institution = explicit?.[1] || (/大学|学院|学校/.test(line) && !/^(学院|院系|所属学院)\s*[：:]/.test(line) && line.length <= 80 ? line.replace(/^\d{4}.*?\s+/, "") : "");
      if (institution && !schools.some((item) => item.value === institution)) schools.push({ value: clean(institution), index });
    });
    return schools.slice(0, 6).map((school, position) => {
      const end = schools[position + 1]?.index ?? part.length;
      const block = part.slice(Math.max(0, school.index - 1), end).join("\n");
      const degree = (block.match(/博士|硕士|本科|大专|专科|高中|中专/) || [""])[0];
      return {
        school: school.value,
        college: labeled(linesOf(block), ["学院", "院系", "所属学院"]),
        major: labeled(linesOf(block), ["专业", "所学专业", "专业名称"]),
        degree,
        educationType: (block.match(/非全日制|全日制|自考|成人教育|网络教育/) || [""])[0],
        rankingPercentage: "",
        hasFailedCourses: "", cet4Passed: "", cet4Score: "", cet6Passed: "", cet6Score: "",
        ...dateRange(block)
      };
    });
  }

  function workEntries(lines) {
    const part = allSections(lines, ["工作经历", "任职经历", "实习经历", "实践经历"]);
    if (!part.length) return [];
    const companies = [];
    part.forEach((line, index) => {
      const explicit = line.match(/^(?:公司|公司名称|工作单位|实习单位|实习公司|实践单位|单位)\s*[：:]\s*(.+)$/);
      const value = explicit?.[1] || (/(公司|集团|事务所|研究院|研究所)$/.test(line) && line.length <= 80 ? line : "");
      if (value) companies.push({ value: clean(value), index });
    });
    return companies.slice(0, 8).map((company, position) => {
      const end = companies[position + 1]?.index ?? part.length;
      const blockLines = part.slice(company.index, end);
      const block = blockLines.join("\n");
      return {
        company: company.value,
        title: labeled(blockLines, ["职位", "职位名称", "岗位", "职务", "实习岗位", "实习职位", "实践岗位"]) || clean(blockLines.find((line) => /工程师|经理|专员|顾问|设计师|运营|实习生|开发|产品/.test(line) && line !== company.value) || ""),
        description: blockLines.filter((line) => line !== company.value && !/^(职位|岗位|职务|实习岗位|实习职位|实践岗位)\s*[：:]/.test(line) && !dateRange(line).startDate).join("；"),
        ...dateRange(block)
      };
    });
  }

  function projectEntries(lines) {
    const part = section(lines, ["项目经历", "项目经验"]);
    if (!part.length) return [];
    const markers = [];
    part.forEach((line, index) => {
      const explicit = line.match(/^(?:项目名称|项目)\s*[：:]\s*(.+)$/);
      if (explicit?.[1]) markers.push({ value: clean(explicit[1]), index });
    });
    if (!markers.length && part.length) markers.push({ value: part[0].replace(/^\d{4}.*?\s+/, ""), index: 0 });
    return markers.slice(0, 8).map((marker, position) => {
      const blockLines = part.slice(marker.index, markers[position + 1]?.index ?? part.length);
      const block = blockLines.join("\n");
      return {
        name: marker.value,
        role: labeled(blockLines, ["担任角色", "项目角色", "角色"]),
        description: blockLines.filter((line) => line !== marker.value && !/^(项目名称|项目|担任角色|项目角色|角色)\s*[：:]/.test(line) && !dateRange(line).startDate).join("；"),
        ...dateRange(block)
      };
    });
  }

  function parseResumeText(text) {
    const lines = linesOf(text);
    const joined = lines.join("\n");
    const phone = (joined.match(/(?:\+?86[- ]?)?1[3-9]\d{9}/) || [""])[0].replace(/\s/g, "");
    const email = (joined.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/) || [""])[0];
    const fullName = labeled(lines, ["姓名", "Name", "真实姓名"]);
    const skills = section(lines, ["技能", "专业技能"]).join("、").split(/[、，,；;]/).map(clean).filter(Boolean);
    const introduction = section(lines, ["自我评价", "个人评价", "自我介绍"]).join("\n");
    return {
      personal: {
        fullName, phone, email,
        gender: labeled(lines, ["性别", "Gender"]),
        birthday: labeled(lines, ["出生日期", "出生年月", "生日"]),
        location: labeled(lines, ["现居地", "现居城市", "所在城市"]),
        hometown: labeled(lines, ["籍贯", "户籍所在地"]),
        website: (joined.match(/https?:\/\/[^\s]+/) || [""])[0]
      },
      education: educationEntries(lines),
      work: workEntries(lines),
      projects: projectEntries(lines),
      skills,
      selfIntroduction: introduction
    };
  }

  return { parseResumeText, extractDocxText, calculateDateRange: dateRange };
});
