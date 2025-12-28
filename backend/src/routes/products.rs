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