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