import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Star, Check, Shield, Book, User, Calendar, Building2, Truck, AlertCircle } from 'lucide-react';
import { useStore, actions } from '../store';
import { Button, Badge } from '../components/UI';
import { formatCurrency } from '../utils';

export default function ProductDetail() {
    const { id } = useParams();
    const [state, dispatch] = useStore();
    const { domain, categories, userInfo, cart } = state;
    const navigate = useNavigate();
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('desc');
    const [activeImg, setActiveImg] = useState(null);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Hàm xử lý ảnh an toàn (Parse JSON string lỗi)
    const getProductImages = (prod) => {
        if (!prod) return [];
        let images = [];
        const safeParse = (str) => {
            try { return JSON.parse(str); } catch (e) {
                try { const fixed = str.replace(/'/g, '"'); return JSON.parse(fixed); } catch (e2) {
                    if (str.startsWith('[') && str.endsWith(']')) { return str.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')); }
                    return null;
                }
            }
        };
        if (Array.isArray(prod.images) && prod.images.length > 0) { images = prod.images; } else if (typeof prod.images === 'string' && prod.images.trim()) { const parsed = safeParse(prod.images); if (Array.isArray(parsed) && parsed.length > 0) images = parsed; else if (typeof parsed === 'string') images = [parsed]; else images = [prod.images]; }
        if (images.length === 0 && prod.image) { if (typeof prod.image === 'string') { const parsed = safeParse(prod.image); if (Array.isArray(parsed) && parsed.length > 0) images = parsed; else images = [prod.image]; } }
        return images.filter(img => typeof img === 'string' && img.length > 2);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true); setError(null);
            try {
                const [prodRes, revRes] = await Promise.all([fetch(`${domain}/api/products/${id}`), fetch(`${domain}/api/reviews/${id}`)]);
                if (!prodRes.ok) { if (prodRes.status === 404) throw new Error("Không tìm thấy giáo trình này."); throw new Error("Lỗi tải thông tin sản phẩm."); }
                const prodData = await prodRes.json();
                setProduct(prodData);
                const imgs = getProductImages(prodData);
                if (imgs.length > 0) setActiveImg(imgs[0]);
                if (revRes.ok) { setReviews(await revRes.json()); }
            } catch (e) { console.error("Detail Error:", e); setError(e.message); } finally { setLoading(false); }
        };
        loadData();
    }, [id, domain]);

    const handlePostReview = async () => { if (!userInfo) return alert("Vui lòng đăng nhập để đánh giá"); if (!newComment.trim()) return alert("Vui lòng nhập nội dung"); setSubmitting(true); try { const res = await fetch(`${domain}/api/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: id, rating: newRating, content: newComment }), credentials: 'include' }); if (res.ok) { alert("Cảm ơn đánh giá của bạn!"); setNewComment(''); setNewRating(5); const revRes = await fetch(`${domain}/api/reviews/${id}`); if (revRes.ok) setReviews(await revRes.json()); } else { alert("Có lỗi xảy ra khi gửi đánh giá"); } } catch(e) { console.error(e); } setSubmitting(false); };
    const handleQuantityChange = (delta) => { const newQty = quantity + delta; if (product && newQty >= 1 && newQty <= product.stock) setQuantity(newQty); };
    const handleAddToCart = async () => { if (!product) return; dispatch(actions.add_to_cart({ ...product, image: activeImg, quantity: quantity })); if (userInfo) { const existingItem = cart.find(i => i.id === product.id); const finalQty = (existingItem ? existingItem.quantity : 0) + quantity; try { await fetch(`${domain}/api/cart`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ product_id: product.id, quantity: finalQty }), credentials: 'include' }); } catch(e) { console.error("Lỗi lưu giỏ hàng", e); } } alert(`Đã thêm ${quantity} quyển vào giỏ hàng!`); };

    if (loading) return <div className="p-20 text-center flex flex-col items-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div><span className="text-gray-500">Đang tải thông tin sách...</span></div>;
    if (error) return <div className="p-20 text-center flex flex-col items-center gap-4"><AlertCircle size={48} className="text-red-400"/><h2 className="text-xl font-bold text-gray-700">{error}</h2><Button onClick={() => navigate('/products')}>Quay lại danh sách</Button></div>;
    if (!product) return null;

    const productImages = getProductImages(product);

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <Button onClick={() => navigate(-1)} variant="secondary" className="mb-6 text-sm">← Quay lại danh sách</Button>
            <div className="grid md:grid-cols-12 gap-8 mb-12">
                <div className="md:col-span-4">
                    <div className="bg-white rounded-lg border p-2 flex items-center justify-center mb-4 shadow-sm relative overflow-hidden h-[450px]">
                        <img src={activeImg ? `${domain}${activeImg}` : "https://placehold.co/300x400?text=No+Image"} className="h-full object-contain shadow-md transition-transform duration-300" alt={product.name} />
                         {product.stock === 0 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl uppercase backdrop-blur-sm">Hết giáo trình</div>)}
                    </div>
                    {productImages.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-200">{productImages.map((img, idx) => (<div key={idx} onClick={() => setActiveImg(img)} className={`w-20 h-24 flex-shrink-0 border rounded cursor-pointer overflow-hidden bg-white ${activeImg === img ? 'border-emerald-600 ring-2 ring-emerald-500 ring-offset-1' : 'border-gray-200 hover:border-emerald-300'}`}><img src={`${domain}${img}`} className="w-full h-full object-cover" alt={`thumb-${idx}`} /></div>))}</div>)}
                </div>

                <div className="md:col-span-8 space-y-5">
                    <div>
                        <div className="flex justify-between items-start"><span className="text-emerald-700 font-bold uppercase text-sm tracking-wider bg-emerald-50 px-2 py-1 rounded">{categories.find(c => c.id === product.category_id)?.name || "Giáo trình"}</span><span className={`text-sm font-medium px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.stock > 0 ? `Còn ${product.stock} quyển` : 'Tạm hết'}</span></div>
                        <h1 className="text-3xl font-bold mt-2 text-gray-900 leading-tight">{product.name}</h1>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 border-b border-dashed pb-4">
                            {product.author && (<div className="flex items-center gap-1"><User size={16} className="text-gray-400"/> Tác giả: <span className="font-semibold text-gray-800">{product.author}</span></div>)}
                            {product.publisher && (<div className="flex items-center gap-1"><Building2 size={16} className="text-gray-400"/> NXB: <span className="font-semibold text-gray-800">{product.publisher}</span></div>)}
                            {product.publication_year && (<div className="flex items-center gap-1"><Calendar size={16} className="text-gray-400"/> Năm: <span className="font-semibold text-gray-800">{product.publication_year}</span></div>)}
                        </div>
                        <div className="flex items-center gap-2 mt-3"><div className="flex text-yellow-400"><span className="font-bold mr-1 text-gray-700">{Number(product.rating || 0).toFixed(1)}</span><Star size={16} fill="currentColor" className={product.rating > 0 ? "text-yellow-400" : "text-gray-300"}/></div><span className="text-sm text-gray-500">({product.review_count || 0} đánh giá)</span></div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {product.sale_price && Number(product.sale_price) > 0 ? (
                            <div className="flex items-baseline gap-3 mb-4"><span className="text-3xl font-bold text-red-600">{formatCurrency(product.sale_price)}</span><span className="text-gray-400 line-through text-lg">{formatCurrency(product.price)}</span><Badge color="red">-{Math.round(((product.price - product.sale_price) / product.price) * 100)}%</Badge></div>
                        ) : (<div className="flex items-baseline gap-4 mb-4"><span className="text-3xl font-bold text-emerald-700">{formatCurrency(product.price)}</span></div>)}
                        <div className="flex flex-col sm:flex-row gap-4"><div className="flex items-center border border-gray-300 rounded-lg w-fit bg-white h-12"><button onClick={() => handleQuantityChange(-1)} className="px-3 h-full hover:bg-gray-100 disabled:opacity-50 border-r" disabled={quantity <= 1}><Minus size={18}/></button><span className="w-12 text-center font-bold text-lg">{quantity}</span><button onClick={() => handleQuantityChange(1)} className="px-3 h-full hover:bg-gray-100 disabled:opacity-50 border-l" disabled={quantity >= product.stock}><Plus size={18}/></button></div><Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 h-12 text-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 border-none text-white"><ShoppingCart className="mr-2"/> {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Liên hệ thư viện'}</Button></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 p-2"><div className="flex gap-2 items-center"><Shield size={18} className="text-emerald-600"/> Đảm bảo sách chính hãng</div><div className="flex gap-2 items-center"><Check size={18} className="text-emerald-600"/> Đổi trả lỗi in ấn</div><div className="flex gap-2 items-center"><Truck size={18} className="text-emerald-600"/> Giao nhanh trong trường</div><div className="flex gap-2 items-center"><Book size={18} className="text-emerald-600"/> Hỗ trợ bọc sách plastic</div></div>
                </div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-8"><div className="flex border-b overflow-x-auto">{['desc', 'reviews'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 font-bold border-b-2 whitespace-nowrap transition-colors capitalize ${activeTab === tab ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>{tab === 'desc' ? 'Giới thiệu nội dung' : `Đánh giá (${reviews.length})`}</button>))}</div><div className="p-6 md:p-8 min-h-[200px]">{activeTab === 'desc' && <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">{product.description || "Chưa có mô tả chi tiết cho giáo trình này."}</div>}{activeTab === 'reviews' && (<div><div className="bg-gray-50 p-6 rounded-lg mb-8 border shadow-sm"><h3 className="font-bold mb-4 text-lg">Đánh giá giáo trình này</h3>{userInfo ? (<div className="space-y-4"><div className="flex gap-2 items-center"><span className="text-sm font-medium">Đánh giá:</span>{[1,2,3,4,5].map(star => (<button key={star} onClick={() => setNewRating(star)} className="focus:outline-none transition-transform hover:scale-110" type="button"><Star size={28} fill={star <= newRating ? "#FACC15" : "white"} className={star <= newRating ? "text-yellow-400" : "text-gray-300"} /></button>))}</div><textarea className="w-full border rounded-lg p-3 focus:ring-2 ring-emerald-500 outline-none resize-none bg-white" rows="3" placeholder="Nội dung sách có hữu ích không?..." value={newComment} onChange={e => setNewComment(e.target.value)}/><div className="flex justify-end"><Button className="bg-emerald-600 hover:bg-emerald-700 border-none text-white" onClick={handlePostReview} disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi đánh giá"}</Button></div></div>) : (<div className="text-gray-500 text-center">Vui lòng đăng nhập để đánh giá.</div>)}</div><div className="space-y-6">{reviews.length === 0 ? (<div className="text-center text-gray-500 py-10">Chưa có đánh giá nào.</div>) : (reviews.map((review) => (<div key={review.id} className="border-b pb-6 last:border-0 last:pb-0"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg select-none">{review.user_name ? review.user_name.charAt(0).toUpperCase() : <User size={20}/>}</div><div><div className="font-bold text-gray-800">{review.user_name || 'Ẩn danh'}</div><div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</div></div></div><div className="pl-13"><div className="flex text-yellow-400 mb-2">{[...Array(5)].map((_, i) => (<Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"}/>))}</div><p className="text-gray-700">{review.content}</p></div></div>)))}</div></div>)}</div></div>
        </div>
    );
}