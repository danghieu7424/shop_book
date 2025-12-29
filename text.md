# IV.1.1. Chức năng tìm kiếm
## frontend


```jsx
... // import

export default function ProductList() {
    //các state khác
    const { products, categories, domain, userInfo, cart } = state;
    const [searchParams, setSearchParams] = useSearchParams();

    // API lấy thông tin sách
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

    //... APi khác

    //tìm kiếm với các trường dữ liệu
    const filtered = Array.isArray(products) ? products.filter(
        (p) =>
        (filterCat === "all" || p.category_id === filterCat) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.author && p.author.toLowerCase().includes(search.toLowerCase())))
    ) : [];

    // khung nhìn
    return (
        <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2">📂 Khoa / Bộ môn</h3>
                <div onClick={() => setSearchParams({ cat: "all" })} className={`cursor-pointer p-2 rounded mb-1 transition-colors ${filterCat === "all" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50 text-gray-600"}`}>Tất cả</div>
                {categories.map((c) => (<div key={c.id} onClick={() => setSearchParams({ cat: c.id })} className={`cursor-pointer p-2 rounded mb-1 transition-colors ${filterCat === c.id ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50 text-gray-600"}`}>{c.name}</div>))}
            </div>
            </div>

            {/* element khác */}
        </div>
        </div>
    )
}
```
# IV.1.2. Chức năng thanh toán
## frontend
checkout.jsx:

```jsx
... // import

export default function ProductList() {
    //các state khác
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        note: "",
    });

    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState(null);


    // API lấy thông khách hàng
    useEffect(() => {
        if (userInfo) {
        setForm((prev) => ({
            ...prev,
            name: userInfo.name || "",
            phone: userInfo.phone || "", 
            address: userInfo.address || "", 
        }));
        }
        
        fetch(`${domain}/api/config`)
            .then(res => res.json())
            .then(setPaymentConfig)
            .catch(err => console.error("Lỗi lấy config thanh toán", err));

    }, [userInfo, domain]);
     const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    

    let discountPercent = 0;
    if (userInfo) {
        const points = userInfo.points || 0;
        const sortedLevels = Object.values(LEVELS).sort((a, b) => b.min - a.min);
        const currentLevel = sortedLevels.find(l => points >= l.min);
        if (currentLevel) {
            discountPercent = currentLevel.discount;
        }
    }

    const discountAmount = subtotal * (discountPercent / 100);
        return { total: subtotal - discountAmount };
    };

    const handleSubmit = async () => {
        if (!userInfo) return alert("Cần đăng nhập");
        const { total } = calculateTotal();

        const finalNote = `[Thanh toán: ${paymentMethod === 'cod' ? 'Tiền mặt khi nhận' : 'Chuyển khoản QR'}] ${form.note || ''}`;

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
            shipping_info: { ...form, note: finalNote },
            final_amount: total,
            payment_method: paymentMethod, 
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
            content: `Mua sach ${data.order_id}`, 
            method: paymentMethod 
            });
        } else {
            alert("Lỗi: " + data.message);
        }
        } catch (e) {
        alert("Lỗi kết nối");
        }
    };

    const getDynamicQR = (amount, content) => {
        const BANK_ID = paymentConfig?.bank_bin || "970422"; 
        const ACCOUNT_NO = paymentConfig?.bank_number || "0333666999"; 
        const ACCOUNT_NAME = paymentConfig?.bank_name || "NGUYEN VAN A";
        const TEMPLATE = paymentConfig?.bank_template || "compact2";

        return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
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
          <div><label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-1"><User size={14}/> Họ tên sinh viên</label><input className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none bg-gray-50" placeholder="Nhập họ tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-1"><Phone size={14}/> Số điện thoại</label><input className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none" placeholder="Nhập số điện thoại liên hệ" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-1"><MapPin size={14}/> Địa chỉ / Lớp học (để giao sách)</label><textarea className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none" rows="3" placeholder="VD: Phòng 302 - Nhà C, hoặc địa chỉ nhà riêng..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1 text-gray-700">Ghi chú thêm</label><textarea className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none" placeholder="VD: Giao vào giờ hành chính..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>

          <div className="pt-4 border-t">
              <label className="block text-sm font-bold mb-3 text-gray-800">Hình thức thanh toán</label>
              <div className="grid grid-cols-2 gap-4">
                  <div className={`border p-4 rounded-xl cursor-pointer flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'hover:bg-gray-50'}`} onClick={() => setPaymentMethod('cod')}><Wallet className={paymentMethod === 'cod' ? "text-emerald-600" : "text-gray-400"} /><span className="text-sm font-medium">Tiền mặt (COD)</span></div>
                  <div className={`border p-4 rounded-xl cursor-pointer flex flex-col items-center gap-2 transition-all ${paymentMethod === 'qr' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'hover:bg-gray-50'}`} onClick={() => setPaymentMethod('qr')}><CreditCard className={paymentMethod === 'qr' ? "text-emerald-600" : "text-gray-400"} /><span className="text-sm font-medium">Chuyển khoản QR</span></div>
              </div>
          </div>

          <Button onClick={handleSubmit} className="w-full py-3 mt-4 text-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 border-none text-white">Xác nhận đăng ký</Button>
        </div>
      </Card>

      {orderSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative">
            <div className="bg-emerald-600 p-4 text-white text-center"><CheckCircle size={48} className="mx-auto mb-2" /><h3 className="text-xl font-bold">Đăng ký thành công!</h3><p className="opacity-90">Mã đơn: #{orderSuccess.id}</p></div>
            <div className="p-6 flex flex-col items-center">
              {orderSuccess.method === 'qr' ? (<><p className="text-gray-600 mb-4 text-center text-sm">Quét mã bên dưới để thanh toán tiền sách</p><img src={getDynamicQR(orderSuccess.amount, orderSuccess.content)} className="w-full h-auto border rounded-lg shadow-sm mb-4" alt="QR Code" /><div className="text-center mb-6"><div className="text-xs text-gray-500 uppercase">Số tiền cần thanh toán</div><div className="text-2xl font-bold text-blue-600">{formatCurrency(orderSuccess.amount)}</div><div className="text-xs text-gray-400 mt-1">{paymentConfig?.bank_name || "NGUYEN VAN A"} - {paymentConfig?.bank_number || "..."}</div></div></>) : (<div className="text-center mb-6 space-y-3"><div className="bg-emerald-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-emerald-600"><Wallet size={32} /></div><p className="text-gray-600">Vui lòng chuẩn bị số tiền <b>{formatCurrency(orderSuccess.amount)}</b> khi nhận sách.</p><p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-dashed">Đơn hàng đang chờ duyệt.</p></div>)}
              <Button onClick={() => navigate("/profile")} className="w-full bg-gray-800 border-none text-white hover:bg-black">Hoàn tất & Xem lịch sử</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## backend
```rust
use axum::{
    extract::{State, Json, Path},
    routing::{get, post, put},
    Router,
    http::StatusCode,
    response::IntoResponse,
};
use crate::AppState;
use crate::routes::auth::AuthUser;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use rust_decimal::Decimal;
use crate::utils::suid;
use rust_decimal::prelude::ToPrimitive;

// ... (Giữ nguyên các Struct Models cũ: CreateOrderReq, ClientItem, etc.) ...
#[derive(Deserialize)]
pub struct CreateOrderReq { pub items: Option<Vec<ClientItem>>, pub shipping_info: ShippingInfo, pub final_amount: Option<Decimal>, pub payment_method: Option<String> }
#[derive(Deserialize)]
pub struct ClientItem { pub product_id: String, pub quantity: i32, pub price: Decimal }
#[derive(Deserialize)]
pub struct ShippingInfo { pub name: String, pub phone: String, pub address: String, pub note: Option<String> }
#[derive(Debug, Serialize, FromRow)]
pub struct OrderHistory { pub id: String, pub final_amount: Decimal, pub status: String, pub payment_method: Option<String>, pub points_earned: i32, pub created_at: chrono::NaiveDateTime }
#[derive(Debug, Serialize, FromRow)]
pub struct OrderDetail { pub id: String, pub product_name: String, pub quantity: i32, pub price: Decimal, pub image: Option<String> }

// ... (Giữ nguyên create_order, my_orders, order_detail, receive_order, cancel_order) ...

async fn create_order(State(state): State<AppState>, auth: AuthUser, Json(payload): Json<CreateOrderReq>) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();
    let cart_items: Vec<(String, String, Decimal, i32)> = sqlx::query_as("SELECT p.id, p.name, COALESCE(p.sale_price, p.price) as price, c.quantity FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?").bind(&auth.user_id).fetch_all(&mut *tx).await.unwrap_or(vec![]);
    if cart_items.is_empty() { return (StatusCode::BAD_REQUEST, Json("Giỏ hàng trống")).into_response(); }
    let mut total_amount = Decimal::ZERO;
    for (_, _, price, qty) in &cart_items { total_amount += price * Decimal::from(*qty); }
    let order_id = suid();
    let points_earned = (total_amount.to_f64().unwrap_or(0.0) / 1000.0) as i32;
    let payment_method = payload.payment_method.unwrap_or("cod".to_string());
    let _ = sqlx::query("INSERT INTO orders (id, user_id, total_amount, final_amount, points_earned, status, shipping_name, shipping_phone, shipping_address, note, payment_method) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)").bind(&order_id).bind(&auth.user_id).bind(total_amount).bind(total_amount).bind(points_earned).bind(&payload.shipping_info.name).bind(&payload.shipping_info.phone).bind(&payload.shipping_info.address).bind(&payload.shipping_info.note).bind(&payment_method).execute(&mut *tx).await;
    for (p_id, _, p_price, p_qty) in cart_items {
        let item_id = suid();
        let _ = sqlx::query("INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)").bind(item_id).bind(&order_id).bind(&p_id).bind(p_qty).bind(p_price).execute(&mut *tx).await;
        let _ = sqlx::query("UPDATE products SET stock = stock - ? WHERE id = ?").bind(p_qty).bind(p_id).execute(&mut *tx).await;
    }
    let _ = sqlx::query("DELETE FROM cart_items WHERE user_id = ?").bind(&auth.user_id).execute(&mut *tx).await;
    if tx.commit().await.is_ok() { (StatusCode::CREATED, Json(serde_json::json!({"order_id": order_id, "message": "Thành công"}))).into_response() } else { (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi server")).into_response() }
}

async fn my_orders(State(state): State<AppState>, auth: AuthUser) -> impl IntoResponse {
    let orders = sqlx::query_as::<_, OrderHistory>("SELECT id, final_amount, status, points_earned, created_at, payment_method FROM orders WHERE user_id = ? ORDER BY created_at DESC").bind(auth.user_id).fetch_all(&state.db).await;
    match orders { Ok(data) => (StatusCode::OK, Json(data)).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi DB")).into_response() }
}

async fn order_detail(State(state): State<AppState>, auth: AuthUser, Path(order_id): Path<String>) -> impl IntoResponse {
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM orders WHERE id = ? AND user_id = ?").bind(&order_id).bind(&auth.user_id).fetch_optional(&state.db).await.unwrap_or(None);
    if exists.is_none() { return (StatusCode::FORBIDDEN, Json("Forbidden")).into_response(); }
    let items = sqlx::query_as::<_, OrderDetail>("SELECT oi.id, p.name as product_name, oi.quantity, oi.price, CASE WHEN JSON_VALID(p.images) THEN JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) ELSE p.images END as image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?").bind(order_id).fetch_all(&state.db).await;
    match items { Ok(data) => (StatusCode::OK, Json(data)).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi DB")).into_response() }
}

async fn receive_order(State(state): State<AppState>, auth: AuthUser, Path(order_id): Path<String>) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();
    let order: Option<(String, i32, String)> = sqlx::query_as("SELECT status, points_earned, payment_method FROM orders WHERE id = ? AND user_id = ?").bind(&order_id).bind(&auth.user_id).fetch_optional(&mut *tx).await.unwrap_or(None);
    if let Some((status, points, payment_method)) = order {
        if payment_method == "cod" { return (StatusCode::BAD_REQUEST, Json("COD cần Admin xác nhận")).into_response(); }
        if status == "shipping" {
            let _ = sqlx::query("UPDATE orders SET status = 'completed' WHERE id = ?").bind(&order_id).execute(&mut *tx).await;
            let _ = sqlx::query("UPDATE users SET points = points + ? WHERE id = ?").bind(points).bind(&auth.user_id).execute(&mut *tx).await;
            if tx.commit().await.is_ok() { return (StatusCode::OK, Json("Xác nhận thành công")).into_response(); }
        }
    }
    (StatusCode::NOT_FOUND, Json("Không tìm thấy đơn")).into_response()
}

async fn cancel_order(State(state): State<AppState>, auth: AuthUser, Path(order_id): Path<String>) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();
    let order: Option<(String,)> = sqlx::query_as("SELECT status FROM orders WHERE id = ? AND user_id = ?").bind(&order_id).bind(&auth.user_id).fetch_optional(&mut *tx).await.unwrap_or(None);
    if let Some((status,)) = order {
        if status == "pending" {
            let items: Vec<(String, i32)> = sqlx::query_as("SELECT product_id, quantity FROM order_items WHERE order_id = ?").bind(&order_id).fetch_all(&mut *tx).await.unwrap_or(vec![]);
            for (prod_id, qty) in items { let _ = sqlx::query("UPDATE products SET stock = stock + ? WHERE id = ?").bind(qty).bind(prod_id).execute(&mut *tx).await; }
            let _ = sqlx::query("UPDATE orders SET status = 'cancelled' WHERE id = ?").bind(&order_id).execute(&mut *tx).await;
            if tx.commit().await.is_ok() { return (StatusCode::OK, Json("Đã hủy đơn")).into_response(); }
        } else { return (StatusCode::BAD_REQUEST, Json("Chỉ hủy được đơn pending")).into_response(); }
    }
    (StatusCode::NOT_FOUND, Json("Không tìm thấy đơn")).into_response()
}

// --- API MỚI: TRẢ HÀNG (RETURN) ---
async fn return_order(State(state): State<AppState>, auth: AuthUser, Path(order_id): Path<String>) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();
    // 1. Kiểm tra điều kiện: Phải là user đó, status completed
    let order: Option<(String, chrono::NaiveDateTime)> = sqlx::query_as("SELECT status, created_at FROM orders WHERE id = ? AND user_id = ?")
        .bind(&order_id).bind(&auth.user_id)
        .fetch_optional(&mut *tx).await.unwrap_or(None);

    if let Some((status, created_at)) = order {
        if status != "completed" {
            return (StatusCode::BAD_REQUEST, Json("Chỉ có thể trả hàng đơn đã hoàn thành")).into_response();
        }

        // Kiểm tra 7 ngày
        let now = chrono::Utc::now().naive_utc();
        let diff = now - created_at;
        if diff.num_days() > 7 {
            return (StatusCode::BAD_REQUEST, Json("Đã quá hạn 7 ngày trả hàng")).into_response();
        }

        // 2. Cập nhật status -> returned
        let _ = sqlx::query("UPDATE orders SET status = 'returned' WHERE id = ?").bind(&order_id).execute(&mut *tx).await;

        // 3. Hoàn kho (Trả sách lại kho)
        let items: Vec<(String, i32)> = sqlx::query_as("SELECT product_id, quantity FROM order_items WHERE order_id = ?")
            .bind(&order_id).fetch_all(&mut *tx).await.unwrap_or(vec![]);
        
        for (prod_id, qty) in items {
            let _ = sqlx::query("UPDATE products SET stock = stock + ? WHERE id = ?").bind(qty).bind(prod_id).execute(&mut *tx).await;
        }

        // 4. Trừ điểm tích lũy đã cộng (nếu cần thiết, tuỳ chính sách) - Ở đây ta trừ đi
        let points_earned: (i32,) = sqlx::query_as("SELECT points_earned FROM orders WHERE id = ?").bind(&order_id).fetch_one(&mut *tx).await.unwrap_or((0,));
        if points_earned.0 > 0 {
            let _ = sqlx::query("UPDATE users SET points = GREATEST(0, points - ?) WHERE id = ?").bind(points_earned.0).bind(&auth.user_id).execute(&mut *tx).await;
        }

        if tx.commit().await.is_ok() {
            return (StatusCode::OK, Json("Yêu cầu trả hàng thành công")).into_response();
        }
    }
    (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi xử lý")).into_response()
}

// --- API MỚI: KIỂM TRA ĐÃ MUA CHƯA ---
#[derive(Serialize)]
struct CheckPurchaseRes { has_purchased: bool }

async fn check_purchase(State(state): State<AppState>, auth: AuthUser, Path(product_id): Path<String>) -> impl IntoResponse {
    // Kiểm tra xem user có đơn hàng nào chứa product_id này và status = 'completed' không
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id 
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'completed'"
    )
    .bind(auth.user_id).bind(product_id)
    .fetch_one(&state.db).await.unwrap_or((0,));

    (StatusCode::OK, Json(CheckPurchaseRes { has_purchased: count.0 > 0 })).into_response()
}

pub fn order_routes() -> Router<AppState> {
    Router::new()
        .route("/", post(create_order).get(my_orders))
        .route("/:id", get(order_detail))
        .route("/:id/receive", put(receive_order))
        .route("/:id/cancel", put(cancel_order))
        .route("/:id/return", put(return_order)) // <-- Mới: Trả hàng
        .route("/check-purchase/:product_id", get(check_purchase)) // <-- Mới: Check đã mua
}
```

# thông tin sản phẩm
## frontend

### ProductDetail.jsx:
```jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Star, Check, Shield, Book, User, Calendar, Building2, Truck, AlertCircle, Info } from 'lucide-react';
import { useStore, actions } from '../store';
import { Button, Badge } from '../components/UI';
import { formatCurrency } from '../utils';

export default function ProductDetail() {
    const { id } = useParams();
    const [state, dispatch] = useStore();
    const { domain, categories, userInfo, cart } = state;
    const navigate = useNavigate();
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('desc');
    const [activeImg, setActiveImg] = useState(null);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    const getProductImages = (prod) => {
        if (!prod) return [];
        let images = [];
        const safeParse = (str) => {
            try { return JSON.parse(str); } catch (e) {
                try { const fixed = str.replace(/'/g, '"'); return JSON.parse(fixed); } catch (e2) {
                    if (str.startsWith('[') && str.endsWith(']')) { return str.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')); }
                    return null;
                }
            }
        };
        if (Array.isArray(prod.images) && prod.images.length > 0) { images = prod.images; } else if (typeof prod.images === 'string' && prod.images.trim()) { const parsed = safeParse(prod.images); if (Array.isArray(parsed) && parsed.length > 0) images = parsed; else if (typeof parsed === 'string') images = [parsed]; else images = [prod.images]; }
        if (images.length === 0 && prod.image) { if (typeof prod.image === 'string') { const parsed = safeParse(prod.image); if (Array.isArray(parsed) && parsed.length > 0) images = parsed; else images = [prod.image]; } }
        return images.filter(img => typeof img === 'string' && img.length > 2);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true); setError(null);
            try {
                const [prodRes, revRes] = await Promise.all([fetch(`${domain}/api/products/${id}`), fetch(`${domain}/api/reviews/${id}`)]);
                if (!prodRes.ok) { if (prodRes.status === 404) throw new Error("Không tìm thấy giáo trình này."); throw new Error("Lỗi tải thông tin sản phẩm."); }
                const prodData = await prodRes.json();
                setProduct(prodData);
                const imgs = getProductImages(prodData);
                if (imgs.length > 0) setActiveImg(imgs[0]);
                if (revRes.ok) { setReviews(await revRes.json()); }

                if (userInfo) {
                    const checkRes = await fetch(`${domain}/api/orders/check-purchase/${id}`, { credentials: 'include' });
                    if (checkRes.ok) {
                        const data = await checkRes.json();
                        setHasPurchased(data.has_purchased);
                    }
                }
            } catch (e) { console.error("Detail Error:", e); setError(e.message); } finally { setLoading(false); }
        };
        loadData();
    }, [id, domain, userInfo]);

    const handlePostReview = async () => { if (!userInfo) return alert("Vui lòng đăng nhập để đánh giá"); if (!newComment.trim()) return alert("Vui lòng nhập nội dung"); setSubmitting(true); try { const res = await fetch(`${domain}/api/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: id, rating: newRating, content: newComment }), credentials: 'include' }); if (res.ok) { alert("Cảm ơn đánh giá của bạn!"); setNewComment(''); setNewRating(5); const revRes = await fetch(`${domain}/api/reviews/${id}`); if (revRes.ok) setReviews(await revRes.json()); } else { alert("Có lỗi xảy ra khi gửi đánh giá"); } } catch(e) { console.error(e); } setSubmitting(false); };
    
    // Logic thay đổi số lượng bằng nút (+/-)
    const handleQuantityChange = (delta) => { 
        // Nếu quantity đang là chuỗi rỗng (do đang xóa để nhập), coi như là 0
        const currentQty = quantity === "" ? 0 : quantity;
        const newQty = currentQty + delta;
        if (product && newQty >= 1 && newQty <= product.stock) setQuantity(newQty); 
    };

    // --- LOGIC MỚI: NHẬP TAY SỐ LƯỢNG ---
    const handleInputQuantity = (e) => {
        const val = e.target.value;
        // Cho phép xóa trắng để người dùng nhập lại
        if (val === "") {
            setQuantity("");
            return;
        }
        
        const numVal = parseInt(val, 10);
        if (!isNaN(numVal) && numVal > 0) {
            // Nếu nhập quá tồn kho -> Set về max tồn kho
            if (product && numVal > product.stock) {
                setQuantity(product.stock);
            } else {
                setQuantity(numVal);
            }
        }
    };

    const handleBlurQuantity = () => {
        // Nếu người dùng để trống hoặc nhập 0 khi focus out -> Reset về 1
        if (quantity === "" || quantity < 1) {
            setQuantity(1);
        }
    };
    // -------------------------------------

    const handleAddToCart = async () => { 
        if (!product) return;
        // Đảm bảo quantity hợp lệ trước khi add
        const finalQ = (quantity === "" || quantity < 1) ? 1 : quantity;
        
        dispatch(actions.add_to_cart({ ...product, image: activeImg, quantity: finalQ })); 
        
        if (userInfo) { 
            const existingItem = cart.find(i => i.id === product.id); 
            const finalQty = (existingItem ? existingItem.quantity : 0) + finalQ; 
            try { 
                await fetch(`${domain}/api/cart`, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({ product_id: product.id, quantity: finalQty }), 
                    credentials: 'include' 
                }); 
            } catch(e) { console.error("Lỗi lưu giỏ hàng", e); } 
        } 
        alert(`Đã thêm ${finalQ} quyển vào giỏ hàng!`); 
        setQuantity(1); // Reset sau khi add
    };

    if (loading) return <div className="p-20 text-center flex flex-col items-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div><span className="text-gray-500">Đang tải thông tin sách...</span></div>;
    if (error) return <div className="p-20 text-center flex flex-col items-center gap-4"><AlertCircle size={48} className="text-red-400"/><h2 className="text-xl font-bold text-gray-700">{error}</h2><Button onClick={() => navigate('/products')}>Quay lại danh sách</Button></div>;
    if (!product) return null;

    const productImages = getProductImages(product);
    const specsArray = product.specs ? Object.entries(product.specs).map(([key, value]) => ({ label: key, value: String(value) })) : [];

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <Button onClick={() => navigate(-1)} variant="secondary" className="mb-6 text-sm">← Quay lại danh sách</Button>
            <div className="grid md:grid-cols-12 gap-8 mb-12">
                <div className="md:col-span-4">
                    <div className="bg-white rounded-lg border p-2 flex items-center justify-center mb-4 shadow-sm relative overflow-hidden h-[450px]">
                        <img src={activeImg ? `${domain}${activeImg}` : "https://placehold.co/300x400?text=No+Image"} className="h-full object-contain shadow-md transition-transform duration-300" alt={product.name} />
                         {product.stock === 0 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl uppercase backdrop-blur-sm">Hết giáo trình</div>)}
                    </div>
                    {productImages.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-200">{productImages.map((img, idx) => (<div key={idx} onClick={() => setActiveImg(img)} className={`w-20 h-24 flex-shrink-0 border rounded cursor-pointer overflow-hidden bg-white ${activeImg === img ? 'border-emerald-600 ring-2 ring-emerald-500 ring-offset-1' : 'border-gray-200 hover:border-emerald-300'}`}><img src={`${domain}${img}`} className="w-full h-full object-cover" alt={`thumb-${idx}`} /></div>))}</div>)}
                </div>

                <div className="md:col-span-8 space-y-5">
                    <div>
                        <div className="flex justify-between items-start"><span className="text-emerald-700 font-bold uppercase text-sm tracking-wider bg-emerald-50 px-2 py-1 rounded">{categories.find(c => c.id === product.category_id)?.name || "Giáo trình"}</span><span className={`text-sm font-medium px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.stock > 0 ? `Còn ${product.stock} quyển` : 'Tạm hết'}</span></div>
                        <h1 className="text-3xl font-bold mt-2 text-gray-900 leading-tight">{product.name}</h1>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 border-b border-dashed pb-4">
                            {product.author && (<div className="flex items-center gap-1"><User size={16} className="text-gray-400"/> Tác giả: <span className="font-semibold text-gray-800">{product.author}</span></div>)}
                            {product.publisher && (<div className="flex items-center gap-1"><Building2 size={16} className="text-gray-400"/> NXB: <span className="font-semibold text-gray-800">{product.publisher}</span></div>)}
                            {product.publication_year && (<div className="flex items-center gap-1"><Calendar size={16} className="text-gray-400"/> Năm: <span className="font-semibold text-gray-800">{product.publication_year}</span></div>)}
                        </div>
                        <div className="flex items-center gap-2 mt-3"><div className="flex text-yellow-400"><span className="font-bold mr-1 text-gray-700">{Number(product.rating || 0).toFixed(1)}</span><Star size={16} fill="currentColor" className={product.rating > 0 ? "text-yellow-400" : "text-gray-300"}/></div><span className="text-sm text-gray-500">({product.review_count || 0} đánh giá)</span></div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {product.sale_price && Number(product.sale_price) > 0 ? (
                            <div className="flex items-baseline gap-3 mb-4"><span className="text-3xl font-bold text-red-600">{formatCurrency(product.sale_price)}</span><span className="text-gray-400 line-through text-lg">{formatCurrency(product.price)}</span><Badge color="red">-{Math.round(((product.price - product.sale_price) / product.price) * 100)}%</Badge></div>
                        ) : (<div className="flex items-baseline gap-4 mb-4"><span className="text-3xl font-bold text-emerald-700">{formatCurrency(product.price)}</span></div>)}
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center border border-gray-300 rounded-lg w-fit bg-white h-12 overflow-hidden">
                                <button onClick={() => handleQuantityChange(-1)} className="px-3 h-full hover:bg-gray-100 disabled:opacity-50 border-r" disabled={quantity <= 1}><Minus size={18}/></button>
                                {/* INPUT NHẬP SỐ LƯỢNG */}
                                <input 
                                    type="number" 
                                    className="w-16 text-center font-bold text-lg outline-none h-full appearance-none" 
                                    value={quantity} 
                                    onChange={handleInputQuantity}
                                    onBlur={handleBlurQuantity}
                                    min="1"
                                    max={product.stock}
                                />
                                <button onClick={() => handleQuantityChange(1)} className="px-3 h-full hover:bg-gray-100 disabled:opacity-50 border-l" disabled={quantity >= product.stock}><Plus size={18}/></button>
                            </div>
                            <Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 h-12 text-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 border-none text-white"><ShoppingCart className="mr-2"/> {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Liên hệ thư viện'}</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 p-2"><div className="flex gap-2 items-center"><Shield size={18} className="text-emerald-600"/> Đảm bảo sách chính hãng</div><div className="flex gap-2 items-center"><Check size={18} className="text-emerald-600"/> Đổi trả lỗi in ấn</div><div className="flex gap-2 items-center"><Truck size={18} className="text-emerald-600"/> Giao nhanh trong trường</div><div className="flex gap-2 items-center"><Book size={18} className="text-emerald-600"/> Hỗ trợ bọc sách plastic</div></div>
                </div>
            </div>
            
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-8">
                <div className="flex border-b overflow-x-auto">
                    {['desc', 'specs', 'reviews'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 font-bold border-b-2 whitespace-nowrap transition-colors capitalize ${activeTab === tab ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>{tab === 'desc' ? 'Giới thiệu nội dung' : tab === 'specs' ? 'Thông tin chi tiết' : `Đánh giá (${reviews.length})`}</button>
                    ))}
                </div>

                <div className="p-6 md:p-8 min-h-[200px]">
                    {activeTab === 'desc' && <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">{product.description || "Chưa có mô tả chi tiết cho giáo trình này."}</div>}
                    
                    {activeTab === 'specs' && (
                        <div>
                            {specsArray.length > 0 ? (
                                <table className="w-full max-w-2xl text-sm border-collapse"><tbody>{specsArray.map((spec, index) => (<tr key={index} className="border-b last:border-0 hover:bg-gray-50"><td className="py-3 px-4 bg-gray-50 font-medium w-1/3 text-gray-600 border-r">{spec.label}</td><td className="py-3 px-4 text-gray-800 font-medium">{spec.value}</td></tr>))}</tbody></table>
                            ) : (<div className="text-gray-500 italic flex items-center justify-center gap-2 py-8 bg-gray-50 rounded-lg"><Info size={20}/> Chưa có thông tin chi tiết.</div>)}
                        </div>
                    )}

                    {activeTab === 'reviews' && (<div><div className="bg-gray-50 p-6 rounded-lg mb-8 border shadow-sm"><h3 className="font-bold mb-4 text-lg">Đánh giá giáo trình này</h3>{userInfo ? (hasPurchased ? (<div className="space-y-4"><div className="flex gap-2 items-center"><span className="text-sm font-medium">Đánh giá:</span>{[1,2,3,4,5].map(star => (<button key={star} onClick={() => setNewRating(star)} className="focus:outline-none transition-transform hover:scale-110" type="button"><Star size={28} fill={star <= newRating ? "#FACC15" : "white"} className={star <= newRating ? "text-yellow-400" : "text-gray-300"} /></button>))}</div><textarea className="w-full border rounded-lg p-3 focus:ring-2 ring-emerald-500 outline-none resize-none bg-white" rows="3" placeholder="Nội dung sách có hữu ích không?..." value={newComment} onChange={e => setNewComment(e.target.value)}/><div className="flex justify-end"><Button className="bg-emerald-600 hover:bg-emerald-700 border-none text-white" onClick={handlePostReview} disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi đánh giá"}</Button></div></div>) : (<div className="text-orange-600 bg-orange-50 p-4 rounded text-center border border-orange-100">Bạn cần mua và nhận sách thành công để có thể đánh giá.</div>)) : (<div className="text-gray-500 text-center">Vui lòng đăng nhập để đánh giá.</div>)}</div><div className="space-y-6">{reviews.length === 0 ? (<div className="text-center text-gray-500 py-10">Chưa có đánh giá nào.</div>) : (reviews.map((review) => (<div key={review.id} className="border-b pb-6 last:border-0 last:pb-0"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg select-none">{review.user_name ? review.user_name.charAt(0).toUpperCase() : <User size={20}/>}</div><div><div className="font-bold text-gray-800">{review.user_name || 'Ẩn danh'}</div><div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</div></div></div><div className="pl-13"><div className="flex text-yellow-400 mb-2">{[...Array(5)].map((_, i) => (<Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"}/>))}</div><p className="text-gray-700">{review.content}</p></div></div>)))}</div></div>)}
                </div>
            </div>
        </div>
    );
}
```

### ProductList.jsx:
```jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, User } from "lucide-react";
import { useStore, actions } from "../store";
import { Button, Card, Badge } from "../components/UI";
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
    // Kiểm tra tồn kho trước khi thêm
    if (product.stock === 0) return;

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

  const filtered = Array.isArray(products) ? products.filter(
    (p) =>
      (filterCat === "all" || p.category_id === filterCat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || 
       (p.author && p.author.toLowerCase().includes(search.toLowerCase())))
  ) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2">📂 Khoa / Bộ môn</h3>
            <div onClick={() => setSearchParams({ cat: "all" })} className={`cursor-pointer p-2 rounded mb-1 transition-colors ${filterCat === "all" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50 text-gray-600"}`}>Tất cả</div>
            {categories.map((c) => (<div key={c.id} onClick={() => setSearchParams({ cat: c.id })} className={`cursor-pointer p-2 rounded mb-1 transition-colors ${filterCat === c.id ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50 text-gray-600"}`}>{c.name}</div>))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 ring-emerald-500 outline-none shadow-sm" placeholder="Tìm tên giáo trình, tên tác giả..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (<div className="text-center py-20 bg-white border border-dashed rounded-xl text-gray-500">Không tìm thấy giáo trình nào phù hợp.</div>) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <Card key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="flex flex-col h-full hover:shadow-lg transition-shadow group cursor-pointer border-emerald-100/50 relative">
                  
                  {/* Badge Sale (Chỉ hiện khi CÒN hàng và CÓ giảm giá) */}
                  {p.stock > 0 && p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price) && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-20">
                          -{Math.round(((p.price - p.sale_price) / p.price) * 100)}%
                      </div>
                  )}

                  <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden rounded-t-lg">
                    <img src={p.image || (p.images && p.images[0]) ? `${domain}${p.image || p.images[0]}` : "https://placehold.co/300x400?text=No+Cover"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={p.name} />
                    
                    {/* --- HIỆN THÔNG BÁO HẾT HÀNG --- */}
                    {p.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <span className="text-white font-bold text-sm uppercase border border-white px-3 py-1 tracking-wider transform -rotate-12">Tạm hết</span>
                        </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">{categories.find((c) => c.id === p.category_id)?.name || "Giáo trình"}</div>
                    <h3 className={`font-bold mb-1 line-clamp-2 min-h-[3rem] transition-colors ${p.stock === 0 ? 'text-gray-400' : 'text-gray-800 group-hover:text-emerald-700'}`}>{p.name}</h3>
                    {p.author && (<div className="flex items-center gap-1 text-xs text-gray-500 mb-3"><User size={12}/> {p.author}</div>)}

                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-dashed">
                      <div className="flex flex-col">
                          {p.sale_price && Number(p.sale_price) > 0 ? (
                              <>
                                <span className={`text-lg font-bold ${p.stock === 0 ? 'text-gray-400' : 'text-red-600'}`}>{formatCurrency(p.sale_price)}</span>
                                <span className="text-xs text-gray-400 line-through">{formatCurrency(p.price)}</span>
                              </>
                          ) : (
                              <span className={`text-lg font-bold ${p.stock === 0 ? 'text-gray-400' : 'text-emerald-700'}`}>{formatCurrency(p.price)}</span>
                          )}
                      </div>
                      
                      {/* Nút thêm nhanh (Vô hiệu hóa nếu hết hàng) */}
                      <Button 
                        onClick={(e) => handleQuickAdd(p, e)} 
                        disabled={p.stock === 0}
                        className={`!p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-all border-none text-white ${p.stock === 0 ? 'bg-gray-300 cursor-not-allowed hover:bg-gray-300 shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md active:scale-90'}`}
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
```


## backend
```rust
use axum::{
    extract::{Path, State, Query},
    routing::get,
    Router,
    Json,
    http::StatusCode,
    response::IntoResponse,
};
use crate::AppState;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use rust_decimal::Decimal;

#[derive(Debug, Serialize, FromRow)]
pub struct Product {
    pub id: String,
    pub category_id: String,
    pub category_name: Option<String>,
    pub name: String,
    pub author: Option<String>,
    pub publisher: Option<String>,
    pub publication_year: Option<i32>,
    pub price: Decimal,             // Giá gốc (Giá bìa)
    pub sale_price: Option<Decimal>, // <-- THÊM: Giá khuyến mãi
    pub stock: i32,
    pub image: Option<String>,
    pub images: Option<serde_json::Value>, 
    pub description: Option<String>,
    pub specs: Option<serde_json::Value>,
    pub rating: Option<Decimal>,
    pub review_count: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ProductFilter {
    pub category_id: Option<String>,
    pub search: Option<String>,
    pub sort: Option<String>,
}

async fn get_products(
    State(state): State<AppState>,
    Query(params): Query<ProductFilter>,
) -> impl IntoResponse {
    // Lấy thêm cột sale_price
    let mut sql = String::from(
        "SELECT p.id, p.category_id, c.name as category_name, p.name, 
                p.author, p.publisher, p.publication_year,
                p.price, p.sale_price, p.stock, 
                CASE 
                    WHEN JSON_VALID(p.images) THEN JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))
                    ELSE p.image 
                END as image,
                p.images,
                p.description, p.specs, p.rating, p.review_count
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_deleted = 0"
    );

    let mut args = Vec::new();

    if let Some(cat_id) = params.category_id {
        if cat_id != "all" {
            sql.push_str(" AND p.category_id = ?");
            args.push(cat_id);
        }
    }

    if let Some(s) = params.search {
        if !s.is_empty() {
            let search_term = format!("%{}%", s);
            sql.push_str(" AND (p.name LIKE ? OR p.author LIKE ?)");
            args.push(search_term.clone());
            args.push(search_term);
        }
    }

    match params.sort.as_deref() {
        Some("price_asc") => sql.push_str(" ORDER BY COALESCE(p.sale_price, p.price) ASC"), // Sắp xếp theo giá thực bán
        Some("price_desc") => sql.push_str(" ORDER BY COALESCE(p.sale_price, p.price) DESC"),
        _ => sql.push_str(" ORDER BY p.created_at DESC"),
    }

    let mut query = sqlx::query_as::<_, Product>(&sql);
    for arg in args {
        query = query.bind(arg);
    }

    let products = query.fetch_all(&state.db).await;

    match products {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(e) => {
            println!("Lỗi get_products: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi cơ sở dữ liệu")).into_response()
        }
    }
}

async fn get_product_detail(
    State(state): State<AppState>,
    Path(id): Path<String>
) -> impl IntoResponse {
    let sql = "
        SELECT p.id, p.category_id, c.name as category_name, p.name, 
               p.author, p.publisher, p.publication_year,
               p.price, p.sale_price, p.stock, 
               p.image, p.images, p.description, p.specs, p.rating, p.review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    ";

    let product = sqlx::query_as::<_, Product>(sql)
        .bind(id)
        .fetch_optional(&state.db)
        .await;

    match product {
        Ok(Some(p)) => (StatusCode::OK, Json(p)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json("Không tìm thấy sách")).into_response(),
        Err(e) => {
            println!("Lỗi get_product_detail: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi DB")).into_response()
        }
    }
}

pub fn product_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_products))
        .route("/:id", get(get_product_detail))
}
```

# điểm thưởng, đơn hàng
## Frontend
```jsx
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
```

## backend
```rust

// file auth.rs
async fn get_me(
    State(state): State<AppState>,
    auth: AuthUser
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, name, picture, role, status, points, level, phone, address, student_id
         FROM users WHERE id = ?"
    )
    .bind(auth.user_id)
    .fetch_optional(&state.db)
    .await;

    match user {
        Ok(Some(u)) => (StatusCode::OK, Json(u)).into_response(),
        _ => (StatusCode::NOT_FOUND,
            Json(serde_json::json!({"message": "User not found"}))).into_response(),
    }
}

//file order.rs ở trên

```