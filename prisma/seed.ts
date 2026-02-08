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
      ],
    },
    {
      code: "ACQUIRE_METHOD",
      name: "获取方式",
      items: [
        { value: "BUY", label: "购买" },
        { value: "GIFT", label: "赠与" },
        { value: "EXCHANGE", label: "交换" },
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
