/** 咕咕数据通用响应包装 */
export interface GuguResponse<T> {
  DataStatus: {
    StatusCode: number;
    StatusDescription: string;
    DataTotalCount: number;
    RequestParameter?: string;
    ResponseDateTime?: string;
  };
  Data: T;
}

/** 高校基础信息 */
export interface GuguCollege {
  SchoolUUID: string;
  CollegeName: string;
  Province: string;
  City: string;
  Is985: boolean;
  Is211: boolean;
  IsDualClass: boolean;
  Ranking?: number;
  WebSite?: string;
  MajorList?: Array<{
    MajorTitle: string;
    Majors: string[];
  }>;
}

/** 高校录取分数线 */
export interface GuguCollegeLine {
  SchoolUUID: string;
  CollegeName: string;
  Province: string;
  Year: number;
  LowestScore: string;
  LowestRank: string;
  TypeName: string;
  SchoolInCity: string;
  Is985: boolean;
  Is211: boolean;
  IsDualClass: boolean;
  AdmissionBatch?: string;
  CollegeProvinceName?: string;
}

/** 一分一段表 */
export interface GuguScoreSection {
  ExaminationScore: string;
  CandidateCount: number;
  TotalCandidates: number;
  RankingRange: string;
  AdmissionBatchName: string;
  MinimumAdmissionScore: string;
  Ranking: string;
}

/** 高校招生计划 */
export interface GuguEnrollmentPlan {
  DataId: string;
  SchoolUUID: string;
  SchoolName: string;
  CollegeMajorName: string;
  ShortCollegeMajorName: string;
  CollegeMajorCode: string;
  RecruitCode: string;
  EnrollmentNumbers: string;
  Tuition: string;
  BatchName: string;
  Type: string;
  ProvinceName: string;
  Year: string;
  CourseSelectionRequirements: string;
  InSchoolYears: string;
  ClassOne: string;
  ClassTwo: string;
  SpecialGroupName: string;
}
