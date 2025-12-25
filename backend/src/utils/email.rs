use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;
use lettre::message::header::ContentType;
use std::env;

fn send_email(to_email: String, subject: String, body_html: String) {
    let gmail_user = env::var("GMAIL_USER").expect("Thiếu GMAIL_USER");
    let gmail_pass = env::var("GMAIL_PASS").expect("Thiếu GMAIL_PASS");

    let email = Message::builder()
        .from(gmail_user.parse().unwrap())
        .to(to_email.parse().unwrap())
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(body_html)
        .unwrap();

    let creds = Credentials::new(gmail_user, gmail_pass);
    let mailer = SmtpTransport::relay("smtp.gmail.com")
        .unwrap()
        .credentials(creds)
        .build();

    std::thread::spawn(move || {
        match mailer.send(&email) {
            Ok(_) => println!("Email sent to {}", to_email),
            Err(e) => eprintln!("Error sending email: {:?}", e),
        }
    });
}

pub fn send_order_shipping_email(to_email: String, order_id: String, items_rows_html: String, total_amount: String) {
    let subject = format!("📚 Đơn sách #{} đang được vận chuyển!", order_id);
    
    let body = format!(r#"
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff; }}
                .header {{ text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 10px; margin-bottom: 20px; }}
                h2 {{ color: #2563EB; margin: 0; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ padding: 12px; border-bottom: 1px solid #eee; text-align: left; }}
                th {{ background-color: #f8f9fa; color: #555; }}
                .total {{ text-align: right; font-size: 18px; font-weight: bold; color: #d9534f; margin-top: 20px; padding-top: 10px; border-top: 2px solid #eee; }}
                .footer {{ margin-top: 30px; font-size: 13px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Giáo Trình Online - Thông Báo Vận Chuyển</h2>
                </div>
                <p>Xin chào bạn sinh viên/độc giả,</p>
                <p>Đơn hàng giáo trình <b>#{}</b> của bạn đã được đóng gói và bàn giao cho đơn vị vận chuyển.</p>
                
                <h3>Chi tiết đơn sách:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tên giáo trình</th>
                            <th style="text-align: center;">SL</th>
                            <th style="text-align: right;">Đơn giá</th>
                            <th style="text-align: right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {} 
                    </tbody>
                </table>

                <div class="total">
                    Tổng thanh toán: {}
                </div>

                <p>Vui lòng chú ý điện thoại để nhận sách nhé!</p>
                
                <div class="footer">
                    Mọi thắc mắc vui lòng liên hệ bộ phận hỗ trợ.<br>
                    Trân trọng,<br>
                    <b>BookShop Team</b>
                </div>
            </div>
        </body>
        </html>
    "#, order_id, items_rows_html, total_amount);

    send_email(to_email, subject, body);
}

pub fn send_order_thank_you_email(to_email: String, order_id: String, points: i32) {
    let subject = format!("✅ Cảm ơn bạn đã mua sách (Đơn #{})", order_id);
    let body = format!(r#"
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #16a34a;">Giao sách thành công!</h2>
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã xác nhận nhận thành công đơn <b>#{}</b>.</p>
            <p style="background-color: #ecfdf5; color: #065f46; padding: 15px; border-radius: 5px; text-align: center; font-weight: bold;">
                🎉 Bạn đã được tích lũy +{} điểm thưởng.
            </p>
            <p>Chúc bạn học tập tốt và đạt kết quả cao!</p>
            <br>
            <p>BookShop Team</p>
        </div>
    "#, order_id, points);

    send_email(to_email, subject, body);
}