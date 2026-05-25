import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng — Halong24h',
};

export default function TermsPage() {
  return (
    <article className="prose prose-ink max-w-none prose-headings:font-display prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed">
      <h1>Điều khoản sử dụng</h1>
      <p className="text-sm text-ink-400">Cập nhật lần cuối: 25/05/2026</p>

      <p>
        Chào mừng bạn đến với Halong24h (&quot;Nền tảng&quot;). Bằng việc truy cập và sử dụng
        Nền tảng, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi
        sử dụng dịch vụ.
      </p>

      <h2>1. Định nghĩa</h2>
      <ul>
        <li>
          <strong>&quot;Chủ nhà&quot;</strong> (Owner): cá nhân hoặc tổ chức đăng ký tài khoản để
          đăng tải và quản lý cơ sở lưu trú trên Nền tảng.
        </li>
        <li>
          <strong>&quot;Nhân viên&quot;</strong> (Sale): người được Chủ nhà uỷ quyền quản lý
          đặt phòng và vận hành.
        </li>
        <li>
          <strong>&quot;Khách hàng&quot;</strong>: người tìm kiếm và đặt phòng thông qua Nền tảng.
        </li>
        <li>
          <strong>&quot;Dịch vụ&quot;</strong>: toàn bộ tính năng do Halong24h cung cấp bao gồm
          quản lý cơ sở, đặt phòng, thanh toán, và các công cụ hỗ trợ liên quan.
        </li>
      </ul>

      <h2>2. Đăng ký tài khoản</h2>
      <ul>
        <li>Bạn phải cung cấp thông tin chính xác, đầy đủ khi đăng ký.</li>
        <li>Mỗi cá nhân hoặc tổ chức chỉ được đăng ký một tài khoản Chủ nhà.</li>
        <li>
          Bạn chịu trách nhiệm bảo mật thông tin đăng nhập. Mọi hoạt động từ tài khoản của
          bạn được coi là do bạn thực hiện.
        </li>
        <li>
          Halong24h có quyền từ chối, tạm khoá hoặc chấm dứt tài khoản nếu phát hiện vi phạm
          điều khoản hoặc hành vi gian lận.
        </li>
      </ul>

      <h2>3. Quyền và nghĩa vụ của Chủ nhà</h2>
      <ul>
        <li>
          Thông tin cơ sở lưu trú (mô tả, hình ảnh, giá, tiện ích) phải chính xác và cập nhật.
        </li>
        <li>
          Chủ nhà chịu trách nhiệm về chất lượng dịch vụ thực tế tại cơ sở của mình.
        </li>
        <li>
          Hoàn tất xác minh KYC (Giấy tờ tuỳ thân, giấy phép kinh doanh nếu có) theo yêu cầu
          của Nền tảng trước khi đăng tải cơ sở.
        </li>
        <li>
          Tuân thủ pháp luật Việt Nam về kinh doanh lưu trú, thuế, và phòng cháy chữa cháy.
        </li>
      </ul>

      <h2>4. Quy trình đặt phòng</h2>
      <ul>
        <li>
          Đặt phòng được xác nhận khi Chủ nhà chấp nhận yêu cầu hoặc khi thanh toán hoàn tất
          (tuỳ chế độ cấu hình của từng cơ sở).
        </li>
        <li>
          Chính sách huỷ phòng do Chủ nhà thiết lập và được hiển thị rõ trên trang cơ sở.
        </li>
        <li>
          Halong24h đóng vai trò trung gian kết nối, không chịu trách nhiệm trực tiếp về
          tranh chấp giữa Chủ nhà và Khách hàng, nhưng sẽ hỗ trợ giải quyết qua cơ chế
          khiếu nại của Nền tảng.
        </li>
      </ul>

      <h2>5. Thanh toán và phí dịch vụ</h2>
      <ul>
        <li>
          Chủ nhà thanh toán phí dịch vụ hàng tháng theo gói cước đã đăng ký. Chi tiết gói cước
          được công bố trên trang quản lý.
        </li>
        <li>
          Halong24h có quyền tạm khoá tính năng nếu Chủ nhà chậm thanh toán quá hạn theo
          quy định.
        </li>
        <li>
          Giá phòng do Chủ nhà tự quyết định. Halong24h không can thiệp vào việc định giá.
        </li>
      </ul>

      <h2>6. Nội dung và sở hữu trí tuệ</h2>
      <ul>
        <li>
          Chủ nhà giữ quyền sở hữu nội dung (hình ảnh, mô tả) đăng tải lên Nền tảng, đồng
          thời cấp cho Halong24h quyền sử dụng để hiển thị và quảng bá trên các kênh của
          Nền tảng.
        </li>
        <li>
          Nghiêm cấm sao chép, phát tán giao diện, mã nguồn, hoặc dữ liệu của Halong24h
          mà không có sự đồng ý bằng văn bản.
        </li>
      </ul>

      <h2>7. Hành vi bị cấm</h2>
      <ul>
        <li>Đăng thông tin sai lệch, lừa đảo, hoặc vi phạm pháp luật.</li>
        <li>Sử dụng Nền tảng để rửa tiền, tài trợ bất hợp pháp, hoặc mục đích phi pháp khác.</li>
        <li>Cố tình phá hoại hệ thống, khai thác lỗ hổng bảo mật.</li>
        <li>Spam, quấy rối người dùng khác qua hệ thống tin nhắn của Nền tảng.</li>
      </ul>

      <h2>8. Giới hạn trách nhiệm</h2>
      <p>
        Halong24h cung cấp Nền tảng theo nguyên tắc &quot;nguyên trạng&quot; (as-is). Chúng tôi
        nỗ lực đảm bảo hệ thống hoạt động ổn định nhưng không cam kết dịch vụ không gián đoạn
        hoặc không có lỗi. Halong24h không chịu trách nhiệm về thiệt hại gián tiếp phát sinh
        từ việc sử dụng Nền tảng.
      </p>

      <h2>9. Thay đổi điều khoản</h2>
      <p>
        Halong24h có quyền cập nhật Điều khoản sử dụng. Thay đổi sẽ được thông báo qua email
        hoặc thông báo trên Nền tảng ít nhất 7 ngày trước khi có hiệu lực. Việc tiếp tục sử
        dụng sau thời điểm có hiệu lực đồng nghĩa với việc bạn chấp nhận các thay đổi.
      </p>

      <h2>10. Luật áp dụng và giải quyết tranh chấp</h2>
      <p>
        Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được giải
        quyết thông qua thương lượng. Trường hợp không đạt được thoả thuận, tranh chấp sẽ
        được đưa ra Toà án nhân dân có thẩm quyền tại thành phố Hạ Long, tỉnh Quảng Ninh.
      </p>

      <h2>11. Liên hệ</h2>
      <p>
        Nếu bạn có câu hỏi về Điều khoản sử dụng, vui lòng liên hệ:
      </p>
      <ul>
        <li>Email: <strong>support@halong24h.com</strong></li>
        <li>Hotline: <strong>0123 456 789</strong></li>
      </ul>

      <div className="mt-10 border-t border-ink-100 pt-6 not-prose">
        <Link
          href="/legal/privacy"
          className="text-sm font-medium text-navy-700 hover:underline"
        >
          Xem Chính sách quyền riêng tư →
        </Link>
      </div>
    </article>
  );
}
