import type { BatchLevel, University } from "../types";
import { GAOKAO_DATA_YEAR } from "../constants/gaokao";
import { attachSchoolWebsites } from "./schoolWebsites";

export { provinces } from "./provinces";
export { majorOptions, undergraduateMajorOptions, vocationalMajorOptions } from "./majors";

type RawUniversity = Omit<University, "batchLevel"> & { batchLevel?: BatchLevel };

function defineUniversities(list: RawUniversity[]): University[] {
  return list.map((item) => ({
    ...item,
    batchLevel: item.batchLevel ?? (item.level === "专科" ? "专科" : "本科"),
  }));
}

/** 2026 年参考录取分数线与位次（本地备用库） */
export const universities: University[] = attachSchoolWebsites(defineUniversities([
  // —— 本科 · 985/211 ——
  { id: "tsinghua", name: "清华大学", province: "北京", city: "北京", level: "985", year: GAOKAO_DATA_YEAR, minScore: 688, minRank: 110, hotMajors: ["计算机科学与技术", "人工智能", "电子信息工程"] },
  { id: "pku", name: "北京大学", province: "北京", city: "北京", level: "985", year: GAOKAO_DATA_YEAR, minScore: 685, minRank: 140, hotMajors: ["计算机科学与技术", "金融学", "法学"] },
  { id: "whu", name: "武汉大学", province: "湖北", city: "武汉", level: "985", year: GAOKAO_DATA_YEAR, minScore: 643, minRank: 3300, hotMajors: ["法学", "计算机科学与技术", "金融学"] },
  { id: "hust", name: "华中科技大学", province: "湖北", city: "武汉", level: "985", year: GAOKAO_DATA_YEAR, minScore: 638, minRank: 4000, hotMajors: ["计算机科学与技术", "电子信息工程", "临床医学"] },
  { id: "sdu", name: "山东大学", province: "山东", city: "济南", level: "985", year: GAOKAO_DATA_YEAR, minScore: 613, minRank: 11500, hotMajors: ["计算机科学与技术", "法学", "汉语言文学"] },
  { id: "whut", name: "武汉理工大学", province: "湖北", city: "武汉", level: "211", year: GAOKAO_DATA_YEAR, minScore: 574, minRank: 42000, hotMajors: ["计算机科学与技术", "机械设计制造及其自动化", "土木工程"] },
  { id: "jnu", name: "暨南大学", province: "广东", city: "广州", level: "211", year: GAOKAO_DATA_YEAR, minScore: 601, minRank: 17800, hotMajors: ["金融学", "计算机科学与技术", "英语"] },

  // —— 本科 · 冲刺档（高于考生约 3~30 分）——
  { id: "cqupt", name: "重庆邮电大学", province: "重庆", city: "重庆", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 561, minRank: 48000, hotMajors: ["计算机科学与技术", "软件工程", "人工智能"] },
  { id: "jnu-local", name: "济南大学", province: "山东", city: "济南", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 556, minRank: 51000, hotMajors: ["计算机科学与技术", "土木工程", "会计学"] },
  { id: "yangtze-u", name: "长江大学", province: "湖北", city: "荆州", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 555, minRank: 52000, hotMajors: ["石油工程", "计算机科学与技术", "会计学"] },
  { id: "hubu", name: "湖北大学", province: "湖北", city: "武汉", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 553, minRank: 56000, hotMajors: ["计算机科学与技术", "汉语言文学", "法学"] },
  { id: "xauat", name: "西安建筑科技大学", province: "陕西", city: "西安", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 551, minRank: 56000, hotMajors: ["土木工程", "建筑学", "会计学"] },
  { id: "qdu", name: "青岛大学", province: "山东", city: "青岛", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 548, minRank: 60000, hotMajors: ["计算机科学与技术", "软件工程", "会计学"] },
  { id: "henu", name: "河南大学", province: "河南", city: "开封", level: "双一流", year: GAOKAO_DATA_YEAR, minScore: 559, minRank: 52000, hotMajors: ["汉语言文学", "法学", "英语"] },
  { id: "qufu", name: "曲阜师范大学", province: "山东", city: "济宁", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 546, minRank: 61000, hotMajors: ["汉语言文学", "英语", "计算机科学与技术"] },
  { id: "lcu", name: "聊城大学", province: "山东", city: "聊城", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 544, minRank: 62500, hotMajors: ["汉语言文学", "计算机科学与技术", "会计学"] },
  { id: "wust", name: "武汉科技大学", province: "湖北", city: "武汉", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 568, minRank: 46000, hotMajors: ["计算机科学与技术", "机械设计制造及其自动化", "会计学"] },

  // —— 本科 · 稳妥档 ——
  { id: "mzuzc", name: "中南民族大学", province: "湖北", city: "武汉", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 543, minRank: 63000, hotMajors: ["计算机科学与技术", "金融学", "英语"] },
  { id: "jining-u", name: "济宁学院", province: "山东", city: "济宁", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 541, minRank: 64500, hotMajors: ["汉语言文学", "计算机科学与技术", "英语"] },
  { id: "weifang", name: "潍坊学院", province: "山东", city: "潍坊", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 540, minRank: 65500, hotMajors: ["计算机科学与技术", "会计学", "英语"] },
  { id: "ytu", name: "烟台大学", province: "山东", city: "烟台", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 535, minRank: 68500, hotMajors: ["计算机科学与技术", "法学", "英语"] },
  { id: "linyi", name: "临沂大学", province: "山东", city: "临沂", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 534, minRank: 69200, hotMajors: ["计算机科学与技术", "汉语言文学", "会计学"] },
  { id: "taishan", name: "泰山学院", province: "山东", city: "泰安", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 533, minRank: 70000, hotMajors: ["汉语言文学", "英语", "计算机科学与技术"] },
  { id: "heze-u", name: "菏泽学院", province: "山东", city: "菏泽", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 531, minRank: 71500, hotMajors: ["汉语言文学", "会计学", "英语"] },
  { id: "zaozhuang", name: "枣庄学院", province: "山东", city: "枣庄", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 529, minRank: 73000, hotMajors: ["计算机科学与技术", "英语", "会计学"] },
  { id: "ctgu", name: "三峡大学", province: "湖北", city: "宜昌", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 526, minRank: 76000, hotMajors: ["电气工程", "土木工程", "计算机科学与技术"] },
  { id: "yangtze-n", name: "长江师范学院", province: "重庆", city: "重庆", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 536, minRank: 68000, hotMajors: ["汉语言文学", "英语", "计算机科学与技术"] },

  // —— 本科 · 保底档 ——
  { id: "ldu", name: "鲁东大学", province: "山东", city: "烟台", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 521, minRank: 80000, hotMajors: ["汉语言文学", "英语", "会计学"] },
  { id: "dezhou", name: "德州学院", province: "山东", city: "德州", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 515, minRank: 84000, hotMajors: ["计算机科学与技术", "会计学", "英语"] },
  { id: "binzhou", name: "滨州学院", province: "山东", city: "滨州", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 512, minRank: 86500, hotMajors: ["汉语言文学", "英语", "会计学"] },
  { id: "local-normal", name: "省属师范大学", province: "山东", city: "济南", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 508, minRank: 96000, hotMajors: ["汉语言文学", "英语", "会计学"] },
  { id: "rizhao", name: "日照职业技术学院", province: "山东", city: "日照", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 505, minRank: 98000, hotMajors: ["会计学", "计算机科学与技术", "英语"] },
  { id: "hubei-n", name: "湖北师范大学", province: "湖北", city: "黄石", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 518, minRank: 82000, hotMajors: ["汉语言文学", "英语", "计算机科学与技术"] },
  { id: "jingzhou", name: "荆州学院", province: "湖北", city: "荆州", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 510, minRank: 90000, hotMajors: ["计算机科学与技术", "会计学", "英语"] },
  { id: "huangshi", name: "湖北理工学院", province: "湖北", city: "黄石", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 507, minRank: 94000, hotMajors: ["土木工程", "计算机科学与技术", "会计学"] },
  { id: "xiangyang", name: "湖北文理学院", province: "湖北", city: "襄阳", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 503, minRank: 99000, hotMajors: ["汉语言文学", "计算机科学与技术", "英语"] },

  // —— 专科 ——
  { id: "wh-vtc", name: "武汉职业技术学院", province: "湖北", city: "武汉", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 420, minRank: 180000, hotMajors: ["计算机应用技术", "软件技术", "电子商务"] },
  { id: "zb-vc", name: "淄博职业学院", province: "山东", city: "淄博", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 410, minRank: 190000, hotMajors: ["计算机应用技术", "会计", "机电一体化"] },
  { id: "hb-vtc", name: "湖北职业技术学院", province: "湖北", city: "武汉", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 395, minRank: 205000, hotMajors: ["护理", "计算机应用技术", "电子商务"] },
  { id: "sd-cvc", name: "山东商业职业技术学院", province: "山东", city: "济南", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 430, minRank: 175000, hotMajors: ["会计", "电子商务", "计算机应用技术"] },
  { id: "wh-ship", name: "武汉船舶职业技术学院", province: "湖北", city: "武汉", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 405, minRank: 195000, hotMajors: ["船舶工程技术", "机电一体化", "计算机应用技术"] },
  { id: "hg-poly", name: "黄冈职业技术学院", province: "湖北", city: "黄冈", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 385, minRank: 215000, hotMajors: ["护理", "建筑工程技术", "会计"] },
  { id: "cj-vc", name: "长江职业学院", province: "湖北", city: "武汉", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 400, minRank: 200000, hotMajors: ["计算机应用技术", "会计", "电子商务"] },
  { id: "jn-vc", name: "济宁职业技术学院", province: "山东", city: "济宁", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 375, minRank: 225000, hotMajors: ["机电一体化", "计算机应用技术", "会计"] },
  { id: "wh-soft", name: "武汉软件工程职业学院", province: "湖北", city: "武汉", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 390, minRank: 210000, hotMajors: ["软件技术", "计算机应用技术", "人工智能"] },
  { id: "glut", name: "桂林理工大学", province: "广西", city: "桂林", level: "普通本科", year: GAOKAO_DATA_YEAR, minScore: 528, minRank: 74000, hotMajors: ["地质工程", "土木工程", "计算机科学与技术"] },
  { id: "sd-med", name: "山东医学高等专科学校", province: "山东", city: "临沂", level: "专科", year: GAOKAO_DATA_YEAR, minScore: 450, minRank: 165000, hotMajors: ["护理", "临床医学", "药学"] },
]));
