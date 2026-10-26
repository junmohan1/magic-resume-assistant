const assert = require("node:assert/strict");
const Parser = require("./resume-parser.js");

const sample = `
姓名：张三
性别：男
电话：13812345678
邮箱：zhangsan@example.com
现居城市：上海

教育经历
2020.09 - 2024.06
示例大学
学院：计算机学院
专业：计算机科学与技术
本科 全日制

工作经历
示例科技有限公司
职位：前端工程师
2024.07 - 至今
负责业务系统开发与性能优化

实习经历
实习单位：示例实习有限公司
实习岗位：开发实习生
2023.07 - 2023.12
参与内部管理系统开发

项目经历
项目名称：智能网申助手
担任角色：核心开发者
2023.01 - 2023.12
负责自动填写模块

专业技能
JavaScript、React、SQL

自我评价
学习能力强，工作认真负责。
`;

const parsed = Parser.parseResumeText(sample);
assert.equal(parsed.personal.fullName, "张三");
assert.equal(parsed.personal.phone, "13812345678");
assert.equal(parsed.personal.email, "zhangsan@example.com");
assert.equal(parsed.education[0].school, "示例大学");
assert.equal(parsed.education[0].major, "计算机科学与技术");
assert.equal(parsed.education[0].degree, "本科");
assert.equal(parsed.work[0].company, "示例科技有限公司");
assert.equal(parsed.work[0].title, "前端工程师");
assert.equal(parsed.work.length, 2);
assert.equal(parsed.work[1].company, "示例实习有限公司");
assert.equal(parsed.work[1].title, "开发实习生");
assert.equal(parsed.projects[0].name, "智能网申助手");
assert.equal(parsed.projects[0].role, "核心开发者");
assert.deepEqual(parsed.skills, ["JavaScript", "React", "SQL"]);
assert.match(parsed.selfIntroduction, /学习能力强/);
console.log("通过 15 项简历导入解析测试");
