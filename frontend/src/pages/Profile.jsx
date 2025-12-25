import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, User } from "lucide-react"; // Thêm icon User
import { useStore, actions } from "../store";
import { Button, Card } from "../components/UI";
import { formatCurrency } from "../utils";

export default function ProductList() {
  const [state, dispatch] = useStore();
  const { products, categories, domain, userInfo, cart } = state; 
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filterCat = searchParams.get("cat") || "all";
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const prodRes = await fetch(`${domain}/api/products`);
        if (prodRes.ok) dispatch(actions.set_products(await prodRes.json()));

        const catRes = await fetch(`${domain}/api/categories`);
        if (catRes.ok) dispatch(actions.set_categories(await catRes.json()));
      } catch (e) {
        console.error("Lỗi tải dữ liệu:", e);
      }
    };
    loadData();
  }, [domain, dispatch]);

  const handleQuickAdd = async (product, e) => {
    e.stopPropagation(); 
    dispatch(actions.add_to_cart(product));
    if (userInfo) {
      const existingItem = cart.find((i) => i.id === product.id);
      const newQty = (existingItem ? existingItem.quantity : 0) + 1;
      try {
        await fetch(`${domain}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: product.id, quantity: newQty }),
          credentials: "include",
        });
      } catch (err) { console.error("Lỗi đồng bộ giỏ hàng:", err); }
    }
  };

  const filtered = products.filter(
    (p) =>
      (filterCat === "all" || p.category_id === filterCat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || 
       (p.author && p.author.toLowerCase().includes(search.toLowerCase()))) // Tìm kiếm cả theo tác giả
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Danh mục */}
        <div className="w-full md:w-64 space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-bold mb-4 text-gray-800">Khoa / Bộ môn</h3>
            <div
              onClick={() => setSearchParams({ cat: "all" })}
              className={`cursor-pointer p-2 rounded mb-1 ${
                filterCat === "all"
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              Tất cả
            </div>
            {categories.map((c) => (
              <div
                key={c.id}
                onClick={() => setSearchParams({ cat: c.id })}
                className={`cursor-pointer p-2 rounded mb-1 ${
                  filterCat === c.id
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 ring-emerald-500 outline-none"
                placeholder="Tìm tên giáo trình, tên tác giả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Không tìm thấy giáo trình nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <Card
                  key={p.id}
                  className="flex flex-col h-full hover:shadow-lg transition-shadow group"
                >
                  {/* Ảnh bìa sách (Tỉ lệ dọc) */}
                  <div
                    className="aspect-[3/4] bg-gray-100 relative cursor-pointer overflow-hidden rounded-t-lg"
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <img
                      src={
                        p.image || (p.images && p.images[0])
                          ? `${domain}${p.image || p.images[0]}`
                          : "https://placehold.co/300x400?text=No+Cover"
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={p.name}
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">
                      {categories.find((c) => c.id === p.category_id)?.name || "Giáo trình"}
                    </div>
                    <h3
                      className="font-bold text-gray-800 mb-1 line-clamp-2 hover:text-emerald-700 cursor-pointer min-h-[3rem]"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {p.name}
                    </h3>
                    
                    {/* Hiển thị Tác giả */}
                    {p.author && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                            <User size={12}/> {p.author}
                        </div>
                    )}

                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-dashed">
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(p.price)}
                      </span>
                      <Button
                        onClick={(e) => handleQuickAdd(p, e)}
                        className="!p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-90 bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                      >
                        <Plus size={20} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}