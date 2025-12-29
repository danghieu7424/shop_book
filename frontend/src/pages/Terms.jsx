import React from 'react';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={32}/>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Điều khoản sử dụng</h1>
        </div>
        
        <div className="prose max-w-none text-gray-600 space-y-4 leading-relaxed">
          <p className="font-medium text-gray-800">Chào mừng bạn đến với Cổng Giáo Trình Trực Tuyến.</p>
          <p>Khi truy cập và sử dụng hệ thống này, bạn đồng ý tuân thủ các điều khoản sau đây:</p>

          <h3 className="text-xl font-bold text-gray-800 mt-6">1. Quyền và trách nhiệm của người sử dụng</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cung cấp thông tin cá nhân (Mã sinh viên, SĐT, Email) chính xác khi đăng ký mua sách.</li>
            <li>Không sử dụng hệ thống vào mục đích phá hoại, phát tán mã độc hoặc spam đơn hàng.</li>
            <li>Có trách nhiệm nhận hàng và thanh toán khi đơn hàng đã được xác nhận (đối với hình thức COD).</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 mt-6">2. Chính sách đặt hàng và thanh toán</h3>
          <p>
            Hệ thống hỗ trợ thanh toán qua chuyển khoản QR Code (VietQR) và thanh toán tiền mặt khi nhận hàng (COD). 
            Đơn hàng sẽ được xử lý trong giờ hành chính từ Thứ 2 đến Thứ 6.
          </p>

          <h3 className="text-xl font-bold text-gray-800 mt-6">3. Chính sách đổi trả</h3>
          <p>
            Sinh viên được quyền đổi trả giáo trình trong vòng <b>7 ngày</b> nếu phát hiện lỗi in ấn, mất trang hoặc sách bị rách do quá trình vận chuyển.
            Sách đổi trả phải còn nguyên tem (nếu có) và chưa qua sử dụng (không viết vẽ).
          </p>

          <p className="mt-8 pt-4 border-t text-sm text-gray-500">
            * Các điều khoản trên có thể được cập nhật mà không cần báo trước. Vui lòng kiểm tra thường xuyên.
          </p>
        </div>
      </div>
    </div>
  );
}