@echo off
chcp 65001 > nul
echo ==============================================================================
echo [E2E TEST RUNNER] CHẠY KIỂM THỬ E2E TÍCH HỢP DOCUMENT-SERVICE VỚI FRONTEND
echo ==============================================================================
echo.

:: 1. Kiểm tra môi trường ảo Python
if exist "venv\Scripts\activate.bat" (
    echo [1/3] Kích hoạt virtualenv venv...
    call venv\Scripts\activate.bat
) else (
    echo [1/3] Sử dụng môi trường Python hệ thống...
)

:: 2. Cài đặt các thư viện phụ thuộc nếu cần
echo [2/3] Kiểm tra cài đặt thư viện kiểm thử (selenium, pytest, webdriver-manager)...
pip install -r requirements.txt -q

:: 3. Thực thi kiểm thử
echo [3/3] Bắt đầu chạy test suite...
echo.

pytest scenarios/ -v -s --html=report.html --self-contained-html %*

echo.
echo ==============================================================================
echo Hoàn thành kiểm thử! Xem báo cáo chi tiết tại: e2e-tests\python\report.html
echo ==============================================================================
pause
