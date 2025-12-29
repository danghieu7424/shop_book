import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Send, Building } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useStore } from '../store';

export default function Contact() {
  const [state] = useStore();
  const { domain, userInfo } = state;
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // State lưu thông tin cấu hình hệ thống
  const [config, setConfig] = useState({
    site_name: 'Cổng Giáo Trình',
    hotline: 'Dang cap nhat',
    contact_email: 'admin@university.edu.vn',
    address: 'Thư viện trung tâm - Trường Đại học' // Địa chỉ hiện chưa có trong DB setting, tạm để cứng hoặc thêm sau
  });

  useEffect(() => {
    // 1. Tự động điền email nếu đã đăng nhập
    if (userInfo && userInfo.email) {
        setEmail(userInfo.email);
    }

    // 2. Lấy thông tin cấu hình từ Server (Hotline, Email quản trị...)
    fetch(`${domain}/api/config`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
          if (data) {
              setConfig(prev => ({
                  ...prev,
                  ...data // Ghi đè thông tin từ server (site_name, hotline, contact_email)
              }));
          }
      })
      .catch(err => console.error("Lỗi lấy cấu hình:", err));
  }, [userInfo, domain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) return alert("Vui lòng nhập đủ thông tin!");

    setLoading(true);
    try {
      const res = await fetch(`${domain}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
        credentials: 'include'
      });

      if (res.ok) {
        alert("Tin nhắn của bạn đã được gửi! Ban quản lý sẽ phản hồi sớm.");
        if (!userInfo) setEmail(''); 
        setMessage('');
      } else {
        alert("Gửi thất bại, vui lòng thử lại sau.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server");
    }
    setLoading(false);
  };

  return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Liên hệ & Góp ý</h2>
          
          <Card className="p-8 space-y-6 border-emerald-100 shadow-md">
              <div className="space-y-4 border-b pb-6 border-dashed">
                  <h3 className="font-bold text-lg text-emerald-700">Thông tin liên hệ</h3>
                  
                  {/* Hiển thị thông tin động từ Config */}
                  <div className="flex items-center gap-4 text-gray-700">
                    <Building className="text-emerald-600 w-5 h-5"/>
                    <span className="font-medium">{config.site_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-700">
                    <Phone className="text-emerald-600 w-5 h-5"/>
                    <span className="font-medium">Hotline: {config.hotline}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-700">
                    <Mail className="text-emerald-600 w-5 h-5"/>
                    <span className="font-medium">Email: {config.contact_email}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-700">
                    <MapPin className="text-emerald-600 w-5 h-5"/>
                    <span className="font-medium">{config.address}</span>
                  </div>
              </div>
              
              <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
                  <h3 className="font-bold text-lg text-gray-800">Gửi góp ý của bạn</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email sinh viên</label>
                    <input 
                        type="email"
                        className={`border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none ${userInfo ? 'bg-gray-100 text-gray-500' : ''}`}
                        placeholder="masv@st.university.edu.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        readOnly={!!userInfo} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung cần hỗ trợ / Góp ý</label>
                    <textarea 
                        className="border w-full p-2.5 rounded focus:ring-2 ring-emerald-500 outline-none" 
                        rows="4" 
                        placeholder="Ví dụ: Sách Giải tích 1 bị hết hàng..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2.5" disabled={loading}>
                      {loading ? 'Đang gửi...' : <><Send size={18} className="mr-2"/> Gửi tin nhắn</>}
                  </Button>
              </form>
          </Card>
      </div>
  );
}