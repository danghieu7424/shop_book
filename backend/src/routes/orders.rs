use axum::{
    extract::{State, Json, Path},
    routing::{get, post},
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

// --- MODELS ---

#[derive(Deserialize)]
pub struct CreateOrderReq {
    pub shipping_name: String,
    pub shipping_phone: String,
    pub shipping_address: String,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct OrderHistory {
    pub id: String,
    pub final_amount: Decimal,
    pub status: String,
    pub points_earned: i32,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, FromRow)]
pub struct OrderDetail {
    pub id: String,
    pub product_name: String,
    pub quantity: i32,
    pub price: Decimal,
    pub image: Option<String>,
}

// --- HANDLERS ---

// 1. Tạo đơn hàng (Checkout)
async fn create_order(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<CreateOrderReq>
) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();

    // 1. Lấy giỏ hàng
    let cart_items: Vec<(String, String, Decimal, i32)> = sqlx::query_as(
        "SELECT p.id, p.name, p.price, c.quantity 
         FROM cart_items c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ?"
    )
    .bind(&auth.user_id)
    .fetch_all(&mut *tx).await.unwrap_or(vec![]);

    if cart_items.is_empty() {
        return (StatusCode::BAD_REQUEST, Json("Giỏ hàng trống")).into_response();
    }

    // 2. Tính tổng tiền
    let mut total_amount = Decimal::ZERO;
    for (_, _, price, qty) in &cart_items {
        total_amount += price * Decimal::from(*qty);
    }

    // 3. Tạo ID đơn hàng
    let order_id = suid();
    let points_earned = (total_amount.to_f64().unwrap_or(0.0) / 1000.0) as i32; // 1000đ = 1 điểm

    // 4. Insert Order
    let _ = sqlx::query(
        "INSERT INTO orders (id, user_id, total_amount, final_amount, points_earned, status, shipping_name, shipping_phone, shipping_address, note)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)"
    )
    .bind(&order_id)
    .bind(&auth.user_id)
    .bind(total_amount)
    .bind(total_amount) // Chưa tính giảm giá
    .bind(points_earned)
    .bind(&payload.shipping_name)
    .bind(&payload.shipping_phone)
    .bind(&payload.shipping_address)
    .bind(&payload.note)
    .execute(&mut *tx).await;

    // 5. Insert Order Items & Trừ kho
    for (p_id, _, p_price, p_qty) in cart_items {
        let item_id = suid();
        let _ = sqlx::query(
            "INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(item_id).bind(&order_id).bind(&p_id).bind(p_qty).bind(p_price)
        .execute(&mut *tx).await;

        // Trừ kho (Stock)
        let _ = sqlx::query("UPDATE products SET stock = stock - ? WHERE id = ?")
            .bind(p_qty).bind(p_id)
            .execute(&mut *tx).await;
    }

    // 6. Xóa giỏ hàng
    let _ = sqlx::query("DELETE FROM cart_items WHERE user_id = ?")
        .bind(&auth.user_id)
        .execute(&mut *tx).await;

    if tx.commit().await.is_ok() {
        (StatusCode::CREATED, Json(serde_json::json!({"order_id": order_id, "message": "Đặt hàng thành công"}))).into_response()
    } else {
        (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi server")).into_response()
    }
}

// 2. Lịch sử đơn hàng của tôi
async fn my_orders(State(state): State<AppState>, auth: AuthUser) -> impl IntoResponse {
    let orders = sqlx::query_as::<_, OrderHistory>(
        "SELECT id, final_amount, status, points_earned, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC"
    )
    .bind(auth.user_id)
    .fetch_all(&state.db)
    .await;

    match orders {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi DB")).into_response(),
    }
}

// 3. Chi tiết đơn hàng
async fn order_detail(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(order_id): Path<String>
) -> impl IntoResponse {
    // Kiểm tra quyền sở hữu đơn hàng
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM orders WHERE id = ? AND user_id = ?")
        .bind(&order_id).bind(&auth.user_id)
        .fetch_optional(&state.db).await.unwrap_or(None);

    if exists.is_none() {
        return (StatusCode::FORBIDDEN, Json("Không có quyền xem đơn này")).into_response();
    }

    let items = sqlx::query_as::<_, OrderDetail>(
        "SELECT oi.id, p.name as product_name, oi.quantity, oi.price, 
                CASE WHEN JSON_VALID(p.images) THEN JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) ELSE p.images END as image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?"
    )
    .bind(order_id)
    .fetch_all(&state.db)
    .await;

    match items {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Lỗi DB")).into_response(),
    }
}

pub fn order_routes() -> Router<AppState> {
    Router::new()
        .route("/", post(create_order).get(my_orders))
        .route("/:id", get(order_detail))
}