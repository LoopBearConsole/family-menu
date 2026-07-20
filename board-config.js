// 老刘小炒 · 国内云同步配置
// 推荐：Gitee（码云）免费私有仓库 — 国内可注册
// 在厨房页点「配置同步」填写即可（保存在手机本地，不会强制提交到 GitHub）
//
// 快速开通：
// 1. https://gitee.com 注册/登录
// 2. 右上角 + → 新建仓库 → 私有 → 名称填 laoliu-board（空仓库即可）
// 3. 右上角头像 → 设置 → 私人令牌 → 生成令牌（勾选 projects）
// 4. 厨房页「配置同步」填入：用户名、仓库名、私人令牌
window.BOARD_CONFIG = {
  provider: 'gitee',
  gitee: {
    owner: '',      // 你的 Gitee 用户名
    repo: 'laoliu-board',
    token: '',      // 私人令牌（只存在本机 localStorage 更安全）
    path: 'board.json'
  }
};
