import { guguConfig } from "../api/config";

/** 当前系统使用的招生/录取数据年份 */
export const GAOKAO_DATA_YEAR = guguConfig.defaultYear;

/** 上一年录取参考年份 */
export const PREVIOUS_GAOKAO_YEAR = GAOKAO_DATA_YEAR - 1;

/** 志愿表最大条数（新高考部分省份可达 45 个） */
export const MAX_VOLUNTEERS = 45;
