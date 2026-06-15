# Nhà Nghỉ Hùng Sơn — Website Đặt Phòng & Quản Lý

Website giới thiệu và đặt phòng cho nhà nghỉ Hùng Sơn, gồm trang khách (xem phòng, combo, đặt phòng, đặt dịch vụ, đánh giá) và phần lưu trữ dữ liệu trên MongoDB kết hợp Firebase Realtime Database.

## Tính năng chính

- Hiển thị danh sách phòng, hình ảnh, combo ưu đãi
- Đặt phòng trực tuyến (lưu vào MongoDB qua API)
- Đặt dịch vụ kèm theo (dọn phòng, ăn uống, v.v.)
- Khách hàng gửi đánh giá, đơn vị quản lý duyệt promo
- Gửi email xác nhận đặt phòng qua EmailJS
- Đồng bộ dữ liệu real-time qua Firebase

## Công nghệ sử dụng

**Backend:** Node.js, Express 5, Mongoose (MongoDB Atlas), dotenv, cors
**Frontend:** HTML/CSS/JavaScript thuần, Firebase Realtime Database, EmailJS

## Cấu trúc thư mục

```
Duan_nhanghi/
├── backend/
│   ├── models/        # Schema: Booking, Promo, Review, Service
│   ├── routes/        # API: /bookings, /promos, /reviews, /services
│   ├── server.js       # Điểm khởi chạy server Express
│   ├── package.json
│   └── .env.example     # Mẫu biến môi trường (copy thành .env)
└── frontend/
    ├── assets/          # Hình ảnh
    ├── css/style.css
    ├── js/
    │   ├── firebase-init.js
    │   └── main.js
    └── index.html
```

## Cài đặt & chạy local

### 1. Backend (API server)

```bash
cd backend
npm install
```

Tạo file `.env` (copy từ `.env.example`) và điền thông tin MongoDB của bạn:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
PORT=3000
```

Chạy server (chế độ phát triển, tự reload khi sửa code):

```bash
npm run dev
```

Server chạy tại `http://localhost:3000`.

### 2. Frontend

Frontend là HTML/CSS/JS thuần, không cần build. Có thể mở `frontend/index.html` trực tiếp bằng extension **Live Server** trong VS Code, hoặc bất kỳ static server nào (ví dụ `npx serve frontend`).

Trước khi chạy, cập nhật `firebaseConfig` trong `frontend/js/main.js` với thông tin project Firebase của bạn (apiKey, databaseURL...).

## API Endpoints

| Method | Endpoint           | Mô tả                  |
|--------|--------------------|------------------------|
| GET    | `/api/bookings`    | Lấy danh sách đặt phòng |
| POST   | `/api/bookings`    | Tạo đặt phòng mới       |
| GET    | `/api/promos`      | Lấy danh sách khuyến mãi |
| POST   | `/api/promos`      | Tạo khuyến mãi mới      |
| GET    | `/api/reviews`     | Lấy danh sách đánh giá   |
| POST   | `/api/reviews`     | Thêm đánh giá mới       |
| GET    | `/api/services`    | Lấy danh sách đơn dịch vụ |
| POST   | `/api/services`    | Tạo đơn dịch vụ mới     |

## Triển khai (Deployment)

- Backend: có thể deploy lên Render / Railway (nhớ cấu hình biến môi trường `MONGO_URI`, `PORT`)
- Frontend: có thể deploy lên Netlify / Vercel (static hosting)

> Cập nhật link demo thực tế tại đây sau khi deploy:
> - Demo: `https://...`
> - API: `https://...`

## Tác giả

Hùng Sơn — [github.com/Hungson2000](https://github.com/Hungson2000)
