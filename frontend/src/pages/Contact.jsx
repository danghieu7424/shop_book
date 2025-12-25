import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useStore } from '../store';

export default function Contact() {
  const [state] = useStore();
  const { domain, userInfo } = state; 
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo && userInfo.email) {
        setEmail(userInfo.email);
    }
  }, [userInfo]);

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
        alert("Góp ý của bạn đã được ghi nhận! Ban quản lý sẽ phản hồi sớm.");
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
          <Card className="p-8 space-y-6 border-emerald-100">
              {/* Thông tin tĩnh */}
              <div className="flex items-center gap-4 text-gray-700">
                <Phone className="text-emerald-600"/>
                <span className="font-medium">Phòng Giáo trình: (024) 3868 xxxx</span>
              </div>
              <div className="flex items-center gap-4 text-gray-700">
                <Mail className="text-emerald-600"/>
                <span className="font-medium">giaotrinh@university.edu.vn</span>
              </div>
              <div className="flex items-center gap-4 text-gray-700">
                <MapPin className="text-emerald-600"/>
                <span className="font-medium">Tầng 1, Thư viện trung tâm</span>
              </div>
              
              <form className="space-y-4 pt-4 border-t" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email sinh viên</label>
                    <input 
                        type="email"
                        className={`border w-full p-2 rounded focus:ring-2 ring-emerald-500 outline-none ${userInfo ? 'bg-gray-100 text-gray-500' : ''}`}
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
                        className="border w-full p-2 rounded focus:ring-2 ring-emerald-500 outline-none" 
                        rows="4" 
                        placeholder="Ví dụ: Sách Giải tích 1 bị hết hàng..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 border-none text-white" disabled={loading}>
                      {loading ? 'Đang gửi...' : <><Send size={18} className="mr-2"/> Gửi tin nhắn</>}
                  </Button>
              </form>
          </Card>
      </div>
  );
}