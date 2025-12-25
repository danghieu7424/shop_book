import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle, MapPin, Phone, User } from "lucide-react";
import { useStore, actions } from "../store";
import { Button, Card } from "../components/UI";
import { formatCurrency, getVietQRUrl, LEVELS } from "../utils";

export default function Checkout() {
  const [state, dispatch] = useStore();
  const { userInfo, cart, domain } = state;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    if (userInfo) {
      setForm((prev) => ({
        ...prev,
        name: userInfo.name || "",
        phone: userInfo.phone || "", 
        address: userInfo.address || "", 
      }));
    }
  }, [userInfo]);

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    let discountPercent = 0;
    const levelKey = userInfo?.level || "BRONZE";
    if (LEVELS[levelKey]) discountPercent = LEVELS[levelKey].discount;
    const discountAmount = subtotal * (discountPercent / 100);
    return { total: subtotal - discountAmount };
  };

  const handleSubmit = async () => {
    if (!userInfo) return alert("Cần đăng nhập");
    const { total } = calculateTotal();

    try {
      const res = await fetch(`${domain}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
          shipping_info: form,
          final_amount: total,
        }),
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        await Promise.all(
          cart.map((item) =>
            fetch(`${domain}/api/cart/${item.id}`, {
              method: "DELETE",
              credentials: "include",
            })
          )
        );

        dispatch(actions.clear_cart());

        fetch(`${domain}/api/auth/me`, { credentials: "include" })
          .then((r) => r.json())
          .then((user) => dispatch(actions.set_user_info(user)));

        setOrderSuccess({
          id: data.order_id,
          amount: total,
          content: `Mua sach ${data.order_id}`, // Nội dung CK ngắn gọn
        });
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (e) {
      alert("Lỗi kết nối");
    }
  };

  if (!userInfo)
    return <div className="text-center py-20">Vui lòng đăng nhập để tiếp tục.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Card className="p-8 border-emerald-100 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Thông tin nhận sách
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-1">
                <User size={14}/> Họ tên sinh viên
            </label>
            <input
              className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none bg-gray-50"
              placeholder="Nhập họ tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-1">
                <Phone size={14}/> Số điện thoại
            </label>
            <input
              className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none"
              placeholder="Nhập số điện thoại liên hệ"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-1">
                <MapPin size={14}/> Địa chỉ / Lớp học (để giao sách)
            </label>
            <textarea
              className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none"
              rows="3"
              placeholder="VD: Phòng 302 - Nhà C, hoặc địa chỉ nhà riêng..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Ghi chú thêm
            </label>
            <textarea
              className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none"
              placeholder="VD: Giao vào giờ hành chính..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full py-3 mt-4 text-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 border-none text-white"
          >
            Xác nhận đăng ký
          </Button>
        </div>
      </Card>

      {/* MODAL QR CODE */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative">
            <div className="bg-emerald-600 p-4 text-white text-center">
              <CheckCircle size={48} className="mx-auto mb-2" />
              <h3 className="text-xl font-bold">Đăng ký thành công!</h3>
              <p className="opacity-90">Mã đơn: #{orderSuccess.id}</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              <p className="text-gray-600 mb-4 text-center text-sm">
                Quét mã bên dưới để thanh toán tiền sách
              </p>
              <img
                src={getVietQRUrl(orderSuccess.amount, orderSuccess.content)}
                className="w-full h-auto border rounded-lg shadow-sm mb-4"
                alt="QR Code"
              />
              <div className="text-center mb-6">
                <div className="text-xs text-gray-500 uppercase">
                  Số tiền cần thanh toán
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(orderSuccess.amount)}
                </div>
              </div>
              <Button onClick={() => navigate("/profile")} className="w-full bg-gray-800 border-none text-white hover:bg-black">
                Hoàn tất & Xem lịch sử
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}