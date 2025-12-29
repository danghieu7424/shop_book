import React, { useState, useEffect, useMemo } from "react";
import { useStore, actions } from "../store";
import { Card, Badge, Button } from "../components/UI";
import { formatCurrency, LEVELS } from "../utils";
import {
  X, QrCode, CheckCircle, Crown, ShoppingCart, User, Save, Phone, MapPin, LogOut, Wallet, Ban, RotateCcw // Thêm RotateCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [state, dispatch] = useStore();
  const { userInfo, domain } = state;
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]); 
  const [qrData, setQrData] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchOrders = () => {
    if (userInfo) {
      fetch(`${domain}/api/orders`, { credentials: "include" })
        .then((res) => {
            if (res.status === 401 || res.status === 403) {
                dispatch(actions.set_user_info(null)); dispatch(actions.clear_cart()); navigate('/login');
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (res.ok) return res.json();
            throw new Error("Không thể tải đơn hàng"); 
        })
        .then((data) => { if (Array.isArray(data)) setOrders(data); else setOrders([]); })
        .catch((err) => { console.error("Lỗi fetch orders:", err); setOrders([]); });
    }
  };

  useEffect(() => {
    fetchOrders();
    if (userInfo) { setPhone(userInfo.phone || ""); setAddress(userInfo.address || ""); }
    fetch(`${domain}/api/config`).then(res => res.ok ? res.json() : null).then(data => { if(data) setPaymentConfig(data); }).catch(console.error);
  }, [userInfo, domain]);

  const handleUpdateProfile = async () => {
    try { const res = await fetch(`${domain}/api/auth/me`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ phone: phone, address: address }), credentials: 'include' }); if (res.ok) { alert("Cập nhật thành công!"); setIsEditing(false); } else { alert("Lỗi cập nhật"); } } catch (e) { console.error(e); }
  };

  // --- LOGIC HỦY ĐƠN ---
  const handleCancelOrder = async (orderId) => {
      if(!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
      try { const res = await fetch(`${domain}/api/orders/${orderId}/cancel`, { method: "PUT", credentials: "include" }); if(res.ok) { alert("Đã hủy đơn hàng thành công!"); fetchOrders(); } else { const err = await res.json(); alert("Lỗi: " + (err || "Không thể hủy đơn")); } } catch(e) { alert("Lỗi kết nối"); }
  };

  // --- LOGIC TRẢ HÀNG (MỚI) ---
  const handleReturnOrder = async (orderId) => {
      if(!window.confirm("Bạn muốn yêu cầu trả hàng/hoàn tiền cho đơn này?\n(Lưu ý: Chỉ áp dụng trong vòng 7 ngày)")) return;
      try {
          const res = await fetch(`${domain}/api/orders/${orderId}/return`, { method: "PUT", credentials: "include" });
          if(res.ok) { alert("Yêu cầu trả hàng thành công! Vui lòng mang sách tới thư viện để hoàn tất."); fetchOrders(); }
          else { const err = await res.json(); alert("Lỗi: " + (err || "Không thể trả hàng")); }
      } catch(e) { alert("Lỗi kết nối"); }
  };

  // Helper check 7 ngày
  const canReturn = (dateStr) => {
      const created = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 7;
  };

  const loyaltyInfo = useMemo(() => {
    if (!userInfo) return null;
    const currentPoints = userInfo.points || 0;
    const sortedLevels = Object.values(LEVELS).sort((a, b) => a.min - b.min);
    let currentLevelObj = sortedLevels[0];
    for (let i = sortedLevels.length - 1; i >= 0; i--) { if (currentPoints >= sortedLevels[i].min) { currentLevelObj = sortedLevels[i]; break; } }
    const nextLevelIndex = sortedLevels.findIndex(lvl => lvl.min > currentPoints);
    let nextLevel = null, progress = 100, pointsNeeded = 0;
    if (nextLevelIndex !== -1) { nextLevel = sortedLevels[nextLevelIndex]; const currentLevelMin = nextLevelIndex > 0 ? sortedLevels[nextLevelIndex - 1].min : 0; const range = nextLevel.min - currentLevelMin; const gained = currentPoints - currentLevelMin; progress = Math.min(100, Math.max(0, (gained / range) * 100)); pointsNeeded = nextLevel.min - currentPoints; }
    return { currentLevelName: currentLevelObj.name, progress, nextLevel, pointsNeeded };
  }, [userInfo]);

  const handleReceived = async (orderId) => {
    if (!window.confirm("Bạn xác nhận đã nhận được sách?")) return;
    try { const res = await fetch(`${domain}/api/orders/${orderId}/receive`, { method: "PUT", credentials: "include" }); if (res.ok) { alert("Xác nhận thành công! Điểm thưởng đã được cộng."); fetchOrders(); } else { const err = await res.json(); alert("Lỗi: " + (err || "Không thể xác nhận")); } } catch (e) { alert("Lỗi kết nối"); }
  };

  const getDynamicQR = (amount, content) => {
      const BANK_ID = paymentConfig?.bank_bin || "970422"; const ACCOUNT_NO = paymentConfig?.bank_number || "0333666999"; const ACCOUNT_NAME = paymentConfig?.bank_name || "NGUYEN VAN A"; const TEMPLATE = paymentConfig?.bank_template || "compact2";
      return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  };

  if (!userInfo) return <div className="p-20 text-center"><Button onClick={() => navigate('/login')}>Đăng nhập lại</Button></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden border-none shadow-lg">
             <div className="h-24 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
             <div className="px-6 pb-6 relative">
                 <div className="flex justify-center mt-[-48px]"><img src={userInfo.picture || "https://via.placeholder.com/100"} className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white" alt="avatar" /></div>
                  <div className="mt-20 text-center"><h2 className="font-bold text-xl text-gray-800">{userInfo.name}</h2><div className="text-sm text-gray-500 mb-2">{userInfo.email}</div><Badge color="blue">{loyaltyInfo ? loyaltyInfo.currentLevelName : "Thành viên"} Reader</Badge></div>
             </div>
             <div className="px-6 pb-6 pt-2 border-t space-y-3">
                 <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Thông tin cá nhân</h3>{!isEditing && <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 hover:underline">Sửa đổi</button>}</div>
                 <div><label className="text-xs text-gray-500 block">Số điện thoại</label>{isEditing ? <input className="w-full border rounded p-1 text-sm mt-1" value={phone} onChange={e=>setPhone(e.target.value)} /> : <div className="font-medium text-gray-800">{userInfo.phone || <span className="text-gray-400 italic">Chưa cập nhật</span>}</div>}</div>
                 <div><label className="text-xs text-gray-500 block">Địa chỉ nhận sách</label>{isEditing ? <textarea className="w-full border rounded p-1 text-sm mt-1" rows="2" value={address} onChange={e=>setAddress(e.target.value)} /> : <div className="font-medium text-gray-800 text-sm">{userInfo.address || <span className="text-gray-400 italic">Chưa cập nhật</span>}</div>}</div>
                 {isEditing && <div className="flex gap-2 mt-2"><Button size="sm" onClick={handleUpdateProfile} className="w-full bg-emerald-600 border-none text-white"><Save size={14} className="mr-1"/> Lưu</Button><Button size="sm" variant="secondary" onClick={() => setIsEditing(false)} className="w-full">Hủy</Button></div>}
             </div>
          </Card>
          <div className="bg-white rounded-xl shadow-sm border p-6"><div className="flex justify-between items-end mb-4"><div><div className="text-gray-500 text-sm font-medium flex items-center gap-1"><Crown size={16} className="text-yellow-500" /> Điểm tích lũy</div><div className="text-4xl font-extrabold text-emerald-700 mt-1">{userInfo.points} <span className="text-sm font-normal text-gray-400">pts</span></div></div></div>{loyaltyInfo && loyaltyInfo.nextLevel ? (<div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Tiến độ lên {loyaltyInfo.nextLevel.name}</span><span className="font-bold">{Math.round(loyaltyInfo.progress)}%</span></div><div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden"><div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${loyaltyInfo.progress}%` }}></div></div><div className="text-xs text-gray-500 text-center">Cần thêm <b>{loyaltyInfo.pointsNeeded}</b> pts để thăng hạng</div></div>) : (<div className="text-center text-sm text-emerald-600 font-bold bg-emerald-50 p-2 rounded">Bạn đã đạt hạng cao nhất!</div>)}</div>
        </div>

        <div className="md:col-span-2">
          <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800">Lịch sử đăng ký sách <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{orders.length}</span></h2>
          <div className="space-y-4">
            {Array.isArray(orders) && orders.map((o) => (
              <Card key={o.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1"><div className="font-bold text-lg text-gray-800">Đơn #{o.id.substring(0, 8)}</div>
                  <Badge color={o.status === "completed" ? "green" : o.status === "shipping" ? "blue" : o.status === "cancelled" ? "red" : o.status === "returned" ? "gray" : "yellow"}>
                      {o.status === "completed" ? "Hoàn thành" : o.status === "shipping" ? "Đang giao" : o.status === "pending" ? "Chờ duyệt" : o.status === "returned" ? "Đã trả hàng" : "Đã hủy"}
                  </Badge></div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">{new Date(o.created_at).toLocaleDateString("vi-VN")}<span className="text-gray-300">|</span>{o.payment_method === 'cod' ? <span className="flex items-center gap-1 text-emerald-600 font-medium"><Wallet size={12}/> COD</span> : <span className="flex items-center gap-1 text-blue-600 font-medium"><QrCode size={12}/> QR</span>}</div>
                </div>
                <div className="text-right flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className="font-bold text-red-600 text-lg">{formatCurrency(o.final_amount)}</div>
                  {o.status === "pending" && (<div className="flex gap-2">{o.payment_method === 'qr' && (<Button size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none" onClick={() => setQrData({ amount: o.final_amount, content: `Thanh toan sach ${o.id}` })}><QrCode size={16} className="mr-1"/> Thanh toán</Button>)}<Button size="sm" variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border-none" onClick={() => handleCancelOrder(o.id)}><Ban size={16} className="mr-1"/> Hủy đơn</Button></div>)}
                  {o.status === "shipping" && (o.payment_method === 'qr' ? (<Button size="sm" onClick={() => handleReceived(o.id)} className="bg-emerald-600 hover:bg-emerald-700 border-none text-white"><CheckCircle size={16} className="mr-1"/> Đã nhận sách</Button>) : (<span className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded border border-orange-100">Shipper đang giao & thu tiền</span>))}
                  
                  {/* NÚT TRẢ HÀNG (MỚI) */}
                  {o.status === "completed" && canReturn(o.created_at) && (
                      <Button size="sm" variant="secondary" onClick={() => handleReturnOrder(o.id)} className="bg-gray-50 border text-gray-600 hover:bg-red-50 hover:text-red-600">
                          <RotateCcw size={16} className="mr-1"/> Trả hàng
                      </Button>
                  )}
                </div>
              </Card>
            ))}{orders.length === 0 && (<div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed text-gray-500">Bạn chưa đăng ký mua cuốn sách nào.</div>)}
          </div>
        </div>
      </div>
      {qrData && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setQrData(null)}><div className="bg-white rounded-xl p-6 max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setQrData(null)} className="absolute top-4 right-4 text-gray-400"><X size={24} /></button><h3 className="text-xl font-bold text-center mb-6">Thanh toán VietQR</h3><img src={getDynamicQR(qrData.amount, qrData.content)} className="w-full rounded-lg mb-4 border" alt="QR Code" /><div className="text-center font-bold text-blue-600 text-2xl">{formatCurrency(qrData.amount)}</div><p className="text-center text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded">{qrData.content}</p><div className="text-center text-xs text-gray-400 mt-1">{paymentConfig?.bank_name} - {paymentConfig?.bank_number}</div></div></div>)}
    </div>
  );
}