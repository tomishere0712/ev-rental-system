const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              EV Rental System
            </h3>
            <p className="text-sm">
              Hệ thống thuê xe điện hiện đại, thân thiện môi trường.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Thuê xe điện
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Điểm thuê
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Bảng giá
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Hướng dẫn
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: info@evrental.com</li>
              <li>Hotline: 1900 xxxx</li>
              <li>Địa chỉ: Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 EV Rental System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
