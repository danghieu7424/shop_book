use axum::{
    extract::{ State, FromRequestParts, Path, Json },
    http::{ StatusCode, request::Parts },
    response::IntoResponse,
    Router,
    routing::{ get, put, post, delete },
    async_trait,
};
use crate::AppState;
use crate::routes::auth::AuthUser;
use crate::utils::suid;
use serde::{ Deserialize, Serialize };
use sqlx::FromRow;
use rust_decimal::Decimal;
use serde_json::Value;
use crate::utils::email::{ send_order_shipping_email, send_order_thank_you_email };
use rust_decimal::prelude::ToPrimitive;
use std::collections::HashMap;

// --- MIDDLEWARE ---
pub struct AdminUser(pub String);

fn format_money(amount: f64) -> String {
    let s = (amount as i64).to_string();
    let mut result = String::new();
    let len = s.len();
    for (i, c) in s.chars().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            result.push(',');
        }
        result.push(c);
    }
    format!("{} đ", result)
}

#[async_trait]
impl<S> FromRequestParts<S> for AdminUser where S: Send + Sync, AppState: From<S>, S: Clone {
    type Rejection = (StatusCode, Json<serde_json::Value>);

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_user = AuthUser::from_request_parts(parts, state).await?;
        let app_state = AppState::from(state.clone());
        let role: (String,) = sqlx
            ::query_as("SELECT role FROM users WHERE id = ?")
            .bind(&auth_user.user_id)
            .fetch_one(&app_state.db).await
            .map_err(|_| (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"message": "User không tồn tại"})),
            ))?;

        if role.0 == "admin" { Ok(AdminUser(auth_user.user_id)) } 
        else { Err((StatusCode::FORBIDDEN, Json(serde_json::json!({"message": "Không có quyền Admin"})))) }
    }
}

// ... (Các phần create_category, delete_category, products... giữ nguyên) ...

#[derive(Deserialize)]
struct CreateCategoryReq { name: String, description: Option<String> }
async fn create_category(State(state): State<AppState>, _: AdminUser, Json(payload): Json<CreateCategoryReq>) -> impl IntoResponse {
    let id = suid();
    let _ = sqlx::query("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)").bind(id).bind(payload.name).bind(payload.description).execute(&state.db).await;
    (StatusCode::CREATED, Json("Created")).into_response()
}
async fn delete_category(State(state): State<AppState>, _: AdminUser, Path(id): Path<String>) -> impl IntoResponse {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM products WHERE category_id = ?").bind(&id).fetch_one(&state.db).await.unwrap_or((0,));
    if count.0 > 0 { return (StatusCode::BAD_REQUEST, Json("Không thể xóa: Danh mục đang có sách")).into_response(); }
    let _ = sqlx::query("DELETE FROM categories WHERE id = ?").bind(id).execute(&state.db).await;
    (StatusCode::OK, Json("Deleted")).into_response()
}

#[derive(Deserialize)]
struct CreateProductReq { category_id: String, name: String, author: Option<String>, publisher: Option<String>, publication_year: Option<i32>, price: Decimal, sale_price: Option<Decimal>, stock: i32, images: Option<Vec<String>>, description: Option<String>, specs: Option<Value> }
async fn create_product(State(state): State<AppState>, _: AdminUser, Json(payload): Json<CreateProductReq>) -> impl IntoResponse {
    let id = suid();
    let images_json = sqlx::types::Json(payload.images.unwrap_or(vec![]));
    let specs_json = sqlx::types::Json(payload.specs.unwrap_or(serde_json::json!({})));
    let _ = sqlx::query("INSERT INTO products (id, category_id, name, author, publisher, publication_year, price, sale_price, stock, images, description, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id).bind(payload.category_id).bind(payload.name).bind(payload.author).bind(payload.publisher).bind(payload.publication_year).bind(payload.price).bind(payload.sale_price).bind(payload.stock).bind(images_json).bind(payload.description).bind(specs_json).execute(&state.db).await;
    (StatusCode::CREATED, Json("Created")).into_response()
}
async fn update_product(State(state): State<AppState>, _: AdminUser, Path(id): Path<String>, Json(payload): Json<CreateProductReq>) -> impl IntoResponse {
    let images_json = sqlx::types::Json(payload.images.unwrap_or(vec![]));
    let specs_json = sqlx::types::Json(payload.specs.unwrap_or(serde_json::json!({})));
    let _ = sqlx::query("UPDATE products SET category_id=?, name=?, author=?, publisher=?, publication_year=?, price=?, sale_price=?, stock=?, images=?, description=?, specs=? WHERE id=?")
        .bind(payload.category_id).bind(payload.name).bind(payload.author).bind(payload.publisher).bind(payload.publication_year).bind(payload.price).bind(payload.sale_price).bind(payload.stock).bind(images_json).bind(payload.description).bind(specs_json).bind(id).execute(&state.db).await;
    (StatusCode::OK, Json("Updated")).into_response()
}
async fn delete_product(State(state): State<AppState>, _: AdminUser, Path(id): Path<String>) -> impl IntoResponse {
    let _ = sqlx::query("UPDATE products SET is_deleted = TRUE WHERE id = ?").bind(id).execute(&state.db).await;
    (StatusCode::OK, Json("Deleted")).into_response()
}

#[derive(Deserialize)] struct UpdateStatusReq { status: String }
#[derive(Debug, Serialize, FromRow)] pub struct AdminOrderHistory { pub id: String, pub user_name: Option<String>, pub final_amount: Decimal, pub status: String, pub points_earned: i32, pub created_at: chrono::NaiveDateTime }
async fn get_all_orders(State(state): State<AppState>, _: AdminUser) -> impl IntoResponse {
    let orders = sqlx::query_as::<_, AdminOrderHistory>("SELECT o.id, u.name as user_name, o.final_amount, o.status, o.points_earned, o.created_at FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC").fetch_all(&state.db).await;
    match orders { Ok(data) => (StatusCode::OK, Json(data)).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
async fn update_order_status(State(state): State<AppState>, _: AdminUser, Path(id): Path<String>, Json(payload): Json<UpdateStatusReq>) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();
    let order_info: Option<(String, String, i32, String, Decimal)> = sqlx::query_as("SELECT o.status, o.user_id, o.points_earned, u.email, o.final_amount FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?").bind(&id).fetch_optional(&mut *tx).await.unwrap_or(None);
    if let Some((old_status, user_id, points, email, final_amount)) = order_info {
        let new_status = payload.status.as_str();
        if old_status != "shipping" && new_status == "shipping" {
            let items: Vec<(String, i32, Decimal)> = sqlx::query_as("SELECT p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?").bind(&id).fetch_all(&mut *tx).await.unwrap_or(vec![]);
            let items_html = items.iter().map(|(name, qty, price)| format!("<tr><td>{}</td><td>{}</td><td>{}</td></tr>", name, qty, format_money(price.to_f64().unwrap_or(0.0)))).collect::<Vec<String>>().join("");
            send_order_shipping_email(email.clone(), id.clone(), items_html, format_money(final_amount.to_f64().unwrap_or(0.0)));
        }
        if old_status != "completed" && new_status == "completed" { let _ = sqlx::query("UPDATE users SET points = points + ? WHERE id = ?").bind(points).bind(&user_id).execute(&mut *tx).await; send_order_thank_you_email(email.clone(), id.clone(), points); }
        else if old_status == "completed" && new_status != "completed" { let _ = sqlx::query("UPDATE users SET points = points - ? WHERE id = ?").bind(points).bind(&user_id).execute(&mut *tx).await; }
        let _ = sqlx::query("UPDATE orders SET status = ? WHERE id = ?").bind(new_status).bind(&id).execute(&mut *tx).await;
    }
    if tx.commit().await.is_ok() { (StatusCode::OK, Json("Updated")).into_response() } else { (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
async fn get_all_users(State(state): State<AppState>, _: AdminUser) -> impl IntoResponse {
    let users = sqlx::query_as::<_, crate::routes::auth::UserResponse>("SELECT id, email, name, picture, role, status, points, level, phone, address, student_id FROM users").fetch_all(&state.db).await;
    match users { Ok(data) => (StatusCode::OK, Json(data)).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
#[derive(Debug, Serialize, Deserialize, FromRow)] pub struct SettingItem { pub id: String, pub value: Option<String> }
#[derive(Debug, Deserialize)] pub struct UpdateSettingReq { pub settings: Vec<SettingItem> }
async fn get_settings(State(state): State<AppState>, _: AdminUser) -> impl IntoResponse {
    let settings = sqlx::query_as::<_, SettingItem>("SELECT * FROM settings").fetch_all(&state.db).await;
    match settings { Ok(data) => (StatusCode::OK, Json(data)).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
async fn update_settings(State(state): State<AppState>, _: AdminUser, Json(payload): Json<UpdateSettingReq>) -> impl IntoResponse {
    let mut tx = state.db.begin().await.unwrap();
    for item in payload.settings { let _ = sqlx::query("INSERT INTO settings (id, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?").bind(&item.id).bind(&item.value).bind(&item.value).execute(&mut *tx).await; }
    if tx.commit().await.is_ok() { (StatusCode::OK, Json("Updated")).into_response() } else { (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
pub async fn get_payment_config(State(state): State<AppState>) -> impl IntoResponse {
    let keys = vec!["bank_bin", "bank_number", "bank_name", "bank_template", "site_name", "hotline", "contact_email"];
    let query_str = format!("SELECT * FROM settings WHERE id IN ({})", keys.iter().map(|_| "?").collect::<Vec<_>>().join(","));
    let mut query = sqlx::query_as::<_, SettingItem>(&query_str);
    for key in keys { query = query.bind(key); }
    let settings = query.fetch_all(&state.db).await.unwrap_or(vec![]);
    let config_map: HashMap<String, String> = settings.into_iter().map(|item| (item.id, item.value.unwrap_or_default())).collect();
    (StatusCode::OK, Json(config_map)).into_response()
}

// --- ANALYTICS MỚI (ĐÃ SỬA LỖI CAST TYPE) ---
#[derive(Serialize)]
struct AnalyticsData {
    revenue_month: f64,
    new_orders: i64,
    new_users: i64,
    top_product: String,
    stats: OrderStatusStats,
}

#[derive(Serialize, FromRow, Default)]
struct OrderStatusStats {
    pending: i64,
    shipping: i64,
    completed: i64,
    cancelled: i64,
    returned: i64,
}

async fn get_analytics(State(state): State<AppState>, _: AdminUser) -> impl IntoResponse {
    let revenue: (Option<Decimal>,) = sqlx::query_as("SELECT SUM(final_amount) FROM orders WHERE status = 'completed'").fetch_one(&state.db).await.unwrap_or((None,));
    let orders_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM orders").fetch_one(&state.db).await.unwrap_or((0,));
    let users_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users").fetch_one(&state.db).await.unwrap_or((0,));
    let top_prod_result: Result<Option<(String,)>, _> = sqlx::query_as("SELECT p.name FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed' GROUP BY p.id, p.name ORDER BY SUM(oi.quantity) DESC LIMIT 1").fetch_optional(&state.db).await;
    let top_prod = match top_prod_result { Ok(Some((name,))) => name, Ok(None) => "Chưa có dữ liệu".to_string(), Err(_) => "Lỗi".to_string() };

    // --- SỬA Ở ĐÂY: THÊM CAST(... AS SIGNED) ---
    // MySQL SUM() trả về Decimal, cần ép kiểu về Signed Integer để khớp với i64 của Rust
    let stats: OrderStatusStats = sqlx::query_as(
        r#"SELECT 
            CAST(COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS SIGNED) as pending,
            CAST(COALESCE(SUM(CASE WHEN status = 'shipping' THEN 1 ELSE 0 END), 0) AS SIGNED) as shipping,
            CAST(COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS SIGNED) as completed,
            CAST(COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS SIGNED) as cancelled,
            CAST(COALESCE(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END), 0) AS SIGNED) as returned
        FROM orders"#
    )
    .fetch_one(&state.db)
    .await
    .unwrap_or_default(); // Nếu lỗi thì trả về toàn 0 thay vì panic

    let data = AnalyticsData {
        revenue_month: revenue.0.unwrap_or(Decimal::ZERO).to_f64().unwrap_or(0.0),
        new_orders: orders_count.0,
        new_users: users_count.0,
        top_product: top_prod,
        stats,
    };

    (StatusCode::OK, Json(data)).into_response()
}

#[derive(Debug, Serialize, FromRow)] pub struct ContactItem { pub id: String, pub user_id: Option<String>, pub user_name: Option<String>, pub email: String, pub message: String, pub status: String, pub created_at: Option<chrono::NaiveDateTime> }
async fn get_all_contacts(State(state): State<AppState>, _: AdminUser) -> impl IntoResponse {
    let sql = "SELECT c.id, c.user_id, u.name as user_name, c.email, c.message, c.status, c.created_at FROM contacts c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC";
    let contacts = sqlx::query_as::<_, ContactItem>(sql).fetch_all(&state.db).await;
    match contacts { Ok(data) => (StatusCode::OK, Json(data)).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
async fn update_contact_status(State(state): State<AppState>, _: AdminUser, Path(id): Path<String>, Json(payload): Json<UpdateStatusReq>) -> impl IntoResponse {
    let res = sqlx::query("UPDATE contacts SET status = ? WHERE id = ?").bind(payload.status).bind(id).execute(&state.db).await;
    match res { Ok(_) => (StatusCode::OK, Json("Updated")).into_response(), Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response() }
}
pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/categories", post(create_category))
        .route("/categories/:id", delete(delete_category))
        .route("/products", post(create_product))
        .route("/products/:id", put(update_product).delete(delete_product))
        .route("/orders", get(get_all_orders))
        .route("/orders/:id/status", put(update_order_status))
        .route("/users", get(get_all_users))
        .route("/settings", get(get_settings).post(update_settings))
        .route("/analytics", get(get_analytics))
        .route("/contacts", get(get_all_contacts))
        .route("/contacts/:id/status", put(update_contact_status))
}