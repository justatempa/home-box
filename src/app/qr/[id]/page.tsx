import { notFound } from "next/navigation";

import { api } from "@/utils/trpc/server";

export default async function QRCodeItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const item = await api.items.getPublicInfo({ id });

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            {/* Images Gallery */}
            {item.images && item.images.length > 0 ? (
              <div className="space-y-2 bg-gray-100 p-2">
                {item.images.map((image) => (
                  <div key={image.id} className="relative w-full overflow-hidden rounded-lg bg-white">
                    <img
                      src={image.url}
                      alt={item.name}
                      className="h-auto w-full object-contain"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                ))}
              </div>
            ) : item.coverImage ? (
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <img
                  src={item.coverImage.url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            {/* Item Info */}
            <div className="p-6">
              <h1 className="mb-4 text-2xl font-bold text-gray-900">{item.name}</h1>

              <div className="space-y-3">
                {item.category && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      分类
                    </span>
                    <span className="text-sm text-gray-900">{item.category.name}</span>
                  </div>
                )}

                {item.statusValue && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      状态
                    </span>
                    <span className="text-sm text-gray-900">{item.statusValue}</span>
                  </div>
                )}

                {item.acquireMethodValue && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      获取方式
                    </span>
                    <span className="text-sm text-gray-900">{item.acquireMethodValue}</span>
                  </div>
                )}

                {item.price > 0 && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      价格
                    </span>
                    <span className="text-sm text-gray-900">¥{item.price}</span>
                  </div>
                )}

                {item.rating > 0 && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      评分
                    </span>
                    <span className="text-sm text-gray-900">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </span>
                  </div>
                )}

                {item.inboundAt && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      入库时间
                    </span>
                    <span className="text-sm text-gray-900">
                      {new Date(item.inboundAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                )}

                {item.tagNamesSnapshot && Array.isArray(item.tagNamesSnapshot) && item.tagNamesSnapshot.length > 0 && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      标签
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(item.tagNamesSnapshot as string[]).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.note && (
                  <div className="flex items-start">
                    <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">
                      备注
                    </span>
                    <span className="text-sm text-gray-900 whitespace-pre-wrap">{item.note}</span>
                  </div>
                )}

                {item.owner && (
                  <div className="mt-6 border-t pt-4">
                    <span className="text-xs text-gray-400">
                      所有者: {item.owner.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            此页面通过二维码公开访问
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
