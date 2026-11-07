1. Tổng quan các vai trò trong hệ thống
ADMIN

Quản trị toàn hệ thống


Người mua

Đăng ký, mua vé, thanh toán  


Người tạo

Tạo và quản lý chương trình


Ban tổ chức

Quay thưởng, xác nhận và trao giải




Lưu ý: Admin là tài khoản được tạo sẵn khi khởi tạo hệ thống. Các tài khoản người tạo chương trình và ban tổ chức được Admin cấp hoặc quản lý. Người mua tự đăng ký.
2. Chức năng của từng phân hệ
A. Người mua vé (USER)
Đây là phân hệ dành cho khách hàng truy cập website.
Các chức năng nên có
Nhóm chức năng	Chức năng cụ thể
Tài khoản	Đăng ký, đăng nhập, đăng xuất  // đã có 
Cá nhân	Xem và cập nhật thông tin cá nhân
Chương trình	Xem danh sách chương trình
Tìm kiếm	Tìm kiếm, lọc theo trạng thái
Chi tiết	Xem hình ảnh, video, mô tả, giải thưởng
Mua vé	Chọn số vé, kiểm tra số còn trống
Thanh toán	Thanh toán mô phỏng bằng số dư hoặc phương thức giả lập
Lịch sử	Xem lịch sử đơn hàng và thanh toán
Vé của tôi	Xem các vé đã mua
Kết quả	Xem kết quả quay thưởng
Giải thưởng	Xem trạng thái trúng thưởng và nhận giải

Nên bổ sung:
- Thông báo khi chương trình sắp quay thưởng.
- Thông báo khi người mua trúng thưởng.
- Xem mã vé, mã đơn hàng và thời gian mua.
- Theo dõi trạng thái trao giải.
B. Người tạo chương trình (ORGANIZER)
Người tạo chương trình không tự đăng ký tài khoản mà được Admin cấp.
Các chức năng nên có
Nhóm chức năng	Chức năng cụ thể
Tài khoản	Đăng nhập, đổi mật khẩu
Tạo chương trình	Tạo chương trình mới
Hình ảnh	Tải lên hình ảnh sản phẩm
Video	Tải lên video giới thiệu
Thông tin	Tên, mô tả, điều kiện, giải thưởng
Phát hành vé	Thiết lập tổng số vé
Giá vé	Thiết lập giá mỗi vé
Quản lý	Xem và chỉnh sửa chương trình nháp
Theo dõi	Theo dõi số vé đã bán, còn lại
Thống kê	Xem doanh thu mô phỏng, số vé bán
Lịch sử	Xem lịch sử chương trình của mình

Quy trình tạo chương trình đề xuất:
ORGANIZER tạo chương trình

Nhập thông tin, hình ảnh, video, giải thưởng, số lượng và giá vé

DRAFT – Bản nháp

ADMIN kiểm duyệt

Phê duyệt hoặc từ chối và ghi lý do

Được phê duyệt

Sắp diễn ra → Đang diễn ra → Đã kết thúc


Một điểm quan trọng: ORGANIZER chỉ nên được chỉnh sửa chương trình khi chương trình còn ở trạng thái nháp hoặc được phép chỉnh sửa. Khi chương trình đã mở bán hoặc đã quay thưởng, các thông tin quan trọng như giá vé, tổng số vé và giải thưởng cần được khóa để tránh thay đổi ảnh hưởng đến người mua.
C. Ban tổ chức quay thưởng (DRAW_OPERATOR)
Mình đồng ý với ý tưởng bổ sung vai trò này. Thực tế, nên tách người tạo chương trình và người thực hiện quay thưởng để phân quyền rõ ràng.

Đây là phân hệ mình đề xuất bổ sung nhiều chức năng nhất.
Nhóm chức năng	Chức năng cụ thể
Chương trình	Xem các chương trình được phân công
Kiểm tra	Kiểm tra điều kiện trước khi quay
Quay thưởng	Thực hiện quy trình quay số
Xác định kết quả	Xác định mã vé trúng thưởng
Công bố	Cập nhật và công bố kết quả
Người thắng	Xem thông tin người trúng thưởng
Liên hệ	Ghi nhận trạng thái liên hệ người thắng
Trao giải	Cập nhật trạng thái trao giải
Lịch sử	Xem lịch sử các lần quay
Biên bản	Xuất biên bản kết quả quay thưởng

Điểm quan trọng: Ban tổ chức không nên được phép tự ý sửa kết quả sau khi quay. Nếu phát hiện sai sót, cần có quy trình lập biên bản, yêu cầu Admin xử lý và lưu lại lịch sử.
Quy trình quay thưởng đề xuất
1

1. Kiểm tra điều kiện quay

Chương trình đã kết thúc hoặc đủ điều kiện quay, vé hợp lệ, không còn giao dịch chờ xử lý.



2

2. Khóa danh sách vé

Chốt danh sách vé hợp lệ và người sở hữu vé tại thời điểm quay.



3

3. Thực hiện quay thưởng

Sử dụng thuật toán chọn ngẫu nhiên có thể kiểm chứng.



4

4. Lưu kết quả

Lưu mã vé trúng, người thắng, thời gian, thuật toán và dữ liệu kiểm chứng.



5

5. Công bố kết quả

Đưa kết quả lên website để người mua có thể xem.



6

6. Liên hệ và trao giải

Xác nhận người thắng, cập nhật tiến trình trao giải và bằng chứng.



Các trạng thái trao giải nên có
Trạng thái	Ý nghĩa
PENDING	Chưa liên hệ người thắng
CONTACTED	Đã liên hệ
VERIFIED	Đã xác minh người thắng
PROCESSING	Đang xử lý trao giải
AWARDED	Đã trao giải
FAILED	Trao giải không thành công
DISPUTED	Có khiếu nại hoặc tranh chấp

Nên có thêm các thông tin:
- Người phụ trách trao giải.
- Thời gian liên hệ.
- Thời gian xác minh.
- Ngày trao giải.
- Hình ảnh hoặc tài liệu xác nhận đã trao giải.
- Ghi chú về trường hợp không liên hệ được người thắng.
D. Admin – Quản trị hệ thống
Admin có quyền cao nhất, quản lý cả ba phân hệ trên.
Nhóm chức năng	Chức năng cụ thể
Tài khoản	Tạo, khóa, mở khóa tài khoản
Người mua	Xem danh sách và thông tin người mua
Người tạo	Cấp tài khoản, quản lý người tạo
Ban tổ chức	Cấp tài khoản, phân công chương trình
Kiểm duyệt	Phê duyệt hoặc từ chối chương trình
Chương trình	Xem tất cả chương trình ở mọi trạng thái
Lịch sử	Xem lịch sử thay đổi và hoạt động chương trình
Quay thưởng	Theo dõi lịch sử quay và kết quả
Người thắng	Xem thông tin người chiến thắng
Trao giải	Theo dõi tiến trình trao giải
Thống kê	Xem thống kê tổng thể hệ thống
Nhật ký	Xem nhật ký hoạt động của các tài khoản

Mình đề xuất Admin có thêm 3 quyền quan trọng:
1. Có thể tạm dừng chương trình khi phát hiện sai phạm hoặc sự cố.
2. Có thể thu hồi quyền của người tạo chương trình và ban tổ chức.
3. Có thể yêu cầu tổ chức quay thưởng thực hiện lại quy trình khi có sự cố, nhưng không được âm thầm xóa hoặc sửa kết quả cũ.
3. Có nên thêm thống kê không?
Rất nên bổ sung
Theo mình, thống kê là một phần đáng có trong đồ án. Tuy nhiên, không nên làm một trang thống kê chung cho tất cả tài khoản. Mỗi vai trò nên có dashboard riêng.
A. Thống kê dành cho Admin
Dashboard tổng quan hệ thống
Tổng chương trình
128

Tổng người dùng
2.450

Vé đã bán
18.620

Chương trình chờ duyệt
12



Biểu đồ số chương trình theo trạng thái


Chờ duyệt

Sắp diễn ra

Đang diễn ra

Đã kết thúc















Minh họa giao diện và dữ liệu giả lập, không phải số liệu thực tế của hệ thống.

Admin nên có các nhóm thống kê sau:
Nhóm	Chỉ số cần thống kê
Người dùng	Tổng USER, ORGANIZER, ban tổ chức
Chương trình	Tổng chương trình, đang diễn ra, đã kết thúc, chờ duyệt, bị từ chối
Vé	Tổng vé phát hành, đã bán, còn lại, bị hủy
Đơn hàng	Tổng đơn, thành công, thất bại, chờ thanh toán
Thanh toán	Tổng giá trị thanh toán mô phỏng
Quay thưởng	Số lần quay, số chương trình đã quay
Giải thưởng	Số người thắng, số giải đã trao, chưa trao

Admin cũng nên có biểu đồ:
- Số lượng chương trình được tạo theo tháng.
- Số vé bán ra theo thời gian.
- Giá trị thanh toán mô phỏng theo tháng.
- Tỷ lệ chương trình hoàn thành.
- Tỷ lệ giải thưởng đã trao.
B. Thống kê dành cho người tạo chương trình
Không cần quá phức tạp. Chỉ thống kê các chương trình do người đó tạo.
Chỉ số	Ý nghĩa
Tổng chương trình	Số chương trình đã tạo
Vé phát hành	Tổng số vé của chương trình
Vé đã bán	Số vé đã được mua thành công
Vé còn lại	Số vé chưa bán
Tỷ lệ bán vé	Vé bán thành công / vé phát hành
Doanh thu mô phỏng	Tổng giá trị vé bán thành công
Đơn hàng	Tổng số đơn thành công và thất bại

Biểu đồ nên có:
- Vé bán ra theo từng ngày.
- So sánh số vé bán giữa các chương trình.
- Tỷ lệ vé đã bán và chưa bán.
- Doanh thu mô phỏng theo chương trình.
C. Thống kê dành cho ban tổ chức quay thưởng
Đây là phần riêng, không cần thống kê doanh thu.
Chỉ số	Ý nghĩa
Chương trình được phân công	Tổng chương trình được giao
Đã quay thưởng	Số chương trình đã hoàn thành quay
Chưa quay	Số chương trình đang chờ
Số giải thưởng	Tổng giải thưởng phải trao
Đã trao	Số giải đã trao thành công
Chưa trao	Số giải chưa trao
Đang xử lý	Số giải đang liên hệ hoặc xác minh


4. Phân quyền giữa Admin và Ban tổ chức
Đây là phần mình muốn bạn chú ý nhất vì hai vai trò này dễ bị trùng chức năng.
Chức năng	Admin	Người tạo	Ban tổ chức
Tạo tài khoản ORGANIZER			
Tạo tài khoản ban tổ chức			
Tạo chương trình			
Duyệt chương trình			
Xem tất cả chương trình			
Xem chương trình của mình			
Phân công quay thưởng			
Thực hiện quay thưởng	Theo dõi		
Công bố kết quả	Theo dõi/kiểm soát		
Xem người chiến thắng		Theo chương trình của mình	
Cập nhật trao giải	Theo dõi/kiểm soát		
Thống kê	Toàn hệ thống	Chương trình của mình	Công việc được giao
Xem nhật ký hoạt động		Nhật ký của mình	Nhật ký của mình

Mình đề xuất Admin có quyền phân công ban tổ chức phụ trách từng chương trình. Như vậy, một người tạo chương trình không thể tự chọn người quay thưởng hoặc tự xác nhận kết quả.
5. Những chức năng quan trọng nên bổ sung cho toàn hệ thống
Ngoài chức năng theo từng vai trò, mình đề xuất thêm 6 nhóm chức năng sau:
Chức năng	Mục đích
Thông báo	Thông báo mua vé thành công, kết quả quay, trúng thưởng
Nhật ký hoạt động	Ghi lại ai đã tạo, sửa, duyệt, quay và công bố
Kiểm tra giao dịch	Tránh mua trùng một vé, xử lý đơn hàng lỗi
Quản lý khiếu nại	Người mua có thể gửi khiếu nại về vé và kết quả
Bảo mật	Mã hóa mật khẩu, phân quyền RBAC, xác thực JWT
Kiểm chứng quay thưởng	Cho phép kiểm tra kết quả có được tạo đúng quy trình hay không

Đặc biệt: Chức năng kiểm chứng quay thưởng

Vì tên đề tài của bạn liên quan đến phân phối giải thưởng thông qua quay số trực tuyến, mình khuyên nên đầu tư phần này.

Có thể sử dụng cơ chế Commit – Reveal:
1. Trước khi quay, hệ thống tạo một seed bí mật và công bố mã hash của seed.
2. Khóa danh sách vé hợp lệ.
3. Sử dụng seed, danh sách vé và dữ liệu ngẫu nhiên để xác định người thắng.
4. Sau khi quay, công bố seed để mọi người có thể kiểm chứng kết quả.
Nhờ vậy, người mua có cơ sở kiểm tra kết quả thay vì chỉ tin vào giao diện quay số.
6. Đề xuất cấu trúc menu của từng tài khoản
Đây là cấu trúc mình khuyên bạn áp dụng khi thiết kế giao diện React.
USER – Người mua

- Tổng quan
- Danh sách chương trình
- Vé của tôi
- Đơn hàng
- Lịch sử thanh toán
- Kết quả quay thưởng
- Giải thưởng của tôi
- Thông báo
- Tài khoản cá nhân


ORGANIZER – Người tạo chương trình

- Tổng quan thống kê
- Tạo chương trình
- Chương trình của tôi
- Chương trình chờ duyệt
- Chương trình đang diễn ra
- Chương trình đã kết thúc
- Thống kê vé bán
- Thống kê doanh thu
- Lịch sử hoạt động
- Tài khoản cá nhân


DRAW_OPERATOR – Ban tổ chức

- Tổng quan công việc
- Chương trình được phân công
- Danh sách chờ quay
- Thực hiện quay thưởng
- Lịch sử quay thưởng
- Kết quả quay thưởng
- Danh sách người chiến thắng
- Quản lý trao giải
- Biên bản quay thưởng
- Thống kê công việc


ADMIN – Quản trị hệ thống

- Dashboard tổng quan
- Quản lý người mua
- Quản lý người tạo chương trình
- Quản lý ban tổ chức
- Quản lý chương trình
- Duyệt chương trình
- Phân công quay thưởng
- Quản lý kết quả
- Quản lý người chiến thắng
- Quản lý trao giải
- Thống kê hệ thống
- Nhật ký hoạt động
- Cấu hình hệ thống