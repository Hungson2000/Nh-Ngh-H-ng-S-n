"""
report_email.py
----------------
Gửi báo cáo doanh thu hàng ngày qua Gmail.
Chạy: python report_email.py
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
import pandas as pd

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "nhanghi")
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
REPORT_TO = os.getenv("REPORT_TO")


def get_db():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]


def build_html_report(db):
    """Tạo nội dung HTML cho email báo cáo."""
    bookings = list(db.bookings.find({"status": {"$ne": "cancel"}}))
    reviews = list(db.reviews.find())

    df = pd.DataFrame(bookings) if bookings else pd.DataFrame()
    total_revenue = 0
    total_booking = 0
    room_stats = ""

    if not df.empty:
        df["total"] = pd.to_numeric(df.get("total", 0), errors="coerce").fillna(0)
        total_revenue = int(df["total"].sum())
        total_booking = len(df)

        room_col = "room" if "room" in df.columns else "roomType"
        top_rooms = df.groupby(room_col)["total"].sum().sort_values(ascending=False)
        rows = ""
        for room, rev in top_rooms.items():
            rows += f"<tr><td style='padding:8px;border:1px solid #eee'>{room}</td><td style='padding:8px;border:1px solid #eee'>{rev:,.0f} đ</td></tr>"
        room_stats = f"""
        <h3>🏆 Doanh thu theo phòng</h3>
        <table style='width:100%;border-collapse:collapse'>
            <tr style='background:#1F4E79;color:white'>
                <th style='padding:8px'>Phòng</th>
                <th style='padding:8px'>Doanh thu</th>
            </tr>
            {rows}
        </table>
        """

    avg_star = 0
    total_review = 0
    if reviews:
        df_r = pd.DataFrame(reviews)
        star_col = "star" if "star" in df_r.columns else "rating"
        df_r[star_col] = pd.to_numeric(df_r[star_col], errors="coerce")
        avg_star = round(df_r[star_col].mean(), 1)
        total_review = len(reviews)

    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    html = f"""
    <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
        <div style='background:#1F4E79;color:white;padding:20px;text-align:center'>
            <h2>🏨 Báo cáo Nhà Nghỉ Hùng Sơn</h2>
            <p>{now}</p>
        </div>

        <div style='padding:20px'>
            <h3>📊 Tổng quan</h3>
            <table style='width:100%;border-collapse:collapse;margin-bottom:20px'>
                <tr style='background:#f5f5f5'>
                    <td style='padding:12px;border:1px solid #eee'><b>💰 Tổng doanh thu</b></td>
                    <td style='padding:12px;border:1px solid #eee;color:#1F4E79;font-size:18px'><b>{total_revenue:,.0f} đ</b></td>
                </tr>
                <tr>
                    <td style='padding:12px;border:1px solid #eee'><b>📋 Tổng booking</b></td>
                    <td style='padding:12px;border:1px solid #eee'>{total_booking} đơn</td>
                </tr>
                <tr style='background:#f5f5f5'>
                    <td style='padding:12px;border:1px solid #eee'><b>⭐ Đánh giá trung bình</b></td>
                    <td style='padding:12px;border:1px solid #eee'>{avg_star} ⭐ ({total_review} đánh giá)</td>
                </tr>
            </table>

            {room_stats}

            <p style='color:#888;font-size:12px;margin-top:24px;text-align:center'>
                Email tự động từ hệ thống Nhà Nghỉ Hùng Sơn — không cần phản hồi.
            </p>
        </div>
    </div>
    """
    return html


def send_email(subject, html_body, attachment_path=None):
    """Gửi email HTML qua Gmail SMTP."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise SystemExit("❌ Thiếu GMAIL_USER hoặc GMAIL_APP_PASSWORD trong file .env")

    to_email = REPORT_TO or GMAIL_USER

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    # Đính kèm file Excel nếu có
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={os.path.basename(attachment_path)}"
            )
            msg.attach(part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())

    print(f"✅ Đã gửi email: '{subject}' → {to_email}")


if __name__ == "__main__":
    print("📧 Đang tạo báo cáo...")
    db = get_db()
    print("✅ Kết nối MongoDB thành công!")

    html = build_html_report(db)
    now_str = datetime.now().strftime("%d/%m/%Y")

    send_email(
        subject=f"[Hùng Sơn] Báo cáo doanh thu {now_str}",
        html_body=html
    )
