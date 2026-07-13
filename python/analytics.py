"""
analytics.py
-------------
Thống kê doanh thu từ MongoDB của Nhà Nghỉ Hùng Sơn.
Chạy: python analytics.py
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
import pandas as pd

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "nhanghi")


def get_db():
    client = MongoClient(MONGO_URI)
    client.admin.command("ping")
    print("✅ Kết nối MongoDB thành công!")
    return client[DB_NAME]


def parse_date(val):
    """Parse ngày dạng d/m/yyyy hoặc ISO string."""
    if not val:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(val)[:10], fmt[:len(fmt)])
        except:
            continue
    return None


def thong_ke_doanh_thu(db):
    """Thống kê doanh thu theo tháng từ collection bookings."""
    print("\n📊 THỐNG KÊ DOANH THU THEO THÁNG")
    print("=" * 50)

    docs = list(db.bookings.find({"status": {"$ne": "cancel"}}))
    if not docs:
        print("Chưa có dữ liệu booking.")
        return pd.DataFrame()

    df = pd.DataFrame(docs)
    df["total"] = pd.to_numeric(df.get("total", 0), errors="coerce").fillna(0)

    # Parse ngày tạo
    date_col = "createdAt" if "createdAt" in df.columns else "checkin"
    df["ngay"] = df[date_col].apply(parse_date)
    df = df.dropna(subset=["ngay"])
    df["thang"] = df["ngay"].dt.to_period("M")

    result = df.groupby("thang")["total"].agg(
        so_booking="count",
        doanh_thu="sum"
    ).reset_index()

    result["thang"] = result["thang"].astype(str)
    result["doanh_thu_format"] = result["doanh_thu"].apply(lambda x: f"{x:,.0f} đ")

    print(result[["thang", "so_booking", "doanh_thu_format"]].to_string(index=False))
    print(f"\n💰 Tổng doanh thu: {result['doanh_thu'].sum():,.0f} đ")
    print(f"📋 Tổng booking: {result['so_booking'].sum()} đơn")
    return result


def thong_ke_phong(db):
    """Thống kê phòng được đặt nhiều nhất."""
    print("\n🏆 PHÒNG ĐƯỢC ĐẶT NHIỀU NHẤT")
    print("=" * 50)

    docs = list(db.bookings.find({"status": {"$ne": "cancel"}}))
    if not docs:
        print("Chưa có dữ liệu.")
        return pd.DataFrame()

    df = pd.DataFrame(docs)
    df["total"] = pd.to_numeric(df.get("total", 0), errors="coerce").fillna(0)

    room_col = "room" if "room" in df.columns else "roomType"
    result = df.groupby(room_col)["total"].agg(
        so_lan_dat="count",
        doanh_thu="sum"
    ).sort_values("doanh_thu", ascending=False).reset_index()

    result["doanh_thu_format"] = result["doanh_thu"].apply(lambda x: f"{x:,.0f} đ")
    print(result[[room_col, "so_lan_dat", "doanh_thu_format"]].to_string(index=False))
    return result


def thong_ke_danh_gia(db):
    """Thống kê đánh giá trung bình."""
    print("\n⭐ THỐNG KÊ ĐÁNH GIÁ KHÁCH HÀNG")
    print("=" * 50)

    docs = list(db.reviews.find())
    if not docs:
        print("Chưa có đánh giá.")
        return

    df = pd.DataFrame(docs)
    star_col = "star" if "star" in df.columns else "rating"
    df[star_col] = pd.to_numeric(df[star_col], errors="coerce")

    avg = df[star_col].mean()
    total = len(df)
    print(f"Tổng số đánh giá: {total}")
    print(f"Điểm trung bình: {avg:.1f} ⭐")

    dist = df[star_col].value_counts().sort_index(ascending=False)
    for star, count in dist.items():
        print(f"  {int(star)}★: {count} lượt")


if __name__ == "__main__":
    db = get_db()
    thong_ke_doanh_thu(db)
    thong_ke_phong(db)
    thong_ke_danh_gia(db)
