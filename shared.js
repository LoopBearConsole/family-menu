// 老刘小炒 · 共享数据与订单同步（客厅 / 厨房）
const DISHES = [
  {
    "id": "d1",
    "name": "红烧肉",
    "cat": "pork",
    "catLabel": "猪肉",
    "time": 60,
    "spice": 0,
    "tagline": "肥而不腻，入口即化",
    "desc": "五花肉焯水后炒糖色，加生抽、老抽、八角、桂皮慢炖至软烂。色泽红亮，配白米饭绝了。",
    "ingredients": [
      "五花肉",
      "冰糖",
      "生抽",
      "老抽",
      "八角",
      "桂皮",
      "姜片"
    ],
    "tip": "选三层五花肉，大火收汁时多翻动，避免糊底。"
  },
  {
    "id": "d2",
    "name": "糖醋排骨",
    "cat": "pork",
    "catLabel": "猪肉",
    "time": 45,
    "spice": 0,
    "tagline": "酸甜开胃，小朋友最爱",
    "desc": "排骨焯水后炸至金黄，用糖、醋、番茄酱、酱油收汁裹匀。外酥里嫩，酸甜可口。",
    "ingredients": [
      "肋排",
      "白糖",
      "香醋",
      "番茄酱",
      "生抽",
      "淀粉"
    ],
    "tip": "炸之前拍干水分，糖醋比例大约 1:1，按口味微调。"
  },
  {
    "id": "d3",
    "name": "回锅肉",
    "cat": "pork",
    "catLabel": "猪肉",
    "time": 30,
    "spice": 2,
    "tagline": "川菜下饭之王",
    "desc": "五花肉先煮后切片，配蒜苗和豆瓣酱爆炒。肉片微卷成「灯盏窝」，香辣下饭。",
    "ingredients": [
      "五花肉",
      "蒜苗",
      "郫县豆瓣",
      "豆豉",
      "青蒜"
    ],
    "tip": "肉要煮到七八成熟再切片，炒时大火快翻。"
  },
  {
    "id": "d4",
    "name": "鱼香肉丝",
    "cat": "pork",
    "catLabel": "猪肉",
    "time": 20,
    "spice": 1,
    "tagline": "无鱼有鱼香",
    "desc": "肉丝上浆滑油，配木耳、胡萝卜、青椒丝，鱼香汁一炒即成。酸甜微辣，经典家常。",
    "ingredients": [
      "猪里脊",
      "木耳",
      "胡萝卜",
      "青椒",
      "泡椒",
      "糖",
      "醋"
    ],
    "tip": "肉丝先用蛋清淀粉上浆，滑油后更嫩。"
  },
  {
    "id": "d5",
    "name": "青椒肉丝",
    "cat": "pork",
    "catLabel": "猪肉",
    "time": 15,
    "spice": 0,
    "tagline": "十分钟快手下饭菜",
    "desc": "肉丝腌好滑油，青椒丝爆炒，生抽蚝油调味。清爽不油腻。",
    "ingredients": [
      "猪肉丝",
      "青椒",
      "蒜",
      "生抽",
      "蚝油"
    ],
    "tip": "青椒后下锅，保持脆爽。"
  },
  {
    "id": "d6",
    "name": "木须肉",
    "cat": "pork",
    "catLabel": "猪肉",
    "time": 20,
    "spice": 0,
    "tagline": "营养均衡的北方家常",
    "desc": "肉丝、鸡蛋、木耳、黄花菜、黄瓜片同炒。色彩丰富，老少皆宜。",
    "ingredients": [
      "猪肉",
      "鸡蛋",
      "木耳",
      "黄花菜",
      "黄瓜"
    ],
    "tip": "鸡蛋先炒散盛出，最后回锅更蓬松。"
  },
  {
    "id": "d7",
    "name": "宫保鸡丁",
    "cat": "chicken",
    "catLabel": "鸡肉",
    "time": 25,
    "spice": 2,
    "tagline": "花生酥脆，麻辣鲜香",
    "desc": "鸡丁上浆滑油，干辣椒、花椒、花生米爆炒，糖醋酱油勾芡。",
    "ingredients": [
      "鸡胸肉",
      "花生米",
      "干辣椒",
      "花椒",
      "葱段",
      "糖",
      "醋"
    ],
    "tip": "花生最后下，避免回潮变软。"
  },
  {
    "id": "d8",
    "name": "可乐鸡翅",
    "cat": "chicken",
    "catLabel": "鸡肉",
    "time": 35,
    "spice": 0,
    "tagline": "懒人必学甜香鸡翅",
    "desc": "鸡翅煎至两面金黄，倒入可乐、酱油、姜片焖至收汁。甜咸融合，色泽诱人。",
    "ingredients": [
      "鸡翅",
      "可乐",
      "生抽",
      "老抽",
      "姜片"
    ],
    "tip": "用普通可乐，不要无糖款；收汁到浓稠即可。"
  },
  {
    "id": "d9",
    "name": "辣子鸡",
    "cat": "chicken",
    "catLabel": "鸡肉",
    "time": 30,
    "spice": 3,
    "tagline": "在辣椒里找鸡肉",
    "desc": "鸡块炸至干香，再与大量干辣椒、花椒翻炒。越嚼越香，重庆风味。",
    "ingredients": [
      "鸡腿肉",
      "干辣椒",
      "花椒",
      "蒜",
      "姜",
      "料酒"
    ],
    "tip": "鸡块要炸干水分，口感才脆香。"
  },
  {
    "id": "d10",
    "name": "口水鸡",
    "cat": "chicken",
    "catLabel": "鸡肉",
    "time": 40,
    "spice": 2,
    "tagline": "红油蒜香，光看就流口水",
    "desc": "鸡腿煮熟冰镇斩块，淋上红油、蒜泥、花生碎调制的酱汁。麻辣鲜香。",
    "ingredients": [
      "鸡腿",
      "辣椒油",
      "蒜",
      "花生",
      "生抽",
      "香醋",
      "糖"
    ],
    "tip": "煮鸡时加姜葱料酒，冷却后更紧实好切。"
  },
  {
    "id": "d11",
    "name": "葱油鸡",
    "cat": "chicken",
    "catLabel": "鸡肉",
    "time": 35,
    "spice": 0,
    "tagline": "清爽吃出鸡肉本味",
    "desc": "鸡蒸熟撕条，热油浇葱花姜末激香，再淋酱油。简单鲜美。",
    "ingredients": [
      "三黄鸡",
      "小葱",
      "姜",
      "生抽",
      "香油"
    ],
    "tip": "油要烧热再浇，葱香才能炸出来。"
  },
  {
    "id": "d12",
    "name": "土豆烧牛肉",
    "cat": "beef",
    "catLabel": "牛肉",
    "time": 70,
    "spice": 0,
    "tagline": "一锅出的满足感",
    "desc": "牛腩焯水后与土豆块红烧慢炖。牛肉软烂，土豆吸饱肉汁。",
    "ingredients": [
      "牛腩",
      "土豆",
      "八角",
      "生抽",
      "老抽",
      "番茄酱"
    ],
    "tip": "牛肉先炖软再下土豆，避免土豆煮烂。"
  },
  {
    "id": "d13",
    "name": "水煮牛肉",
    "cat": "beef",
    "catLabel": "牛肉",
    "time": 25,
    "spice": 3,
    "tagline": "滋啦一声，满屋飘香",
    "desc": "牛肉片滑油，铺在烫好的豆芽青菜上，浇滚烫红油辣椒。",
    "ingredients": [
      "牛肉片",
      "豆芽",
      "干辣椒",
      "花椒",
      "豆瓣酱",
      "蒜"
    ],
    "tip": "牛肉逆纹切片，上浆后才嫩。"
  },
  {
    "id": "d14",
    "name": "青椒牛肉",
    "cat": "beef",
    "catLabel": "牛肉",
    "time": 15,
    "spice": 0,
    "tagline": "嫩滑爽脆快炒",
    "desc": "牛肉逆纹切片腌制，大火快炒变色，再合炒青椒调味。",
    "ingredients": [
      "牛里脊",
      "青椒",
      "蚝油",
      "生抽",
      "淀粉"
    ],
    "tip": "锅要够热，牛肉下锅后少翻，锁住汁水。"
  },
  {
    "id": "d15",
    "name": "蚝油牛肉",
    "cat": "beef",
    "catLabel": "牛肉",
    "time": 15,
    "spice": 0,
    "tagline": "粤菜经典嫩滑快炒",
    "desc": "牛肉片用蚝油、料酒、淀粉腌制，大火快炒，出锅再淋蚝油。",
    "ingredients": [
      "牛肉",
      "蚝油",
      "料酒",
      "姜",
      "葱"
    ],
    "tip": "腌制时加少许小苏打可更嫩（可选）。"
  },
  {
    "id": "d16",
    "name": "清蒸鲈鱼",
    "cat": "seafood",
    "catLabel": "鱼虾",
    "time": 25,
    "spice": 0,
    "tagline": "鲜嫩无比的宴客菜",
    "desc": "鲈鱼划刀，铺姜丝葱段蒸 8–10 分钟，倒掉腥水，淋蒸鱼豉油，热油浇葱花。",
    "ingredients": [
      "鲈鱼",
      "姜",
      "葱",
      "蒸鱼豉油",
      "热油"
    ],
    "tip": "时间宁短勿长，刚熟最嫩；蒸好后务必倒掉盘中腥水。"
  },
  {
    "id": "d17",
    "name": "红烧鱼",
    "cat": "seafood",
    "catLabel": "鱼虾",
    "time": 30,
    "spice": 0,
    "tagline": "汤汁拌饭能吃三碗",
    "desc": "鱼煎至两面金黄，加姜蒜、酱油、糖、醋红烧收汁。鱼肉入味。",
    "ingredients": [
      "鲤鱼/草鱼",
      "姜",
      "蒜",
      "生抽",
      "老抽",
      "糖",
      "醋"
    ],
    "tip": "煎鱼前擦干并冷油下锅，不易粘。"
  },
  {
    "id": "d18",
    "name": "油焖大虾",
    "cat": "seafood",
    "catLabel": "鱼虾",
    "time": 20,
    "spice": 0,
    "tagline": "红亮诱人，吮指回味",
    "desc": "大虾开背去虾线，油爆姜蒜后焖煮，料酒、酱油、糖调味。",
    "ingredients": [
      "大虾",
      "姜",
      "蒜",
      "料酒",
      "生抽",
      "糖"
    ],
    "tip": "虾壳留着焖更香，最后大火收汁。"
  },
  {
    "id": "d19",
    "name": "酸菜鱼",
    "cat": "seafood",
    "catLabel": "鱼虾",
    "time": 35,
    "spice": 2,
    "tagline": "酸辣开胃，鱼片如豆腐",
    "desc": "鱼片腌制上浆，酸菜炒香加水煮开，滑入鱼片。酸辣鲜嫩。",
    "ingredients": [
      "黑鱼/草鱼",
      "酸菜",
      "泡椒",
      "豆芽",
      "花椒",
      "蒜"
    ],
    "tip": "鱼片薄切上浆，水开后下锅，变白即熟。"
  },
  {
    "id": "d20",
    "name": "水煮鱼片",
    "cat": "seafood",
    "catLabel": "鱼虾",
    "time": 25,
    "spice": 3,
    "tagline": "麻辣鲜香，鱼片嫩滑",
    "desc": "鱼片码味上浆，铺在烫好的蔬菜上，泼滚烫干辣椒花椒油。",
    "ingredients": [
      "鱼片",
      "豆芽",
      "白菜",
      "干辣椒",
      "花椒",
      "豆瓣"
    ],
    "tip": "泼油时油要够热，香味才能激出来。"
  },
  {
    "id": "d21",
    "name": "麻婆豆腐",
    "cat": "tofu",
    "catLabel": "豆腐",
    "time": 15,
    "spice": 3,
    "tagline": "麻辣烫香，拌饭神器",
    "desc": "嫩豆腐焯水，牛肉末炒香加豆瓣豆豉，下豆腐推匀勾芡，撒花椒面。",
    "ingredients": [
      "嫩豆腐",
      "牛肉末",
      "豆瓣酱",
      "豆豉",
      "花椒粉",
      "蒜苗"
    ],
    "tip": "豆腐用盐水焯一下更不易碎。"
  },
  {
    "id": "d22",
    "name": "家常豆腐",
    "cat": "tofu",
    "catLabel": "豆腐",
    "time": 20,
    "spice": 0,
    "tagline": "外焦里嫩家常味",
    "desc": "老豆腐切片煎金黄，加木耳、青椒、胡萝卜同炒，酱油蚝油调味。",
    "ingredients": [
      "老豆腐",
      "木耳",
      "青椒",
      "胡萝卜",
      "生抽",
      "蚝油"
    ],
    "tip": "豆腐两面煎硬再翻，不容易破。"
  },
  {
    "id": "d23",
    "name": "红烧豆腐",
    "cat": "tofu",
    "catLabel": "豆腐",
    "time": 15,
    "spice": 0,
    "tagline": "简单快手，入味下饭",
    "desc": "豆腐切块煎微黄，酱油糖水焖几分钟，勾薄芡撒葱花。",
    "ingredients": [
      "豆腐",
      "生抽",
      "老抽",
      "糖",
      "葱花"
    ],
    "tip": "用内酯豆腐更嫩，用老豆腐更耐煮。"
  },
  {
    "id": "d24",
    "name": "皮蛋豆腐",
    "cat": "tofu",
    "catLabel": "豆腐",
    "time": 5,
    "spice": 0,
    "tagline": "不用开火的清爽凉菜",
    "desc": "内酯豆腐扣盘，皮蛋切碎铺上，淋酱油香油，撒葱花。",
    "ingredients": [
      "内酯豆腐",
      "皮蛋",
      "生抽",
      "香油",
      "葱花",
      "香菜"
    ],
    "tip": "豆腐先沥水，酱汁可加少许蒜末更香。"
  },
  {
    "id": "d25",
    "name": "蟹黄豆腐",
    "cat": "tofu",
    "catLabel": "豆腐",
    "time": 15,
    "spice": 0,
    "tagline": "金黄沙沙配嫩滑豆腐",
    "desc": "咸蛋黄碾碎炒出泡沫，加嫩豆腐轻轻推匀。色泽诱人。",
    "ingredients": [
      "嫩豆腐",
      "咸蛋黄",
      "葱",
      "料酒",
      "生抽"
    ],
    "tip": "蛋黄小火慢炒出油，香味更浓。"
  },
  {
    "id": "d26",
    "name": "番茄炒蛋",
    "cat": "egg",
    "catLabel": "鸡蛋",
    "time": 10,
    "spice": 0,
    "tagline": "国民第一家常菜",
    "desc": "鸡蛋炒散盛出，番茄炒出汁，倒回鸡蛋加盐糖。酸甜下饭。",
    "ingredients": [
      "鸡蛋",
      "番茄",
      "盐",
      "糖",
      "葱花"
    ],
    "tip": "番茄先炒出红油再加水焖，汤汁更浓。"
  },
  {
    "id": "d27",
    "name": "韭菜炒蛋",
    "cat": "egg",
    "catLabel": "鸡蛋",
    "time": 8,
    "spice": 0,
    "tagline": "春天的味道",
    "desc": "鸡蛋炒凝固后下韭菜段快炒，加盐出锅。香气扑鼻。",
    "ingredients": [
      "鸡蛋",
      "韭菜",
      "盐",
      "香油"
    ],
    "tip": "韭菜后下，断生即可，保持翠绿。"
  },
  {
    "id": "d28",
    "name": "虾仁滑蛋",
    "cat": "egg",
    "catLabel": "鸡蛋",
    "time": 12,
    "spice": 0,
    "tagline": "嫩滑如丝绸",
    "desc": "虾仁腌制滑油，蛋液加少许水淀粉，小火慢推至半凝固时入虾仁。",
    "ingredients": [
      "虾仁",
      "鸡蛋",
      "料酒",
      "淀粉",
      "盐"
    ],
    "tip": "火要小，不停推动，蛋才嫩滑。"
  },
  {
    "id": "d29",
    "name": "蛋炒饭",
    "cat": "egg",
    "catLabel": "鸡蛋",
    "time": 10,
    "spice": 0,
    "tagline": "隔夜饭的最高礼遇",
    "desc": "鸡蛋炒散，加米饭大火翻炒至粒粒分明，撒葱花调味。",
    "ingredients": [
      "隔夜饭",
      "鸡蛋",
      "葱花",
      "盐",
      "生抽"
    ],
    "tip": "饭要冷透、粒散；锅要热、油要够。"
  },
  {
    "id": "d30",
    "name": "酸辣土豆丝",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 10,
    "spice": 1,
    "tagline": "酸辣脆爽，秒光盘",
    "desc": "土豆切细丝泡水去淀粉，干辣椒花椒爆锅，大火快炒 30 秒，加醋出锅。",
    "ingredients": [
      "土豆",
      "干辣椒",
      "花椒",
      "蒜",
      "香醋",
      "盐"
    ],
    "tip": "切丝后多泡冷水，炒时大火快，才脆。"
  },
  {
    "id": "d31",
    "name": "干煸四季豆",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 15,
    "spice": 1,
    "tagline": "干香微辣，比肉还香",
    "desc": "四季豆煸至表皮起皱，加肉末、芽菜、干辣椒翻炒。",
    "ingredients": [
      "四季豆",
      "肉末",
      "芽菜",
      "干辣椒",
      "蒜"
    ],
    "tip": "豆子一定要煸干水分，口感才好。"
  },
  {
    "id": "d32",
    "name": "地三鲜",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 25,
    "spice": 0,
    "tagline": "东北名菜，三鲜合璧",
    "desc": "土豆、茄子、青椒分别过油，再一起炒，酱油糖调味勾芡。",
    "ingredients": [
      "土豆",
      "茄子",
      "青椒",
      "蒜",
      "生抽",
      "糖"
    ],
    "tip": "茄子先炸定型，少吸油更好吃。"
  },
  {
    "id": "d33",
    "name": "手撕包菜",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 10,
    "spice": 1,
    "tagline": "手撕比刀切更入味",
    "desc": "包菜手撕成片，干辣椒花椒爆锅大火爆炒，加醋酱油。",
    "ingredients": [
      "包菜",
      "干辣椒",
      "花椒",
      "蒜",
      "香醋",
      "生抽"
    ],
    "tip": "大火快炒，断生即可，保持脆爽。"
  },
  {
    "id": "d34",
    "name": "蒜蓉西兰花",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 10,
    "spice": 0,
    "tagline": "清爽健康蒜香浓",
    "desc": "西兰花焯水，大量蒜末爆香后快炒，加盐蚝油。",
    "ingredients": [
      "西兰花",
      "蒜",
      "盐",
      "蚝油"
    ],
    "tip": "焯水时加少许盐和油，颜色更翠绿。"
  },
  {
    "id": "d35",
    "name": "蚝油生菜",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 5,
    "spice": 0,
    "tagline": "最简单的鲜甜蔬菜",
    "desc": "生菜焯 10 秒摆盘，蚝油蒜末水淀粉煮开浇上。",
    "ingredients": [
      "生菜",
      "蚝油",
      "蒜",
      "水淀粉"
    ],
    "tip": "焯水时间极短，过久会黄软。"
  },
  {
    "id": "d36",
    "name": "清炒时蔬",
    "cat": "veggie",
    "catLabel": "蔬菜",
    "time": 8,
    "spice": 0,
    "tagline": "吃的是蔬菜本味",
    "desc": "当季绿叶菜（菜心/菠菜/空心菜），蒜末爆锅大火快炒，只加盐。",
    "ingredients": [
      "时令青菜",
      "蒜",
      "盐",
      "油"
    ],
    "tip": "菜要干，锅要热，一次别炒太多。"
  },
  {
    "id": "d37",
    "name": "紫菜蛋花汤",
    "cat": "soup",
    "catLabel": "汤羹",
    "time": 8,
    "spice": 0,
    "tagline": "三分钟快手汤",
    "desc": "水开下紫菜，淋入蛋液成蛋花，加盐、香油、葱花。",
    "ingredients": [
      "紫菜",
      "鸡蛋",
      "盐",
      "香油",
      "葱花"
    ],
    "tip": "蛋液细流淋入并轻轻搅，蛋花更漂亮。"
  },
  {
    "id": "d38",
    "name": "番茄鸡蛋汤",
    "cat": "soup",
    "catLabel": "汤羹",
    "time": 12,
    "spice": 0,
    "tagline": "酸酸暖暖一碗汤",
    "desc": "番茄炒出红油加水煮开，淋蛋花，加盐香菜。",
    "ingredients": [
      "番茄",
      "鸡蛋",
      "盐",
      "香菜",
      "香油"
    ],
    "tip": "番茄去皮炒更细腻，可加少许糖提鲜。"
  },
  {
    "id": "d39",
    "name": "排骨莲藕汤",
    "cat": "soup",
    "catLabel": "汤羹",
    "time": 90,
    "spice": 0,
    "tagline": "汤色奶白，冬天暖身",
    "desc": "排骨焯水，莲藕切块，小火慢炖一个半小时。莲藕粉糯。",
    "ingredients": [
      "排骨",
      "莲藕",
      "姜",
      "枸杞",
      "盐"
    ],
    "tip": "大火煮开转小火，盖严才奶白。"
  },
  {
    "id": "d40",
    "name": "菌菇豆腐汤",
    "cat": "soup",
    "catLabel": "汤羹",
    "time": 15,
    "spice": 0,
    "tagline": "鲜掉眉毛的素汤",
    "desc": "菌菇炒香加水煮开，下嫩豆腐，白胡椒提鲜。",
    "ingredients": [
      "香菇/蟹味菇",
      "嫩豆腐",
      "姜",
      "白胡椒",
      "盐"
    ],
    "tip": "多种菌菇搭配，鲜味更层次。"
  },
  {
    "id": "d41",
    "name": "冬瓜排骨汤",
    "cat": "soup",
    "catLabel": "汤羹",
    "time": 70,
    "spice": 0,
    "tagline": "清淡鲜美，夏日消暑",
    "desc": "排骨焯水后与冬瓜块同炖。清淡鲜美，冬瓜入口即化。",
    "ingredients": [
      "排骨",
      "冬瓜",
      "姜",
      "枸杞",
      "盐"
    ],
    "tip": "冬瓜后放，炖 20–30 分钟即可，避免过烂。"
  }
];

const ORDER_BOARD_ID = '019f7956-dbdc-767d-9801-ae89afad20d8';
const ORDER_BOARD_URL = 'https://jsonblob.com/api/jsonBlob/' + ORDER_BOARD_ID;

const IMG_FILE = { d38: 'd38b', d40: 'd40b', d41: 'd41b' };
const IMG_VER = 'v6';
const IMG_REF = '4afe10c';
const IMG_HOSTS = [
  'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://fastly.jsdelivr.net/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://gcore.jsdelivr.net/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://loopbearconsole.github.io/family-menu/images/',
  'https://raw.githubusercontent.com/LoopBearConsole/family-menu/' + IMG_REF + '/images/'
];

function findDish(id) { return DISHES.find(d => d.id === id); }

function imgFile(id) { return (IMG_FILE[id] || id) + '.jpg'; }

function imgOf(id) {
  return IMG_HOSTS[0] + imgFile(id) + '?' + IMG_VER;
}

function onImgError(el, id) {
  const step = Number(el.dataset.fb || 0) + 1;
  el.dataset.fb = String(step);
  if (step < IMG_HOSTS.length) {
    el.src = IMG_HOSTS[step] + imgFile(id) + '?' + IMG_VER + '&r=' + step;
    return;
  }
  el.style.display = 'none';
  const wrap = el.parentElement;
  if (wrap && !wrap.querySelector('.img-fallback')) {
    const d = document.createElement('div');
    d.className = 'img-fallback absolute inset-0 flex items-center justify-center text-white/90 font-display text-3xl font-bold';
    d.textContent = (el.alt || '菜').slice(0, 1);
    wrap.appendChild(d);
  }
}

function dishSteps(dish) {
  if (!dish) return [];
  if (dish.steps && dish.steps.length) return dish.steps;
  return String(dish.desc || '')
    .split(/[。！？；\n]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => /[。！？]$/.test(s) ? s : s + '。');
}

async function fetchOrderBoard() {
  const res = await fetch(ORDER_BOARD_URL, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('读取订单板失败 ' + res.status);
  const data = await res.json();
  if (!data || typeof data !== 'object') return { orders: [], updatedAt: null };
  if (!Array.isArray(data.orders)) data.orders = [];
  return data;
}

async function saveOrderBoard(board) {
  const body = JSON.stringify({
    orders: board.orders || [],
    updatedAt: new Date().toISOString()
  });
  const res = await fetch(ORDER_BOARD_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body
  });
  if (!res.ok) throw new Error('同步厨房失败 ' + res.status);
  return true;
}

async function pushKitchenOrder(order) {
  const board = await fetchOrderBoard();
  board.orders = Array.isArray(board.orders) ? board.orders : [];
  board.orders.unshift(order);
  board.orders = board.orders.slice(0, 30);
  await saveOrderBoard(board);
  return board;
}

async function updateKitchenOrderStatus(orderId, status) {
  const board = await fetchOrderBoard();
  board.orders = (board.orders || []).map(o => o.id === orderId ? Object.assign({}, o, { status: status }) : o);
  await saveOrderBoard(board);
  return board;
}

async function clearDoneKitchenOrders() {
  const board = await fetchOrderBoard();
  board.orders = (board.orders || []).filter(o => o.status !== 'done');
  await saveOrderBoard(board);
  return board;
}
