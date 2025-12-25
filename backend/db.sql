CREATE TABLE users (
  id varchar(11) NOT NULL,
  email varchar(255) NOT NULL,
  name varchar(255),
  given_name varchar(100),
  family_name varchar(100),
  picture text,
  role enum('user','admin') DEFAULT 'user',
  status enum('active','locked') DEFAULT 'active',
  login_count int DEFAULT 0,
  points int DEFAULT 0,
  level enum('BRONZE','SILVER','GOLD','DIAMOND') DEFAULT 'BRONZE',
  email_verified tinyint(1) DEFAULT 0,
  phone varchar(20),          -- Thêm cột này
  address text,               -- Thêm cột này
  student_id varchar(50),     -- Thêm cột này (Mã sinh viên)
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
  id varchar(11) NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id varchar(11) NOT NULL,
  category_id varchar(11) NOT NULL,
  name varchar(255) NOT NULL,
  author varchar(255),        -- Tác giả
  publisher varchar(255),     -- Nhà xuất bản
  publication_year int,       -- Năm xuất bản
  price decimal(15,2) NOT NULL,
  stock int DEFAULT 0,
  images json,                -- Dùng JSON để lưu mảng ảnh
  image text,                 -- Giữ lại để tương thích ngược (nếu cần)
  description text,
  specs json,
  rating decimal(2,1) DEFAULT 0,
  review_count int DEFAULT 0,
  is_deleted tinyint(1) DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id varchar(11) NOT NULL,
  user_id varchar(11) NOT NULL,
  total_amount decimal(15,2) NOT NULL,
  discount_amount decimal(15,2) DEFAULT 0,
  final_amount decimal(15,2) NOT NULL,
  points_earned int DEFAULT 0,
  status enum('pending','shipping','completed','cancelled') DEFAULT 'pending',
  shipping_name varchar(255),
  shipping_phone varchar(20),
  shipping_address text,
  note text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_idx (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id varchar(11) NOT NULL,
  order_id varchar(11) NOT NULL,
  product_id varchar(11) NOT NULL,
  quantity int NOT NULL,
  price decimal(15,2) NOT NULL,
  PRIMARY KEY (id),
  KEY order_idx (order_id),
  KEY product_idx (product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cart_items (
  user_id varchar(11) NOT NULL,
  product_id varchar(11) NOT NULL,
  quantity int DEFAULT 1,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
  id varchar(11) NOT NULL,
  user_id varchar(11) NOT NULL,
  product_id varchar(11) NOT NULL,
  rating int NOT NULL,
  content text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contacts (
  id varchar(11) NOT NULL,
  user_id varchar(11),
  email varchar(255) NOT NULL,
  message text NOT NULL,
  status enum('new','processed') DEFAULT 'new',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE settings (
  id varchar(50) NOT NULL,
  value text,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1. (Tùy chọn) Đảm bảo user_id có cùng kiểu dữ liệu và collation với bảng users
ALTER TABLE contacts MODIFY COLUMN user_id varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. Thêm khóa ngoại
-- ON DELETE SET NULL: Nếu user bị xóa, tin nhắn vẫn giữ lại nhưng user_id sẽ về NULL (để giữ lịch sử)
-- ON DELETE CASCADE: Nếu user bị xóa, toàn bộ tin nhắn của họ cũng mất theo.
ALTER TABLE contacts
ADD CONSTRAINT fk_contacts_users
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

INSERT INTO categories (id, name, description) VALUES
('cntt', 'Công nghệ thông tin', 'Giáo trình Lập trình, Mạng, Phần cứng...'),
('kinhte', 'Kinh tế & Quản trị', 'Giáo trình Kinh tế vi mô, vĩ mô, Marketing...'),
('ngoaingu', 'Ngoại ngữ', 'Sách tiếng Anh, Nhật, Trung...'),
('dientu', 'Điện - Điện tử', 'Mạch điện, Vi xử lý, Tự động hóa...'),
('cokhi', 'Cơ khí & Xây dựng', 'Cơ lý thuyết, Sức bền vật liệu...'),
('luat', 'Luật & Chính trị', 'Pháp luật đại cương, Triết học Mác-Lênin...'),
('kynang', 'Tâm lý & Kỹ năng', 'Kỹ năng giao tiếp, làm việc nhóm...');