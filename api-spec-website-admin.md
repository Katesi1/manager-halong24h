# API Spec — Trang Quản Lý (Web Admin)

> **Ngày**: 2026-05-08
> **Audience**: Web frontend dev (trang quản lý)
> **Backend**: Đã deploy
> **Base URL**: `http://103.183.118.148:3000/api/v1`
> **Swagger UI**: `http://103.183.118.148:3000/api`

---

## 0. Quy Ước Chung

### 0.1 Response Format

**Success** (HTTP 2xx):
```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... }   // hoặc array, hoặc null
}
```

**Error** (HTTP 4xx / 5xx):
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Lý do lỗi cụ thể",
  "errors": null,
  "path": "/api/v1/...",
  "timestamp": "2026-05-08T08:30:00.000Z"
}
```

> **Lưu ý**: Web FE chỉ cần check `success` và `message` để hiển thị toast/alert. Field `data` luôn xuất hiện ở response thành công.

### 0.2 Authentication

- Tất cả endpoint (trừ public) yêu cầu header:
  ```
  Authorization: Bearer <accessToken>
  ```
- `accessToken` có thời hạn **15 phút** (900 giây).
- `refreshToken` có thời hạn **7 ngày** (604800 giây).
- Khi nhận HTTP 401 → gọi `POST /auth/refresh` để lấy token mới. Nếu refresh cũng fail → logout, đẩy về trang login.

### 0.3 Đa Ngôn Ngữ (i18n)

- Tùy chọn: gửi kèm header `Accept-Language: vi` hoặc `Accept-Language: en`.
- Mặc định: `en`.
- Field `message` trong response sẽ trả về theo ngôn ngữ đã chọn.

### 0.4 Role Codes (số nguyên)

| Code | Role     | Mô tả                                   |
|------|----------|-----------------------------------------|
| 0    | ADMIN    | Quản trị viên hệ thống                  |
| 1    | OWNER    | Chủ homestay/villa                      |
| 2    | SALE     | Nhân viên (thuộc về 1 OWNER)            |
| 3    | CUSTOMER | Khách hàng (không vào trang quản lý)    |

Trang quản lý chỉ phục vụ **role 0, 1, 2**. Nếu user login với role 3 → FE chặn không cho vào.

### 0.5 Property Type & Cancellation Policy

| `type` | Loại     |
|--------|----------|
| 0      | VILLA    |
| 1      | HOMESTAY |
| 2      | HOTEL    |

| `cancellationPolicy` | Chính sách |
|----------------------|------------|
| 0                    | FLEXIBLE   |
| 1                    | MODERATE   |
| 2                    | STRICT     |

| `view`  | Mô tả          |
|---------|----------------|
| `sea`   | View biển      |
| `city`  | View thành phố |
| `null`  | Không xác định |

---

## 1. AUTH MODULE

### 1.1 Đăng Nhập

`POST /auth/login`  •  **Public**

**Request body:**
```json
{
  "email": "owner@example.com",
  "password": "Abcd@1234"
}
```

**Validation:**
- `email`: bắt buộc, định dạng email
- `password`: bắt buộc, tối thiểu 6 ký tự

**Response 200:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "name": "Nguyễn Văn A",
      "phone": "0912345678",
      "email": "owner@example.com",
      "role": 1,
      "ownerId": null,
      "isActive": true
    }
  }
}
```

**Errors:**
- `401` — sai email/mật khẩu, hoặc tài khoản bị khóa.

**FE notes:**
- Lưu `accessToken` + `refreshToken` (localStorage hoặc httpOnly cookie tùy stack).
- Nếu `role === 3` (CUSTOMER) → từ chối vào trang quản lý.
- Nếu `role === 2` (SALE) và `ownerId === null` → user chưa được Admin gán, FE nên show banner "Tài khoản chưa được kích hoạt, vui lòng liên hệ Admin" nhưng vẫn cho vào (chỉ xem được trang giới hạn).

---

### 1.2 Đăng Ký

`POST /auth/register`  •  **Public**

**Request body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "newuser@example.com",
  "password": "matkhau123",
  "role": 1,
  "phone": "0912345678"
}
```

**Validation:**
- `name`: 2-100 ký tự
- `email`: bắt buộc, email hợp lệ, unique
- `password`: tối thiểu 6 ký tự
- `role`: chỉ chấp nhận `1` (OWNER), `2` (SALE), hoặc `3` (CUSTOMER). **Không cho đăng ký role 0 (ADMIN).**
- `phone`: optional, nếu có phải là 10-11 số bắt đầu bằng `0`

**Response 201:**
Cấu trúc giống `POST /auth/login` (auto-login sau register).

**Errors:**
- `409` — email hoặc phone đã tồn tại.
- `400` — validation fail (sai định dạng).

**FE notes:**
- Trang quản lý chỉ cho đăng ký `role = 1` hoặc `role = 2`.

---

### 1.3 Đăng Nhập Google

`POST /auth/google`  •  **Public**

**Request body:**
```json
{
  "idToken": "<Google ID Token từ Google Sign-In SDK>",
  "role": 1
}
```

- `role`: bắt buộc với user mới (chưa từng login). User cũ → bỏ qua.

**Response 200:** giống `/auth/login`.

---

### 1.4 Refresh Token

`POST /auth/refresh`  •  **Public**

**Request body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Làm mới token thành công",
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Errors:**
- `403` — refresh token không hợp lệ hoặc hết hạn → FE phải logout user.

**FE notes:**
- Implement axios/fetch interceptor: bắt 401 → gọi refresh → retry request gốc.
- Mỗi lần refresh sẽ trả về **refreshToken mới** → cập nhật lại storage.

---

### 1.5 Quên Mật Khẩu

`POST /auth/forgot-password`  •  **Public**

**Request body:**
```json
{
  "identifier": "user@example.com"
}
```
- `identifier`: email hoặc số điện thoại.

**Response 200:** luôn trả message thành công (kể cả email không tồn tại — chống enumeration).

---

### 1.6 Đặt Lại Mật Khẩu

`POST /auth/reset-password`  •  **Public**

**Request body:**
```json
{
  "token": "<reset token từ email/SMS>",
  "newPassword": "matkhauMoi123"
}
```

**Response 200:** message thành công.

**Errors:**
- `400` — token không hợp lệ/hết hạn.

---

### 1.7 Profile Hiện Tại

`GET /auth/profile`  •  **Auth required**

**Response 200:**
```json
{
  "success": true,
  "message": "Lấy thông tin thành công",
  "data": {
    "id": "uuid",
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "owner@example.com",
    "role": 1,
    "ownerId": null,
    "isActive": true,
    "gender": 0,
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "kycBypass": false,
    "kycStatus": "approved",
    "subscriptionStatus": "active",
    "subscriptionPlanId": "plan-uuid",
    "subscriptionCycle": "monthly",
    "trialEndsAt": null,
    "nextChargeAt": "2026-06-01T00:00:00.000Z",
    "permissions": [
      { "module": "properties", "canCreate": true, "canRead": true, "canUpdate": true, "canDelete": false },
      { "module": "bookings",   "canCreate": true, "canRead": true, "canUpdate": true, "canDelete": true  }
    ]
  }
}
```

**FE notes — RẤT QUAN TRỌNG:**
- Gọi endpoint này **ngay sau login** và **mỗi lần load app** để lấy `permissions` mới nhất.
- Field `permissions` quyết định menu/nút nào hiển thị trong trang quản lý.
- Quy tắc:
  - `role === 0` (ADMIN) → bypass mọi check, hiện toàn bộ menu.
  - `role === 1, 2` (OWNER/SALE) → chỉ hiện CRUD button khi `permissions[module].canX === true`.
  - Mặc định OWNER/SALE chỉ có quyền `canRead = true`, các quyền khác do Admin cấp.
- Field `kycStatus`:
  - `none` → chưa nộp KYC, hiện banner "Nộp KYC để bắt đầu quản lý"
  - `pending` → đang xử lý
  - `approved` → đã duyệt, full access
  - `rejected` → bị từ chối, show lý do
- `kycBypass = true` → OWNER không cần KYC vẫn CRUD được property (Admin cấp).

---

### 1.8 Đăng Xuất

`POST /auth/logout`  •  **Auth required**

**Response 200:** message thành công.

**FE notes:** xóa token khỏi storage, redirect về trang login.

---

### 1.9 Đổi Mật Khẩu

`POST /auth/change-password`  •  **Auth required**

**Request body:**
```json
{
  "currentPassword": "matkhauCu",
  "newPassword": "matkhauMoi123"
}
```

**Errors:**
- `400` — `currentPassword` sai.

---

## 2. PROPERTIES MODULE

> **Phân quyền tổng quát** (kết hợp với permission system):
> - `ADMIN`: thấy tất cả property.
> - `OWNER`: chỉ thấy property của mình (`ownerId === user.id`).
> - `SALE`: chỉ thấy property của owner đã được gán (`ownerId === user.ownerId`).
> - `OWNER` phải có KYC `approved` (hoặc `kycBypass = true`) thì mới Create/Update/Delete được.

### 2.1 Danh Sách Property (Quản lý)

`GET /properties`  •  **Roles: ADMIN, OWNER, SALE** + permission `properties.canRead`

**Query params:**
| Param             | Type    | Mô tả                                                  |
|-------------------|---------|--------------------------------------------------------|
| `includeInactive` | boolean | `true` để hiện cả property đang tắt (mặc định: false)  |
| `view`            | string  | Lọc theo view: `sea` hoặc `city`                       |

**Response 200:**
```json
{
  "success": true,
  "message": "Danh sách phòng",
  "data": [
    {
      "id": "uuid",
      "name": "Villa B1716",
      "type": 0,
      "code": "B1716",
      "view": "sea",
      "address": "Bãi Cháy, Hạ Long",
      "mapLink": "https://maps.google.com/...",
      "isActive": true,
      "bedrooms": 3,
      "bathrooms": 2,
      "standardGuests": 4,
      "maxGuests": 8,
      "weekdayPrice": 1500000,
      "weekendPrice": 2000000,
      "holidayPrice": 2500000,
      "adultSurcharge": 200000,
      "childSurcharge": 100000,
      "amenities": ["Wifi", "Điều hòa", "Bể bơi"],
      "cancellationPolicy": 0,
      "rules": "Không hút thuốc",
      "services": ["BBQ", "Thuê xe máy"],
      "checkInTime": "14:00",
      "checkOutTime": "12:00",
      "description": "...",
      "ownerId": "uuid",
      "owner": { "id": "uuid", "name": "Nguyễn Văn A", "phone": "0912345678" },
      "images": [
        { "id": "uuid", "imageUrl": "https://res.cloudinary.com/...", "isCover": true, "order": 0 }
      ],
      "_count": { "bookings": 12 }
    }
  ]
}
```

---

### 2.2 Chi Tiết Property

`GET /properties/:id`  •  **Auth required** (mọi user đã login đều xem được)

**Response 200:** một object property (cấu trúc giống item trong danh sách).

**Errors:**
- `404` — không tìm thấy hoặc đã bị xóa.

---

### 2.3 Tạo Property

`POST /properties`  •  **Roles: ADMIN, OWNER** + permission `properties.canCreate` + KYC `approved` (cho OWNER)

**Request body:**
```json
{
  "name": "Villa B1716",
  "type": 0,
  "code": "B1716",
  "view": "sea",
  "address": "Bãi Cháy, Hạ Long",
  "mapLink": "https://maps.google.com/...",
  "bedrooms": 3,
  "bathrooms": 2,
  "standardGuests": 4,
  "maxGuests": 8,
  "amenities": ["Wifi", "Điều hòa", "Bể bơi"],
  "description": "Villa view biển...",
  "rules": "Không hút thuốc",
  "services": ["BBQ", "Thuê xe máy"],
  "cancellationPolicy": 0,
  "weekdayPrice": 1500000,
  "weekendPrice": 2000000,
  "holidayPrice": 2500000,
  "adultSurcharge": 200000,
  "childSurcharge": 100000,
  "ownerId": "uuid"
}
```

**Validation:**
- `name`: bắt buộc.
- `type`: bắt buộc, giá trị 0/1/2.
- `code`: bắt buộc, **unique toàn hệ thống**.
- `view`: chỉ chấp nhận `sea` hoặc `city`.
- Các field còn lại: optional.
- `ownerId`: **chỉ ADMIN** mới được set; OWNER tự động dùng id của mình.

**Response 201:** object property vừa tạo.

**Errors:**
- `409` — `code` bị trùng.
- `403` — OWNER chưa hoàn thành KYC, hoặc không có permission `canCreate`.
- `404` — `ownerId` không tồn tại (khi ADMIN gán).

---

### 2.4 Cập Nhật Property (Partial)

`PATCH /properties/:id`  •  **Roles: ADMIN, OWNER, SALE** + permission `properties.canUpdate`

**Request body:** tất cả field đều **optional**, chỉ gửi field cần update. Cấu trúc tương tự `POST` cộng thêm:
- `latitude`, `longitude`: tọa độ
- `checkInTime`, `checkOutTime`: VD `"14:00"`, `"12:00"`
- `isActive`: bật/tắt property

**Response 200:** object property sau khi update.

**Errors:**
- `404`, `403`, `409` (nếu đổi `code` trùng).

---

### 2.5 Xóa Property (Soft Delete)

`DELETE /properties/:id`  •  **Roles: ADMIN, OWNER** + permission `properties.canDelete`

**Response 200:** message thành công, `data: null`.

**FE notes:** SALE không bao giờ xóa được, dù có permission. Backend chặn cứng.

---

### 2.6 Cập Nhật Bảng Giá

`PUT /properties/:id/prices`  •  **Roles: ADMIN, OWNER, SALE** + permission `properties.canUpdate`

**Request body:** tất cả field optional, chỉ gửi field cần update:
```json
{
  "weekdayPrice": 1500000,
  "weekendPrice": 2000000,
  "holidayPrice": 2500000,
  "adultSurcharge": 200000,
  "childSurcharge": 100000
}
```

**Response 200:** object chỉ chứa `id, name, code` + 5 field giá vừa cập nhật.

---

### 2.7 Upload Ảnh Property

`POST /properties/:id/images`  •  **Roles: ADMIN, OWNER, SALE** + permission `properties.canUpdate`

**Request:** `multipart/form-data`
- Field name: `images` (array, nhiều file).
- Định dạng: `JPG / PNG / WEBP`.
- Tối đa **20 ảnh/lần upload**, mỗi ảnh **≤ 10 MB**.
- Tổng số ảnh / property: **tối đa 30**.

**Response 201:**
```json
{
  "success": true,
  "message": "Đã upload 3 ảnh",
  "data": [
    { "id": "uuid", "imageUrl": "https://res.cloudinary.com/...", "isCover": true, "order": 0 }
  ]
}
```

**Notes:**
- Nếu property chưa có ảnh → ảnh đầu tiên upload tự động set `isCover = true`.
- `order` tăng dần theo thứ tự upload.

**Errors:**
- `400` — không có file hoặc sai định dạng.
- `409` — vượt quá 30 ảnh/property.

---

### 2.8 Xóa Ảnh

`DELETE /properties/:id/images/:imageId`  •  **Roles: ADMIN, OWNER, SALE** + permission `properties.canUpdate`

**Response 200:** message thành công.

---

### 2.9 Đặt Ảnh Bìa

`PATCH /properties/:id/images/:imageId/cover`  •  **Roles: ADMIN, OWNER, SALE** + permission `properties.canUpdate`

**Response 200:** message thành công.

**Notes:** Backend tự động bỏ `isCover` của ảnh cũ và set ảnh mới làm bìa.

---

### 2.10 Endpoints Public (Không Auth — dùng cho landing/search)

| Endpoint                     | Mô tả                                                                          |
|------------------------------|--------------------------------------------------------------------------------|
| `GET /properties/public`     | Danh sách property active, hỗ trợ filter `checkinDate`, `checkoutDate`, `guests`, `minPrice`, `maxPrice`, `type`, `view`. **Tự động loại bỏ property đã có booking trùng ngày.** |
| `GET /properties/share/:id`  | Thông tin property cho share link (không lộ giá).                              |

> Trang quản lý thường không cần 2 endpoint này, nhưng để sẵn nếu cần preview.

---

## 3. DASHBOARD MODULE

> **Phân quyền data scoping**:
> - `ADMIN` → thấy stats toàn hệ thống.
> - `OWNER` → chỉ thấy stats của property thuộc về mình.
> - `SALE` → chỉ thấy stats của property thuộc owner đã được gán. Nếu chưa được gán → tất cả số = 0.

### 3.1 KPI Tổng Quan Hôm Nay

`GET /dashboard/stats`  •  **Roles: ADMIN, OWNER, SALE**

Dùng cho **widget trên cùng** của dashboard (cards KPI chính).

**Response 200:**
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "totalRooms": 5,
    "activeRooms": 4,
    "emptyRooms": 2,
    "occupiedRooms": 2,
    "globalTotalRooms": 20,
    "globalEmptyRooms": 12,
    "checkoutToday": 1,
    "totalBookings": 15,
    "thisMonthBookings": 3,
    "monthlyRevenue": 5000000,
    "todayRevenue": 1500000
  }
}
```

| Field                | Ý nghĩa                                                            |
|----------------------|--------------------------------------------------------------------|
| `totalRooms`         | Tổng số phòng (theo scope role)                                    |
| `activeRooms`        | Phòng đang bật (`isActive=true`)                                   |
| `emptyRooms`         | Phòng đang trống (không có booking active)                         |
| `occupiedRooms`      | Phòng đang có khách ở                                              |
| `globalTotalRooms`   | Tổng phòng toàn hệ thống — dùng cho mục "thị trường chung"         |
| `globalEmptyRooms`   | Phòng trống toàn hệ thống                                          |
| `checkoutToday`      | Số booking checkout hôm nay                                        |
| `totalBookings`      | Tổng booking lifetime (theo scope)                                 |
| `thisMonthBookings`  | Booking tạo trong tháng hiện tại                                   |
| `monthlyRevenue`     | Doanh thu deposit tháng hiện tại (VNĐ)                             |
| `todayRevenue`       | Doanh thu deposit hôm nay (VNĐ)                                    |

**FE notes:**
- Cards UI nên show: `totalRooms`, `occupiedRooms`, `emptyRooms`, `todayRevenue`, `monthlyRevenue`, `checkoutToday`.
- Field `globalXxx` chỉ dùng nếu thiết kế có panel "toàn hệ thống" (so sánh với cá nhân).

---

### 3.2 Báo Cáo Mở Rộng

`GET /reports`  •  **Roles: ADMIN, OWNER, SALE**

Dùng cho **trang Reports / Analytics** (charts, top rooms, ratings…).

**Query params:**
| Param      | Type   | Mô tả                                                                     |
|------------|--------|---------------------------------------------------------------------------|
| `period`   | enum   | `today` / `week` / `month` / `year` / `custom`. Mặc định: month hiện tại. |
| `from`     | string | `YYYY-MM-DD` — bắt buộc khi `period=custom`                               |
| `to`       | string | `YYYY-MM-DD` — bắt buộc khi `period=custom`                               |
| `month`    | number | Legacy: 1-12 (giữ tương thích phiên bản cũ)                               |
| `year`     | number | Legacy: VD `2026`                                                         |

**Examples:**
- Tuần này: `GET /reports?period=week`
- Tháng 5/2026: `GET /reports?period=month&year=2026&month=5`
- Custom 7 ngày: `GET /reports?period=custom&from=2026-05-01&to=2026-05-07`

**Response 200 (rút gọn — đầy đủ ở Swagger):**
```json
{
  "success": true,
  "message": "Lấy báo cáo thành công",
  "data": {
    "totalRooms": 5,
    "activeRooms": 4,
    "totalBookings": 15,
    "thisMonthBookings": 8,
    "holdCount": 1,
    "confirmedCount": 5,
    "cancelledCount": 2,
    "completedCount": 3,
    "totalDeposit": 3000000,
    "occupancyRate": 45.5,
    "roomsWithCover": 3,
    "roomsWithPrice": 4,

    "revenue": 12000000,
    "adr": 1500000,

    "revenueByDay": [
      { "date": "2026-05-01", "revenue": 1500000, "bookings": 1, "occupancy": 0.25 },
      { "date": "2026-05-02", "revenue": 0,       "bookings": 0, "occupancy": 0    }
    ],

    "topRooms": [
      {
        "roomId": "uuid",
        "name": "Villa B1716",
        "coverImage": "https://res.cloudinary.com/...",
        "revenue": 5000000,
        "bookings": 4,
        "occupancy": 0.6
      }
    ],

    "previousPeriod": {
      "revenue": 9000000,
      "bookings": 6,
      "occupancy": 35.2,
      "adr": 1300000
    },

    "ratingSummary": {
      "avgRating": 4.6,
      "totalReviews": 18,
      "totalProperties": 4,
      "distribution": { "5": 12, "4": 4, "3": 1, "2": 1, "1": 0 },
      "breakdown": {
        "cleanliness": 4.8,
        "location":    4.7,
        "amenities":   4.5,
        "service":     4.6,
        "value":       4.4,
        "accuracy":    4.6
      }
    },

    "propertyRatings": [
      {
        "propertyId": "uuid",
        "propertyName": "Villa B1716",
        "coverImage": "https://...",
        "avgRating": 4.8,
        "totalReviews": 10,
        "distribution": { "5": 8, "4": 2, "3": 0, "2": 0, "1": 0 },
        "breakdown": { "cleanliness": 4.9, "location": 4.8, "amenities": 4.7, "service": 4.8, "value": 4.6, "accuracy": 4.8 }
      }
    ],

    "recentReviews": [
      {
        "id": "uuid",
        "propertyId": "uuid",
        "propertyName": "Villa B1716",
        "customerName": "Trần Thị B",
        "customerAvatar": null,
        "rating": 5,
        "comment": "Tuyệt vời!",
        "photos": ["https://..."],
        "createdAt": "2026-05-01T10:00:00.000Z"
      }
    ],

    "lengthOfStay": { "oneNight": 3, "twoToThree": 5, "fourToSeven": 4, "eightPlus": 1 },

    "dayOfWeekOccupancy": { "values": [0.5, 0.4, 0.3, 0.6, 0.8, 0.9, 0.7] },

    "recentBookings": [ /* 10 bookings gần nhất, đầy đủ field BookingDto */ ]
  }
}
```

**Field reference cho FE:**

| Field                                          | UI gợi ý                                          |
|------------------------------------------------|---------------------------------------------------|
| `revenue`, `totalDeposit`                      | Card doanh thu kỳ này                             |
| `adr`                                          | Average Daily Rate (giá thuê TB/đêm)              |
| `occupancyRate` (%)                            | Card tỷ lệ lấp đầy                                |
| `holdCount` / `confirmedCount` / ...           | Pie chart trạng thái booking                      |
| `revenueByDay[]`                               | Line chart doanh thu theo ngày                    |
| `topRooms[]` (max 5)                           | Bảng xếp hạng top 5 phòng theo doanh thu          |
| `previousPeriod`                               | So sánh vs kỳ trước (mũi tên ↑↓ %)                |
| `ratingSummary`                                | Card tổng đánh giá toàn bộ property               |
| `propertyRatings[]`                            | Bảng rating từng phòng                            |
| `recentReviews[]` (max 5)                      | Widget "Đánh giá mới nhất"                        |
| `lengthOfStay`                                 | Bar chart phân bố số đêm lưu trú                  |
| `dayOfWeekOccupancy.values[]` (index 0=Mon→6=Sun) | Bar chart công suất theo thứ trong tuần      |
| `recentBookings[]` (max 10)                    | Bảng "Booking gần đây"                            |

**Notes:**
- `dayOfWeekOccupancy.values` là **tỷ lệ** (0..1), không phải %. Nhân 100 để hiển thị %.
- `occupancyRate` đã sẵn dạng %, range 0..100.
- `previousPeriod` được tính tự động: lùi đúng số ngày của `period` hiện tại.
- Field `coverImage` có thể `null` nếu property chưa upload ảnh → FE phải có placeholder.

---

## 4. THỨ TỰ INTEGRATION ĐỀ XUẤT

1. **Auth**: login → lưu token → setup axios interceptor cho `Authorization` header và xử lý 401 → refresh.
2. **Profile**: gọi `GET /auth/profile` ngay sau login để lấy `permissions` + `kycStatus`.
3. **Layout / Menu**: render menu dựa vào `role` + `permissions[]`.
4. **Dashboard**: gọi `/dashboard/stats` cho trang home → sau đó tích hợp `/reports` cho trang Analytics.
5. **Properties**:
   - List + filter (`GET /properties`) → bảng chính.
   - Detail (`GET /properties/:id`) → modal/trang chi tiết.
   - Create (`POST /properties`) → form thêm phòng.
   - Update (`PATCH /properties/:id`) → form chỉnh sửa.
   - Prices (`PUT /properties/:id/prices`) → tab "Giá phòng".
   - Images (`POST/DELETE/PATCH /properties/:id/images/...`) → tab "Hình ảnh".
   - Delete (`DELETE /properties/:id`) → soft delete với confirm dialog.

---

## 5. CHECKLIST FE TRƯỚC KHI MERGE

- [ ] Mọi request có `Authorization: Bearer <token>` (trừ public endpoints).
- [ ] Interceptor xử lý 401 → refresh → retry; 403 → toast permission denied.
- [ ] Field `success`, `message`, `data` mapping đúng trong type/interface.
- [ ] Hiển thị message từ backend (đã i18n) thay vì hard-code tiếng Việt.
- [ ] Menu/button ẩn theo `permissions[]` cho OWNER/SALE.
- [ ] Banner KYC khi `kycStatus !== 'approved'` và `kycBypass === false` cho OWNER.
- [ ] SALE chưa được gán (`ownerId === null`) → show empty state, không gọi API list.
- [ ] Validate input ở FE (mirror DTO rules) trước khi submit.
- [ ] Image upload: validate type/size, hiển thị progress, max 20 file/lần.
- [ ] Pagination cho list property nếu BE bổ sung sau (hiện tại trả full list).

---

> **Liên hệ BE khi cần thêm endpoint:** `bookings`, `calendar`, `notifications`, `reviews`, `kyc`, `billing`, `payment`, `permissions` (admin), `users` (admin) đã sẵn sàng — sẽ tách spec sau khi 3 module trên xong.
