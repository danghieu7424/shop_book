import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Library, GraduationCap, PenTool, Search } from "lucide-react";
import { useStore } from "../store";
import { Button } from "../components/UI";

export default function Home() {
  const [state] = useStore();
  const { categories } = state;
  const navigate = useNavigate();

  const renderCategoryIcon = (id) => {
    if (id.includes("it") || id.includes("code")) return <BookOpen size={32} />;
    if (id.includes("math")) return <PenTool size={32} />;
    if (id.includes("lit")) return <Library size={32} />;
    return <GraduationCap size={32} />;
  };

  return (
    <div className="space-y-12 pb-10">
      {/* --- HERO SECTION VỚI ẢNH NỀN --- */}
      <div className="relative bg-gray-900 text-white py-24 px-4 shadow-xl overflow-hidden">
        {/* Ảnh nền (Absolute) */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop" 
                alt="Library Background" 
                className="w-full h-full object-cover opacity-40 blur-[1px]" 
            />
            {/* Gradient phủ lên để tạo chiều sâu */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent"></div>
        </div>

        {/* Nội dung chính (Relative z-10) */}
        <div className="relative z-10 container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
              Cổng thông tin chính thức
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Kho Tàng Tri Thức <br/> <span className="text-emerald-400">Dành Cho Sinh Viên</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Cung cấp đầy đủ giáo trình, tài liệu tham khảo và sách chuyên khảo phục vụ học tập, nghiên cứu với mức giá ưu đãi nhất.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => navigate("/products")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 text-lg font-bold shadow-lg shadow-emerald-900/20 border-none transition-transform hover:-translate-y-1"
            >
              <Search size={20} className="mr-2"/> Tìm sách ngay
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/about")}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 text-lg backdrop-blur-sm transition-transform hover:-translate-y-1"
            >
              Tìm hiểu quy trình
            </Button>
          </div>
        </div>
      </div>

      {/* --- CATEGORIES SECTION --- */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Library size={24}/>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Khoa / Bộ môn</h2>
            </div>
            <span 
                onClick={() => navigate('/products')}
                className="text-emerald-600 font-medium hover:underline cursor-pointer text-sm"
            >
                Xem tất cả &rarr;
            </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/products?cat=${cat.id}`)}
              className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer flex flex-col items-center gap-4 transition-all hover:border-emerald-200"
            >
              <div className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                {renderCategoryIcon(cat.id)}
              </div>
              <span className="font-semibold text-gray-700 text-center group-hover:text-emerald-700 transition-colors">
                  {cat.name}
              </span>
            </div>
          ))}
          {categories.length === 0 && (
             <div className="col-span-full text-center text-gray-400 py-12 bg-gray-50 rounded-xl border border-dashed">
                Đang cập nhật danh mục...
             </div>
          )}
        </div>
      </div>
      
      {/* --- BANNER PHỤ (ĐÃ SỬA NỘI DUNG) --- */}
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* Decor blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">HOT</span>
                    <span className="text-orange-800 font-medium text-sm">Ưu đãi mùa tựu trường</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Săn sách hay - Nhận quà ngay</h3>
                <p className="text-gray-600 max-w-lg leading-relaxed">
                    Cập nhật <b>Số điện thoại</b> và <b>Địa chỉ</b> nhận sách chính xác để không bỏ lỡ các thông báo quan trọng về đơn hàng và nhận ưu đãi giảm giá đặc biệt cho thành viên mới.
                </p>
            </div>
            <div className="relative z-10 flex-shrink-0">
                <Button onClick={() => navigate("/profile")} className="bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg shadow-orange-600/30 px-8 py-3 h-auto text-lg">
                    Cập nhật thông tin
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

// Helper component nhỏ cho Badge
const Badge = ({ children, className }) => (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${className}`}>
        {children}
    </span>
);