import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Library, GraduationCap, PenTool } from "lucide-react"; // Đổi icon sang chủ đề sách
import { useStore } from "../store";
import { Button } from "../components/UI";

export default function Home() {
  const [state] = useStore();
  const { categories } = state;
  const navigate = useNavigate();

  // Hàm helper để chọn icon đúng theo id danh mục (đã sửa cho sách)
  const renderCategoryIcon = (id) => {
    // Logic map icon tùy ý, ví dụ dựa trên ID hoặc tên
    if (id.includes("it") || id.includes("code")) return <BookOpen size={32} />;
    if (id.includes("math")) return <PenTool size={32} />;
    if (id.includes("lit")) return <Library size={32} />;
    return <GraduationCap size={32} />; // Default
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section - Đổi sang màu xanh đậm chất giáo dục */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white py-16 px-4 rounded-b-[0px] shadow-xl">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Cổng Đăng Ký Giáo Trình Trực Tuyến
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 mb-8">
            Cung cấp đầy đủ giáo trình, sách tham khảo và tài liệu học tập chính quy cho sinh viên.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate("/products")}
              className="bg-white !text-emerald-900 hover:bg-emerald-50 px-8 py-3 text-lg shadow-lg font-semibold border-none"
            >
              Tìm sách ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4">
        {/* Tiêu đề có vạch xanh trang trí */}
        <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-8 bg-emerald-600 rounded-sm"></div>
            <h2 className="text-2xl font-bold text-gray-800">Khoa / Bộ môn</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/products?cat=${cat.id}`)}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer flex flex-col items-center gap-3 transition-transform hover:-translate-y-1"
            >
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                {renderCategoryIcon(cat.id)}
              </div>
              <span className="font-semibold text-gray-700 text-center">{cat.name}</span>
            </div>
          ))}
          {categories.length === 0 && (
             <div className="col-span-full text-center text-gray-400 py-8">
                Đang cập nhật danh mục...
             </div>
          )}
        </div>
      </div>
      
      {/* Banner phụ (Optional) */}
      <div className="container mx-auto px-4 mt-12">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-2xl font-bold text-orange-800 mb-2">Đăng ký sớm - Nhận sách ngay</h3>
                <p className="text-orange-700">Sinh viên vui lòng cập nhật Mã Sinh Viên trong phần hồ sơ để được ưu tiên xử lý đơn hàng.</p>
            </div>
            <Button onClick={() => navigate("/profile")} className="bg-orange-600 hover:bg-orange-700 text-white border-none whitespace-nowrap">
                Cập nhật hồ sơ
            </Button>
        </div>
      </div>
    </div>
  );
}