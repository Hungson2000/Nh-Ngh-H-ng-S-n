/**
 * seed.js - Tạo dữ liệu mẫu cho Nhà Nghỉ Hùng Sơn
 * Chạy: node seed.js
 * (Sẽ XÓA dữ liệu cũ trong 4 collection rồi tạo mới, dùng để demo/test)
 */
require('dotenv').config();
const mongoose = require('mongoose');
 
const Booking = require('./models/Booking');
const Promo = require('./models/Promo');
const Review = require('./models/Review');
const Service = require('./models/Service');
 
const MONGO_URI = process.env.MONGO_URI;
 
if (!MONGO_URI) {
  console.error('❌ Không tìm thấy MONGO_URI trong file .env');
  process.exit(1);
}
 
const rooms = ['Phòng Đơn 101', 'Phòng Đôi 102', 'Phòng Gia Đình 201', 'Phòng VIP 301', 'Phòng Đơn 103'];
 
const bookings = [
  { code: 'HS0001', name: 'Nguyễn Văn An', phone: '0905123456', email: 'an.nguyen@gmail.com', room: rooms[0], checkin: '01/07/2026', checkout: '03/07/2026', nights: 2, total: 700000, status: 'done' },
  { code: 'HS0002', name: 'Trần Thị Bích', phone: '0912345678', email: 'bich.tran@gmail.com', room: rooms[1], checkin: '05/07/2026', checkout: '07/07/2026', nights: 2, total: 900000, status: 'done' },
  { code: 'HS0003', name: 'Lê Hoàng Cường', phone: '0987654321', email: 'cuong.le@gmail.com', room: rooms[2], checkin: '08/07/2026', checkout: '11/07/2026', nights: 3, total: 2100000, status: 'new' },
  { code: 'HS0004', name: 'Phạm Thị Duyên', phone: '0978123456', email: 'duyen.pham@gmail.com', room: rooms[3], checkin: '10/07/2026', checkout: '12/07/2026', nights: 2, total: 1600000, status: 'new' },
  { code: 'HS0005', name: 'Hoàng Văn Em', phone: '0966112233', email: 'em.hoang@gmail.com', room: rooms[4], checkin: '12/07/2026', checkout: '13/07/2026', nights: 1, total: 350000, status: 'new' },
  { code: 'HS0006', name: 'Đỗ Thị Phương', phone: '0933445566', email: 'phuong.do@gmail.com', room: rooms[1], checkin: '15/06/2026', checkout: '17/06/2026', nights: 2, total: 900000, status: 'done' },
  { code: 'HS0007', name: 'Vũ Minh Quang', phone: '0944556677', email: 'quang.vu@gmail.com', room: rooms[0], checkin: '20/06/2026', checkout: '22/06/2026', nights: 2, total: 700000, status: 'done' },
  { code: 'HS0008', name: 'Bùi Thị Thu', phone: '0955667788', email: 'thu.bui@gmail.com', room: rooms[2], checkin: '25/06/2026', checkout: '28/06/2026', nights: 3, total: 2100000, status: 'done' },
];
 
const promos = [
  { from: '01/07/2026', to: '31/07/2026', apply: 'Tất cả phòng', percent: 10, label: 'Khuyến mãi mùa hè' },
  { from: '01/08/2026', to: '15/08/2026', apply: 'Phòng VIP', percent: 15, label: 'Ưu đãi phòng VIP' },
];
 
const reviews = [
  { name: 'Nguyễn Văn An', text: 'Phòng sạch sẽ, nhân viên nhiệt tình, sẽ quay lại lần sau.', room: rooms[0], star: 5 },
  { name: 'Trần Thị Bích', text: 'Vị trí thuận tiện, giá cả hợp lý. Rất hài lòng.', room: rooms[1], star: 5 },
  { name: 'Lê Hoàng Cường', text: 'Phòng ổn nhưng hơi ồn vào buổi tối.', room: rooms[2], star: 4 },
  { name: 'Đỗ Thị Phương', text: 'Dịch vụ tốt, đáng đồng tiền bát gạo.', room: rooms[1], star: 5 },
  { name: 'Vũ Minh Quang', text: 'Trải nghiệm bình thường, không có gì đặc biệt.', room: rooms[0], star: 3 },
];
 
const services = [
  { name: 'Nguyễn Văn An', room: rooms[0], date: '02/07/2026', time: '19:00', services: 'Giặt ủi, ăn sáng', total: 150000, note: '', status: 'done' },
  { name: 'Lê Hoàng Cường', room: rooms[2], date: '09/07/2026', time: '08:00', services: 'Thuê xe máy', total: 200000, note: 'Trả xe trước 18h', status: 'new' },
];
 
async function seed() {
  console.log('🔌 Đang kết nối MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Kết nối thành công!');
 
  console.log('🗑️  Xóa dữ liệu cũ (nếu có)...');
  await Promise.all([
    Booking.deleteMany({}),
    Promo.deleteMany({}),
    Review.deleteMany({}),
    Service.deleteMany({}),
  ]);
 
  console.log('🌱 Đang tạo dữ liệu mẫu...');
  await Booking.insertMany(bookings);
  await Promo.insertMany(promos);
  await Review.insertMany(reviews);
  await Service.insertMany(services);
 
  console.log(`✅ Đã tạo: ${bookings.length} booking, ${promos.length} khuyến mãi, ${reviews.length} đánh giá, ${services.length} dịch vụ.`);
 
  await mongoose.disconnect();
  console.log('✅ Hoàn tất, đã ngắt kết nối.');
}
 
seed().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
 