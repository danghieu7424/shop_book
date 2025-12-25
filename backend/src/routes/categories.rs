use axum::{
    extract::{State, Path, Json},
    routing::{get, post, put, delete},
    Router,
    http::StatusCode,
    response::IntoResponse,
};
use crate::AppState;
use crate::routes::admin::AdminUser; // Chỉ admin mới được sửa
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use crate::utils::suid;

#[derive(Debug, Serialize, FromRow)]
pub struct Category {
    pub id: String,
    pub name: String,
}

#[derive(Deserialize)]
pub struct CreateCategoryReq {
    pub name: String,
}

// Public: Lấy danh sách danh mục (Khoa/Bộ môn/Thể loại sách)
async fn get_categories(State(state): State<AppState>) -> impl IntoResponse {
    let categories = sqlx::query_as::<_, Category>("SELECT id, name FROM categories")
        .fetch_all(&state.db)
        .await;

    match categories {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json("Error")).into_response(),
    }
}

// Admin: Tạo danh mục
async fn create_category(
    State(state): State<AppState>,
    _: AdminUser,
    Json(payload): Json<CreateCategoryReq>
) -> impl IntoResponse {
    let id = suid();
    let _ = sqlx::query("INSERT INTO categories (id, name) VALUES (?, ?)")
        .bind(id)
        .bind(payload.name)
        .execute(&state.db)
        .await;
    (StatusCode::CREATED, Json("Created")).into_response()
}

// Admin: Xóa danh mục
async fn delete_category(
    State(state): State<AppState>,
    _: AdminUser,
    Path(id): Path<String>
) -> impl IntoResponse {
    let _ = sqlx::query("DELETE FROM categories WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await;
    (StatusCode::OK, Json("Deleted")).into_response()
}

pub fn category_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_categories).post(create_category))
        .route("/:id", delete(delete_category))
}