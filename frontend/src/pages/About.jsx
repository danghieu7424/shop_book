import React from 'react';

export default function About() {
  return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold mb-6 text-emerald-800">Về Cổng Giáo Trình</h1>
            <div className="prose max-w-none text-gray-700 space-y-4 leading-relaxed">
                <p>
                    <strong>Cổng Đăng Ký Giáo Trình Trực Tuyến</strong> là nền tảng chính thức hỗ trợ sinh viên và giảng viên trong việc tiếp cận nguồn tài liệu học tập, giáo trình và sách tham khảo chất lượng cao phục vụ công tác giảng dạy và học tập tại trường.
                </p>
                <p>Mục tiêu của chúng tôi:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Cung cấp 100% giáo trình chính quy do Nhà trường và các NXB uy tín phát hành.</li>
                    <li>Đơn giản hóa quy trình đăng ký mua sách đầu kỳ cho sinh viên.</li>
                    <li>Hỗ trợ tra cứu thông tin sách, tác giả và đề cương chi tiết.</li>
                    <li>Chính sách giá ưu đãi đặc biệt dành riêng cho sinh viên trong trường.</li>
                </ul>
                <p>
                    Hệ thống cũng tích hợp tính năng <strong>Điểm thưởng (Loyalty)</strong>, giúp sinh viên tích lũy điểm khi mua sách để đổi lấy các quà tặng văn phòng phẩm hoặc voucher giảm giá cho các kỳ học tiếp theo.
                </p>
            </div>
          </div>
      </div>
  );
}