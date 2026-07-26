import type { University } from "../types";

/** 本地院校 id → 官网 */
const websitesById: Record<string, string> = {
  tsinghua: "https://www.tsinghua.edu.cn",
  pku: "https://www.pku.edu.cn",
  whu: "https://www.whu.edu.cn",
  hust: "https://www.hust.edu.cn",
  sdu: "https://www.sdu.edu.cn",
  whut: "https://www.whut.edu.cn",
  jnu: "https://www.jnu.edu.cn",
  cqupt: "https://www.cqupt.edu.cn",
  "jnu-local": "https://www.ujn.edu.cn",
  "yangtze-u": "https://www.yangtzeu.edu.cn",
  hubu: "https://www.hubu.edu.cn",
  xauat: "https://www.xauat.edu.cn",
  qdu: "https://www.qdu.edu.cn",
  henu: "https://www.henu.edu.cn",
  qufu: "https://www.qfnu.edu.cn",
  lcu: "https://www.lcu.edu.cn",
  wust: "https://www.wust.edu.cn",
  mzuzc: "https://www.scuec.edu.cn",
  "jining-u": "https://www.jnxy.edu.cn",
  weifang: "https://www.wfu.edu.cn",
  ytu: "https://www.ytu.edu.cn",
  linyi: "https://www.lyu.edu.cn",
  taishan: "https://www.tsu.edu.cn",
  "heze-u": "https://www.hzu.edu.cn",
  zaozhuang: "https://www.uzz.edu.cn",
  ctgu: "https://www.ctgu.edu.cn",
  "yangtze-n": "https://www.yznu.edu.cn",
  ldu: "https://www.ldu.edu.cn",
  dezhou: "https://www.dzu.edu.cn",
  binzhou: "https://www.bzu.edu.cn",
  "local-normal": "https://www.sdnu.edu.cn",
  rizhao: "https://www.rzpt.edu.cn",
  "hubei-n": "https://www.hbnu.edu.cn",
  jingzhou: "https://www.jzxy.edu.cn",
  huangshi: "https://www.hbpu.edu.cn",
  xiangyang: "https://www.hbuas.edu.cn",
  "wh-vtc": "https://www.wtc.edu.cn",
  "zb-vc": "https://www.zbvc.edu.cn",
  "hb-vtc": "https://www.hbvtc.edu.cn",
  "sd-cvc": "https://www.sict.edu.cn",
  "wh-ship": "https://www.wspc.edu.cn",
  "hg-poly": "https://www.hbhgzy.com.cn",
  "cj-vc": "https://www.cjxy.edu.cn",
  "jn-vc": "https://www.jnzyjsxy.cn",
  "wh-soft": "https://www.whvcse.edu.cn",
  glut: "https://www.glut.edu.cn",
  "sd-med": "https://www.sdmc.edu.cn",
};

/** 校名 → 官网（API 返回院校补充） */
const websitesByName: Record<string, string> = {
  清华大学: "https://www.tsinghua.edu.cn",
  北京大学: "https://www.pku.edu.cn",
  武汉大学: "https://www.whu.edu.cn",
  华中科技大学: "https://www.hust.edu.cn",
  山东大学: "https://www.sdu.edu.cn",
  武汉理工大学: "https://www.whut.edu.cn",
  暨南大学: "https://www.jnu.edu.cn",
  复旦大学: "https://www.fudan.edu.cn",
  上海交通大学: "https://www.sjtu.edu.cn",
  浙江大学: "https://www.zju.edu.cn",
  南京大学: "https://www.nju.edu.cn",
  中国科学技术大学: "https://www.ustc.edu.cn",
  中山大学: "https://www.sysu.edu.cn",
  四川大学: "https://www.scu.edu.cn",
  厦门大学: "https://www.xmu.edu.cn",
  天津大学: "https://www.tju.edu.cn",
  南开大学: "https://www.nankai.edu.cn",
  哈尔滨工业大学: "https://www.hit.edu.cn",
  西安交通大学: "https://www.xjtu.edu.cn",
  中南大学: "https://www.csu.edu.cn",
  湖南大学: "https://www.hnu.edu.cn",
  重庆大学: "https://www.cqu.edu.cn",
  吉林大学: "https://www.jlu.edu.cn",
  大连理工大学: "https://www.dlut.edu.cn",
  东南大学: "https://www.seu.edu.cn",
  北京师范大学: "https://www.bnu.edu.cn",
  中国人民大学: "https://www.ruc.edu.cn",
  同济大学: "https://www.tongji.edu.cn",
  北京航空航天大学: "https://www.buaa.edu.cn",
  北京理工大学: "https://www.bit.edu.cn",
  华东师范大学: "https://www.ecnu.edu.cn",
  华南理工大学: "https://www.scut.edu.cn",
  西北工业大学: "https://www.nwpu.edu.cn",
  兰州大学: "https://www.lzu.edu.cn",
  中国海洋大学: "https://www.ouc.edu.cn",
  中国农业大学: "https://www.cau.edu.cn",
  中央民族大学: "https://www.muc.edu.cn",
  电子科技大学: "https://www.uestc.edu.cn",
  北京交通大学: "https://www.bjtu.edu.cn",
  北京科技大学: "https://www.ustb.edu.cn",
  北京邮电大学: "https://www.bupt.edu.cn",
  对外经济贸易大学: "https://www.uibe.edu.cn",
  中央财经大学: "https://www.cufe.edu.cn",
  上海财经大学: "https://www.sufe.edu.cn",
  西南财经大学: "https://www.swufe.edu.cn",
  中南财经政法大学: "https://www.zuel.edu.cn",
  中国政法大学: "https://www.cupl.edu.cn",
  华东政法大学: "https://www.ecupl.edu.cn",
  西南政法大学: "https://www.swupl.edu.cn",
  西北政法大学: "https://www.nwupl.edu.cn",
  桂林理工大学: "https://www.glut.edu.cn",
  三峡大学: "https://www.ctgu.edu.cn",
  长江大学: "https://www.yangtzeu.edu.cn",
  湖北大学: "https://www.hubu.edu.cn",
  济南大学: "https://www.ujn.edu.cn",
  青岛大学: "https://www.qdu.edu.cn",
  烟台大学: "https://www.ytu.edu.cn",
  临沂大学: "https://www.lyu.edu.cn",
  鲁东大学: "https://www.ldu.edu.cn",
  聊城大学: "https://www.lcu.edu.cn",
  曲阜师范大学: "https://www.qfnu.edu.cn",
  河南大学: "https://www.henu.edu.cn",
  武汉科技大学: "https://www.wust.edu.cn",
  重庆邮电大学: "https://www.cqupt.edu.cn",
  西安建筑科技大学: "https://www.xauat.edu.cn",
  淄博职业学院: "https://www.zbvc.edu.cn",
  武汉职业技术学院: "https://www.wtc.edu.cn",
};

function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/** 解析院校官网地址 */
export function resolveSchoolWebsite(university: University): string | undefined {
  if (university.website) {
    return normalizeWebsite(university.website);
  }
  const byId = websitesById[university.id];
  if (byId) {
    return byId;
  }
  const byName = websitesByName[university.name];
  if (byName) {
    return byName;
  }
  return undefined;
}

/** 为院校列表补充官网字段 */
export function attachSchoolWebsites(universities: University[]): University[] {
  return universities.map((item) => {
    const website = resolveSchoolWebsite(item);
    return website && !item.website ? { ...item, website } : item;
  });
}
