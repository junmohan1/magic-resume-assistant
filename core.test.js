const assert = require("node:assert/strict");
const Core = require("./core.js");

const cases = [
  [{ label: "姓名" }, "fullName"],
  [{ ariaLabel: "电子邮箱", type: "email" }, "email"],
  [{ placeholder: "请输入手机号码", type: "tel" }, "phone"],
  [{ name: "candidate[first_name]" }, "firstName"],
  [{ autocomplete: "organization-title" }, "jobTitle"],
  [{ nearby: "最高学历（必填）" }, "degree"],
  [{ label: "Personal statement" }, "selfIntroduction"],
  [{ label: "岗位职责" }, "workDescription"],
  [{ label: "实习单位" }, "company"],
  [{ label: "实习岗位" }, "jobTitle"],
  [{ label: "实习内容" }, "workDescription"],
  [{ placeholder: "开始时间", context: "实习经历 实习单位 实习岗位" }, "workStartDate"],
  [{ label: "项目名称" }, "projectName"],
  [{ placeholder: "请填写项目描述" }, "projectDescription"],
  [{ label: "担任角色" }, "projectRole"],
  [{ label: "项目概括" }, "projectDescription"],
  [{ label: "起始时间", context: "项目经历 项目名称 担任角色" }, "projectStartDate"],
  [{ label: "奖项名称" }, "awardName"],
  [{ label: "获奖时间" }, "awardDate"],
  [{ label: "出生年月日" }, "birthday"],
  [{ label: "身高（cm）" }, "height"],
  [{ placeholder: "请输入体重kg" }, "weight"],
  [{ label: "兴趣爱好" }, "hobbies"],
  [{ label: "民族类别" }, "ethnicity"],
  [{ label: "政治面貌" }, "politicalStatus"],
  [{ placeholder: "请选择党派身份" }, "politicalStatus"],
  [{ label: "宗教信仰" }, "religion"],
  [{ placeholder: "请选择个人信仰" }, "religion"],
  [{ label: "国籍" }, "nationality"],
  [{ label: "所属学院" }, "college"],
  [{ label: "学历性质" }, "educationType"],
  [{ placeholder: "开始时间", context: "教育经历 学校 专业" }, "educationStartDate"],
  [{ placeholder: "结束时间", context: "项目经历 项目名称" }, "projectEndDate"],
  [{ label: "电子邮件地址" }, "email"],
  [{ label: "院系名称" }, "college"],
  [{ placeholder: "请输入学院", context: "教育经历 毕业学校 学历学位 学院 专业" }, "college"],
  [{ label: "毕业学校", placeholder: "请填写学校" }, "school"],
  [{ placeholder: "请选择专业排名" }, "rankingPercentage"],
  [{ label: "是否有挂科" }, "hasFailedCourses"],
  [{ label: "英语四级是否通过" }, "cet4Passed"],
  [{ label: "英语四级成绩" }, "cet4Score"],
  [{ label: "六级状态" }, "cet6Passed"],
  [{ placeholder: "请输入六级分数" }, "cet6Score"],
  [{ label: "家庭成员姓名" }, "familyName"],
  [{ label: "姓名", context: "家庭成员信息 与本人关系 姓名 性别 工作单位" }, "familyName"],
  [{ label: "性别", context: "家庭成员信息 与本人关系 姓名 性别 工作单位" }, "familyGender"],
  [{ label: "工作单位", context: "主要社会关系 姓名 性别 工作单位" }, "familyCompany"]
];

for (const [meta, expected] of cases) {
  const actual = Core.matchField({ label: "", ariaLabel: "", placeholder: "", name: "", id: "", nearby: "", type: "", autocomplete: "", ...meta });
  assert.equal(actual?.key, expected, `${JSON.stringify(meta)} should match ${expected}`);
}

const flattened = Core.flattenResume({
  personal: { fullName: "测试用户", email: "test@example.com" },
  education: [{ school: "测试大学", degree: "本科" }],
  work: [{ company: "示例科技", title: "产品经理", description: "负责产品规划" }],
  projects: [{ name: "智能招聘平台", role: "负责人", description: "实现自动填表" }],
  awards: [{ name: "创新大赛一等奖", date: "2025-06" }],
  preference: { expectedPosition: "高级产品经理" },
  skills: ["需求分析", "SQL"],
  hobbies: ["阅读", "跑步"]
});
assert.equal(flattened.school, "测试大学");
assert.equal(flattened.workDescription, "负责产品规划");
assert.equal(flattened.projectName, "智能招聘平台");
assert.equal(flattened.projectDescription, "实现自动填表");
assert.equal(flattened.awardName, "创新大赛一等奖");
assert.equal(flattened.skills, "需求分析、SQL");
assert.equal(flattened.hobbies, "阅读、跑步");

const multiResume = {
  education: [{ school: "第一大学" }, { school: "第二大学" }],
  work: [{ company: "第一公司" }, { company: "第二公司" }],
  projects: [{ name: "项目一" }, { name: "项目二" }, { name: "项目三" }],
  awards: [{ name: "奖项一" }, { name: "奖项二" }]
};
assert.deepEqual(Core.valuesForKey(multiResume, "school"), ["第一大学", "第二大学"]);
assert.deepEqual(Core.valuesForKey(multiResume, "company"), ["第一公司", "第二公司"]);
assert.deepEqual(Core.valuesForKey(multiResume, "projectName"), ["项目一", "项目二", "项目三"]);
assert.deepEqual(Core.valuesForKey(multiResume, "awardName"), ["奖项一", "奖项二"]);
assert.equal(Core.isRepeatableKey("projectName"), true);
assert.equal(Core.isRepeatableKey("email"), false);
assert.deepEqual(Core.valuesForKey({ education: [{ college: "计算机学院", educationType: "全日制" }, { college: "软件学院", educationType: "非全日制" }] }, "college"), ["计算机学院", "软件学院"]);
assert.deepEqual(Core.valuesForKey({ education: [{ educationType: "全日制" }, { educationType: "非全日制" }] }, "educationType"), ["全日制", "非全日制"]);
assert.equal(Core.canonicalChoice("大学本科"), Core.canonicalChoice("本科"));
assert.equal(Core.canonicalChoice("硕士研究生"), Core.canonicalChoice("硕士"));
assert.notEqual(Core.canonicalChoice("全日制"), Core.canonicalChoice("非全日制"));
assert.notEqual(Core.canonicalChoice("本科"), Core.canonicalChoice("非全日制本科"));
assert.ok(Core.choiceMatchScore("全日制", "普通全日制") >= 70);
assert.equal(Core.choiceMatchScore("全日制", "非全日制"), 0);
assert.ok(Core.choiceMatchScore("本科", "大学本科（学士学位）") >= 70);
assert.equal(Core.choiceMatchScore("本科", "硕士研究生"), 0);
assert.ok(Core.choiceMatchScore("计算机科学与技术", "计算机科学与技术专业") >= 70);
assert.ok(Core.choiceMatchScore("北京", "北京市") >= 70);
assert.equal(Core.calculateRankingPercentage("5", "100"), "5%");
assert.equal(Core.calculateRankingPercentage("7", "80"), "8.75%");
assert.equal(Core.calculateRankingPercentage("", "100"), "");
assert.equal(Core.calculateRankingPercentage("101", "100"), "");
assert.equal(Core.normalizeRankingPercentage("5"), "5%");
assert.equal(Core.normalizeRankingPercentage("前5%"), "5%");
assert.equal(Core.normalizeRankingPercentage("101%"), "");
assert.equal(Core.normalizeRankingPercentage("0"), "");
assert.ok(Core.choiceMatchScore("5%", "前5%") > Core.choiceMatchScore("5%", "前10%"));
const rankingOptions = ["前10%", "前20%", "前30%", "前40%", "前50%", "其它"];
assert.equal(rankingOptions[Core.percentageOptionIndex("10", rankingOptions)], "前10%");
assert.equal(rankingOptions[Core.percentageOptionIndex("35%", rankingOptions)], "前40%");
assert.equal(rankingOptions[Core.percentageOptionIndex("50", rankingOptions)], "前50%");
assert.equal(rankingOptions[Core.percentageOptionIndex("66", rankingOptions)], "其它");
assert.ok(Core.choiceMatchScore("无挂科", "否") >= 100);
assert.ok(Core.choiceMatchScore("有挂科", "是") >= 100);
assert.ok(Core.choiceMatchScore("已通过", "是") >= 100);
assert.ok(Core.choiceMatchScore("未通过", "否") >= 100);
assert.equal(Core.choiceMatchScore("未通过", "已通过"), 0);
assert.deepEqual(Core.valuesForKey({ family: [{ name: "张某", relationship: "父亲" }, { name: "李某", relationship: "母亲" }] }, "familyName"), ["张某", "李某"]);
assert.deepEqual(Core.valuesForKey({ education: [{ rankingPercentage: "5" }, { rankingPercentage: "前8.75%" }] }, "rankingPercentage"), ["5%", "8.75%"]);
console.log(`通过 ${cases.length + 45} 项核心测试`);
