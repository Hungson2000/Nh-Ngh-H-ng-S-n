# Nhà Nghỉ Hùng Sơn

Website quản lý & đặt phòng cho Nhà Nghỉ Hùng Sơn.

## Cấu trúc dự án

```
Duan_nhanghi/
├── backend/              # API Node.js + Express + MongoDB (dùng cho mở rộng sau)
│   ├── models/           # Schema Mongoose
│   ├── routes/           # API routes
│   ├── .env.example      # Mẫu biến môi trường
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/             # Giao diện website (chạy độc lập với Firebase)
    ├── index.html
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js          # Toàn bộ logic giao diện
    │   └── firebase-init.js # Kết nối Firebase Realtime Database
    └── assets/
        └── images/
```

## Lưu ý quan trọng về bảo mật

File `server.js` cũ có chứa thông tin đăng nhập MongoDB ngay trong code.
Trong bản tách này, thông tin đó đã được chuyển vào file `backend/.env`
(file này **không nên đưa lên GitHub**).

**Bạn nên đổi mật khẩu MongoDB Atlas ngay** vì mật khẩu cũ đã từng xuất
hiện trong code, có thể đã bị lộ nếu repo từng là public.

## Chạy frontend

Frontend hiện tại dùng Firebase Realtime Database trực tiếp (không gọi
qua backend Express). Để chạy:

1. Mở thư mục `frontend/` bằng Live Server (VS Code) hoặc bất kỳ static
   server nào.
2. Mở `index.html` trên trình duyệt.

## Chạy backend (nếu muốn dùng API MongoDB)

```bash
cd backend
npm install
cp .env.example .env
# Mở .env và điền MONGO_URI thật của bạn
npm run dev
```

Server chạy tại `http://localhost:3000`.

### Các API có sẵn

| Method | Endpoint              | Mô tả                     |
|--------|-----------------------|---------------------------|
| GET    | `/api/bookings`        | Lấy danh sách đặt phòng    |
| POST   | `/api/bookings`        | Tạo đặt phòng mới          |
| PUT    | `/api/bookings/:id`     | Cập nhật đặt phòng          |
| GET    | `/api/reviews`          | Lấy danh sách đánh giá       |
| POST   | `/api/reviews`          | Thêm đánh giá mới            |
| DELETE | `/api/reviews/:id`      | Xóa đánh giá                 |
| GET    | `/api/services`         | Lấy danh sách dịch vụ đã đặt  |
| POST   | `/api/services`         | Tạo đơn dịch vụ mới           |
| PUT    | `/api/services/:id`     | Cập nhật đơn dịch vụ           |
| GET    | `/api/promos`           | Lấy danh sách khuyến mãi       |
| POST   | `/api/promos`           | Tạo khuyến mãi mới             |
| DELETE | `/api/promos/:id`       | Xóa khuyến mãi                 |

## Triển khai (deploy)

- **Frontend**: Netlify / Vercel (kéo thả thư mục `frontend/`)
- **Backend**: Render / Railway (kết nối thư mục `backend/`, nhớ thiết
  lập biến môi trường `MONGO_URI` trong dashboard, không dùng file
  `.env`)
