import React, { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Users,
  Layers,
  Plus,
  Trash2,
  Save,
  X,
  Menu,
  UploadCloud,
  ChevronRight,
  Edit,
  User,
  Building2,
  Calendar,
  Star,
  BarChart2,
  Settings,
  MessageSquare,
  Mail
} from "lucide-react";
import { useStore, actions } from "../store";
import { Button, Card, Badge } from "../components/UI";
import { formatCurrency } from "../utils";

// --- 1. COMPONENT UPLOAD ẢNH ---
const ImageUploader = ({ images = [], onImagesChange, domain }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append("files", file));

      try {
        const res = await fetch(`${domain}/api/upload`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const newLinks = await res.json();
          onImagesChange([...images, ...newLinks]);
        }
      } catch (e) {
        console.error(e);
      }
      setUploading(false);
    },
    [images, domain, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Ảnh bìa sách
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 hover:border-emerald-400"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <UploadCloud size={32} className="text-emerald-500" />
          {uploading ? (
            <span className="animate-pulse">Đang tải lên...</span>
          ) : (
            <span className="text-sm">Kéo thả ảnh vào đây</span>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          {images.map((link, idx) => (
            <div
              key={idx}
              className="relative group aspect-[3/4] border rounded bg-gray-100"
            >
              <img
                src={`${domain}${link}`}
                className="w-full h-full object-cover"
                alt="preview"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImagesChange(images.filter((_, i) => i !== idx));
                }}
                className="absolute top-1 right-1 bg-white text-red-600 p-1 rounded-full shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 2. COMPONENT ADMIN MAIN ---
export default function Admin() {
  const [state, dispatch] = useStore();
  const { userInfo, domain, categories } = state;
  const [activeTab, setActiveTab] = useState("products");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [contacts, setContacts] = useState([]);

  // Form thêm Sách
  const [isEditingProd, setIsEditingProd] = useState(false);
  const [prodForm, setProdForm] = useState({
    id: "",
    category_id: "",
    name: "",
    author: "",
    publisher: "",
    publication_year: "",
    price: 0,
    stock: 0,
    images: [],
    description: "",
    specs: [],
  });

  // Form thêm Danh mục
  const [catName, setCatName] = useState("");

  const fetchData = async (tab = activeTab) => {
    setLoading(true);
    try {
      // Luôn load danh mục và sản phẩm nền
      const [prodRes, catRes] = await Promise.all([
        fetch(`${domain}/api/products`),
        fetch(`${domain}/api/categories`),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) dispatch(actions.set_categories(await catRes.json()));

      const opts = { credentials: "include" };

      if (tab === "orders") {
        const res = await fetch(`${domain}/api/admin/orders`, opts);
        if (res.ok) setOrders(await res.json());
      } else if (tab === "users") {
        const res = await fetch(`${domain}/api/admin/users`, opts);
        if (res.ok) setUsers(await res.json());
      } else if (tab === "settings" || tab === "loyalty") {
        const res = await fetch(`${domain}/api/admin/settings`, opts);
        if (res.ok) {
           const data = await res.json();
           const setObj = data.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {});
           setSettings(setObj);
        }
      } else if (tab === "analytics") {
        const res = await fetch(`${domain}/api/admin/analytics`, opts);
        if (res.ok) setAnalytics(await res.json());
      } else if (tab === "contacts") {
        const res = await fetch(`${domain}/api/admin/contacts`, opts);
        if (res.ok) setContacts(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userInfo?.role === "admin") fetchData();
  }, [activeTab, userInfo, domain]);

  // --- LOGIC DANH MỤC ---
  const handleAddCategory = async () => {
    if (!catName) return alert("Nhập tên danh mục!");
    try {
      const res = await fetch(`${domain}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, description: "" }),
        credentials: "include",
      });
      if (res.ok) {
        alert("Đã thêm!");
        setCatName("");
        fetchData();
      } else alert("Lỗi thêm danh mục");
    } catch (e) {
      alert("Lỗi server");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      const res = await fetch(`${domain}/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        alert("Đã xóa!");
        fetchData();
      } else alert("Không thể xóa (có thể danh mục đang chứa sách)");
    } catch (e) {
      alert("Lỗi server");
    }
  };

  // --- LOGIC SÁCH ---
  const saveProduct = async () => {
    if (!prodForm.name || !prodForm.category_id)
      return alert("Vui lòng nhập tên và chọn danh mục!");

    const specsObject = prodForm.specs.reduce((acc, curr) => {
      if (curr.key) acc[curr.key] = curr.value;
      return acc;
    }, {});
    const payload = {
      ...prodForm,
      price: Number(prodForm.price),
      stock: Number(prodForm.stock),
      publication_year: Number(prodForm.publication_year),
      specs: specsObject,
    };

    const method = prodForm.id ? "PUT" : "POST";
    const url = prodForm.id
      ? `${domain}/api/admin/products/${prodForm.id}`
      : `${domain}/api/admin/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        alert("Lưu thành công!");
        setIsEditingProd(false);
        fetchData();
      } else alert("Lỗi lưu sách");
    } catch (e) {
      console.error(e);
    }
  };

  const openEditProduct = (p) => {
    if (p) {
      const specs = p.specs
        ? Object.entries(p.specs).map(([key, value]) => ({ key, value }))
        : [];
      setProdForm({
        ...p,
        specs,
        images: Array.isArray(p.images)
          ? p.images
          : p.image
          ? [p.image]
          : [],
        author: p.author || "",
        publisher: p.publisher || "",
        publication_year: p.publication_year || "",
      });
    } else {
      setProdForm({
        id: "",
        category_id: categories[0]?.id || "",
        name: "",
        author: "",
        publisher: "",
        publication_year: new Date().getFullYear(),
        price: 0,
        stock: 0,
        images: [],
        description: "",
        specs: [],
      });
    }
    setIsEditingProd(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Xóa sách này?")) return;
    await fetch(`${domain}/api/admin/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchData();
  };

  // --- LOGIC KHÁC ---
  const updateOrderStatus = async (id, status) => {
    await fetch(`${domain}/api/admin/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include",
    });
    fetchData("orders");
  };

  const saveSettings = async (newSettingsObj) => {
    const settingsArray = Object.entries(newSettingsObj).map(([id, value]) => ({ id, value }));
    try {
        await fetch(`${domain}/api/admin/settings`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ settings: settingsArray }),
            credentials: 'include'
        });
        alert("Cập nhật thành công!");
    } catch(e) { alert("Lỗi cập nhật"); }
  };

  const updateContactStatus = async (id, status) => {
      await fetch(`${domain}/api/admin/contacts/${id}/status`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ status }),
          credentials: 'include'
      });
      fetchData("contacts");
  };

  // --- RENDER ---
  if (userInfo?.role !== "admin")
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        ⛔ Bạn không có quyền truy cập.
      </div>
    );

  const renderContent = () => {
    if (loading)
      return <div className="text-center p-10">Đang tải dữ liệu...</div>;

    switch (activeTab) {
      case "categories":
        return (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800">
              Quản lý Danh mục (Khoa/Bộ môn)
            </h2>
            <Card className="p-6 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tên danh mục mới
                </label>
                <input
                  className="border p-2 rounded w-full outline-none focus:border-emerald-500"
                  placeholder="VD: Công nghệ thông tin, Kinh tế..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddCategory}
                className="bg-emerald-600 text-white h-10"
              >
                Thêm mới
              </Button>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center"
                >
                  <span className="font-bold text-gray-700">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "products":
        if (isEditingProd)
          return (
            <div className="max-w-5xl mx-auto animate-fade-in">
              <button
                onClick={() => setIsEditingProd(false)}
                className="mb-4 text-gray-500 hover:text-emerald-600 flex items-center gap-1"
              >
                <ChevronRight className="rotate-180" size={20} /> Quay lại danh
                sách
              </button>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6 border-b pb-2">
                  {prodForm.id ? "Sửa thông tin sách" : "Thêm sách mới"}
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Tên giáo trình
                      </label>
                      <input
                        className="w-full border p-2 rounded"
                        value={prodForm.name}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, name: e.target.value })
                        }
                        placeholder="VD: Giải tích 1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Tác giả
                        </label>
                        <input
                          className="w-full border p-2 rounded"
                          value={prodForm.author}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, author: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Nhà xuất bản
                        </label>
                        <input
                          className="w-full border p-2 rounded"
                          value={prodForm.publisher}
                          onChange={(e) =>
                            setProdForm({
                              ...prodForm,
                              publisher: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Danh mục
                        </label>
                        <select
                          className="w-full border p-2 rounded"
                          value={prodForm.category_id}
                          onChange={(e) =>
                            setProdForm({
                              ...prodForm,
                              category_id: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Năm XB
                        </label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded"
                          value={prodForm.publication_year}
                          onChange={(e) =>
                            setProdForm({
                              ...prodForm,
                              publication_year: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Giá bìa (VND)
                        </label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded font-bold text-emerald-600"
                          value={prodForm.price}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, price: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Số lượng kho
                        </label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded"
                          value={prodForm.stock}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, stock: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Mô tả nội dung
                      </label>
                      <textarea
                        rows="4"
                        className="w-full border p-2 rounded"
                        value={prodForm.description}
                        onChange={(e) =>
                          setProdForm({
                            ...prodForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <ImageUploader
                      images={prodForm.images}
                      onImagesChange={(imgs) =>
                        setProdForm({ ...prodForm, images: imgs })
                      }
                      domain={domain}
                    />
                  </div>
                  {/* Cột phải: Thông số */}
                  <div className="bg-gray-50 p-4 rounded h-fit border">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-bold">Thông tin khác</label>
                      <button
                        onClick={() =>
                          setProdForm({
                            ...prodForm,
                            specs: [
                              ...prodForm.specs,
                              { key: "", value: "" },
                            ],
                          })
                        }
                        className="text-emerald-600 text-sm font-bold flex items-center"
                      >
                        <Plus size={14} /> Thêm
                      </button>
                    </div>
                    <div className="space-y-2">
                      {prodForm.specs.map((s, i) => (
                        <div
                          key={i}
                          className="flex gap-2 bg-white p-2 border rounded"
                        >
                          <input
                            className="w-1/2 text-xs border-b outline-none font-bold"
                            placeholder="Tên (Số trang)"
                            value={s.key}
                            onChange={(e) => {
                              const n = [...prodForm.specs];
                              n[i].key = e.target.value;
                              setProdForm({ ...prodForm, specs: n });
                            }}
                          />
                          <input
                            className="w-1/2 text-xs outline-none"
                            placeholder="Giá trị"
                            value={s.value}
                            onChange={(e) => {
                              const n = [...prodForm.specs];
                              n[i].value = e.target.value;
                              setProdForm({ ...prodForm, specs: n });
                            }}
                          />
                          <button
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                specs: prodForm.specs.filter(
                                  (_, idx) => idx !== i
                                ),
                              })
                            }
                            className="text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditingProd(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={saveProduct}
                    className="bg-emerald-600 text-white"
                  >
                    Lưu sách
                  </Button>
                </div>
              </Card>
            </div>
          );
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Kho sách giáo trình
              </h2>
              <Button
                onClick={() => openEditProduct(null)}
                className="bg-emerald-600 text-white"
              >
                <Plus size={18} className="mr-2" /> Nhập sách mới
              </Button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase font-bold">
                  <tr>
                    <th className="p-4">Tên sách</th>
                    <th className="p-4">Tác giả</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Giá</th>
                    <th className="p-4 text-center">Kho</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 flex gap-3 items-center">
                        <img
                          src={
                            p.image || p.images?.[0]
                              ? `${domain}${p.image || p.images[0]}`
                              : "https://via.placeholder.com/40"
                          }
                          className="w-10 h-14 object-cover border bg-gray-100"
                        />
                        <span className="font-bold">{p.name}</span>
                      </td>
                      <td className="p-4 text-gray-600">{p.author}</td>
                      <td className="p-4 text-gray-500">
                        {categories.find((c) => c.id === p.category_id)?.name}
                      </td>
                      <td className="p-4 font-bold text-emerald-700">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            p.stock > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="text-blue-600 bg-blue-50 p-2 rounded hover:bg-blue-100"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Đơn đặt sách</h2>
            {orders.map((o) => (
              <Card
                key={o.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex gap-2">
                     <span className="font-bold">Đơn #{o.id}</span>
                     <span className="text-gray-400">({new Date(o.created_at).toLocaleDateString("vi-VN")})</span>
                  </div>
                  <div className="text-sm text-gray-500">Người nhận: {o.shipping_name || o.user_name || "Ẩn danh"}</div>
                </div>
                <div className="font-bold text-emerald-600">
                  {formatCurrency(o.final_amount)}
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        color={
                            o.status === "completed"
                            ? "green"
                            : o.status === "shipping" ? "blue" : o.status === "cancelled" ? "red" : "yellow"
                        }
                    >
                    {o.status}
                    </Badge>
                    <select
                      className="border rounded p-1 text-sm outline-none"
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="shipping">Đang giao</option>
                      <option value="completed">Đã nhận</option>
                      <option value="cancelled">Hủy đơn</option>
                    </select>
                </div>
              </Card>
            ))}
          </div>
        );

      case "users":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Sinh viên</h2>
            <div className="bg-white rounded border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 uppercase">
                  <tr>
                    <th className="p-4">Tên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">MSV</th>
                    <th className="p-4">Điểm</th>
                    <th className="p-4">Vai trò</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-4 flex items-center gap-2">
                         <img src={u.picture} className="w-6 h-6 rounded-full"/>
                         {u.name}
                      </td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">{u.student_id || "---"}</td>
                      <td className="p-4 font-bold">{u.points}</td>
                      <td className="p-4 text-xs uppercase font-bold text-gray-500">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "loyalty":
        return (
           <div className="max-w-2xl space-y-6">
                <h2 className="text-2xl font-bold">Cấu hình Điểm thưởng</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="font-bold mb-4 flex gap-2 items-center"><Star size={16} className="text-yellow-500"/> Tỷ lệ đổi điểm</h3>
                        <div className="flex items-center gap-2">
                            <span>1.000 VNĐ = </span>
                            <input className="border p-1 w-20 text-center font-bold rounded" value={settings.point_ratio || ""} onChange={e => setSettings({...settings, point_ratio: e.target.value})}/>
                            <span>điểm</span>
                        </div>
                    </Card>
                    <Card className="p-6">
                         <h3 className="font-bold mb-4">Các hạng thành viên</h3>
                         {['Silver', 'Gold', 'Diamond'].map(l => (
                             <div key={l} className="flex justify-between mb-2">
                                 <span>{l} Reader</span>
                                 <input className="border p-1 w-24 text-right rounded" placeholder="Điểm" value={settings[`level_${l.toLowerCase()}`] || ""} onChange={e => setSettings({...settings, [`level_${l.toLowerCase()}`]: e.target.value})}/>
                             </div>
                         ))}
                    </Card>
                </div>
                <Button onClick={() => saveSettings(settings)} className="bg-emerald-600 text-white">Lưu cấu hình</Button>
           </div>
        );

      case "analytics":
        if (!analytics) return <div className="p-10 text-center">Chưa có dữ liệu thống kê</div>;
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Thống kê hoạt động</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-emerald-50 border-emerald-100">
                        <div className="text-gray-500 text-sm">Doanh thu tháng</div>
                        <div className="text-xl font-bold text-emerald-700">{formatCurrency(analytics.revenue_month)}</div>
                    </Card>
                    <Card className="p-4 bg-blue-50 border-blue-100">
                        <div className="text-gray-500 text-sm">Đơn mới</div>
                        <div className="text-xl font-bold text-blue-700">{analytics.new_orders}</div>
                    </Card>
                    <Card className="p-4 bg-purple-50 border-purple-100">
                        <div className="text-gray-500 text-sm">Sinh viên mới</div>
                        <div className="text-xl font-bold text-purple-700">{analytics.new_users}</div>
                    </Card>
                    <Card className="p-4 bg-orange-50 border-orange-100">
                        <div className="text-gray-500 text-sm">Sách Top 1</div>
                        <div className="text-sm font-bold text-orange-700 line-clamp-2">{analytics.top_product}</div>
                    </Card>
                </div>
            </div>
        );
      
      case "settings":
        return (
            <div className="max-w-xl space-y-6">
                <h2 className="text-2xl font-bold">Cấu hình Hệ thống</h2>
                <Card className="p-6 space-y-4">
                    <div><label className="block text-sm font-bold mb-1">Tên cổng thông tin</label><input className="w-full border p-2 rounded" value={settings.site_name || ""} onChange={e => setSettings({...settings, site_name: e.target.value})}/></div>
                    <div><label className="block text-sm font-bold mb-1">Email ban quản trị</label><input className="w-full border p-2 rounded" value={settings.contact_email || ""} onChange={e => setSettings({...settings, contact_email: e.target.value})}/></div>
                    <div><label className="block text-sm font-bold mb-1">Hotline thư viện</label><input className="w-full border p-2 rounded" value={settings.hotline || ""} onChange={e => setSettings({...settings, hotline: e.target.value})}/></div>
                    <Button onClick={() => saveSettings(settings)} className="bg-emerald-600 text-white">Lưu thay đổi</Button>
                </Card>
            </div>
        );

      case "contacts":
         return (
             <div className="space-y-4">
                 <h2 className="text-2xl font-bold">Hòm thư góp ý</h2>
                 {contacts.map(c => (
                     <Card key={c.id} className="p-4 flex gap-4">
                         <div className="flex-1">
                             <div className="font-bold text-gray-800 flex items-center gap-2">
                                 <Mail size={14}/> {c.email} 
                                 <span className="text-xs font-normal text-gray-400">({new Date(c.created_at).toLocaleDateString()})</span>
                             </div>
                             <p className="bg-gray-50 p-3 mt-2 rounded italic text-gray-700">"{c.message}"</p>
                         </div>
                         <div className="flex flex-col gap-2 min-w-[120px]">
                             <Badge color={c.status === "processed" ? "green" : "yellow"}>{c.status === "processed" ? "Đã trả lời" : "Chờ xử lý"}</Badge>
                             {c.status === "new" && (
                                 <Button size="sm" onClick={() => updateContactStatus(c.id, "processed")} className="bg-emerald-600 text-white text-xs">Đánh dấu xong</Button>
                             )}
                             <a href={`mailto:${c.email}`} className="text-xs text-blue-600 text-center hover:underline">Gửi mail trả lời</a>
                         </div>
                     </Card>
                 ))}
                 {contacts.length === 0 && <div className="text-center text-gray-500 py-10 border border-dashed rounded bg-gray-50">Hòm thư trống</div>}
             </div>
         );

      default:
        return null;
    }
  };

  const menuItems = [
    { id: "categories", label: "Quản lý Danh mục", icon: <Layers size={20} /> },
    { id: "products", label: "Kho sách", icon: <BookOpen size={20} /> },
    { id: "orders", label: "Đơn đặt hàng", icon: <ShoppingCart size={20} /> },
    { id: "users", label: "Sinh viên", icon: <Users size={20} /> },
    { id: "loyalty", label: "Điểm thưởng", icon: <Star size={20} /> },
    { id: "analytics", label: "Thống kê", icon: <BarChart2 size={20} /> },
    { id: "settings", label: "Cấu hình", icon: <Settings size={20} /> },
    { id: "contacts", label: "Góp ý", icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-xl transform transition-transform duration-300 md:translate-x-0 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b flex items-center gap-2 font-bold text-xl text-gray-800">
          <LayoutDashboard className="text-emerald-600" /> AdminPanel
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
                setIsEditingProd(false); // Reset trạng thái edit khi chuyển tab
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                activeTab === item.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden p-4 bg-white border-b flex justify-between items-center">
          <span className="font-bold">Menu</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}