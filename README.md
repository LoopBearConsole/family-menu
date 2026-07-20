# 老刘小炒

纯静态家常菜点菜页：点开看详情、加购物车、一键下单。适合手机扫码放在厨房。

## 正确打开方式（重要）

| 用途 | 地址 |
|------|------|
| **客厅点餐** | https://loopbearconsole.github.io/family-menu/ |
| **厨房看板** | https://loopbearconsole.github.io/family-menu/kitchen.html |

> 不要用 `cdn.jsdmirror.com/.../index.html` 当网址打开——  
> 镜像会把 HTML 当**纯文本**返回，浏览器会显示源码，不是网页。

### 国内云同步（LeanCloud 免费，两台手机互通）

1. 打开 [LeanCloud 控制台](https://console.leancloud.cn) 注册，创建**开发版**应用  
2. 复制 **AppID、AppKey、服务器地址（serverURL）**  
3. 打开厨房页 → 点 **「配置同步」** → 粘贴三项 → **保存并测试**  
4. 点 **「生成配置码」**，客厅手机扫码导入同一套配置（或两台都手填）  

配置后：客厅下单 ↔ 厨房自动刷新；「开始做 / 做完了」可正常同步。

也可编辑仓库里的 `board-config.js` 后 `git push`。

菜谱来源：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)（MIT）


## 怎么用

1. 双击打开 `index.html`，或用任意静态服务器托管
2. 点菜品卡片看详情（做法、食材、小贴士、辣度）
3. 点右下角 `+` 或详情里「加入购物车」
4. 底部栏点「一键下单」→ 弹出「妈——做饭啦——！」

购物车和最近订单会记在浏览器 `localStorage` 里。

## 部署到 GitHub Pages

```bash
cd menu
git init
git add .
git commit -m "家里的菜单"
git branch -M main
git remote add origin https://github.com/你的用户名/family-menu.git
git push -u origin main
```

仓库 Settings → Pages → Source 选 `main` 分支。  
访问：`https://你的用户名.github.io/family-menu/`

## 文件结构

```
menu/
  index.html      # 页面与逻辑
  images/d1.jpg … # 41 道菜本地图片
  README.md
```

## 改菜单

编辑 `index.html` 里的 `dishes` 数组，并在 `images/` 放入对应 `dN.jpg`。
