import React, { useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import {
  ShoppingCart,
  BookOpen, // Đổi icon CPU -> BookOpen
  LogOut,
  User,
  Settings,
  Menu,
  X,
  Library
} from "lucide-react"; 
import { useStore, actions } from "../store";
import { Button } from "./UI";

export default function Layout() {
  const [state, dispatch] = useStore();
  const { userInfo, cart, domain } = state;
  const navigate = useNavigate();

  // State cho Mobile Menu
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* --- MOBILE HAMBURGER BUTTON --- */}
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 cursor-pointer no-underline text-current group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white group-hover:bg-emerald-700 transition-colors">
                  <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold hidden sm:block text-emerald-900 tracking-tight">
                Cổng Giáo Trình
              </span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className="font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Danh mục sách
            </Link>
            <Link
              to="/about"
              className="font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Giới thiệu
            </Link>
            <Link
              to="/contact"
              className="font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Góp ý
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative cursor-pointer text-gray-600 hover:text-emerald-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* User Dropdown (Desktop) & Login Button */}
            <div className="hidden md:block">
              {userInfo ? (
                <div className="relative group py-2">
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="text-right hidden lg:block">
                      <div className="text-sm font-bold text-gray-700">
                        {userInfo.name}
                      </div>
                      <div className="text-xs text-emerald-600 font-bold">
                        {userInfo.points} pts
                      </div>
                    </div>
                    <img
                      src={userInfo.picture || "https://via.placeholder.com/40"}
                      className="w-9 h-9 rounded-full border border-gray-200 object-cover"
                      alt="Avatar"
                    />
                  </div>

                  <div className="absolute right-0 top-full pt-2 w-60 hidden group-hover:block z-50">
                    <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden animate-fade-in p-1">
                      <Link
                        to="/profile"
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-3 rounded-lg transition-colors"
                      >
                        <User size={16} className="text-gray-400" /> Hồ sơ sinh viên
                      </Link>
                      {userInfo.role === "admin" && (
                        <Link
                          to="/admin"
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-3 rounded-lg transition-colors"
                        >
                          <Settings size={16} /> Quản trị hệ thống
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
                  <Button size="sm" className="text-sm px-5 py-2 rounded-full shadow-none bg-emerald-600 hover:bg-emerald-700 border-none text-white">
                    Đăng nhập SV
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile User Avatar */}
            {userInfo && (
              <div
                className="md:hidden cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <img
                  src={userInfo.picture || "https://via.placeholder.com/40"}
                  className="w-8 h-8 rounded-full border border-emerald-200"
                  alt="User"
                />
              </div>
            )}
          </div>
        </div>

        {/* --- MOBILE MENU DROPDOWN --- */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg animate-fade-in z-40">
            <div className="flex flex-col p-4 space-y-3">
              {/* User Info (Mobile) */}
              {userInfo ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-2">
                  <img
                    src={userInfo.picture}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <div>
                    <div className="font-bold text-gray-800">
                      {userInfo.name}
                    </div>
                    <div className="text-xs text-emerald-600 font-bold">
                      {userInfo.points} điểm tích lũy
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center bg-emerald-600 border-none text-white">
                    Đăng nhập tài khoản
                  </Button>
                </Link>
              )}

              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium text-gray-700 hover:text-emerald-600 py-2 border-b border-gray-50 flex items-center gap-2"
              >
                <Library size={18}/> Trang chủ
              </Link>
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium text-gray-700 hover:text-emerald-600 py-2 border-b border-gray-50 flex items-center gap-2"
              >
                <BookOpen size={18}/> Danh sách giáo trình
              </Link>
              
              {/* Các link khác... */}

              {userInfo && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-gray-700 hover:text-emerald-600 py-2 border-b border-gray-50 flex items-center gap-2"
                  >
                    <User size={18} /> Thông tin cá nhân
                  </Link>
                  {userInfo.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-bold text-emerald-600 py-2 border-b border-gray-50 flex items-center gap-2"
                    >
                      <Settings size={18} /> Trang quản trị
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="font-medium text-red-500 py-2 text-left flex items-center gap-2"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-10 mt-12 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4 text-white">
             <BookOpen className="text-emerald-500"/>
             <span className="text-xl font-bold">Cổng Giáo Trình Trực Tuyến</span>
          </div>
          <p className="mb-6 text-sm max-w-lg mx-auto">
            Hệ thống cung cấp giáo trình, tài liệu học tập chính quy dành cho sinh viên. 
            Hỗ trợ đăng ký trực tuyến, giao nhận tại trường và tích điểm thưởng.
          </p>
          <div className="flex justify-center gap-6 text-sm font-medium">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Quy định chung</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Hướng dẫn mua sách</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Liên hệ thư viện</span>
          </div>
          <div className="mt-8 text-xs text-gray-600">
            &copy; {new Date().getFullYear()} University Book Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}