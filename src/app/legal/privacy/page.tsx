import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư — Halong24h',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-ink max-w-none prose-headings:font-display prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed">
      <h1>Chính sách quyền riêng tư</h1>
      <p className="text-sm text-ink-400">Cập nhật lần cuối: 25/05/2026</p>

      <p>
        Halong24h (&quot;chúng tôi&quot;) cam kết bảo vệ quyền riêng tư của bạn. Chính sách
        này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân khi
        bạn sử dụng Nền tảng.
      </p>

      <h2>1. Thông tin chúng tôi thu thập</h2>

      <h3 className="text-base font-semibold mt-6">1.1. Thông tin bạn cung cấp</h3>
      <ul>
        <li>Họ tên, email, số điện thoại khi đăng ký tài khoản.</li>
        <li>Giấy tờ tuỳ thân (CCCD/CMND), giấy phép kinh doanh khi xác minh KYC.</li>
        <li>Thông tin cơ sở lưu trú: địa chỉ, mô tả, hình ảnh, giá phòng.</li>
        <li>Nội dung tin nhắn, đánh giá, phản hồi bạn gửi qua Nền tảng.</li>
      </ul>

      <h3 className="text-base font-semibold mt-6">1.2. Thông tin tự động thu thập</h3>
      <ul>
        <li>Địa chỉ IP, loại trình duyệt, hệ điều hành.</li>
        <li>Thời gian truy cập, trang đã xem, hành vi tương tác trên Nền tảng.</li>
        <li>Cookie và công nghệ theo dõi tương tự (xem mục 6).</li>
      </ul>

      <h2>2. Mục đích sử dụng thông tin</h2>
      <ul>
        <li>Tạo và quản lý tài khoản, xác minh danh tính.</li>
        <li>Xử lý đặt phòng, thanh toán, và các giao dịch liên quan.</li>
        <li>Gửi thông báo về trạng thái đặt phòng, thanh toán, và cập nhật hệ thống.</li>
        <li>Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.</li>
        <li>Phát hiện và ngăn chặn gian lận, bảo vệ an ninh hệ thống.</li>
        <li>Tuân thủ nghĩa vụ pháp lý theo quy định của pháp luật Việt Nam.</li>
      </ul>

      <h2>3. Chia sẻ thông tin</h2>
      <p>Chúng tôi không bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp:</p>
      <ul>
        <li>
          <strong>Giữa Chủ nhà và Khách hàng:</strong> thông tin liên lạc cần thiết để thực
          hiện đặt phòng (tên, số điện thoại).
        </li>
        <li>
          <strong>Nhà cung cấp dịch vụ:</strong> đối tác thanh toán, dịch vụ email, lưu trữ
          đám mây — chỉ trong phạm vi cần thiết để vận hành Nền tảng.
        </li>
        <li>
          <strong>Yêu cầu pháp lý:</strong> khi có yêu cầu từ cơ quan nhà nước có thẩm quyền
          theo quy định pháp luật.
        </li>
      </ul>

      <h2>4. Lưu trữ và bảo mật</h2>
      <ul>
        <li>
          Dữ liệu được lưu trữ trên hệ thống máy chủ có mã hoá, kiểm soát truy cập nghiêm ngặt.
        </li>
        <li>Mật khẩu được hash một chiều, không lưu dạng plaintext.</li>
        <li>
          Kết nối giữa trình duyệt và máy chủ được bảo vệ bằng HTTPS/TLS.
        </li>
        <li>
          Thông tin cá nhân được lưu trữ trong thời gian bạn sử dụng dịch vụ và tối đa 3 năm
          sau khi tài khoản bị xoá, trừ khi pháp luật yêu cầu lưu trữ lâu hơn.
        </li>
      </ul>

      <h2>5. Quyền của bạn</h2>
      <p>Bạn có quyền:</p>
      <ul>
        <li>
          <strong>Truy cập:</strong> xem thông tin cá nhân chúng tôi đang lưu trữ về bạn.
        </li>
        <li>
          <strong>Chỉnh sửa:</strong> cập nhật thông tin không chính xác hoặc lỗi thời.
        </li>
        <li>
          <strong>Xoá:</strong> yêu cầu xoá tài khoản và dữ liệu cá nhân (trừ dữ liệu cần
          giữ theo nghĩa vụ pháp lý hoặc giao dịch chưa hoàn tất).
        </li>
        <li>
          <strong>Hạn chế xử lý:</strong> yêu cầu tạm ngừng xử lý dữ liệu trong một số
          trường hợp nhất định.
        </li>
        <li>
          <strong>Rút đồng ý:</strong> rút lại sự đồng ý đã cấp trước đó (không ảnh hưởng
          đến tính hợp pháp của việc xử lý trước khi rút đồng ý).
        </li>
      </ul>
      <p>
        Để thực hiện các quyền trên, vui lòng liên hệ <strong>support@halong24h.com</strong>.
        Chúng tôi sẽ phản hồi trong vòng 15 ngày làm việc.
      </p>

      <h2>6. Cookie</h2>
      <p>Halong24h sử dụng cookie để:</p>
      <ul>
        <li>Duy trì phiên đăng nhập.</li>
        <li>Ghi nhớ tuỳ chọn cá nhân của bạn.</li>
        <li>Phân tích lưu lượng truy cập nhằm cải thiện dịch vụ.</li>
      </ul>
      <p>
        Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng của
        Nền tảng có thể không hoạt động đầy đủ.
      </p>

      <h2>7. Bảo vệ trẻ em</h2>
      <p>
        Nền tảng không dành cho người dưới 18 tuổi. Chúng tôi không cố ý thu thập thông tin
        từ trẻ em. Nếu phát hiện tài khoản của người dưới 18 tuổi, chúng tôi sẽ xoá ngay
        lập tức.
      </p>

      <h2>8. Thay đổi chính sách</h2>
      <p>
        Chúng tôi có thể cập nhật Chính sách quyền riêng tư theo thời gian. Thay đổi quan trọng
        sẽ được thông báo qua email hoặc thông báo trên Nền tảng ít nhất 7 ngày trước khi
        có hiệu lực.
      </p>

      <h2>9. Liên hệ</h2>
      <p>
        Nếu bạn có câu hỏi hoặc khiếu nại về việc xử lý dữ liệu cá nhân, vui lòng liên hệ:
      </p>
      <ul>
        <li>Email: <strong>support@halong24h.com</strong></li>
        <li>Hotline: <strong>0123 456 789</strong></li>
        <li>Địa chỉ: Thành phố Hạ Long, tỉnh Quảng Ninh, Việt Nam</li>
      </ul>

      <div className="mt-10 border-t border-ink-100 pt-6 not-prose">
        <Link
          href="/legal/terms"
          className="text-sm font-medium text-navy-700 hover:underline"
        >
          Xem Điều khoản sử dụng →
        </Link>
      </div>
    </article>
  );
}
