export interface DemoPage {
  id: string
  name: string
  path: string
  highlights: string[] // data-demo selectors
  narration: string
}

export const PAGES: DemoPage[] = [
  {
    id: '01-login',
    name: '登录页',
    path: '/login',
    highlights: [],
    narration: '成本核算与报价管理系统支持多角色登录，包括管理员、采购员、审核员等，确保不同岗位只看到权限内的功能。'
  },
  {
    id: '02-dashboard',
    name: '仪表盘',
    path: '/',
    highlights: ['[data-demo="kpi-card"]', '[data-demo="recent-quotations"]'],
    narration: '登录后进入仪表盘，核心 KPI、最近报价单、业务趋势一目了然，帮助管理者快速掌握全局。'
  },
  {
    id: '03-cost-records',
    name: '成本记录',
    path: '/cost/records',
    highlights: ['[data-demo="status-filter"]', '[data-demo="record-table"]'],
    narration: '在成本记录列表中，可以按状态筛选草稿、已提交、已通过和已退回的报价，跟踪每笔业务的审批进度。'
  },
  {
    id: '04-cost-new',
    name: '新建成本分析',
    path: '/cost/new',
    highlights: ['[data-demo="cost-steps"]', '[data-demo="cost-summary"]'],
    narration: '新建成本分析时，按步骤选择法规、型号、客户和销售配置，系统实时计算原料、包材、工序、运费和总成本。'
  },
  {
    id: '05-review-pending',
    name: '审核待办',
    path: '/review/pending',
    highlights: ['[data-demo="review-stats"]', '[data-demo="review-table"]'],
    narration: '审核员在待办页面查看提交的报价，可以一键通过或驳回，系统会自动记录审批意见。'
  },
  {
    id: '06-master-processes',
    name: '工序管理',
    path: '/master/processes',
    highlights: ['[data-demo="process-table"]', '[data-demo="add-button"]'],
    narration: '工序管理模块维护不同型号和包装配置下的工序与定价，是成本计算的基础数据。'
  }
]
