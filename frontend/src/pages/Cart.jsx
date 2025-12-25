import React from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, Book } from "lucide-react";
import { useStore, actions } from "../store";
import { Button } from "../components/UI";
import { formatCurrency, LEVELS } from "../utils";

export default function Cart() {
  const [state, dispatch] = useStore();
  const { cart, userInfo, domain } = state; 
  const navigate = useNavigate();

  const handleUpdateQuantity = async (itemId, delta) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (newQty > 0) {
      dispatch(actions.update_cart_quantity({ id: itemId, delta }));
    } else {
      handleRemoveItem(itemId);
      return;
    }

    if (userInfo && newQty > 0) {
      try {
        await fetch(`${domain}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: itemId, quantity: newQty }),
          credentials: "include",
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("Bạn muốn xóa giáo trình này khỏi giỏ?")) return;

    dispatch(actions.remove_from_cart(itemId));

    if (userInfo) {
      try {
        await fetch(`${domain}/api/cart/${itemId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    let discountPercent = 0;
    const levelKey = userInfo?.level || "BRONZE";
    if (LEVELS[levelKey]) discountPercent = LEVELS[levelKey].discount;
    const discountAmount = subtotal * (discountPercent / 100);
    return {
      subtotal,
      discountPercent,
      discountAmount,
      total: subtotal - discountAmount,
    };
  };

  const { subtotal, discountAmount, total } = calculateTotal();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Book className="text-emerald-600"/> Giỏ sách của bạn
      </h2>
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed rounded-xl">
          <p className="mb-4 text-gray-500">Bạn chưa chọn giáo trình nào.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/products")} className="bg-emerald-600 border-none text-white">Xem danh sách sách</Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 border rounded-xl flex gap-4 items-center shadow-sm"
              >
                <img
                  src={
                    item.image
                      ? `${domain}${item.image}`
                      : "https://placehold.co/100"
                  }
                  className="w-16 h-20 object-cover bg-gray-100 rounded border"
                  alt={item.name}
                />
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1 text-gray-800">{item.name}</h3>
                  <div className="text-emerald-600 font-bold">
                    {formatCurrency(item.price)}
                  </div>
                  {/* Nếu có tác giả thì hiện ở đây nếu API trả về, tạm thời bỏ qua nếu chưa sync */}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="p-1 hover:bg-white rounded shadow-sm transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="p-1 hover:bg-white rounded shadow-sm transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 border rounded-xl h-fit shadow-sm sticky top-4">
            <h3 className="font-bold mb-4 text-lg">Tổng cộng</h3>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 bg-emerald-50 p-2 rounded">
                <span>Ưu đãi ({userInfo?.level || "BRONZE"}):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t text-red-600">
                <span>Thành tiền:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <Button onClick={() => navigate("/checkout")} className="w-full bg-emerald-600 hover:bg-emerald-700 border-none text-white py-3 text-lg">
              Tiến hành đăng ký
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}