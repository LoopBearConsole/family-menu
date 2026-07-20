// 老刘小炒 · 国内云同步配置（LeanCloud 免费版）
// 在厨房页点「配置同步」可图形化填写，会自动写到本机；
// 两台手机需使用同一套 AppId / AppKey / 服务器地址。
//
// 免费开通（约 2 分钟）：
// 1. 打开 https://console.leancloud.cn 注册/登录
// 2. 创建应用 → 开发版（免费）
// 3. 应用 → 设置 → 应用凭证 → 复制 AppID、AppKey
// 4. 同一页复制「服务器地址 / REST API 服务器地址」
// 5. 粘贴到厨房页「配置同步」里保存
//
// 也可直接改下面三项后 git push（AppKey 是客户端密钥，可放前端）
window.BOARD_CONFIG = {
  provider: 'leancloud',
  leancloud: {
    appId: '',
    appKey: '',
    // 例：https://xxx.lc-cn-n1-shared.com  或控制台显示的 serverURL
    serverURL: ''
  }
};
