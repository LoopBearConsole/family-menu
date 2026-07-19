# 老刘小炒

纯静态家常菜点菜页：点开看详情、加购物车、一键下单。适合手机扫码放在厨房。

**客厅点餐：** https://loopbearconsole.github.io/family-menu/  

**厨房看板：** https://loopbearconsole.github.io/family-menu/kitchen.html  

菜谱来源：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)（MIT）

- 约 350+ 道菜，含食材与分步做法  
- 客厅扫码选菜、加购物车、一键下单  
- 订单自动同步到厨房看板  
- 厨房点开菜名看制作步骤  

重新导入菜谱：

```bash
# 需已 clone HowToCook 到 D:\Grok\HowToCook
node import-howtocook.js D:\Grok\HowToCook
git add -A && git commit -m "更新 HowToCook 菜谱" && git push
```

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
