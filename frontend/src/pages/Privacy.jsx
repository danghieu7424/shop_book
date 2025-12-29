import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck size={32}/>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Chính sách bảo mật</h1>
        </div>

        <div className="prose max-w-none text-gray-600 space-y-4 leading-relaxed">
          <p>
            Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của sinh viên và người dùng trên hệ thống 
            theo đúng quy định của pháp luật và quy chế của Nhà trường.
          </p>

          <h3 className="text-xl font-bold text-gray-800 mt-6">1. Thu thập thông tin</h3>
          <p>Chúng tôi chỉ thu thập các thông tin cần thiết để xử lý đơn hàng và hỗ trợ sinh viên, bao gồm:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Họ tên, Mã sinh viên.</li>
            <li>Email nhà trường (@st.university.edu.vn) hoặc email cá nhân.</li>
            <li>Số điện thoại và địa chỉ nhận sách.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 mt-6">2. Sử dụng thông tin</h3>
          <p>Thông tin của bạn được sử dụng cho các mục đích:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Xác nhận và giao đơn hàng giáo trình.</li>
            <li>Gửi thông báo về tình trạng đơn hàng hoặc các chương trình ưu đãi sách.</li>
            <li>Tích điểm thưởng thành viên (Loyalty Program).</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 mt-6">3. Chia sẻ thông tin</h3>
          <p>
            Chúng tôi <b>tuyệt đối không</b> chia sẻ, bán hoặc trao đổi thông tin cá nhân của sinh viên cho bên thứ ba, 
            trừ trường hợp có yêu cầu từ cơ quan pháp luật hoặc Ban giám hiệu nhà trường.
          </p>

          <h3 className="text-xl font-bold text-gray-800 mt-6">4. Bảo mật dữ liệu</h3>
          <p>
            Dữ liệu được lưu trữ trên máy chủ bảo mật, sử dụng các biện pháp mã hóa để ngăn chặn truy cập trái phép.
          </p>
        </div>
      </div>
    </div>
  );
}