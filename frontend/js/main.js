
// ================================================================
  // ⚙️ CẤU HÌNH EMAILJS — https://dashboard.emailjs.com
  // 1. Tạo tài khoản miễn phí tại emailjs.com
  // 2. Add Email Service (Gmail) → copy Service ID
  // 3. Tạo 2 Email Template → copy Template ID
  // 4. Account → API Keys → copy Public Key
  // ================================================================
  const EMAILJS_PUBLIC_KEY    = 'pUy-ayRECajyRNy2k';   // Public Key của bạn
  const EMAILJS_SERVICE_ID    = 'service_12345';         // Service ID thật (Gmail đã kết nối)
  const EMAILJS_TEMPLATE_OWNER = 'template_d2ozdyn';    // Template gửi cho chủ nhà (To: sonhung...@gmail.com)
  const EMAILJS_TEMPLATE_GUEST = 'template_alfhcb7';    // Template gửi cho khách (To: {{guest_email}})
 
  // ================================================================
  // ⚙️ CẤU HÌNH TELEGRAM — Nhận thông báo tức thì khi có booking mới
  // 1. Nhắn @BotFather trên Telegram → /newbot → copy TOKEN
  // 2. Nhắn bot của bạn 1 tin → rồi vào:
  //    https://api.telegram.org/bot<TOKEN>/getUpdates → copy chat id
  // ================================================================
  const TELEGRAM_BOT_TOKEN = '';   // ← VD: '7234567890:AAF...'
  const TELEGRAM_CHAT_ID   = '';   // ← VD: '123456789'
  // ================================================================
  // ⚙️ CẤU HÌNH AI TƯ VẤN PHÒNG — backend Node (Render) giữ API key Gemini,
  // frontend KHÔNG BAO GIỜ được gọi thẳng Gemini hay chứa API key ở đây.
  // Điền URL backend đã deploy, ví dụ: 'https://duan-nhanghi-backend.onrender.com'
  // ================================================================
 const AI_API_BASE = 'https://nh-ngh-h-ng-s-n.onrender.com';// ← TODO: điền URL backend Render của bạn vào đây
 
  try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {}
 
  async function sendTelegram(booking) {
    if(!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const msg = encodeURIComponent(
      '🏨 ĐẶT PHÒNG MỚI - Nhà Nghỉ Hùng Sơn\n' +
      '━━━━━━━━━━━━━━━\n' +
      '📋 Mã: ' + booking.code + '\n' +
      '👤 Khách: ' + booking.name + '\n' +
      '📞 SĐT: ' + booking.phone + '\n' +
      '🏠 Phòng: ' + booking.room + '\n' +
      '📅 Nhận: ' + booking.checkin + ' → Trả: ' + booking.checkout + '\n' +
      '🌙 Số đêm: ' + booking.nights + '\n' +
      '💰 Tổng: ' + booking.total.toLocaleString('vi') + 'đ\n' +
      (booking.email ? '📧 Email: ' + booking.email + '\n' : '') +
      '━━━━━━━━━━━━━━━\n' +
      '⏰ ' + new Date().toLocaleString('vi')
    );
    fetch('https://api.telegram.org/bot'+TELEGRAM_BOT_TOKEN+'/sendMessage?chat_id='+TELEGRAM_CHAT_ID+'&text='+msg)
      .catch(()=>{});
  }
  const PRICES = {'Phòng đơn':200000,'Phòng đôi':350000};
  // ================================================================
  // DỮ LIỆU: FIREBASE (đồng bộ mọi thiết bị) + localStorage (offline)
  // ================================================================
  // ⚙️ CẤU HÌNH FIREBASE — Thay bằng config của bạn từ console.firebase.google.com
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyD-REPLACE-WITH-YOUR-KEY",
    authDomain:        "nha-nghi-hung-son.firebaseapp.com",
    databaseURL:       "https://nha-nghi-hung-son-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "nha-nghi-hung-son",
    storageBucket:     "nha-nghi-hung-son.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:0000000000000000"
  };
  let _db = null;
  let _firebaseReady = false;
 
  async function initFirebase() {
    try {
      const { initializeApp, getDatabase, ref, set, get, onValue } = window._firebaseModules || {};
      if(!initializeApp) throw new Error('Firebase SDK chua san sang');
      const app = initializeApp(FIREBASE_CONFIG);
      _db = getDatabase(app);
      _firebaseReady = true;
      // Lắng nghe thay đổi real-time
      onValue(ref(_db, 'data'), snap => {
        const d = snap.val();
        if(!d) return;
        if(d.bookings)      bookings      = Object.values(d.bookings);
        if(d.reviews)       reviews       = Object.values(d.reviews);
        if(d.serviceOrders) serviceOrders = Object.values(d.serviceOrders);
        if(d.promos)        promos        = Object.values(d.promos);
        // Cập nhật UI nếu admin đang mở
        try { renderStats();renderAdmin();renderAdminReviews();renderAdminServices();renderPromoList();renderCouponList();renderGantt(); } catch(e){}
        renderCalendar(); updateRoomAvailability();
      });
      console.log('✓ Firebase kết nối thành công - dữ liệu đồng bộ mọi thiết bị');
    } catch(e) {
      console.warn('Firebase chưa cấu hình - dùng localStorage:', e.message);
      _firebaseReady = false;
    }
  }
 
  function saveData() {
    // Luôn lưu localStorage trước (offline fallback)
    localStorage.setItem('hs_bookings',      JSON.stringify(bookings));
    localStorage.setItem('hs_reviews',       JSON.stringify(reviews));
    localStorage.setItem('hs_serviceOrders', JSON.stringify(serviceOrders));
    localStorage.setItem('hs_promos',        JSON.stringify(promos));
    // Đồng bộ lên Firebase nếu đã kết nối
    if(_firebaseReady && _db) {
      const { ref, set } = window._firebaseModules;
      const toObj = arr => arr.reduce((o,x)=>{o[x.id||x._id||Date.now()]=x;return o},{});
      set(ref(_db,'data'), {
        bookings:      toObj(bookings),
        reviews:       toObj(reviews),
        serviceOrders: toObj(serviceOrders),
        promos:        toObj(promos),
      }).catch(e=>console.warn('Firebase save error:', e));
    }
  }
 
  function loadData() {
    // Load từ localStorage trước (instant)
    bookings      = JSON.parse(localStorage.getItem('hs_bookings')      || '[]');
    reviews       = JSON.parse(localStorage.getItem('hs_reviews')       || '[]');
    serviceOrders = JSON.parse(localStorage.getItem('hs_serviceOrders') || '[]');
    promos        = JSON.parse(localStorage.getItem('hs_promos')        || '[]');
    // Firebase sẽ tự cập nhật qua onValue listener
    initFirebase();
  }
 
  function checkLocalStorage() {}
 
  let bookings = [];
  let reviews = [];
  let serviceOrders = [];
  let promos = [];
  let selectedServices = {};
  const SERVICE_CATALOG = {
    clean:     {name:'Dọn phòng thêm',     price:50000,  icon:'🧹'},
    pickup:    {name:'Đón khách',           price:80000,  icon:'🚗'},
    breakfast: {name:'Bữa sáng',            price:40000,  icon:'🍳'},
    laundry:   {name:'Giặt ủi',             price:30000,  icon:'👕'},
    bike:      {name:'Thuê xe máy',         price:120000, icon:'🛵'},
    tour:      {name:'Hướng dẫn tham quan', price:150000, icon:'🗺️'},
  };
  let selectedStar = 0;
  let calYear, calMonth;
 
  // ===== NGÔN NGỮ =====
  let currentLang = 'vi';
  function setLang(lang) {
    currentLang = lang;
    document.getElementById('btnVI').classList.toggle('active', lang==='vi');
    document.getElementById('btnEN').classList.toggle('active', lang==='en');
    document.querySelectorAll('[data-vi][data-en]').forEach(el => {
      if(el.tagName==='INPUT') el.placeholder = el.getAttribute('data-'+lang)||el.placeholder;
      else el.textContent = el.getAttribute('data-'+lang)||el.textContent;
    });
    // Cập nhật placeholder form
    const placeholders = {
      vi: {gName:'Nguyễn Văn A', gPhone:'09xx xxx xxx', gEmail:'example@gmail.com', svcName:'Nguyễn Văn A', rvName:'Nguyễn Văn A', rvText:'Chia sẻ cảm nhận của bạn...', svcNote:'Ví dụ: đón tại bến xe Phú Lộc lúc 14h...'},
      en: {gName:'John Smith', gPhone:'09xx xxx xxx', gEmail:'example@gmail.com', svcName:'John Smith', rvName:'John Smith', rvText:'Share your experience...', svcNote:'E.g: pick up at Phu Loc station at 2pm...'}
    };
    Object.entries(placeholders[lang]).forEach(([id,val])=>{
      const el=document.getElementById(id); if(el) el.placeholder=val;
    });
  }
 
  // ===== SỐ PHÒNG CÒN LẠI =====
  const ROOM_TOTAL = {'Phòng đơn': 5, 'Phòng đôi': 3};
  function updateRoomAvailability() {
    const today = new Date().toISOString().split('T')[0];
    ['Phòng đơn','Phòng đôi'].forEach(room => {
      const booked = bookings.filter(b =>
        b.room === room && b.status !== 'cancel' &&
        b.checkin <= today && b.checkout > today
      ).length;
      const available = Math.max(0, ROOM_TOTAL[room] - booked);
      const isEn = currentLang === 'en';
      const id = room === 'Phòng đơn' ? 'Single' : 'Double';
      const countEl = document.getElementById('count'+id);
      const availEl = document.getElementById('avail'+id);
      if(!countEl||!availEl) return;
      countEl.textContent = available;
      const dot = availEl.querySelector('.avail-dot');
      dot.className = 'avail-dot ' + (available > 2 ? 'green' : available > 0 ? 'orange' : 'red');
      if(available === 0) {
        availEl.querySelector('.avail-text').textContent = isEn ? 'Fully booked' : 'Hết phòng';
        countEl.textContent = '';
        availEl.querySelector('span:last-child').textContent = '';
      } else {
        availEl.querySelector('.avail-text').textContent = isEn ? 'Available: ' : 'Còn ';
        availEl.querySelector('span:last-child').textContent = isEn ? ' rooms' : ' phòng trống';
      }
    });
  }
 
  function init() {
    const now = new Date();
    calYear = now.getFullYear(); calMonth = now.getMonth();
    loadData();
    renderCalendar();
    checkTodayPromo();
    updateRoomAvailability();
    renderReviews();
    renderPromoList();
    const today = now.toISOString().split('T')[0];
    document.getElementById('gCheckin').min = today;
    document.getElementById('gCheckout').min = today;
    document.getElementById('svcDate').min = today;
  }
 
  function closeCodeModal(){
    document.getElementById('codeModalOverlay').style.display='none';
  }
 
  function copyCode(){
    const code = document.getElementById('modalCode').textContent;
    navigator.clipboard.writeText(code).then(()=>{
      document.getElementById('copyDone').style.display='block';
    }).catch(()=>{
      // fallback
      const el = document.createElement('textarea');
      el.value = code; document.body.appendChild(el);
      el.select(); document.execCommand('copy');
      document.body.removeChild(el);
      document.getElementById('copyDone').style.display='block';
    });
  }
 
  // ===== TRA CỨU KHÁCH HÀNG =====
function switchLookupTab(tab) {
    const isCode = tab === 'code';
    document.getElementById('panelCode').style.display  = isCode ? 'flex'  : 'none';
    document.getElementById('panelPhone').style.display = isCode ? 'none'  : 'flex';
    document.getElementById('tabCode').className  = isCode ? 'lookup-tab-active'   : 'lookup-tab-inactive';
    document.getElementById('tabPhone').className = isCode ? 'lookup-tab-inactive' : 'lookup-tab-active';
    document.getElementById('lookupErr').style.display = 'none';
    document.getElementById('customerBody').innerHTML = `<div class="customer-empty"><div class="big-icon">🔍</div><div style="font-size:15px;font-weight:500;color:var(--text);margin-bottom:8px">Nhập thông tin để tra cứu</div></div>`;
  }
 
  function doLookup(){
    const num = document.getElementById('lookupCode').value.trim();
    const code = 'HS' + num;
    const errEl = document.getElementById('lookupErr');
    errEl.style.display='none';
    if(!num){errEl.textContent='Vui lòng nhập số mã đặt phòng.';errEl.style.display='block';return}
    const booking = bookings.find(b=>b.code===code);
    if(!booking){errEl.textContent='Không tìm thấy mã "'+code+'". Vui lòng kiểm tra lại.';errEl.style.display='block';return}
    renderCustomerResult(booking);
  }
 
  function renderCustomerResult(booking){
    const body = document.getElementById('customerBody');
    const svcOrders = serviceOrders.filter(s=>s.name===booking.name);
    const points = Math.floor(booking.total/10000) + svcOrders.reduce((a,s)=>a+Math.floor(s.total/10000),0);
    const nextTier = points < 50 ? 50 : points < 200 ? 200 : 500;
    const tierName = points >= 200 ? '🥇 VIP' : points >= 50 ? '🥈 Thân thiết' : '🥉 Thành viên';
    const sLabel={new:'Chờ xác nhận',done:'Đã xác nhận',cancel:'Đã hủy'};
    const sCls={new:'status-new',done:'status-done',cancel:'status-cancel'};
 
    let svcHTML = '';
    if(svcOrders.length){
      svcHTML = `<div class="svc-detail-card">
        <div class="sdc-header">
          <div class="sdc-title">🛎 Dịch vụ đã đặt</div>
          <span style="font-size:12px;color:var(--muted)">${svcOrders.length} đơn</span>
        </div>
        <div class="sdc-body">
          ${svcOrders.map(s=>`
            <div class="sdc-row">
              <span class="sdc-label">${s.services}</span>
              <span class="sdc-val">${s.date} ${s.time} · <span style="color:var(--green)">${s.total.toLocaleString('vi')}đ</span> · <span class="status-badge ${sCls[s.status]}">${sLabel[s.status]}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
    }
 
    body.innerHTML = `
      <div class="points-card">
        <div class="points-label">Điểm tích lũy</div>
        <div class="points-val">${points} <span style="font-size:20px">điểm</span></div>
        <div class="points-sub">${tierName} · Còn ${Math.max(0,nextTier-points)} điểm lên hạng tiếp</div>
        <div class="points-bar-track"><div class="points-bar-fill" style="width:${Math.min(100,Math.round(points/nextTier*100))}%"></div></div>
        <div class="points-next">Mỗi 10.000đ chi tiêu = 1 điểm</div>
      </div>
 
      <div class="booking-detail-card">
        <div class="bdc-header">
          <div>
            <div class="bdc-code">${booking.code}</div>
            <div class="bdc-date">Đặt ngày ${booking.createdAt}</div>
          </div>
          <span class="status-badge ${sCls[booking.status]}" style="font-size:13px;padding:6px 14px">${sLabel[booking.status]}</span>
        </div>
        <div class="bdc-body">
          <div class="bdc-grid">
            <div class="bdc-item"><label>Họ tên</label><span>${booking.name}</span></div>
            <div class="bdc-item"><label>Số điện thoại</label><span>${booking.phone}</span></div>
            <div class="bdc-item"><label>Loại phòng</label><span>${booking.room}</span></div>
            <div class="bdc-item"><label>Số đêm</label><span>${booking.nights} đêm</span></div>
            <div class="bdc-item"><label>Nhận phòng</label><span>${booking.checkin}</span></div>
            <div class="bdc-item"><label>Trả phòng</label><span>${booking.checkout}</span></div>
          </div>
          <div class="bdc-total">
            <span class="bdc-total-label">Tổng tiền</span>
            <span class="bdc-total-val">${booking.total.toLocaleString('vi')}đ</span>
          </div>
          <div class="bdc-actions">
            <button class="btn-cancel-booking"
              ${booking.status!=='new'?'disabled':''}
              onclick="cancelFromLookup('${booking.code}')">
              ${booking.status==='cancel'?'Đã hủy':booking.status==='done'?'Không thể hủy':'Hủy đặt phòng'}
            </button>
            <button onclick="printInvoice(${booking.id})" style="background:var(--dark);color:var(--gold);border:1px solid var(--gold);padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">🖨 In hóa đơn</button>
            <button class="btn-print" onclick="printInvoice(${booking.id||booking._id})">🖨 In hóa đơn</button>
          </div>
        </div>
      </div>
 
      ${svcHTML}
 
      <div style="text-align:center;margin-top:8px">
        <button onclick="document.getElementById('lookupCode').value='';document.getElementById('customerBody').innerHTML='<div class=customer-empty><div class=big-icon>🔍</div><div>Nhập mã để tra cứu</div></div>'"
          style="background:none;border:1px solid var(--border);color:var(--muted);padding:9px 20px;border-radius:8px;cursor:pointer;font-family:DM Sans,sans-serif;font-size:13px">
          ← Tra cứu mã khác
        </button>
      </div>`;
  }
 
  function cancelFromLookup(code){
    if(!confirm('Bạn có chắc muốn hủy đặt phòng '+code+'?')) return;
    const b=bookings.find(x=>x.code===code);
    if(b){
      b.status='cancel';
      // FIX: Cập nhật lên server
      saveData();
      renderCustomerResult(b);renderCalendar();updateRoomAvailability();
      if(document.getElementById('adminBody').style.display==='block'){renderAdmin();renderStats()}
    }
  }
 
  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    if(id==='customerPage'){
      document.getElementById('lookupCode').value='';
      document.getElementById('lookupErr').style.display='none';
      document.getElementById('customerBody').innerHTML=`<div class="customer-empty"><div class="big-icon">🔍</div><div style="font-size:15px;font-weight:500;color:var(--text);margin-bottom:8px">Nhập mã để tra cứu</div><div style="font-size:13px;color:var(--muted)">Mã đặt phòng dạng <strong>HS123456</strong> — hiển thị sau khi đặt phòng thành công</div></div>`;
    }
    if(id==='adminPage'){
      document.getElementById('adminLogin').style.display='block';
      document.getElementById('adminBody').style.display='none';
      document.getElementById('loginUser').value='';
      document.getElementById('loginPass').value='';
      document.getElementById('loginErr').style.display='none';
    }
  }
 
  function goSection(id) {
    const el = document.getElementById(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({top, behavior:'smooth'});
  }
 
  function selectRoom(room) {
    document.getElementById('gRoom').value = room;
    goSection('booking');
    calcPrice();
  }
 
  function getActivePromo(dateStr, room) {
    const d = new Date(dateStr);
    return promos.find(p => {
      const from = new Date(p.from), to = new Date(p.to);
      to.setHours(23,59,59);
      return d >= from && d <= to && (p.apply === 'Tất cả phòng' || p.apply === room);
    });
  }
 
  function calcPrice() {
    const ci = document.getElementById('gCheckin').value;
    const co = document.getElementById('gCheckout').value;
    const room = document.getElementById('gRoom').value;
    const ps = document.getElementById('priceSummary');
    if(!ci||!co){ps.classList.remove('show');return}
    const nights = Math.round((new Date(co)-new Date(ci))/86400000);
    if(nights<=0){ps.classList.remove('show');return}
    const rate = PRICES[room];
    const promo = getActivePromo(ci, room);
    const discount = promo ? promo.percent : 0;
    const discountedRate = Math.round(rate * (1 - discount/100));
    const total = nights * discountedRate;
    // Tính thêm coupon
    let finalTotal = total;
    let html = `<div class="ps-row"><span class="ps-label">${nights} đêm × ${room}</span><span class="ps-val">${rate.toLocaleString('vi')}đ / đêm</span></div>`;
    if(promo) html += `<div class="ps-row"><span class="ps-label" style="color:#6fcf97">🎉 Khuyến mãi (${promo.label})</span><span class="ps-val" style="color:#6fcf97">-${discount}%</span></div>`;
    if(appliedCoupon) {
      const couponDiscount = Math.round(total * appliedCoupon.percent / 100);
      finalTotal = total - couponDiscount;
      html += `<div class="ps-row"><span class="ps-label" style="color:#6fcf97">🏷 Mã ${appliedCoupon.code}</span><span class="ps-val" style="color:#6fcf97">-${couponDiscount.toLocaleString('vi')}đ <span style="font-size:11px;cursor:pointer;opacity:.7" onclick="removeCoupon()">✕ bỏ</span></span></div>`;
    }
    html += `<div class="ps-total"><span class="ps-total-label">Tổng tiền</span><span class="ps-total-val">${finalTotal.toLocaleString('vi')}đ</span></div>`;
    document.getElementById('priceSummary').innerHTML = html;
    ps.classList.add('show');
    document.getElementById('couponArea').style.display='block';
    if(document.getElementById('recurringBox')&&document.getElementById('recurringBox').style.display!=='none')previewRecurring();
  }
 
  // Tính số phòng còn trống (của 1 loại phòng) trong suốt khoảng [ci, co)
  // Trả về số nhỏ nhất còn trống trong các đêm — nếu <=0 nghĩa là có ít nhất 1 đêm đã hết phòng
  function getAvailableRoomsForRange(room, ci, co) {
    const total = ROOM_TOTAL[room] || 0;
    let minAvail = total;
    let d = new Date(ci);
    const end = new Date(co);
    while (d < end) {
      const ds = d.toISOString().split('T')[0];
      const bookedCount = bookings.filter(b =>
        b.room === room && b.status !== 'cancel' &&
        b.checkin <= ds && b.checkout > ds
      ).length;
      minAvail = Math.min(minAvail, total - bookedCount);
      d.setDate(d.getDate() + 1);
    }
    return minAvail;
  }
 
  async function handleBooking() {
    const name = document.getElementById('gName').value.trim();
    const phone = document.getElementById('gPhone').value.trim();
    const email = document.getElementById('gEmail').value.trim();
    const ci = document.getElementById('gCheckin').value;
    const co = document.getElementById('gCheckout').value;
    const room = document.getElementById('gRoom').value;
    const errEl = document.getElementById('gError');
    const btn = document.querySelector('.btn-submit');
    errEl.style.display='none';
    if(!name||!phone||!ci||!co){errEl.textContent='Vui lòng điền đầy đủ thông tin.';errEl.style.display='block';return}
    if(!/^[0-9]{9,11}$/.test(phone.replace(/\s/g,''))){errEl.textContent='Số điện thoại không hợp lệ (9–11 chữ số).';errEl.style.display='block';return}
    if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){errEl.textContent='Email không hợp lệ.';errEl.style.display='block';return}
    const nights = Math.round((new Date(co)-new Date(ci))/86400000);
    if(nights<=0){errEl.textContent='Ngày trả phòng phải sau ngày nhận phòng.';errEl.style.display='block';return}
    if(getAvailableRoomsForRange(room, ci, co) <= 0){
      errEl.textContent = 'Rất tiếc, '+room+' đã hết trong khoảng ngày bạn chọn. Vui lòng chọn ngày khác hoặc loại phòng khác.';
      errEl.style.display='block';
      return;
    }
    const promo = getActivePromo(ci, room);
    const discount = promo ? promo.percent : 0;
    const rate = Math.round(PRICES[room] * (1 - discount/100));
    const total = nights*rate;
    const params = {
      guest_name: name, guest_phone: phone, guest_email: email||'(không cung cấp)',
      room, checkin: ci, checkout: co, nights, total: total.toLocaleString('vi')+'đ'
    };
    btn.textContent='Đang xử lý...'; btn.disabled=true;
    // ✅ FIX: Lưu booking TRƯỚC, gửi email SAU (không chặn luồng)
    const bookingCode = 'HS'+Date.now().toString().slice(-6);
    const newBooking = {code:bookingCode,name,phone,email,checkin:ci,checkout:co,room,nights,total,status:'new',createdAt:new Date().toLocaleDateString('vi')};
    const recurExtra = getRecurringBookings();
    const createdBooking = {...newBooking, id:Date.now(), coupon: appliedCoupon?appliedCoupon.code:''};
    bookings.unshift(createdBooking);
    sendTelegram(createdBooking); // Thông báo Telegram tức thì
    recurExtra.forEach((r,ri)=>{
      const rid=Date.now()+ri+1;
      bookings.unshift({...newBooking,id:rid,checkin:r.checkin,checkout:r.checkout,nights:r.nights,
        total:r.nights*(PRICES[newBooking.room]||200000),code:'HS'+(rid.toString().slice(-6)),coupon:''});
    });
    if(appliedCoupon){appliedCoupon.used++;saveCoupons();appliedCoupon=null;document.getElementById('couponInput').value='';}
    saveData();
    renderCalendar();
    updateRoomAvailability();
    document.getElementById('gName').value='';
    document.getElementById('gPhone').value='';
    document.getElementById('gEmail').value='';
    document.getElementById('gCheckin').value='';
    document.getElementById('gCheckout').value='';
    document.getElementById('priceSummary').classList.remove('show');
    btn.textContent='Xác nhận đặt phòng'; btn.disabled=false;
    const ok=document.getElementById('gSuccess');
    ok.innerHTML = '✓ Đặt phòng thành công!<br>📋 Mã đặt phòng của bạn: <strong style="font-size:16px;letter-spacing:1px">'+bookingCode+'</strong> — lưu lại để tra cứu!';
    ok.style.display='block';
    setTimeout(()=>ok.style.display='none',5000);
    document.getElementById('modalCode').textContent = bookingCode;
    document.getElementById('codeModalOverlay').style.display='flex';
    document.getElementById('copyDone').style.display='none';
    // Gửi email bất đồng bộ — không chặn, không báo lỗi cho khách nếu thất bại
   const sends = [emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_OWNER, params)];
    if(email) sends.push(emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_GUEST, params));
    Promise.all(sends).catch(err => console.warn('EmailJS warning:', err));
  }
 
  function changeMonth(d){calMonth+=d;if(calMonth>11){calMonth=0;calYear++}if(calMonth<0){calMonth=11;calYear--}renderCalendar()}
 
  function getBookedDates(){
    const dates=new Set();
    bookings.filter(b=>b.status!=='cancel').forEach(b=>{
      let d=new Date(b.checkin);const end=new Date(b.checkout);
      while(d<end){dates.add(d.toISOString().split('T')[0]);d.setDate(d.getDate()+1)}
    });
    return dates;
  }
 
  function renderCalendar(){
    const months=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    document.getElementById('calMonth').textContent=months[calMonth]+' '+calYear;
    const booked=getBookedDates();
    const today=new Date().toISOString().split('T')[0];
    const grid=document.getElementById('calGrid');
    const days=['CN','T2','T3','T4','T5','T6','T7'];
    let html=days.map(d=>`<div class="cal-day-label">${d}</div>`).join('');
    const first=new Date(calYear,calMonth,1).getDay();
    for(let i=0;i<first;i++)html+=`<div class="cal-day empty"></div>`;
    const total=new Date(calYear,calMonth+1,0).getDate();
    for(let d=1;d<=total;d++){
      const ds=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      let cls='cal-day';
      if(booked.has(ds))cls+=' booked';
      else if(ds===today)cls+=' today';
      html+=`<div class="${cls}">${d}</div>`;
    }
    grid.innerHTML=html;
  }
 
  async function doLogin(){
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginErr');
    // Kiểm tra khóa brute force
    const now = Date.now();
    if(lockUntil > now) {
      const secs = Math.ceil((lockUntil-now)/1000);
      errEl.textContent = 'Quá nhiều lần thử! Vui lòng đợi '+secs+' giây.';
      errEl.style.display='block'; return;
    }
    const hash = await sha256(p);
    if(u === ADMIN_USER && hash === ADMIN_PASS_HASH) {
      // Đăng nhập thành công
      loginAttempts = 0;
      sessionStorage.removeItem('hs_login_attempts');
      sessionStorage.removeItem('hs_lock_until');
      sessionStorage.setItem('hs_auth', btoa(ADMIN_USER+':'+Date.now()));
      document.getElementById('adminLogin').style.display='none';
      document.getElementById('adminBody').style.display='block';
      renderStats();renderAdmin();renderAdminReviews();renderAdminServices();renderPromoList();renderCouponList();renderGantt();
    } else {
      loginAttempts++;
      sessionStorage.setItem('hs_login_attempts', loginAttempts);
      if(loginAttempts >= 5) {
        lockUntil = Date.now() + 5*60*1000; // khóa 5 phút
        sessionStorage.setItem('hs_lock_until', lockUntil);
        errEl.textContent = 'Đăng nhập sai quá 5 lần! Tài khoản bị khóa 5 phút.';
      } else {
        errEl.textContent = 'Sai tên đăng nhập hoặc mật khẩu. (Lần '+loginAttempts+'/5)';
      }
      errEl.style.display='block';
    }
  }
 
  // Kiểm tra session còn hợp lệ khi load trang
  function checkAdminSession() {
    const auth = sessionStorage.getItem('hs_auth');
    if(!auth) return;
    try {
      const [user, ts] = atob(auth).split(':');
      if(user === ADMIN_USER && Date.now() - parseInt(ts) < 8*60*60*1000) {
        // Session còn hợp lệ (8 giờ)
        document.getElementById('adminLogin').style.display='none';
        document.getElementById('adminBody').style.display='block';
        renderStats();renderAdmin();renderAdminReviews();renderAdminServices();renderPromoList();renderCouponList();renderGantt();
      }
    } catch(e) { sessionStorage.removeItem('hs_auth'); }
  }
 
  let currentDash = 'month';
 
  function renderStats(){
    const total=bookings.length;
    const newB=bookings.filter(b=>b.status==='new').length;
    const revenue=bookings.filter(b=>b.status!=='cancel').reduce((s,b)=>s+b.total,0);
    const nights=bookings.filter(b=>b.status!=='cancel').reduce((s,b)=>s+b.nights,0);
    document.getElementById('statsGrid').innerHTML=`
      <div class="stat-card"><div class="stat-label">Tổng đặt phòng</div><div class="stat-val">${total}</div></div>
      <div class="stat-card"><div class="stat-label">Chờ xác nhận</div><div class="stat-val gold">${newB}</div></div>
      <div class="stat-card"><div class="stat-label">Tổng số đêm</div><div class="stat-val">${nights}</div></div>
      <div class="stat-card"><div class="stat-label">Doanh thu</div><div class="stat-val green">${revenue.toLocaleString('vi')}đ</div></div>
    `;
    renderDashChart(currentDash);
  }
 
  function switchDash(type, btn) {
    currentDash = type;
    document.querySelectorAll('.dash-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderDashChart(type);
  }
 
  function renderDashChart(type) {
    const chart = document.getElementById('barChart');
    const summary = document.getElementById('summaryRow');
    const title = document.getElementById('chartTitle');
    const active = bookings.filter(b=>b.status!=='cancel');
    let labels=[], values=[], totalRev=0, totalNights=0, totalBook=0;
 
    if(type==='month') {
      title.textContent = 'Doanh thu 6 tháng gần nhất';
      const map={};
      for(let i=5;i>=0;i--){
        const d=new Date(); d.setMonth(d.getMonth()-i);
        const key=d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0');
        const label='T'+(d.getMonth()+1);
        map[key]={label,rev:0,nights:0,count:0};
      }
      active.forEach(b=>{
        const parts=(b.checkin||'').split('/');
        const key = parts.length===3 ? parts[2]+'-'+parts[1].padStart(2,'0') : (b.checkin||'').substring(0,7);
        if(map[key]){map[key].rev+=b.total;map[key].nights+=b.nights;map[key].count++;}
      });
      Object.values(map).forEach(m=>{labels.push(m.label);values.push(m.rev);totalRev+=m.rev;totalNights+=m.nights;totalBook+=m.count;});
 
    } else if(type==='day') {
      title.textContent = 'Doanh thu 14 ngày gần nhất';
      const map={};
      for(let i=13;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const key=d.toLocaleDateString('vi');
        const label=(d.getDate()).toString().padStart(2,'0')+'/'+(d.getMonth()+1);
        map[key]={label,rev:0,nights:0,count:0};
      }
      active.forEach(b=>{
        if(map[b.checkin]){map[b.checkin].rev+=b.total;map[b.checkin].nights+=b.nights;map[b.checkin].count++;}
      });
      Object.values(map).forEach(m=>{labels.push(m.label);values.push(m.rev);totalRev+=m.rev;totalNights+=m.nights;totalBook+=m.count;});
 
    } else {
      title.textContent = 'Doanh thu theo loại phòng';
      const rooms={'Phòng đơn':{rev:0,nights:0,count:0},'Phòng đôi':{rev:0,nights:0,count:0}};
      active.forEach(b=>{if(rooms[b.room]){rooms[b.room].rev+=b.total;rooms[b.room].nights+=b.nights;rooms[b.room].count++;}});
      Object.entries(rooms).forEach(([r,v])=>{labels.push(r);values.push(v.rev);totalRev+=v.rev;totalNights+=v.nights;totalBook+=v.count;});
    }
 
    const maxVal = Math.max(...values, 1);
    chart.innerHTML = values.map((v,i)=>`
      <div class="bar-col" title="${labels[i]}: ${v.toLocaleString('vi')}đ">
        <div class="bar" style="height:${Math.max(v/maxVal*140,v>0?4:1)}px">
          <span class="bar-val">${v>0?Math.round(v/1000)+'k':''}</span>
        </div>
        <div class="bar-label">${labels[i]}</div>
      </div>`).join('');
 
    summary.innerHTML = `
      <div class="summary-mini"><div class="summary-mini-val rev-green">${totalRev.toLocaleString('vi')}đ</div><div class="summary-mini-label">Doanh thu</div></div>
      <div class="summary-mini"><div class="summary-mini-val">${totalBook}</div><div class="summary-mini-label">Đặt phòng</div></div>
      <div class="summary-mini"><div class="summary-mini-val rev-gold">${totalNights}</div><div class="summary-mini-label">Số đêm</div></div>`;
  }
 
  function renderAdmin(){
    const rf=document.getElementById('filterRoom').value;
    const sf=document.getElementById('filterStatus').value;
    let data=bookings.filter(b=>(!rf||b.room===rf)&&(!sf||b.status===sf));
    const sLabel={new:'Mới',done:'Đã xác nhận',cancel:'Đã hủy'};
    const sCls={new:'status-new',done:'status-done',cancel:'status-cancel'};
    if(!data.length){document.getElementById('adminTable').innerHTML='<div class="empty-state">Chưa có đặt phòng nào</div>';return}
    document.getElementById('adminTable').innerHTML=`
      <table>
        <thead><tr><th>Khách</th><th>SĐT</th><th>Phòng</th><th>Nhận phòng</th><th>Trả phòng</th><th>Số đêm</th><th>Tổng tiền</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
        <tbody>${data.map(b=>`<tr>
          <td style="font-weight:500">${b.name}</td><td>${b.phone}</td><td>${b.room}</td>
          <td>${b.checkin}</td><td>${b.checkout}</td><td style="text-align:center">${b.nights}</td>
          <td style="color:var(--green);font-weight:500">${b.total.toLocaleString('vi')}đ</td>
          <td><span class="status-badge ${sCls[b.status]}">${sLabel[b.status]}</span></td>
          <td><div class="td-actions">
            ${b.status==='new'?`<button class="act-btn act-done" onclick="changeStatus(${b.id},'done')">Xác nhận</button>`:''}
            ${b.status!=='cancel'?`<button class="act-btn act-del" onclick="changeStatus(${b.id},'cancel')">Hủy</button>`:''}
            <button class="act-btn" style="background:#f0f0f0;color:#333" onclick="printInvoice(${b.id})">🖨</button>
            <button class="act-btn" style="background:#f0f0f0;color:#333" onclick="printInvoice(${b.id})">🖨</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>`;
  }
 
  async function changeStatus(id,status){
    const b=bookings.find(x=>x.id===id||x._id===id);
    if(b){
      b.status=status;
      saveData();
      renderStats();renderAdmin();renderCalendar();updateRoomAvailability();renderGantt();
    }
  }
 
  async function addPromo(){
    const from=document.getElementById('promoFrom').value;
    const to=document.getElementById('promoTo').value;
    const apply=document.getElementById('promoApply').value;
    const percent=parseInt(document.getElementById('promoPercent').value);
    const label=document.getElementById('promoLabel2').value.trim();
    if(!from||!to||!percent||!label){alert('Vui lòng điền đầy đủ thông tin khuyến mãi.');return}
    if(percent<1||percent>99){alert('Phần trăm giảm giá phải từ 1–99%.');return}
    if(new Date(to)<new Date(from)){alert('Ngày kết thúc phải sau ngày bắt đầu.');return}
    const newPromo = {id:Date.now(),from,to,apply,percent,label};
    try {
      promos.unshift(newPromo);
      saveData();
    } catch(e) {}
    document.getElementById('promoFrom').value='';
    document.getElementById('promoTo').value='';
    document.getElementById('promoPercent').value='';
    document.getElementById('promoLabel2').value='';
    renderPromoList();
    checkTodayPromo();
    calcPrice();
  }
 
  async function deletePromo(id){
    promos=promos.filter(p=>p.id!==id&&p._id!==id);
    saveData();
    renderPromoList();checkTodayPromo();calcPrice();
  }
 
  function renderPromoList(){
    const el=document.getElementById('promoList');
    if(!promos.length){el.innerHTML='<div class="empty-state" style="padding:20px 0">Chưa có chương trình khuyến mãi nào</div>';return}
    const today=new Date();
    el.innerHTML=promos.map(p=>{
      const from=new Date(p.from),to=new Date(p.to);to.setHours(23,59,59);
      const active=today>=from&&today<=to;
      return `<div class="promo-item">
        <div>
          <div class="promo-item-info">
            ${active?'🟢':'⚪'} <strong>${p.label}</strong> — ${p.apply}
            <span class="promo-discount"> -${p.percent}%</span>
          </div>
          <div class="promo-item-date">${p.from} → ${p.to}</div>
        </div>
        <button class="btn-del-promo" onclick="deletePromo(${p.id})">Xóa</button>
      </div>`;
    }).join('');
  }
 
  function checkTodayPromo(){
    const today=new Date().toISOString().split('T')[0];
    const active=promos.filter(p=>{
      const from=new Date(p.from),to=new Date(p.to);to.setHours(23,59,59);
      return new Date(today)>=from&&new Date(today)<=to;
    });
    const banner=document.getElementById('promoBanner');
    if(!active.length){banner.style.display='none';return}
    const p=active[0];
    banner.style.display='flex';
    document.getElementById('promoDiscount').textContent='-'+p.percent+'%';
    document.getElementById('promoRoom').textContent=p.apply;
    document.getElementById('promoLabel').textContent='🎉 '+p.label;
    // Cập nhật giá phòng hiển thị trên card
    const single=200000,double=350000;
    document.querySelectorAll('.room-price').forEach((el,i)=>{
      const base=i===0?single:double;
      const room=i===0?'Phòng đơn':'Phòng đôi';
      const promo=active.find(p=>p.apply==='Tất cả phòng'||p.apply===room);
      if(promo){
        const discounted=Math.round(base*(1-promo.percent/100));
        el.innerHTML=`<s style="color:var(--muted);font-size:12px">${base.toLocaleString('vi')}đ</s> <span style="color:var(--red)">${discounted.toLocaleString('vi')}đ</span> / đêm`;
      } else {
        el.textContent=base.toLocaleString('vi')+'đ / đêm';
      }
    });
  }
 
  function toggleService(key){
    if(selectedServices[key]) delete selectedServices[key];
    else selectedServices[key]=1;
    document.getElementById('svc-'+key).classList.toggle('selected', !!selectedServices[key]);
    renderSelectedServices();
  }
 
  function renderSelectedServices(){
    const list=document.getElementById('selectedServicesList');
    const keys=Object.keys(selectedServices);
    if(!keys.length){
      list.innerHTML='<div style="font-size:13px;color:rgba(255,255,255,0.3);padding:16px 0">Chưa chọn dịch vụ nào — nhấn vào thẻ phía trên để thêm</div>';
      document.getElementById('svcTotalRow').style.display='none';
      return;
    }
    let total=0;
    list.innerHTML=keys.map(k=>{
      const s=SERVICE_CATALOG[k]; total+=s.price;
      return `<div class="sel-svc-item">
        <span class="sel-svc-name">${s.icon} ${s.name}</span>
        <span style="display:flex;align-items:center;gap:10px">
          <span class="sel-svc-price">${s.price.toLocaleString('vi')}đ</span>
          <button class="sel-svc-remove" onclick="toggleService('${k}')">×</button>
        </span>
      </div>`;
    }).join('');
    document.getElementById('svcTotalRow').style.display='flex';
    document.getElementById('svcTotalVal').textContent=total.toLocaleString('vi')+'đ';
  }
 
  async function handleServiceBooking(){
    const name=document.getElementById('svcName').value.trim();
    const room=document.getElementById('svcRoom').value;
    const date=document.getElementById('svcDate').value;
    const time=document.getElementById('svcTime').value;
    const note=document.getElementById('svcNote').value.trim();
    const errEl=document.getElementById('svcError');
    errEl.style.display='none';
    const keys=Object.keys(selectedServices);
    if(!name||!date){errEl.textContent='Vui lòng điền họ tên và ngày cần dịch vụ.';errEl.style.display='block';return}
    if(!keys.length){errEl.textContent='Vui lòng chọn ít nhất 1 dịch vụ.';errEl.style.display='block';return}
    const services=keys.map(k=>SERVICE_CATALOG[k].name).join(', ');
    const total=keys.reduce((s,k)=>s+SERVICE_CATALOG[k].price,0);
    const newSvc = {id:Date.now(),name,room,date,time,services,total,note,status:'new',createdAt:new Date().toLocaleDateString('vi')};
    try {
      serviceOrders.unshift(newSvc);
      saveData();
    } catch(e) {}
    if(document.getElementById('adminBody').style.display==='block') renderAdminServices();
    selectedServices={};
    Object.keys(SERVICE_CATALOG).forEach(k=>document.getElementById('svc-'+k).classList.remove('selected'));
    renderSelectedServices();
    document.getElementById('svcName').value='';
    document.getElementById('svcDate').value='';
    document.getElementById('svcNote').value='';
    const ok=document.getElementById('svcSuccess');
    ok.textContent='✓ Đặt dịch vụ thành công! Chúng tôi sẽ chuẩn bị trước cho bạn.';
    ok.style.display='block';
    setTimeout(()=>ok.style.display='none',4000);
  }
 
  function renderAdminServices(){
    const el=document.getElementById('adminServices');
    if(!serviceOrders.length){el.innerHTML='<div class="empty-state">Chưa có đơn dịch vụ nào</div>';return}
    const sLabel={new:'Mới',done:'Hoàn thành',cancel:'Đã hủy'};
    const sCls={new:'status-new',done:'status-done',cancel:'status-cancel'};
    el.innerHTML=`<table>
      <thead><tr><th>Khách</th><th>Phòng</th><th>Dịch vụ</th><th>Ngày</th><th>Giờ</th><th>Tổng</th><th>Ghi chú</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
      <tbody>${serviceOrders.slice().reverse().map(o=>`<tr>
        <td style="font-weight:500">${o.name}</td><td>${o.room}</td>
        <td style="max-width:160px">${o.services}</td>
        <td>${o.date}</td><td>${o.time}</td>
        <td style="color:var(--green);font-weight:500">${o.total.toLocaleString('vi')}đ</td>
        <td style="color:var(--muted);font-size:12px">${o.note||'—'}</td>
        <td><span class="status-badge ${sCls[o.status]}">${sLabel[o.status]}</span></td>
        <td><div class="td-actions">
          ${o.status==='new'?`<button class="act-btn act-done" onclick="changeSvcStatus(${o.id},'done')">Xong</button>`:''}
          ${o.status!=='cancel'?`<button class="act-btn act-del" onclick="changeSvcStatus(${o.id},'cancel')">Hủy</button>`:''}
        </div></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }
 
  async function changeSvcStatus(id,status){
    const o=serviceOrders.find(x=>x.id===id||x._id===id);
    if(o){
      o.status=status;
      saveData();
      renderAdminServices();
    }
  }
 
  function setStar(n){
    selectedStar=n;
    document.querySelectorAll('#starPicker span').forEach((s,i)=>{
      s.classList.toggle('active',i<n);
    });
  }
 
  async function submitReview(){
    const name=document.getElementById('rvName').value.trim();
    const text=document.getElementById('rvText').value.trim();
    const room=document.getElementById('rvRoom').value;
    if(!name||!text||!selectedStar){alert('Vui lòng điền tên, chọn sao và nhập nhận xét.');return}
    const newReview = {id:Date.now(),name,text,room,star:selectedStar,date:new Date().toLocaleDateString('vi')};
    try {
      reviews.unshift(newReview);
      saveData();
    } catch(e) {}
    renderReviews();
    if(document.getElementById('adminBody').style.display==='block') renderAdminReviews();
    document.getElementById('rvName').value='';
    document.getElementById('rvText').value='';
    setStar(0);selectedStar=0;
    const ok=document.getElementById('reviewOk');
    ok.style.display='block';
    setTimeout(()=>ok.style.display='none',3000);
  }
 
  function renderReviews(){
    const grid=document.getElementById('reviewsGrid');
    if(!reviews.length){
      grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--muted);font-size:14px">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>';
      updateSummary(); return;
    }
    grid.innerHTML=reviews.slice().reverse().map(r=>`
      <div class="review-card">
        <div class="review-header">
          <div><div class="reviewer-name">${r.name}</div><div class="review-room">${r.room}</div></div>
          <div class="review-date">${r.date}</div>
        </div>
        <div class="review-stars">${'★'.repeat(r.star)}${'☆'.repeat(5-r.star)}</div>
        <div class="review-text">${r.text}</div>
      </div>`).join('');
    updateSummary();
  }
 
  function updateSummary(){
    const el=document.getElementById('reviewSummary');
    if(!reviews.length){
      document.getElementById('rsNumber').textContent='—';
      document.getElementById('rsStars').textContent='';
      document.getElementById('rsCount').textContent='Chưa có đánh giá';
      document.getElementById('rsBars').innerHTML='';
      return;
    }
    const avg=(reviews.reduce((s,r)=>s+r.star,0)/reviews.length);
    const avgR=Math.round(avg*10)/10;
    document.getElementById('rsNumber').textContent=avgR.toFixed(1);
    document.getElementById('rsStars').textContent='★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg));
    document.getElementById('rsCount').textContent=reviews.length+' đánh giá';
    const counts=[5,4,3,2,1].map(s=>({s,c:reviews.filter(r=>r.star===s).length}));
    document.getElementById('rsBars').innerHTML=counts.map(({s,c})=>`
      <div class="rs-bar-row">
        <div class="rs-bar-label">${s}★</div>
        <div class="rs-bar-track"><div class="rs-bar-fill" style="width:${reviews.length?Math.round(c/reviews.length*100):0}%"></div></div>
        <div class="rs-bar-count">${c}</div>
      </div>`).join('');
  }
 
  function renderAdminReviews(){
    const el=document.getElementById('adminReviews');
    if(!reviews.length){el.innerHTML='<div class="empty-state">Chưa có đánh giá nào</div>';return}
    el.innerHTML=reviews.slice().reverse().map(r=>`
      <div class="admin-review-card">
        <div class="arc-top">
          <div><div class="arc-name">${r.name}</div></div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="arc-stars">${'★'.repeat(r.star)}</span>
            <button class="btn-del-review" onclick="deleteReview(${r.id})">Xóa</button>
          </div>
        </div>
        <div class="arc-meta">${r.room} · ${r.date}</div>
        <div class="arc-text">${r.text}</div>
      </div>`).join('');
  }
 
  async function deleteReview(id){
    reviews=reviews.filter(r=>r.id!==id&&r._id!==id);
    saveData();
    renderReviews(); renderAdminReviews();
  }
 
 
  // ===== COUPON CODE =====
  let coupons = JSON.parse(localStorage.getItem('hs_coupons') || '[]');
  let appliedCoupon = null;
 
  function saveCoupons() { localStorage.setItem('hs_coupons', JSON.stringify(coupons)); }
 
  function addCoupon() {
    const code = document.getElementById('cpCode').value.trim().toUpperCase();
    const percent = parseInt(document.getElementById('cpPercent').value);
    const limit = parseInt(document.getElementById('cpLimit').value) || 999;
    const expiry = document.getElementById('cpExpiry').value;
    if(!code || !percent) { alert('Vui long nhap ma va phan tram giam!'); return; }
    if(coupons.find(c=>c.code===code)) { alert('Ma nay da ton tai!'); return; }
    coupons.push({code, percent, limit, used:0, expiry, id:Date.now()});
    saveCoupons(); renderCouponList();
    document.getElementById('cpCode').value='';
    document.getElementById('cpPercent').value='';
    document.getElementById('cpLimit').value='';
    document.getElementById('cpExpiry').value='';
  }
 
  function deleteCoupon(id) {
    if(!confirm('Xoa ma giam gia nay?')) return;
    coupons = coupons.filter(c=>c.id!==id);
    saveCoupons(); renderCouponList();
  }
 
  function renderCouponList() {
    const el = document.getElementById('couponList');
    if(!el) return;
    if(!coupons.length){el.innerHTML='<div class="empty-state" style="padding:16px 0">Chua co ma giam gia nao</div>';return}
    el.innerHTML = coupons.map(c=>`
      <div class="coupon-list-item">
        <div>
          <div class="coupon-code-tag">${c.code}</div>
          <div class="coupon-info">Giam ${c.percent}% · Da dung: ${c.used}/${c.limit}${c.expiry?' · Het han: '+c.expiry:''}</div>
        </div>
        <button onclick="deleteCoupon(${c.id})" style="background:#fee2e2;border:none;border-radius:6px;padding:5px 10px;color:#c0392b;cursor:pointer;font-size:12px">Xoa</button>
      </div>`).join('');
  }
 
  function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const okEl = document.getElementById('couponOk');
    const errEl = document.getElementById('couponErr2');
    okEl.style.display='none'; errEl.style.display='none';
    if(!code){errEl.textContent='Vui long nhap ma!';errEl.style.display='block';return}
    const coupon = coupons.find(c=>c.code===code);
    if(!coupon){errEl.textContent='Ma "'+code+'" khong hop le hoac khong ton tai.';errEl.style.display='block';return}
    if(coupon.used>=coupon.limit){errEl.textContent='Ma nay da het luot su dung.';errEl.style.display='block';return}
    if(coupon.expiry && new Date(coupon.expiry)<new Date()){errEl.textContent='Ma nay da het han.';errEl.style.display='block';return}
    appliedCoupon = coupon;
    okEl.textContent='✓ Ap dung thanh cong! Giam '+coupon.percent+'% tong tien.';
    okEl.style.display='block';
    calcPrice();
  }
 
  function removeCoupon() {
    appliedCoupon = null;
    document.getElementById('couponInput').value='';
    document.getElementById('couponOk').style.display='none';
    calcPrice();
  }
 
  // ===== GANTT =====
  let ganttStartDate = new Date();
 
  function ganttToday() { ganttStartDate = new Date(); renderGantt(); }
  function ganttPrev()  { ganttStartDate = new Date(ganttStartDate); ganttStartDate.setDate(ganttStartDate.getDate()-14); renderGantt(); }
  function ganttNext()  { ganttStartDate = new Date(ganttStartDate); ganttStartDate.setDate(ganttStartDate.getDate()+14); renderGantt(); }
 
  function renderGantt() {
    const el = document.getElementById('ganttBody');
    const labelEl = document.getElementById('ganttLabel');
    if(!el) return;
    const DAYS = 14;
    const start = new Date(ganttStartDate);
    start.setDate(start.getDate() - 3);
    const today = new Date(); today.setHours(0,0,0,0);
 
    const days = [];
    for(let i=0;i<DAYS;i++){const d=new Date(start);d.setDate(d.getDate()+i);days.push(new Date(d));}
    if(labelEl) labelEl.textContent = days[0].toLocaleDateString('vi',{day:'2-digit',month:'2-digit'})+' – '+days[DAYS-1].toLocaleDateString('vi',{day:'2-digit',month:'2-digit'});
 
    const ROOMS = ['Phong don','Phong doi'];
    const ROOM_LABELS = {'Phong don':'Phòng đơn','Phong doi':'Phòng đôi'};
    const parseDate = s => {
      if(!s) return null;
      const p=s.split('/');
      if(p.length===3) return new Date(+p[2],+p[1]-1,+p[0]);
      return new Date(s);
    };
 
    let html = '<table class="gantt-table"><thead><tr><th style="min-width:90px">Phòng</th>';
    days.forEach(d=>{
      const isToday=d.getTime()===today.getTime();
      const isWE=d.getDay()===0||d.getDay()===6;
      html+=`<th style="${isToday?'background:rgba(201,168,76,0.3);':isWE?'color:var(--gold)':''}">${d.getDate()}/${d.getMonth()+1}</th>`;
    });
    html+='</tr></thead><tbody>';
 
    ['Phòng đơn','Phòng đôi'].forEach(room=>{
      const roomBk = bookings.filter(b=>b.room===room);
      const usedCols = new Set();
      html+=`<tr><td class="gantt-room-label">${room}</td>`;
      days.forEach((d,di)=>{
        if(usedCols.has(di)){return;}
        const dT=d.getTime();
        const isToday=dT===today.getTime();
        const startingBk = roomBk.find(b=>{const ci=parseDate(b.checkin);return ci&&ci.getTime()===dT;});
        if(startingBk){
          const ci=parseDate(startingBk.checkin);
          const co=parseDate(startingBk.checkout);
          const span=co&&ci?Math.round((co-ci)/86400000):1;
          const colSpan=Math.min(span,DAYS-di);
          for(let x=di+1;x<di+colSpan;x++) usedCols.add(x);
          html+=`<td colspan="${colSpan}" class="${isToday?'gantt-today':''}" style="overflow:visible;position:relative">
            <div class="gantt-bar ${startingBk.status}" title="${startingBk.name}: ${startingBk.checkin} → ${startingBk.checkout}">${startingBk.name.split(' ').pop()}</div></td>`;
        } else {
          const inBk=roomBk.find(b=>{const ci=parseDate(b.checkin);const co=parseDate(b.checkout);return ci&&co&&dT>ci.getTime()&&dT<co.getTime();});
          html+=`<td class="${isToday?'gantt-today':d.getDay()===0||d.getDay()===6?'gantt-weekend':''}">${inBk?'':''}</td>`;
        }
      });
      html+='</tr>';
    });
    html+='</tbody></table>';
    el.innerHTML=html;
  }
 
 
  // ===== CHÍNH SÁCH HỦY PHÒNG =====
  function togglePolicy() {
    const b=document.getElementById('policyBox');
    b.style.display=b.style.display==='none'?'block':'none';
  }
 
  // ===== ĐẶT PHÒNG ĐỊNH KỲ =====
  function toggleRecurring(){
    const b=document.getElementById('recurringBox');
    b.style.display=b.style.display==='none'?'block':'none';
    previewRecurring();
  }
  function previewRecurring(){
    const ci=document.getElementById('gCheckin').value;
    const co=document.getElementById('gCheckout').value;
    const freq=document.getElementById('recurFreq')?document.getElementById('recurFreq').value:'weekly';
    const count=parseInt(document.getElementById('recurCount')?document.getElementById('recurCount').value:'2');
    const prev=document.getElementById('recurPreview');
    if(!prev)return;
    if(!ci||!co){prev.innerHTML='← Chọn ngày nhận & trả phòng trước';return}
    const nights=Math.round((new Date(co)-new Date(ci))/86400000);
    if(nights<=0){prev.innerHTML='← Ngày không hợp lệ';return}
    const gap=freq==='weekly'?7:freq==='biweekly'?14:30;
    let lines=[];
    for(let i=0;i<count;i++){
      const s=new Date(ci);s.setDate(s.getDate()+gap*i);
      const e=new Date(s);e.setDate(e.getDate()+nights);
      const fmt=d=>d.toLocaleDateString('vi',{day:'2-digit',month:'2-digit',year:'numeric'});
      lines.push('📅 Lần '+(i+1)+': '+fmt(s)+' → '+fmt(e)+' ('+nights+' đêm)');
    }
    prev.innerHTML='<strong style="color:rgba(255,255,255,0.7)">Lịch định kỳ:</strong><br>'+lines.join('<br>');
  }
  function getRecurringBookings(){
    const box=document.getElementById('recurringBox');
    if(!box||box.style.display==='none')return[];
    const ci=document.getElementById('gCheckin').value;
    const co=document.getElementById('gCheckout').value;
    const freq=document.getElementById('recurFreq').value;
    const count=parseInt(document.getElementById('recurCount').value);
    if(!ci||!co||count<2)return[];
    const nights=Math.round((new Date(co)-new Date(ci))/86400000);
    const gap=freq==='weekly'?7:freq==='biweekly'?14:30;
    const extra=[];
    for(let i=1;i<count;i++){
      const s=new Date(ci);s.setDate(s.getDate()+gap*i);
      const e=new Date(s);e.setDate(e.getDate()+nights);
      extra.push({checkin:s.toLocaleDateString('vi'),checkout:e.toLocaleDateString('vi'),nights});
    }
    return extra;
  }
 
  // ===== FAQ =====
  const FAQ_DATA=[
    {q:'Giờ nhận phòng và trả phòng là mấy giờ?',a:'Nhận phòng từ 14:00. Trả phòng trước 12:00 trưa. Nếu cần nhận sớm hoặc trả muộn, vui lòng liên hệ trước để sắp xếp.'},
    {q:'Có thể hủy hoặc đổi lịch đặt phòng không?',a:'Có. Hủy trước 3 ngày: hoàn 100%. Hủy 1–2 ngày trước: hoàn 50%. Hủy trong ngày: không hoàn tiền. Đổi lịch miễn phí nếu báo trước 24 giờ.'},
    {q:'Nhà nghỉ có bãi đậu xe không?',a:'Có bãi đậu xe miễn phí cho xe máy và ô tô ngay trong khuôn viên.'},
    {q:'Wifi có tốt không? Có tính phí không?',a:'Wifi miễn phí, tốc độ cao phủ toàn bộ khu vực. Không giới hạn băng thông.'},
    {q:'Có dịch vụ đưa đón sân bay/ga tàu không?',a:'Có. Chi phí 80.000đ/lượt. Vui lòng đặt trước qua mục Dịch vụ hoặc gọi 0352 055 348.'},
    {q:'Phòng có điều hòa và nước nóng không?',a:'Tất cả phòng đều có điều hòa inverter và bình nước nóng. Phòng đôi thêm TV smart 43 inch.'},
    {q:'Thanh toán bằng hình thức nào?',a:'Tiền mặt và chuyển khoản ngân hàng. Thanh toán khi nhận phòng.'},
    {q:'Có thể mang thú cưng không?',a:'Rất tiếc, hiện tại chưa nhận thú cưng để đảm bảo vệ sinh cho các khách khác.'},
  ];
  function renderFAQ(){
    const el=document.getElementById('faqList');
    if(!el)return;
    el.innerHTML=FAQ_DATA.map((f,i)=>`
      <div id="faq_${i}" onclick="toggleFAQ(${i})" style="border:1px solid var(--border);border-radius:12px;margin-bottom:10px;overflow:hidden;transition:box-shadow .2s;cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;font-weight:500;font-size:14px;color:var(--dark)">
          ${f.q}<span id="faqIcon_${i}" style="color:var(--gold);font-size:18px;transition:transform .3s;flex-shrink:0">+</span>
        </div>
        <div id="faqA_${i}" style="max-height:0;overflow:hidden;transition:max-height .35s ease,padding .3s">
          <div style="font-size:13px;color:var(--muted);line-height:1.7;border-top:1px solid var(--border);padding:12px 20px 16px">${f.a}</div>
        </div>
      </div>`).join('');
  }
  function toggleFAQ(i){
    const ans=document.getElementById('faqA_'+i);
    const icon=document.getElementById('faqIcon_'+i);
    const isOpen=ans.style.maxHeight&&ans.style.maxHeight!=='0px';
    document.querySelectorAll('[id^="faqA_"]').forEach(el=>{el.style.maxHeight='0px';el.style.padding='0';});
    document.querySelectorAll('[id^="faqIcon_"]').forEach(el=>{el.style.transform='';el.textContent='+';});
    if(!isOpen){ans.style.maxHeight='300px';icon.style.transform='rotate(45deg)';icon.textContent='×';}
  }
 
  // ===== IN HÓA ĐƠN PDF =====
  function printInvoice(id){
    const b=bookings.find(x=>x.id===id||x._id===id);
    if(!b)return;
    document.getElementById('invoiceCode').textContent='Mã: '+b.code;
    document.getElementById('invoiceDate').textContent='Ngày in: '+new Date().toLocaleDateString('vi');
    document.getElementById('invoiceBody').innerHTML=`
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Họ tên</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Số điện thoại</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.phone}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Email</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.email||'—'}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Loại phòng</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.room}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Nhận phòng</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.checkin}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Trả phòng</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.checkout}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">Số đêm</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${b.nights} đêm</td></tr>
      ${b.coupon?'<tr><td style="padding:10px 14px;font-size:13px">Mã giảm giá</td><td style="padding:10px 14px;font-size:13px">'+b.coupon+'</td></tr>':''}`;
    document.getElementById('invoiceSubtotal').innerHTML=b.coupon?'<span>Tạm tính</span><span>—</span>':'';
    document.getElementById('invoiceDiscount').innerHTML=b.coupon?'<span>Mã '+b.coupon+'</span><span>Đã áp dụng</span>':'';
    document.getElementById('invoiceGrand').innerHTML='<span>Tổng thanh toán</span><span>'+b.total.toLocaleString('vi')+'đ</span>';
    document.getElementById('printArea').style.display='block';
    setTimeout(()=>{window.print();document.getElementById('printArea').style.display='none';},200);
  }
 // ================================================================
  // TƯ VẤN PHÒNG BẰNG AI (Gemini, qua backend Node)
  // ================================================================

  // Tính số phòng còn trống cho 1 loại phòng trong khoảng ngày [ci, co)
  function getAvailableRoomsForRange(room, ci, co){
    if(!ci || !co) return ROOM_TOTAL[room];
    const start = new Date(ci), end = new Date(co);
    if(!(start < end)) return ROOM_TOTAL[room];
    let maxBooked = 0;
    for(let d = new Date(start); d < end; d.setDate(d.getDate()+1)){
      const dStr = d.toISOString().split('T')[0];
      const booked = bookings.filter(b =>
        b.room === room && b.status !== 'cancel' &&
        b.checkin <= dStr && b.checkout > dStr
      ).length;
      if(booked > maxBooked) maxBooked = booked;
    }
    return Math.max(0, ROOM_TOTAL[room] - maxBooked);
  }

  function getAvailabilitySnapshot(ci, co){
    const snap = {};
    Object.keys(ROOM_TOTAL).forEach(room => {
      snap[room] = getAvailableRoomsForRange(room, ci, co);
    });
    return snap;
  }

  function checkAIConfigured(){
    if(!AI_API_BASE){
      alert('Tính năng AI chưa được cấu hình: cần điền AI_API_BASE (URL backend) trong js/main.js.');
      return false;
    }
    return true;
  }

  function openAIPanel(){
    document.getElementById('aiPanelOverlay').classList.add('open');
  }
  function closeAIPanel(){
    document.getElementById('aiPanelOverlay').classList.remove('open');
  }

  function switchAITab(tab){
    const isSuggest = tab === 'suggest';
    document.getElementById('aiTabSuggest').style.display = isSuggest ? 'block' : 'none';
    document.getElementById('aiTabChat').style.display = isSuggest ? 'none' : 'block';
    document.getElementById('aiTabBtnSuggest').classList.toggle('active', isSuggest);
    document.getElementById('aiTabBtnChat').classList.toggle('active', !isSuggest);
  }

  async function submitAISuggest(){
    if(!checkAIConfigured()) return;
    const guests = document.getElementById('aiGuests').value.trim();
    const budget = document.getElementById('aiBudget').value.trim();
    const needs = document.getElementById('aiNeeds').value.trim();
    const checkin = document.getElementById('aiCheckin').value;
    const checkout = document.getElementById('aiCheckout').value;
    const resultEl = document.getElementById('aiSuggestResult');
    const btn = document.getElementById('aiSuggestBtn');

    if(!guests){
      resultEl.textContent = 'Vui lòng nhập số lượng khách.';
      return;
    }

    const availability = getAvailabilitySnapshot(checkin, checkout);

    btn.disabled = true; btn.textContent = 'Đang phân tích...';
    resultEl.textContent = '';
    try{
      const resp = await fetch(AI_API_BASE + '/api/ai/suggest', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ guests, budget, needs, checkin, checkout, availability })
      });
      const data = await resp.json();
      if(!resp.ok) throw new Error(data.error || 'Lỗi không xác định');
      resultEl.textContent = data.reply;
    }catch(err){
      resultEl.textContent = '⚠️ Không thể lấy tư vấn lúc này (' + err.message + '). Vui lòng thử lại sau.';
    }finally{
      btn.disabled = false; btn.textContent = '✨ Nhờ AI tư vấn';
    }
  }

  let aiChatHistory = []; // {role:'user'|'model', text:'...'}

  function appendAIChatBubble(text, who){
    const box = document.getElementById('aiChatMessages');
    const div = document.createElement('div');
    div.className = 'ai-msg ' + (who === 'user' ? 'ai-msg-user' : 'ai-msg-bot');
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  async function sendAIChatMessage(){
    if(!checkAIConfigured()) return;
    const input = document.getElementById('aiChatInput');
    const message = input.value.trim();
    if(!message) return;

    appendAIChatBubble(message, 'user');
    aiChatHistory.push({role:'user', text: message});
    input.value = '';

    const ci = document.getElementById('gCheckin') ? document.getElementById('gCheckin').value : '';
    const co = document.getElementById('gCheckout') ? document.getElementById('gCheckout').value : '';
    const availability = getAvailabilitySnapshot(ci, co);

    appendAIChatBubble('Đang trả lời...', 'bot');
    const box = document.getElementById('aiChatMessages');

    try{
      const resp = await fetch(AI_API_BASE + '/api/ai/chat', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ message, history: aiChatHistory.slice(0,-1), availability })
      });
      const data = await resp.json();
      box.removeChild(box.lastChild);
      if(!resp.ok) throw new Error(data.error || 'Lỗi không xác định');
      appendAIChatBubble(data.reply, 'bot');
      aiChatHistory.push({role:'model', text: data.reply});
    }catch(err){
      box.removeChild(box.lastChild);
      appendAIChatBubble('⚠️ Không thể trả lời lúc này (' + err.message + ').', 'bot');
    }
  }
  // ===== XUẤT EXCEL (CSV) =====
  function exportExcel(){
    const month=document.getElementById('exportMonth').value;
    let data=bookings.filter(b=>b.status!=='cancel');
    if(month){
      data=data.filter(b=>{
        const p=(b.checkin||'').split('/');
        if(p.length===3)return p[2]+'-'+p[1].padStart(2,'0')===month;
        return (b.checkin||'').startsWith(month);
      });
    }
    if(!data.length){alert('Khong co du lieu de xuat!');return}
    const BOM='﻿';
    const header=['Ma dat phong','Ho ten','SDT','Email','Phong','Nhan phong','Tra phong','So dem','Tong tien','Trang thai','Coupon','Ghi chu'];
    const sLabel={new:'Cho xac nhan',done:'Da xac nhan',cancel:'Da huy'};
    const rows=data.map(b=>[b.code,b.name,b.phone,b.email||'',b.room,b.checkin,b.checkout,b.nights,b.total,sLabel[b.status]||b.status,b.coupon||'',b.note||'']);
    const csv=BOM+[header,...rows].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='BaoCao_HungSon_'+(month||'TatCa')+'_'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();URL.revokeObjectURL(url);
  }
 
 
  // ================================================================
  // BẢO MẬT ADMIN - SHA-256 hashing + brute force protection
  // ================================================================
  // Mật khẩu được hash bằng SHA-256 - không lưu plain text
  // Để đổi mật khẩu: chạy hashPassword('matkhaumoi') trong console
  // rồi copy kết quả thay vào ADMIN_PASS_HASH bên dưới
  const ADMIN_USER = 'admin';
  const ADMIN_PASS_HASH = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // = "123"
  // Thay bằng hash của mật khẩu bạn muốn. VD: hashPassword('matkhau2024')
 
  let loginAttempts = parseInt(sessionStorage.getItem('hs_login_attempts')||'0');
  let lockUntil = parseInt(sessionStorage.getItem('hs_lock_until')||'0');
 
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
 
  async function hashPassword(pass) {
    const h = await sha256(pass);
    console.log('Hash của "'+pass+'" là:', h);
    return h;
  }
 
 
  async function changeAdminPassword() {
    const current = prompt('Nhập mật khẩu hiện tại:');
    if(!current) return;
    const currentHash = await sha256(current);
    if(currentHash !== ADMIN_PASS_HASH) { alert('Mật khẩu hiện tại không đúng!'); return; }
    const newPass = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if(!newPass || newPass.length < 6) { alert('Mật khẩu phải ít nhất 6 ký tự!'); return; }
    const confirm = prompt('Nhập lại mật khẩu mới:');
    if(newPass !== confirm) { alert('Mật khẩu không khớp!'); return; }
    const newHash = await sha256(newPass);
    localStorage.setItem('hs_admin_hash', newHash);
    alert('✓ Đổi mật khẩu thành công!\nHash mới: '+newHash+'\nLưu hash này vào ADMIN_PASS_HASH trong file để dùng lâu dài.');
  }
 
 
  // ===== HAMBURGER MOBILE NAV =====
  function toggleMobileNav() {
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('mobile-open');
  }
  // Đóng nav khi click link
  document.addEventListener('click', e => {
    if(e.target.closest('#mainNav a')) document.getElementById('mainNav').classList.remove('mobile-open');
  });
 
 
  function openPrivacy() { document.getElementById('privacyModal').classList.add('open'); }
  function closePrivacy() { document.getElementById('privacyModal').classList.remove('open'); }
 
// ===== GALLERY =====
  const GALLERY_DATA = {
    single: {
      title: 'Phòng Đơn',
      slides: [
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-1-1.webp', label:'Giường đơn tiêu chuẩn', icon:'🛏', bg:'linear-gradient(135deg,#e8dcc8,#d4c4a0)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-1.webp',   label:'Phòng tắm riêng', icon:'🚿', bg:'linear-gradient(135deg,#dce8e8,#a0c4c4)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-2-1.webp', label:'Điều hòa inverter', icon:'❄️', bg:'linear-gradient(135deg,#d8e8dc,#a0c4a8)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-3-1.webp', label:'TV & Wifi tốc độ cao', icon:'📺', bg:'linear-gradient(135deg,#e0d8e8,#b8a8d0)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-4-1.webp', label:'View sân vườn', icon:'🌿', bg:'linear-gradient(135deg,#dce8d0,#a8c4a0)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-5-2.webp', label:'Không gian & ánh sáng', icon:'💡', bg:'linear-gradient(135deg,#f0e7d6,#c9b98a)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-13-1 (1).webp', label:'Góc nhìn thư giãn', icon:'🛋️', bg:'linear-gradient(135deg,#e9d7e0,#c9a7b5)'},
      ]
    },
    double: {
      title: 'Phòng Đôi',
      slides: [
        {src:'assets/images/phong-superior-2-giuong-don-khach-san-phan-van-1-1.webp', label:'2 giường đôi rộng rãi', icon:'🛏🛏', bg:'linear-gradient(135deg,#c8d8e8,#a0b8cc)'},
        {src:'assets/images/phong-superior-2-giuong-don-khach-san-phan-van-1.webp',   label:'Phòng tắm & tiện nghi', icon:'🛁', bg:'linear-gradient(135deg,#ccd8e8,#a0b4d0)'},
        {src:'assets/images/phong-superior-2-giuong-don-khach-san-phan-van-2-1.webp', label:'Điều hòa inverter', icon:'❄️', bg:'linear-gradient(135deg,#d8e8dc,#a0c4a8)'},
        {src:'assets/images/phong-superior-2-giuong-don-khach-san-phan-van-3-1.webp', label:'Smart TV 43 inch', icon:'🖥', bg:'linear-gradient(135deg,#e0d8e8,#b8a8d0)'},
        {src:'assets/images/phong-superior-2-giuong-don-khach-san-phan-van-4-1-786465c7-6d30-49c3-8b27-8bc1ca4cd438.webp', label:'Ban công view núi', icon:'🌅', bg:'linear-gradient(135deg,#e8e0d0,#d0c0a0)'},
        {src:'assets/images/phong-superior-2-giuong-don-khach-san-phan-van-5-1.webp', label:'Góc nghỉ ngơi', icon:'🛌', bg:'linear-gradient(135deg,#e6f2ff,#b9d3ff)'},
        {src:'assets/images/can-ho-2-phong-ngu-co-ban-cong-rieng-khach-san-phan-van-1.webp', label:'Chi tiết nội thất', icon:'🪑', bg:'linear-gradient(135deg,#f3efe6,#d1c4a3)'},
      ]
    }
  };
  let galleryCurrent = {type:'single', idx:0};
 
  function openGallery(type) {
    galleryCurrent = {type, idx:0};
    const data = GALLERY_DATA[type];
    document.getElementById('galleryTitle').textContent = '🏨 ' + data.title;
    renderGallery();
    document.getElementById('galleryOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
 
  function closeGallery() {
    document.getElementById('galleryOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
 
  function renderGallery() {
    const {type, idx} = galleryCurrent;
    const slides = GALLERY_DATA[type].slides;
    const slide = slides[idx];
    const main = document.getElementById('galleryMain');
    main.style.background = slide.bg;
    if(slide.src){
      main.innerHTML = `
        <div class="gallery-img-wrap">
          <img class="gallery-img" alt="${slide.label}" src="${slide.src}" />
          <div class="gallery-caption">
            <span class="gallery-caption-icon">${slide.icon}</span>
            <span class="gallery-caption-text">${slide.label}</span>
          </div>
        </div>
      `;
    } else {
      main.innerHTML = `<div style="text-align:center"><div style="font-size:72px;margin-bottom:12px">${slide.icon}</div><div style="color:#555;font-size:14px;font-weight:500">${slide.label}</div></div>`;
    }
    const thumbs = document.getElementById('galleryThumbs');
    thumbs.innerHTML = slides.map((s,i) => `
      <div class="gallery-thumb ${i===idx?'active':''}" onclick="galleryCurrent.idx=${i};renderGallery()"
        style="background:${s.bg}">${s.icon}</div>`).join('');
  }
 
  function galleryNext() { const s=GALLERY_DATA[galleryCurrent.type].slides; galleryCurrent.idx=(galleryCurrent.idx+1)%s.length; renderGallery(); }
  function galleryPrev() { const s=GALLERY_DATA[galleryCurrent.type].slides; galleryCurrent.idx=(galleryCurrent.idx-1+s.length)%s.length; renderGallery(); }
  document.addEventListener('keydown', e => { if(!document.getElementById('galleryOverlay').classList.contains('open')) return; if(e.key==='ArrowRight') galleryNext(); if(e.key==='ArrowLeft') galleryPrev(); if(e.key==='Escape') closeGallery(); });
 
const COMBOS = {
    sleep:   {room:'Phòng đơn', nights:1, price:180000, label:'Combo Nghỉ Ngơi'},
    family:  {room:'Phòng đôi', nights:1, price:308000, label:'Combo Gia Đình'},
    explore: {room:'Phòng đơn', nights:2, price:450000, label:'Combo Khám Phá'},
    vip:     {room:'Phòng đôi', nights:2, price:750000, label:'Combo Nghỉ Dưỡng'},
  }
 
 
  function saveNote(id) {
    const b = bookings.find(x=>x.id===id||x._id===id);
    if(!b) return;
    b.note = document.getElementById('note_'+id).value.trim();
    saveData();
    const el = document.getElementById('noteSaved_'+id);
    if(el){el.style.display='inline';setTimeout(()=>el.style.display='none',1500);}
  }
 
  init();
 