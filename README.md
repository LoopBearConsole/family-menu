# 老刘小炒

纯静态家常菜点菜页：点开看详情、加购物车、一键下单。适合手机扫码放在厨房。

## 正确打开方式（重要）

| 用途 | 地址 |
|------|------|
| **客厅点餐** | https://loopbearconsole.github.io/family-menu/ |
| **厨房看板** | https://loopbearconsole.github.io/family-menu/kitchen.html |

> 不要用 `cdn.jsdmirror.com/.../index.html` 当网址打开——  
> 镜像会把 HTML 当**纯文本**返回，浏览器会显示源码，不是网页。

图片 / 脚本会自动走国内 CDN（jsdmirror），入口网页用 GitHub Pages 渲染。

菜谱来源：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)（MIT）

### 极速版优化
- 首屏轻量菜谱约 80KB；详情按需加载
- 列表缩略图 + 懒加载
- 去掉 Tailwind / Google 字体
- 首屏 24 道，下滑再加载


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
