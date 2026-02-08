import "dotenv/config";
import argon2 from "argon2";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "Missing ADMIN_USERNAME/ADMIN_PASSWORD. Set them in .env before seeding.",
    );
  }

  if (password.toLowerCase().includes("change-me")) {
    throw new Error(
      "Refusing to seed with weak default password. Set a strong ADMIN_PASSWORD in .env.",
    );
  }

  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { username },
    create: {
      username,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      deletedAt: null,
    },
  });

  // Get admin user for seeding user-scoped data
  const adminUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!adminUser) {
    throw new Error("Admin user not found after upsert");
  }

  // seed system dictionaries
  const dicts = [
    {
      code: "ITEM_STATUS",
      name: "物品状态",
      items: [
        { value: "IN_STOCK", label: "在库" },
        { value: "BORROWED", label: "借出" },
        { value: "DAMAGED", label: "损坏" },
        { value: "SOLD", label: "售出" },
        { value: "LOST", label: "丢失" },
        { value: "REPAIRING", label: "维修中" },
        { value: "DONATED", label: "捐赠" },
        { value: "SCRAPPED", label: "报废" },
      ],
    },
    {
      code: "ACQUIRE_METHOD",
      name: "获取方式",
      items: [
        { value: "BUY", label: "购买" },
        { value: "GIFT", label: "赠与" },
        { value: "EXCHANGE", label: "交换" },
        { value: "HANDMADE", label: "自制" },
        { value: "RENT", label: "租赁" },
        { value: "INHERIT", label: "继承" },
        { value: "FOUND", label: "拾得" },
        { value: "PRIZE", label: "奖品" },
      ],
    },
    {
      code: "ITEM_CONDITION",
      name: "物品成色",
      items: [
        { value: "NEW", label: "全新" },
        { value: "LIKE_NEW", label: "几乎全新" },
        { value: "GOOD", label: "良好" },
        { value: "FAIR", label: "一般" },
        { value: "POOR", label: "较差" },
      ],
    },
    {
      code: "STORAGE_LOCATION",
      name: "存放位置",
      items: [
        { value: "LIVING_ROOM", label: "客厅" },
        { value: "BEDROOM", label: "卧室" },
        { value: "STUDY", label: "书房" },
        { value: "KITCHEN", label: "厨房" },
        { value: "BALCONY", label: "阳台" },
        { value: "STORAGE_ROOM", label: "储藏室" },
        { value: "GARAGE", label: "车库" },
        { value: "BASEMENT", label: "地下室" },
        { value: "ATTIC", label: "阁楼" },
        { value: "OFFICE", label: "办公室" },
      ],
    },
    {
      code: "MATERIAL",
      name: "材质",
      items: [
        { value: "PLASTIC", label: "塑料" },
        { value: "METAL", label: "金属" },
        { value: "WOOD", label: "木材" },
        { value: "GLASS", label: "玻璃" },
        { value: "FABRIC", label: "布料" },
        { value: "LEATHER", label: "皮革" },
        { value: "CERAMIC", label: "陶瓷" },
        { value: "PAPER", label: "纸质" },
        { value: "RUBBER", label: "橡胶" },
        { value: "STONE", label: "石材" },
      ],
    },
    {
      code: "PRIORITY",
      name: "优先级",
      items: [
        { value: "HIGH", label: "高" },
        { value: "MEDIUM", label: "中" },
        { value: "LOW", label: "低" },
      ],
    },
  ];

  for (const d of dicts) {
    const dict = await prisma.dictionary.upsert({
      where: {
        scopeOwner_code: {
          scopeOwner: "system",
          code: d.code,
        },
      },
      create: {
        scope: "SYSTEM",
        scopeOwner: "system",
        code: d.code,
        name: d.name,
      },
      update: {
        name: d.name,
        deletedAt: null,
      },
    });

    for (let i = 0; i < d.items.length; i++) {
      const it = d.items[i];
      await prisma.dictionaryItem.upsert({
        where: {
          dictionaryId_value: {
            dictionaryId: dict.id,
            value: it.value,
          },
        },
        create: {
          dictionaryId: dict.id,
          dictionaryCode: d.code,
          value: it.value,
          label: it.label,
          sortOrder: i,
          isActive: true,
        },
        update: {
          label: it.label,
          sortOrder: i,
          isActive: true,
          deletedAt: null,
        },
      });
    }
  }

  // seed system templates
  const templates = [
    {
      group: "电子产品",
      name: "通用电子产品",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: true },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
        { key: "color", label: "颜色", type: "text", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "手机",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: true },
        { key: "model", label: "型号", type: "text", required: true },
        { key: "imei", label: "IMEI", type: "text", required: false },
        { key: "storage", label: "存储容量", type: "select", required: false, options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
        { key: "carrier", label: "运营商", type: "select", required: false, options: ["中国移动", "中国联通", "中国电信", "无锁"] },
      ],
    },
    {
      group: "电子产品",
      name: "电脑",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: true },
        { key: "model", label: "型号", type: "text", required: true },
        { key: "cpu", label: "处理器", type: "text", required: false },
        { key: "ram", label: "内存", type: "text", required: false },
        { key: "storage", label: "硬盘", type: "text", required: false },
        { key: "gpu", label: "显卡", type: "text", required: false },
        { key: "os", label: "操作系统", type: "select", required: false, options: ["Windows 11", "Windows 10", "macOS", "Linux", "其他"] },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "书籍",
      name: "图书",
      schema: [
        { key: "author", label: "作者", type: "text", required: false },
        { key: "publisher", label: "出版社", type: "text", required: false },
        { key: "isbn", label: "ISBN", type: "text", required: false },
        { key: "publishDate", label: "出版日期", type: "date", required: false },
        { key: "pages", label: "页数", type: "number", required: false },
        { key: "language", label: "语言", type: "select", required: false, options: ["中文", "英文", "日文", "其他"] },
        { key: "isRead", label: "是否已读", type: "boolean", required: false },
      ],
    },
    {
      group: "服装",
      name: "衣物",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "size", label: "尺码", type: "select", required: false, options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "season", label: "季节", type: "select", required: false, options: ["春", "夏", "秋", "冬", "四季"] },
        { key: "careInstructions", label: "洗涤说明", type: "text", required: false },
      ],
    },
    {
      group: "家具",
      name: "家具",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "dimensions", label: "尺寸", type: "text", required: false },
        { key: "weight", label: "重量", type: "text", required: false },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "assemblyRequired", label: "需要组装", type: "boolean", required: false },
      ],
    },
    {
      group: "收藏品",
      name: "手办模型",
      schema: [
        { key: "series", label: "系列", type: "text", required: false },
        { key: "character", label: "角色", type: "text", required: false },
        { key: "manufacturer", label: "厂商", type: "text", required: false },
        { key: "scale", label: "比例", type: "text", required: false },
        { key: "releaseDate", label: "发售日期", type: "date", required: false },
        { key: "isLimited", label: "限定版", type: "boolean", required: false },
        { key: "serialNumber", label: "编号", type: "text", required: false },
      ],
    },
    {
      group: "工具",
      name: "工具设备",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "power", label: "功率", type: "text", required: false },
        { key: "voltage", label: "电压", type: "text", required: false },
        { key: "weight", label: "重量", type: "text", required: false },
        { key: "lastMaintenance", label: "上次保养", type: "date", required: false },
      ],
    },
    {
      group: "文具",
      name: "文具用品",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "quantity", label: "数量", type: "number", required: false },
      ],
    },
    {
      group: "运动器材",
      name: "运动装备",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "size", label: "尺寸", type: "text", required: false },
        { key: "weight", label: "重量", type: "text", required: false },
        { key: "sport", label: "运动类型", type: "select", required: false, options: ["跑步", "游泳", "骑行", "健身", "球类", "其他"] },
      ],
    },
    {
      group: "通用",
      name: "财务与保修",
      schema: [
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "purchaseChannel", label: "购买渠道", type: "text", required: false },
        { key: "productLink", label: "商品链接", type: "text", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
        { key: "invoiceNumber", label: "发票编号", type: "text", required: false },
        { key: "originalPrice", label: "原价（元）", type: "number", required: false },
        { key: "discountPrice", label: "实付（元）", type: "number", required: false },
      ],
    },
    {
      group: "通用",
      name: "维护记录",
      schema: [
        { key: "lastMaintenance", label: "上次维护", type: "date", required: false },
        { key: "nextMaintenance", label: "下次维护", type: "date", required: false },
        { key: "maintenanceInterval", label: "维护周期", type: "text", required: false },
        { key: "instructions", label: "使用说明", type: "text", required: false },
        { key: "notes", label: "注意事项", type: "text", required: false },
      ],
    },
    {
      group: "通用",
      name: "来源与去向",
      schema: [
        { key: "sourceFrom", label: "来源人", type: "text", required: false },
        { key: "giftOccasion", label: "赠送场合", type: "text", required: false },
        { key: "borrowedTo", label: "出借给", type: "text", required: false },
        { key: "borrowedDate", label: "出借日期", type: "date", required: false },
        { key: "expectedReturn", label: "应归还日期", type: "date", required: false },
        { key: "soldTo", label: "售给", type: "text", required: false },
        { key: "soldDate", label: "售出日期", type: "date", required: false },
        { key: "soldPrice", label: "售价（元）", type: "number", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "相机",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "sensorType", label: "传感器", type: "select", required: false, options: ["全画幅", "APS-C", "M4/3", "1英寸", "其他"] },
        { key: "megapixels", label: "像素（MP）", type: "number", required: false },
        { key: "lens", label: "镜头", type: "text", required: false },
        { key: "shutterCount", label: "快门数", type: "number", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "耳机音响",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["入耳式", "头戴式", "音箱", "条形音箱", "其他"] },
        { key: "wireless", label: "无线", type: "boolean", required: false },
        { key: "noiseCancelling", label: "降噪", type: "boolean", required: false },
        { key: "batteryLife", label: "续航（小时）", type: "number", required: false },
      ],
    },
    {
      group: "家电",
      name: "厨房电器",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "power", label: "功率（W）", type: "number", required: false },
        { key: "capacity", label: "容量", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "家电",
      name: "空调冰箱",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "energyRating", label: "能效等级", type: "select", required: false, options: ["一级", "二级", "三级", "四级", "五级"] },
        { key: "capacity", label: "容量/匹数", type: "text", required: false },
        { key: "installDate", label: "安装日期", type: "date", required: false },
        { key: "lastMaintenance", label: "上次保养", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "车辆",
      name: "汽车",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "year", label: "年份", type: "number", required: false },
        { key: "vin", label: "车架号", type: "text", required: false },
        { key: "licensePlate", label: "车牌号", type: "text", required: false },
        { key: "mileage", label: "里程（km）", type: "number", required: false },
        { key: "lastMaintenance", label: "上次保养", type: "date", required: false },
        { key: "nextMaintenance", label: "下次保养", type: "date", required: false },
        { key: "insuranceExpiry", label: "保险到期", type: "date", required: false },
      ],
    },
    {
      group: "车辆",
      name: "自行车电动车",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["山地车", "公路车", "折叠车", "电动车", "其他"] },
        { key: "frameNumber", label: "车架号", type: "text", required: false },
        { key: "batteryCapacity", label: "电池容量", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
      ],
    },
    {
      group: "乐器",
      name: "乐器",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "instrumentType", label: "乐器类型", type: "select", required: false, options: ["吉他", "钢琴", "小提琴", "鼓", "管乐", "其他"] },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
      ],
    },
    {
      group: "化妆品",
      name: "护肤彩妆",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "productName", label: "产品名", type: "text", required: false },
        { key: "category", label: "类别", type: "select", required: false, options: ["洁面", "水乳", "精华", "面霜", "面膜", "防晒", "彩妆", "其他"] },
        { key: "volume", label: "容量", type: "text", required: false },
        { key: "productionDate", label: "生产日期", type: "date", required: false },
        { key: "expiryDate", label: "过期日期", type: "date", required: false },
        { key: "openedDate", label: "开封日期", type: "date", required: false },
      ],
    },
    {
      group: "药品",
      name: "药品",
      schema: [
        { key: "drugName", label: "药品名称", type: "text", required: false },
        { key: "manufacturer", label: "生产厂家", type: "text", required: false },
        { key: "specification", label: "规格", type: "text", required: false },
        { key: "batchNumber", label: "批号", type: "text", required: false },
        { key: "productionDate", label: "生产日期", type: "date", required: false },
        { key: "expiryDate", label: "有效期至", type: "date", required: false },
        { key: "usage", label: "用法用量", type: "text", required: false },
        { key: "indications", label: "适应症", type: "text", required: false },
      ],
    },
    {
      group: "食品",
      name: "食品饮料",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "productName", label: "产品名", type: "text", required: false },
        { key: "specification", label: "规格", type: "text", required: false },
        { key: "productionDate", label: "生产日期", type: "date", required: false },
        { key: "expiryDate", label: "保质期至", type: "date", required: false },
        { key: "storageMethod", label: "储存方式", type: "select", required: false, options: ["常温", "冷藏", "冷冻", "避光", "其他"] },
      ],
    },
    {
      group: "玩具",
      name: "玩具",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "productName", label: "产品名", type: "text", required: false },
        { key: "ageRange", label: "适用年龄", type: "text", required: false },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "batteryRequired", label: "需要电池", type: "boolean", required: false },
        { key: "assemblyRequired", label: "需要组装", type: "boolean", required: false },
      ],
    },
    // 更多电子产品模板
    {
      group: "电子产品",
      name: "平板电脑",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: true },
        { key: "model", label: "型号", type: "text", required: true },
        { key: "screenSize", label: "屏幕尺寸", type: "text", required: false },
        { key: "storage", label: "存储容量", type: "select", required: false, options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
        { key: "cellular", label: "蜂窝网络", type: "boolean", required: false },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "智能手表",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: true },
        { key: "model", label: "型号", type: "text", required: true },
        { key: "size", label: "表盘尺寸", type: "text", required: false },
        { key: "material", label: "表带材质", type: "select", required: false, options: ["硅胶", "皮革", "金属", "尼龙", "其他"] },
        { key: "waterproof", label: "防水等级", type: "text", required: false },
        { key: "batteryLife", label: "续航（天）", type: "number", required: false },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "游戏机",
      schema: [
        { key: "brand", label: "品牌", type: "select", required: false, options: ["PlayStation", "Xbox", "Nintendo Switch", "Steam Deck", "其他"] },
        { key: "model", label: "型号", type: "text", required: true },
        { key: "storage", label: "存储容量", type: "text", required: false },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "region", label: "区域版本", type: "select", required: false, options: ["国行", "港版", "日版", "美版", "欧版", "其他"] },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "显示器",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "screenSize", label: "屏幕尺寸", type: "text", required: false },
        { key: "resolution", label: "分辨率", type: "select", required: false, options: ["1920x1080", "2560x1440", "3840x2160", "其他"] },
        { key: "refreshRate", label: "刷新率（Hz）", type: "number", required: false },
        { key: "panelType", label: "面板类型", type: "select", required: false, options: ["IPS", "VA", "TN", "OLED", "其他"] },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "键盘鼠标",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["机械键盘", "薄膜键盘", "游戏鼠标", "办公鼠标", "其他"] },
        { key: "wireless", label: "无线", type: "boolean", required: false },
        { key: "switchType", label: "轴体类型", type: "text", required: false },
        { key: "dpi", label: "DPI", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "路由器网络设备",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "wifiStandard", label: "WiFi标准", type: "select", required: false, options: ["WiFi 4", "WiFi 5", "WiFi 6", "WiFi 6E", "WiFi 7"] },
        { key: "maxSpeed", label: "最大速率", type: "text", required: false },
        { key: "ports", label: "端口数量", type: "text", required: false },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "移动电源充电器",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "capacity", label: "容量（mAh）", type: "number", required: false },
        { key: "maxPower", label: "最大功率（W）", type: "number", required: false },
        { key: "ports", label: "接口类型", type: "text", required: false },
        { key: "fastCharge", label: "快充协议", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
      ],
    },
    {
      group: "电子产品",
      name: "硬盘存储",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "capacity", label: "容量", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["SSD固态", "HDD机械", "移动硬盘", "U盘", "SD卡", "其他"] },
        { key: "interface", label: "接口", type: "select", required: false, options: ["USB-A", "USB-C", "Thunderbolt", "SATA", "NVMe", "其他"] },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    // 更多服装模板
    {
      group: "服装",
      name: "上衣T恤",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["T恤", "衬衫", "卫衣", "毛衣", "外套", "其他"] },
        { key: "size", label: "尺码", type: "select", required: false, options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "material", label: "材质", type: "select", required: false, options: ["纯棉", "涤纶", "羊毛", "真丝", "混纺", "其他"] },
        { key: "season", label: "季节", type: "select", required: false, options: ["春", "夏", "秋", "冬", "四季"] },
        { key: "style", label: "风格", type: "select", required: false, options: ["休闲", "商务", "运动", "潮流", "其他"] },
        { key: "careInstructions", label: "洗涤说明", type: "text", required: false },
      ],
    },
    {
      group: "服装",
      name: "裤子",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["牛仔裤", "休闲裤", "西裤", "运动裤", "短裤", "其他"] },
        { key: "size", label: "尺码", type: "text", required: false },
        { key: "waist", label: "腰围", type: "text", required: false },
        { key: "length", label: "裤长", type: "text", required: false },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "material", label: "材质", type: "select", required: false, options: ["牛仔布", "纯棉", "涤纶", "羊毛", "混纺", "其他"] },
        { key: "season", label: "季节", type: "select", required: false, options: ["春", "夏", "秋", "冬", "四季"] },
        { key: "careInstructions", label: "洗涤说明", type: "text", required: false },
      ],
    },
    {
      group: "服装",
      name: "鞋子",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["运动鞋", "休闲鞋", "皮鞋", "靴子", "凉鞋", "拖鞋", "其他"] },
        { key: "size", label: "尺码", type: "text", required: false },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "material", label: "材质", type: "select", required: false, options: ["真皮", "人造革", "帆布", "网面", "橡胶", "其他"] },
        { key: "season", label: "季节", type: "select", required: false, options: ["春", "夏", "秋", "冬", "四季"] },
        { key: "waterproof", label: "防水", type: "boolean", required: false },
        { key: "careInstructions", label: "保养说明", type: "text", required: false },
      ],
    },
    {
      group: "服装",
      name: "配饰",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["帽子", "围巾", "手套", "腰带", "包包", "首饰", "手表", "眼镜", "其他"] },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "season", label: "季节", type: "select", required: false, options: ["春", "夏", "秋", "冬", "四季"] },
        { key: "style", label: "风格", type: "text", required: false },
      ],
    },
    // 更多分类模板
    {
      group: "箱包",
      name: "箱包",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["双肩包", "单肩包", "手提包", "行李箱", "钱包", "腰包", "其他"] },
        { key: "material", label: "材质", type: "select", required: false, options: ["真皮", "人造革", "帆布", "尼龙", "其他"] },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "capacity", label: "容量", type: "text", required: false },
        { key: "waterproof", label: "防水", type: "boolean", required: false },
      ],
    },
    {
      group: "床上用品",
      name: "床上用品",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["床单", "被套", "枕套", "被子", "枕头", "床垫", "其他"] },
        { key: "size", label: "尺寸", type: "select", required: false, options: ["单人", "双人", "加大双人", "其他"] },
        { key: "material", label: "材质", type: "select", required: false, options: ["纯棉", "真丝", "天丝", "化纤", "羽绒", "记忆棉", "其他"] },
        { key: "color", label: "颜色", type: "text", required: false },
        { key: "season", label: "季节", type: "select", required: false, options: ["春秋", "夏季", "冬季", "四季"] },
      ],
    },
    {
      group: "厨具",
      name: "锅具餐具",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["炒锅", "汤锅", "平底锅", "压力锅", "餐盘", "碗", "杯子", "刀具", "其他"] },
        { key: "material", label: "材质", type: "select", required: false, options: ["不锈钢", "铸铁", "陶瓷", "玻璃", "塑料", "木质", "其他"] },
        { key: "capacity", label: "容量/尺寸", type: "text", required: false },
        { key: "dishwasherSafe", label: "可用洗碗机", type: "boolean", required: false },
      ],
    },
    {
      group: "宠物用品",
      name: "宠物用品",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "petType", label: "宠物类型", type: "select", required: false, options: ["猫", "狗", "鸟", "鱼", "其他"] },
        { key: "type", label: "用品类型", type: "select", required: false, options: ["食品", "玩具", "窝垫", "牵引绳", "食盆水盆", "清洁用品", "其他"] },
        { key: "specification", label: "规格", type: "text", required: false },
        { key: "expiryDate", label: "有效期至", type: "date", required: false },
      ],
    },
    {
      group: "办公用品",
      name: "办公设备",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "model", label: "型号", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["打印机", "扫描仪", "碎纸机", "装订机", "计算器", "其他"] },
        { key: "serialNumber", label: "序列号", type: "text", required: false },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
        { key: "warrantyExpiry", label: "保修到期", type: "date", required: false },
      ],
    },
    {
      group: "母婴用品",
      name: "母婴用品",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["奶瓶", "奶嘴", "尿布", "婴儿车", "安全座椅", "玩具", "衣物", "其他"] },
        { key: "ageRange", label: "适用年龄", type: "text", required: false },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "expiryDate", label: "有效期至", type: "date", required: false },
      ],
    },
    {
      group: "园艺植物",
      name: "植物",
      schema: [
        { key: "plantName", label: "植物名称", type: "text", required: false },
        { key: "scientificName", label: "学名", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["观叶植物", "观花植物", "多肉植物", "水培植物", "盆景", "其他"] },
        { key: "potSize", label: "花盆尺寸", type: "text", required: false },
        { key: "wateringFrequency", label: "浇水频率", type: "text", required: false },
        { key: "sunlight", label: "光照需求", type: "select", required: false, options: ["全日照", "半日照", "散射光", "耐阴", "其他"] },
        { key: "purchaseDate", label: "购买日期", type: "date", required: false },
      ],
    },
    {
      group: "园艺植物",
      name: "园艺工具",
      schema: [
        { key: "brand", label: "品牌", type: "text", required: false },
        { key: "type", label: "类型", type: "select", required: false, options: ["铲子", "剪刀", "喷壶", "花盆", "肥料", "土壤", "其他"] },
        { key: "material", label: "材质", type: "text", required: false },
        { key: "specification", label: "规格", type: "text", required: false },
      ],
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: {
        scopeOwner_templateGroup_templateName: {
          scopeOwner: "system",
          templateGroup: t.group,
          templateName: t.name,
        },
      },
      create: {
        scope: "SYSTEM",
        scopeOwner: "system",
        templateGroup: t.group,
        templateName: t.name,
        schema: t.schema,
      },
      update: {
        schema: t.schema,
        deletedAt: null,
      },
    });
  }

  // seed categories for admin user
  const categories = [
    { name: "电子产品", description: "手机、电脑、平板等电子设备", sortOrder: 1 },
    { name: "书籍", description: "图书、杂志、漫画等", sortOrder: 2 },
    { name: "服装", description: "衣服、鞋子、配饰等", sortOrder: 3 },
    { name: "家具", description: "桌椅、柜子、床等家具", sortOrder: 4 },
    { name: "厨具", description: "锅碗瓢盆、厨房电器等", sortOrder: 5 },
    { name: "家电", description: "冰箱、空调、洗衣机等家用电器", sortOrder: 6 },
    { name: "收藏品", description: "手办、模型、纪念品等", sortOrder: 7 },
    { name: "工具", description: "维修工具、电动工具等", sortOrder: 8 },
    { name: "文具", description: "笔、本子、办公用品等", sortOrder: 9 },
    { name: "运动器材", description: "健身器材、球类、户外装备等", sortOrder: 10 },
    { name: "乐器", description: "吉他、钢琴、鼓等乐器", sortOrder: 11 },
    { name: "玩具", description: "儿童玩具、益智玩具等", sortOrder: 12 },
    { name: "化妆品", description: "护肤品、彩妆等", sortOrder: 13 },
    { name: "食品", description: "零食、饮料、保健品等", sortOrder: 14 },
    { name: "药品", description: "常用药品、医疗用品等", sortOrder: 15 },
    { name: "箱包", description: "背包、行李箱、钱包等", sortOrder: 16 },
    { name: "床上用品", description: "床单、被套、枕头等", sortOrder: 17 },
    { name: "车辆", description: "汽车、自行车、电动车等", sortOrder: 18 },
    { name: "宠物用品", description: "宠物食品、玩具、用品等", sortOrder: 19 },
    { name: "办公用品", description: "办公设备、文件用品等", sortOrder: 20 },
    { name: "母婴用品", description: "婴儿用品、孕妇用品等", sortOrder: 21 },
    { name: "园艺植物", description: "植物、花卉、园艺工具等", sortOrder: 22 },
    { name: "其他", description: "未分类物品", sortOrder: 99 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: {
        ownerId_name: {
          ownerId: adminUser.id,
          name: c.name,
        },
      },
      create: {
        ownerId: adminUser.id,
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
      },
      update: {
        description: c.description,
        sortOrder: c.sortOrder,
        deletedAt: null,
      },
    });
  }

  // seed tags for admin user
  const tags = [
    { name: "重要", color: "#ef4444" },
    { name: "常用", color: "#f59e0b" },
    { name: "收藏", color: "#eab308" },
    { name: "待处理", color: "#84cc16" },
    { name: "已借出", color: "#22c55e" },
    { name: "需维修", color: "#06b6d4" },
    { name: "待出售", color: "#3b82f6" },
    { name: "纪念品", color: "#8b5cf6" },
    { name: "礼物", color: "#ec4899" },
    { name: "限定版", color: "#f43f5e" },
    { name: "二手", color: "#64748b" },
    { name: "全新", color: "#10b981" },
    { name: "绝版", color: "#dc2626" },
    { name: "稀有", color: "#7c3aed" },
    { name: "日常", color: "#6b7280" },
    { name: "工作", color: "#0ea5e9" },
    { name: "学习", color: "#14b8a6" },
    { name: "娱乐", color: "#a855f7" },
    { name: "运动", color: "#f97316" },
    { name: "旅行", color: "#06b6d4" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: {
        ownerId_name: {
          ownerId: adminUser.id,
          name: tag.name,
        },
      },
      create: {
        ownerId: adminUser.id,
        name: tag.name,
        color: tag.color,
      },
      update: {
        color: tag.color,
        deletedAt: null,
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`- Admin user: ${username}`);
  console.log(`- System dictionaries: ${dicts.length}`);
  console.log(`- System templates: ${templates.length}`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Tags: ${tags.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
