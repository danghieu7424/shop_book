import React from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
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
    if (!window.confirm("Bạn muốn xóa sản phẩm này?")) return;

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
    
    // --- SỬA LỖI: Tính Level & Giảm giá dựa trên ĐIỂM (Points) thực tế ---
    let discountPercent = 0;
    let levelName = "Thành viên";

    if (userInfo) {
        const points = userInfo.points || 0;
        // Sắp xếp level từ cao xuống thấp (Diamond -> Gold -> Silver -> Bronze)
        const sortedLevels = Object.values(LEVELS).sort((a, b) => b.min - a.min);
        // Tìm level cao nhất mà user đạt được
        const currentLevel = sortedLevels.find(l => points >= l.min);
        
        if (currentLevel) {
            discountPercent = currentLevel.discount;
            levelName = currentLevel.name;
        }
    }
    // --------------------------------------------------------------------

    const discountAmount = subtotal * (discountPercent / 100);
    return {
      subtotal,
      discountPercent,
      discountAmount,
      total: subtotal - discountAmount,
      levelName // Trả về tên level để hiển thị
    };
  };

  const { subtotal, discountPercent, discountAmount, total, levelName } = calculateTotal();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Giỏ sách của bạn</h2>
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded">
          <p className="mb-4 text-gray-500">Giỏ hàng trống</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/products")}>Đăng ký mua sách ngay</Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 border rounded flex gap-4 items-center"
              >
                <img
                  src={
                    item.image
                      ? `${domain}${item.image}`
                      : "https://placehold.co/100"
                  }
                  className="w-16 h-16 object-contain bg-gray-100 rounded"
                  alt={item.name}
                />
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                  <div className="text-blue-600 font-bold">
                    {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 border rounded h-fit shadow-sm">
            <h3 className="font-bold mb-4">Tổng quan đơn hàng</h3>
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {/* Hiển thị chi tiết giảm giá */}
              <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded">
                <span>Ưu đãi {levelName} (-{discountPercent}%):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-xl pt-4 border-t text-red-600">
                <span>Tổng cộng:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <Button onClick={() => navigate("/checkout")} className="w-full py-3 text-lg">
              Tiến hành thanh toán
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}