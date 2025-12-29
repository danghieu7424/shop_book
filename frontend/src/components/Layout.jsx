import React, { useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  BookOpen,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  Library,
  Info,           
  MessageSquare,  
} from "lucide-react";
import { useStore, actions } from "../store";
import { Button } from "./UI";

export default function Layout() {
  const [state, dispatch] = useStore();
  const { userInfo, cart, domain } = state;
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${domain}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      dispatch(actions.set_user_info(null));
      dispatch(actions.clear_cart());
      navigate("/");
      setIsMobileMenuOpen(false);
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const isActive = (path) => {
      if (path === "/" && location.pathname !== "/") return false;
      return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* --- HEADER --- */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          
          {/* Logo & Mobile Button */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 group"
              onClick={closeMenu}
            >
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white group-hover:bg-emerald-700 transition-colors shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                Cổng Giáo Trình
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" label="Trang chủ" active={isActive("/")} />
            <NavLink to="/products" label="Danh mục sách" active={isActive("/products")} />
            <NavLink to="/about" label="Giới thiệu" active={isActive("/about")} />
            <NavLink to="/contact" label="Góp ý" active={isActive("/contact")} />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className={`relative p-2 rounded-full transition-all ${isActive("/cart") ? "text-emerald-600 bg-emerald-50" : "text-gray-600 hover:text-emerald-600 hover:bg-gray-100"}`}
              onClick={closeMenu}
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* User Dropdown (Desktop) */}
            <div className="hidden md:block pl-2 border-l ml-2">
              {userInfo ? (
                <div className="relative group py-2">
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-700 leading-tight">
                        {userInfo.name}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded-full inline-block mt-0.5">
                        {userInfo.points} pts
                      </div>
                    </div>
                    <img
                      src={userInfo.picture || "https://via.placeholder.com/40"}
                      className="w-9 h-9 rounded-full border border-gray-200 object-cover shadow-sm group-hover:ring-2 ring-emerald-500 transition-all"
                      alt="Avatar"
                    />
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full pt-2 w-60 hidden group-hover:block z-50 animate-fade-in">
                    <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden p-1">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 mb-1">
                        <div className="text-xs text-gray-500 font-medium uppercase">Tài khoản</div>
                        <div className="text-sm font-bold text-gray-800 truncate">{userInfo.email}</div>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 text-sm font-medium flex items-center gap-3 rounded-lg transition-colors"
                      >
                        <User size={16} /> Hồ sơ cá nhân
                      </Link>
                      
                      {userInfo.role === "admin" && (
                        <Link
                          to="/admin"
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-3 rounded-lg transition-colors"
                        >
                          <Settings size={16} /> Trang quản trị
                        </Link>
                      )}
                      
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-3 rounded-lg transition-colors"
                      >
                        <LogOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm" className="text-sm px-6 py-2 bg-emerald-600 hover:bg-emerald-700 border-none text-white shadow-md shadow-emerald-200">
                    Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* --- MOBILE MENU --- */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 fixed w-full shadow-2xl animate-fade-in z-40 max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col p-4 space-y-2">
              {userInfo ? (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl mb-2 border border-emerald-100">
                  <img
                    src={userInfo.picture || "https://via.placeholder.com/40"}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    alt="User"
                  />
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{userInfo.name}</div>
                    <div className="text-sm text-emerald-600 font-bold bg-white px-2 py-0.5 rounded-full inline-block shadow-sm">
                      {userInfo.points} điểm tích lũy
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={closeMenu} className="mb-4 block">
                  <Button className="w-full justify-center bg-emerald-600 border-none text-white py-3 shadow-md">
                    Đăng nhập tài khoản
                  </Button>
                </Link>
              )}

              <MobileNavLink to="/" label="Trang chủ" icon={<Library size={18}/>} onClick={closeMenu} active={isActive("/")} />
              <MobileNavLink to="/products" label="Danh mục sách" icon={<BookOpen size={18}/>} onClick={closeMenu} active={isActive("/products")} />
              <MobileNavLink to="/about" label="Giới thiệu" icon={<Info size={18}/>} onClick={closeMenu} active={isActive("/about")} />
              <MobileNavLink to="/contact" label="Góp ý" icon={<MessageSquare size={18}/>} onClick={closeMenu} active={isActive("/contact")} />

              {userInfo && (
                <>
                  <div className="h-px bg-gray-100 my-2"></div>
                  <MobileNavLink to="/profile" label="Hồ sơ cá nhân" icon={<User size={18}/>} onClick={closeMenu} active={isActive("/profile")} />
                  {userInfo.role === "admin" && (
                    <MobileNavLink to="/admin" label="Quản trị hệ thống" icon={<Settings size={18}/>} onClick={closeMenu} isSpecial />
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 bg-gray-50 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-auto border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
             <div className="bg-gray-800 p-2 rounded-lg">
                <BookOpen className="text-emerald-500 h-6 w-6"/>
             </div>
             <span className="text-2xl font-bold text-white tracking-tight">Cổng Giáo Trình</span>
          </div>
          <p className="mb-8 text-sm max-w-lg mx-auto leading-relaxed text-gray-500">
            Hệ thống cung cấp giáo trình, tài liệu học tập chính quy dành cho sinh viên. 
            Hỗ trợ đăng ký trực tuyến, giao nhận tại trường và tích điểm thưởng.
          </p>
          <div className="flex justify-center gap-8 text-sm font-medium mb-8">
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">Điều khoản sử dụng</Link>
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Chính sách bảo mật</Link>
            <Link to="/contact" className="hover:text-emerald-400 transition-colors">Liên hệ hỗ trợ</Link>
          </div>
          <div className="text-xs text-gray-600 pt-8 border-t border-gray-800">
            &copy; {new Date().getFullYear()} University Book Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const NavLink = ({ to, label, active }) => (
  <Link
    to={to}
    className={`font-medium transition-colors relative group py-2 ${active ? "text-emerald-600" : "text-gray-600 hover:text-emerald-600"}`}
  >
    {label}
    <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600 transform transition-transform origin-left ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
  </Link>
);

const MobileNavLink = ({ to, label, icon, onClick, isSpecial, active }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
      isSpecial 
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
      : active
      ? "bg-emerald-50 text-emerald-700" 
      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
    }`}
  >
    {icon}
    {label}
  </Link>
);