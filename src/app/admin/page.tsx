'use client';

import { useState, useEffect } from 'react';
import { 
  FaTrash, FaEdit, FaPlus, FaSignOutAlt, FaStar, FaCrown, FaQuoteLeft, 
  FaSearch, FaUsers, FaEnvelope, FaGlobe, FaFire, FaThLarge, FaSitemap, FaChevronUp, FaChevronDown, FaSave
} from 'react-icons/fa';
import './admin.css';

const LogoSVG = ({ height = "90px" }: { height?: string }) => (
  <img src="/logo.png" alt="Artistvibes Entertainment" style={{ height, width: 'auto', objectFit: "contain", display: 'block' }} />
);

// Helper to compress large base64 images before sending to backend to avoid 413 Payload Too Large
const compressImage = (base64Str: string, maxWidth = 500): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str.startsWith('data:image')) return resolve(base64Str);
    
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      if (ratio >= 1) return resolve(base64Str);
      
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function AdminDashboard() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'testimonials' | 'subscribers' | 'trending' | 'exclusive' | 'seo'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [artists, setArtists] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [seoPages, setSeoPages] = useState<any[]>([]);
  const [selectedSeoSlug, setSelectedSeoSlug] = useState<string | null>(null);
  const [seoPanelOpen, setSeoPanelOpen] = useState(true);
  const [savingSeo, setSavingSeo] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modals state
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'artist' | 'testimonial') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'YOUR_UPLOAD_PRESET';
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Cloudinary error details:', errData);
        throw new Error(errData?.error?.message || 'Cloudinary upload failed');
      }
      const data = await res.json();
      
      if (formType === 'artist') {
        setArtistForm({ ...artistForm, imageUrl: data.secure_url });
      } else {
        setTestimonialForm({ ...testimonialForm, imageUrl: data.secure_url });
      }
      setToast('Image uploaded successfully to Cloudinary!');
    } catch (error) {
      alert('Error uploading image to Cloudinary. Please check your Cloudinary credentials.');
      console.error(error);
    }
    setUploadingImage(false);
  };

  // Artist Form State
  const [artistForm, setArtistForm] = useState({
    name: '', category: 'Singer', location: 'Mumbai', price: 'On Request', imageUrl: '', rating: '4.5', bio: '',
    isExclusive: false, isFeatured: false, isTrending: false, isActive: true, eventsCount: '0', videoUrl: '', order: '0'
  });

  // Testimonial Form State
  const [testimonialForm, setTestimonialForm] = useState({
    name: '', role: '', content: '', rating: '5', imageUrl: '', isActive: true
  });

  // SEO Form State
  const [seoForm, setSeoForm] = useState({
    slug: '', label: '', path: '', pageTitle: '', metaKeywords: '',
    metaDescription: '', canonicalUrl: '', schemaJson: '',
  });

  // Automatically clear toast message
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/artists', {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        setIsLoggedIn(true);
        setToast('Welcome back! Successfully logged into portal.');
        fetchArtists();
        fetchTestimonials();
        fetchSubscribers();
        fetchSeoPages();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Network error. Check connection.');
    }
    setLoading(false);
  };

  const fetchArtists = async () => {
    const res = await fetch('/api/admin/artists', { headers: { 'x-admin-token': token } });
    if (res.ok) {
      const data = await res.json();
      setArtists(data.data || []);
    }
  };

  const fetchTestimonials = async () => {
    const res = await fetch('/api/admin/testimonials', { headers: { 'x-admin-token': token } });
    if (res.ok) {
      const data = await res.json();
      setTestimonials(data.data || []);
    }
  };

  const fetchSubscribers = async () => {
    const res = await fetch('/api/admin/subscribers', { headers: { 'x-admin-token': token } });
    if (res.ok) {
      const data = await res.json();
      setSubscribers(data.data || []);
    }
  };

  const fetchSeoPages = async () => {
    const res = await fetch('/api/admin/seo', { headers: { 'x-admin-token': token } });
    if (res.ok) {
      const data = await res.json();
      setSeoPages(data.data || []);
    }
  };

  const openSeoEditor = (page: any) => {
    setSelectedSeoSlug(page.slug);
    setSeoForm({
      slug: page.slug,
      label: page.label || '',
      path: page.path || '',
      pageTitle: page.pageTitle || '',
      metaKeywords: page.metaKeywords || '',
      metaDescription: page.metaDescription || '',
      canonicalUrl: page.canonicalUrl || '',
      schemaJson: page.schemaJson || '',
    });
    setSeoPanelOpen(true);
  };

  const handleSeoFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSeoForm({ ...seoForm, [e.target.name]: e.target.value });
  };

  const saveSeoPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeoSlug) return;
    if (!seoForm.metaDescription.trim()) {
      setToast('Meta description is required.');
      return;
    }

    setSavingSeo(true);
    try {
      const res = await fetch(`/api/admin/seo/${selectedSeoSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(seoForm),
      });
      const data = await res.json();
      if (res.ok) {
        setToast(`SEO settings saved for ${seoForm.label || selectedSeoSlug}.`);
        fetchSeoPages();
      } else {
        setToast(data.error || 'Failed to save SEO settings.');
      }
    } catch {
      setToast('Network error while saving SEO settings.');
    }
    setSavingSeo(false);
  };

  const handleLogout = () => {
    setToken('');
    setIsLoggedIn(false);
    setArtists([]);
    setTestimonials([]);
    setSubscribers([]);
    setToast('Logged out successfully.');
  };

  // --- ARTIST HANDLERS ---
  const handleArtistFormChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setArtistForm({ ...artistForm, [e.target.name]: value });
  };

  const openNewArtistModal = () => {
    setEditingId(null);
    setArtistForm({ 
      name: '', 
      category: 'Singer', 
      location: 'Mumbai', 
      price: 'On Request', 
      imageUrl: '', 
      rating: '4.5', 
      bio: '', 
      isExclusive: activeTab === 'exclusive', 
      isFeatured: activeTab === 'featured', 
      isTrending: activeTab === 'trending', 
      isActive: true,
      eventsCount: '0',
      videoUrl: '',
      order: '0'
    });
    setShowArtistModal(true);
  };

  const openEditArtistModal = (artist: any) => {
    setEditingId(artist.id);
    setArtistForm({
      name: artist.name || '',
      category: artist.category || 'Singer',
      location: artist.location || 'Mumbai',
      price: artist.price || 'On Request',
      imageUrl: artist.imageUrl || '',
      rating: artist.rating?.toString() || '4.5',
      bio: artist.bio || '',
      isExclusive: !!artist.isExclusive,
      isFeatured: !!artist.isFeatured,
      isTrending: !!artist.isTrending,
      isActive: artist.isActive !== false,
      eventsCount: artist.eventsCount?.toString() || '0',
      videoUrl: artist.videoUrl || '',
      order: artist.order?.toString() || '0'
    });
    setShowArtistModal(true);
  };

  const saveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId ? `/api/admin/artists/${editingId}` : '/api/admin/artists';
    const method = editingId ? 'PUT' : 'POST';

    try {
      // Image is already uploaded to Cloudinary, just use the URL
      const payload = { 
        ...artistForm, 
        rating: parseFloat(artistForm.rating) || 4.5,
        eventsCount: parseInt(artistForm.eventsCount) || 0,
        order: parseInt(artistForm.order) || 0
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowArtistModal(false);
        setToast(editingId ? 'Artist updated successfully!' : 'New artist added successfully!');
        fetchArtists();
      } else {
        alert('Failed to save artist. Please check the inputs.');
      }
    } catch (err) {
      alert('Error saving artist.');
    }
    setLoading(false);
  };

  const deleteArtist = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will remove them permanently.`)) return;
    try {
      const res = await fetch(`/api/admin/artists/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        setToast('Artist deleted successfully.');
        fetchArtists();
      } else {
        alert('Failed to delete artist');
      }
    } catch {
      alert('Error deleting artist');
    }
  };

  // --- TESTIMONIAL HANDLERS ---
  const handleTestiFormChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setTestimonialForm({ ...testimonialForm, [e.target.name]: value });
  };

  const openNewTestimonialModal = () => {
    setEditingId(null);
    setTestimonialForm({ name: '', role: '', content: '', rating: '5', imageUrl: '', isActive: true });
    setShowTestimonialModal(true);
  };

  const openEditTestimonialModal = (testi: any) => {
    setEditingId(testi.id);
    setTestimonialForm({
      name: testi.name || '',
      role: testi.role || '',
      content: testi.content || '',
      rating: testi.rating?.toString() || '5',
      imageUrl: testi.imageUrl || '',
      isActive: testi.isActive !== false
    });
    setShowTestimonialModal(true);
  };

  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId ? `/api/admin/testimonials/${editingId}` : '/api/admin/testimonials';
    const method = editingId ? 'PUT' : 'POST';

    try {
      // Image is already uploaded to Cloudinary, just use the URL
      const payload = { 
        ...testimonialForm, 
        rating: parseInt(testimonialForm.rating) || 5
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowTestimonialModal(false);
        setToast(editingId ? 'Testimonial updated!' : 'Testimonial added!');
        fetchTestimonials();
      } else {
        const errorData = await res.json();
        alert(`Failed to save testimonial: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error saving testimonial');
    }
    setLoading(false);
  };

  const deleteTestimonial = async (id: number, name: string) => {
    if (!confirm(`Delete testimonial from ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        setToast('Testimonial removed.');
        fetchTestimonials();
      } else {
        alert('Failed to delete testimonial');
      }
    } catch {
      alert('Error deleting testimonial');
    }
  };

  // --- SUBSCRIBER HANDLERS ---
  const deleteSubscriber = async (id: number, email: string) => {
    if (!confirm(`Remove ${email} from subscribers list?`)) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      if (res.ok) {
        setToast('Subscriber removed.');
        fetchSubscribers();
      } else {
        alert('Failed to delete subscriber');
      }
    } catch {
      alert('Error deleting subscriber');
    }
  };

  // --- FILTER ITEMS ---
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = 
      artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'featured') return artist.isFeatured && matchesSearch;
    if (activeTab === 'trending') return artist.isTrending && matchesSearch;
    if (activeTab === 'exclusive') return artist.isExclusive && matchesSearch;
    return matchesSearch;
  });

  const filteredTestimonials = testimonials.filter(testi => 
    testi.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testi.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testi.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        {/* Scoped styles override */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .login-container {
            min-height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 99999;
            background: #050507;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
          }

          .login-card {
            background: #0c0c0e;
            border-radius: 16px;
            padding: 48px 40px 40px 40px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 
                        0 0 40px rgba(201, 168, 76, 0.04);
            border: 1.5px solid rgba(201, 168, 76, 0.25);
            text-align: center;
          }

          .login-brand-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 8px;
          }

          .login-logo-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .login-title-text {
            font-size: 2.3rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            line-height: 1.1;
            background: linear-gradient(135deg, #f5e9c8 0%, #c9a84c 50%, #b38f36 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .login-title-subtext {
            font-size: 2.3rem;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.03em;
            line-height: 1.1;
            margin-top: 4px;
          }

          .login-subtitle {
            color: #a0aec0;
            font-size: 0.95rem;
            margin-top: 14px;
            margin-bottom: 34px;
            font-weight: 400;
          }

          .login-form-group {
            margin-bottom: 20px;
            text-align: left;
          }

          .login-label {
            display: block;
            font-size: 0.88rem;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 8px;
          }

          .login-input {
            width: 100%;
            padding: 13px 16px;
            border: 1.5px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            font-size: 0.95rem;
            color: #ffffff;
            background: #141417;
            outline: none;
            transition: all 0.2s ease-in-out;
            font-family: inherit;
          }

          .login-input::placeholder {
            color: #4b5563;
            font-weight: 400;
          }

          .login-input:focus {
            border-color: #c9a84c;
            box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.18);
          }

          .login-options {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-top: 16px;
            margin-bottom: 26px;
          }

          .login-remember {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.92rem;
            color: #a0aec0;
            cursor: pointer;
            user-select: none;
          }

          .login-checkbox {
            width: 18px;
            height: 18px;
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            border-radius: 4px;
            accent-color: #c9a84c;
            cursor: pointer;
          }

          .login-btn {
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 50%, #b38f36 100%);
            color: #050507;
            border: none;
            border-radius: 8px;
            font-size: 0.98rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            font-family: inherit;
          }

          .login-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #f5e9c8 0%, #e8c97a 50%, #c9a84c 100%);
            box-shadow: 0 0 15px rgba(201, 168, 76, 0.3);
          }

          .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .login-footer-links {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
          }

          .login-forgot {
            font-size: 0.92rem;
            color: #a0aec0;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
          }

          .login-forgot:hover {
            color: #e8c97a;
          }

          .login-error {
            color: #e53e3e;
            font-size: 0.88rem;
            margin-bottom: 16px;
            text-align: left;
            font-weight: 500;
          }
        `}</style>

        <div className="login-card">
          <div className="login-brand-group" style={{ marginBottom: '20px' }}>
            <LogoSVG height="110px" />
          </div>
          
          <p className="login-subtitle">Please enter your user information.</p>

          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label className="login-label">Username or email</label>
              <input 
                className="login-input"
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                placeholder="Username" 
                autoComplete="username" 
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <input 
                className="login-input"
                type="password" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                required 
                placeholder="•••••••" 
                autoComplete="current-password" 
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="login-options">
              <label className="login-remember">
                <input 
                  type="checkbox" 
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '30px', textAlign: 'center', opacity: 0.6 }}>
            <a 
              href="https://www.cypherswift.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontSize: '0.7rem',
                color: '#888',
                textDecoration: 'none',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#e8c97a'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
            >
              Cypher Swift InfoTech
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Helper title based on active tab
  const getTabTitle = () => {
    switch(activeTab) {
      case 'all': return 'All Artists Database';
      case 'featured': return 'Featured Artists Listing';
      case 'trending': return 'Trendingcollage Selection';
      case 'exclusive': return 'Exclusive Premium Artists';
      case 'testimonials': return 'Customer Testimonials';
      case 'subscribers': return 'Newsletter Subscribers';
      case 'seo': return 'SEO & Sitemap Settings';
      default: return 'Admin Panel';
    }
  };

  const getTabSubtitle = () => {
    switch(activeTab) {
      case 'all': return 'Directly view and edit all active and inactive artists inside the website.';
      case 'featured': return 'These artists are featured inside the listings pages on the frontend.';
      case 'trending': return 'Artists configured to cycle in the homepage neon-glow trending collage grid.';
      case 'exclusive': return 'Exclusive stars displayed inside the premium flip-book container on the homepage.';
      case 'testimonials': return 'Add, edit, or disable client reviews displayed in the homepage slider.';
      case 'subscribers': return 'People who subscribed to receive email notifications when a new artist is added.';
      case 'seo': return 'Manage page titles, meta descriptions, canonical URLs, and JSON-LD schema for each site page.';
      default: return 'ArtistVibes Portal control center';
    }
  };

  return (
    <div className="admin-shell">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-row" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '16px 0' }}>
            <LogoSVG height="90px" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main Directory</span>
          <button 
            onClick={() => { setActiveTab('all'); setMobileMenuOpen(false); }} 
            className={`sidebar-item ${activeTab === 'all' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaThLarge /></span>
            All Artists
            <span className="item-count">{artists.length}</span>
          </button>

          <span className="sidebar-section-label">Homepage Sections</span>
          <button 
            onClick={() => { setActiveTab('featured'); setMobileMenuOpen(false); }} 
            className={`sidebar-item ${activeTab === 'featured' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaStar /></span>
            Featured
            <span className="item-count">{artists.filter(a => a.isFeatured).length}</span>
          </button>
          <button 
            onClick={() => { setActiveTab('trending'); setMobileMenuOpen(false); }} 
            className={`sidebar-item ${activeTab === 'trending' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaFire /></span>
            Trending Collage
            <span className="item-count">{artists.filter(a => a.isTrending).length}</span>
          </button>
          <button 
            onClick={() => { setActiveTab('exclusive'); setMobileMenuOpen(false); }} 
            className={`sidebar-item ${activeTab === 'exclusive' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaCrown /></span>
            Exclusive Book
            <span className="item-count">{artists.filter(a => a.isExclusive).length}</span>
          </button>

          <span className="sidebar-section-label">Social & Marketing</span>
          <button 
            onClick={() => { setActiveTab('testimonials'); setMobileMenuOpen(false); }} 
            className={`sidebar-item ${activeTab === 'testimonials' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaQuoteLeft /></span>
            Testimonials
            <span className="item-count">{testimonials.length}</span>
          </button>
          <button 
            onClick={() => { setActiveTab('subscribers'); setMobileMenuOpen(false); }} 
            className={`sidebar-item ${activeTab === 'subscribers' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaEnvelope /></span>
            Subscribers List
            <span className="item-count">{subscribers.length}</span>
          </button>

          <span className="sidebar-section-label">Site Configuration</span>
          <button 
            onClick={() => { setActiveTab('seo'); setMobileMenuOpen(false); fetchSeoPages(); }} 
            className={`sidebar-item ${activeTab === 'seo' ? 'active' : ''}`}
          >
            <span className="item-icon"><FaSitemap /></span>
            SEO / Sitemap
            <span className="item-count">{seoPages.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ padding: '0 16px 12px', fontSize: '0.8rem', color: '#555' }}>
            Logged in: <strong style={{ color: '#888' }}>{username || 'Administrator'}</strong>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            <FaSignOutAlt /> Log Out Portal
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="admin-main">
        {/* Topbar Row */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="mobile-menu-btn"
                aria-label="Toggle menu"
              >
                ☰
              </button>
              <h1>{getTabTitle()}</h1>
            </div>
            <p>{getTabSubtitle()}</p>
          </div>

          <div className="topbar-right">
            <div className="topbar-search">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search name, category, city..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {!['subscribers', 'seo'].includes(activeTab) && (
              <button 
                onClick={activeTab === 'testimonials' ? openNewTestimonialModal : openNewArtistModal} 
                className="add-btn"
              >
                <FaPlus /> {activeTab === 'testimonials' ? 'Add Testimonial' : 'Add Artist'}
              </button>
            )}
          </div>
        </header>

        {/* Quick Stats Grid */}
        <section className="stats-row">
          <div className="stat-card" style={{ '--stat-accent': '#c9a84c' } as any}>
            <div className="stat-icon" style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}><FaUsers /></div>
            <div className="stat-value">{artists.length}</div>
            <div className="stat-label">Total Artists</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#a78bfa' } as any}>
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}><FaStar /></div>
            <div className="stat-value">{artists.filter(a => a.isFeatured).length}</div>
            <div className="stat-label">Featured</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#fb923c' } as any}>
            <div className="stat-icon" style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}><FaFire /></div>
            <div className="stat-value">{artists.filter(a => a.isTrending).length}</div>
            <div className="stat-label">Trending</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#e8c97a' } as any}>
            <div className="stat-icon" style={{ background: 'rgba(232,201,122,0.1)', color: '#e8c97a' }}><FaCrown /></div>
            <div className="stat-value">{artists.filter(a => a.isExclusive).length}</div>
            <div className="stat-label">Exclusive</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#22c55e' } as any}>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}><FaEnvelope /></div>
            <div className="stat-value">{subscribers.length}</div>
            <div className="stat-label">Subscribers</div>
          </div>
        </section>

        {/* Content Panel Area */}
        <div className="content-panel">
          {/* Artists Listings */}
          {['all', 'featured', 'trending', 'exclusive'].includes(activeTab) && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Artist Details</th>
                    <th>Category</th>
                    <th>Location / City</th>
                    <th>Starting Price</th>
                    <th>Rating & Shows</th>
                    <th>Home Display flags</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArtists.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <div className="empty-icon">🎤</div>
                          <div className="empty-title">No Artists Found</div>
                          <div className="empty-desc">Try modifying your search query or add a new artist using the gold button above.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredArtists.map((artist) => (
                      <tr key={artist.id}>
                        <td>
                          <div className="artist-cell">
                            {artist.imageUrl ? (
                              <img src={artist.imageUrl} alt={artist.name} className="artist-avatar" />
                            ) : (
                              <div className="artist-avatar-placeholder">🎤</div>
                            )}
                            <div>
                              <div className="artist-name">{artist.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>Order Priority: {artist.order || 0}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#ccc', fontWeight: 500 }}>{artist.category}</span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaGlobe style={{ fontSize: '0.75rem', color: '#555' }} /> {artist.location || 'Mumbai'}</span>
                        </td>
                        <td>
                          <span style={{ color: '#e8c97a', fontWeight: 600 }}>{artist.price || 'On Request'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600 }}>
                              <FaStar /> {artist.rating || '4.5'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#555' }}>
                              {artist.eventsCount || 0} Events
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="badge-group">
                            {artist.isActive ? (
                              <span className="status-pill status-active">Active</span>
                            ) : (
                              <span className="status-pill status-inactive">Inactive</span>
                            )}
                            {artist.isFeatured && <span className="status-pill status-featured"><FaStar /> Featured</span>}
                            {artist.isTrending && <span className="status-pill status-trending"><FaFire /> Trending</span>}
                            {artist.isExclusive && <span className="status-pill status-exclusive"><FaCrown /> Exclusive</span>}
                          </div>
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              onClick={() => openEditArtistModal(artist)} 
                              className="action-btn action-edit"
                              title="Edit Artist Details"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button 
                              onClick={() => deleteArtist(artist.id, artist.name)} 
                              className="action-btn action-delete"
                              title="Remove Artist"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Testimonials Listing */}
          {activeTab === 'testimonials' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Reviewer</th>
                    <th>Company / Role</th>
                    <th style={{ width: '40%' }}>Review Content</th>
                    <th>Rating</th>
                    <th>Display Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestimonials.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-icon"><FaQuoteLeft /></div>
                          <div className="empty-title">No Reviews Found</div>
                          <div className="empty-desc">Create client reviews to display them on the homepage.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTestimonials.map((testi) => (
                      <tr key={testi.id}>
                        <td>
                          <div className="artist-cell">
                            {testi.imageUrl ? (
                              <img src={testi.imageUrl} alt={testi.name} className="artist-avatar" style={{ borderRadius: '50%' }} />
                            ) : (
                              <div className="artist-avatar-placeholder" style={{ borderRadius: '50%' }}>👤</div>
                            )}
                            <span className="artist-name">{testi.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#888' }}>{testi.role || '-'}</span>
                        </td>
                        <td>
                          <span style={{ fontStyle: 'italic', color: '#bbb', fontSize: '0.82rem' }}>"{testi.content}"</span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c9a84c', fontWeight: 600 }}>
                            <FaStar /> {testi.rating || '5'}
                          </span>
                        </td>
                        <td>
                          {testi.isActive ? (
                            <span className="status-pill status-active">Visible</span>
                          ) : (
                            <span className="status-pill status-inactive">Hidden</span>
                          )}
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              onClick={() => openEditTestimonialModal(testi)} 
                              className="action-btn action-edit"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button 
                              onClick={() => deleteTestimonial(testi.id, testi.name)} 
                              className="action-btn action-delete"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SEO / Sitemap */}
          {activeTab === 'seo' && (
            <div className="seo-admin-layout">
              <div className="seo-page-list">
                <h3 className="seo-section-title">Site Pages</h3>
                <p className="seo-section-desc">Select a page to edit its SEO title, description, canonical URL, and schema markup.</p>
                <div className="seo-page-cards">
                  {seoPages.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaSitemap /></div>
                      <div className="empty-title">No SEO Pages Found</div>
                      <div className="empty-desc">Default pages will be created automatically when you open this tab.</div>
                    </div>
                  ) : (
                    seoPages.map((page) => (
                      <button
                        key={page.slug}
                        type="button"
                        onClick={() => openSeoEditor(page)}
                        className={`seo-page-card ${selectedSeoSlug === page.slug ? 'active' : ''}`}
                      >
                        <div className="seo-page-card-label">{page.label}</div>
                        <div className="seo-page-card-path">{page.path}</div>
                        <div className="seo-page-card-title">{page.pageTitle || 'No title set'}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedSeoSlug && (
                <div className="seo-editor-panel">
                  <button
                    type="button"
                    className="seo-panel-toggle"
                    onClick={() => setSeoPanelOpen(!seoPanelOpen)}
                  >
                    <span>SEO Settings — {seoForm.label}</span>
                    {seoPanelOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {seoPanelOpen && (
                    <form onSubmit={saveSeoPage} className="adm-form-grid seo-form">
                      <div className="adm-form-group full-width">
                        <label className="adm-form-label">Page Title (Meta Title)</label>
                        <input
                          name="pageTitle"
                          type="text"
                          className="adm-form-input"
                          value={seoForm.pageTitle}
                          onChange={handleSeoFormChange}
                          placeholder="e.g. Book Artists | Artistvibes Entertainment"
                        />
                      </div>

                      <div className="adm-form-group full-width">
                        <label className="adm-form-label">Meta Keyword</label>
                        <input
                          name="metaKeywords"
                          type="text"
                          className="adm-form-input"
                          value={seoForm.metaKeywords}
                          onChange={handleSeoFormChange}
                          placeholder="Comma-separated keywords"
                        />
                      </div>

                      <div className="adm-form-group full-width">
                        <label className="adm-form-label">Meta Description <span style={{ color: '#ef4444' }}>*</span></label>
                        <textarea
                          name="metaDescription"
                          className="adm-form-input"
                          rows={4}
                          value={seoForm.metaDescription}
                          onChange={handleSeoFormChange}
                          placeholder="Brief description shown in search engine results..."
                          required
                        />
                      </div>

                      <div className="adm-form-group full-width">
                        <label className="adm-form-label">Canonical URL</label>
                        <input
                          name="canonicalUrl"
                          type="url"
                          className="adm-form-input"
                          value={seoForm.canonicalUrl}
                          onChange={handleSeoFormChange}
                          placeholder="https://www.artistvibes.in/about"
                        />
                        <span className="adm-form-hint">The primary URL search engines should index for this page.</span>
                      </div>

                      <div className="adm-form-group full-width">
                        <label className="adm-form-label">Schema (JSON)</label>
                        <textarea
                          name="schemaJson"
                          className="adm-form-input"
                          rows={10}
                          value={seoForm.schemaJson}
                          onChange={handleSeoFormChange}
                          placeholder='Paste JSON-LD schema markup here, e.g. {"@context":"https://schema.org","@type":"LocalBusiness",...}'
                          style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="adm-form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="submit" className="add-btn" disabled={savingSeo}>
                          <FaSave /> {savingSeo ? 'Saving...' : 'Save SEO Settings'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Newsletter Subscribers Listing */}
          {activeTab === 'subscribers' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>No.</th>
                    <th>Email Address</th>
                    <th>Subscription Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state">
                          <div className="empty-icon"><FaEnvelope /></div>
                          <div className="empty-title">No Subscribers Yet</div>
                          <div className="empty-desc">When users sign up for updates on the website, they will appear here.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, index) => (
                      <tr key={sub.id}>
                        <td>
                          <span style={{ color: '#555', fontWeight: 600 }}>{index + 1}</span>
                        </td>
                        <td>
                          <span className="artist-name" style={{ color: '#e8c97a' }}>{sub.email}</span>
                        </td>
                        <td>
                          <span style={{ color: '#888' }}>
                            {new Date(sub.createdAt).toLocaleDateString()} at {new Date(sub.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              onClick={() => deleteSubscriber(sub.id, sub.email)} 
                              className="action-btn action-delete"
                            >
                              <FaTrash /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* --- ADD/EDIT ARTIST MODAL --- */}
      {showArtistModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Edit Artist Details' : 'Add New Artist to Website'}</h2>
              <button onClick={() => setShowArtistModal(false)} className="admin-modal-close">✕</button>
            </div>
            
            <form onSubmit={saveArtist} className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-form-label">Full Name *</label>
                <input 
                  name="name" 
                  type="text"
                  className="adm-form-input" 
                  value={artistForm.name} 
                  onChange={handleArtistFormChange} 
                  placeholder="e.g. Darshan Raval" 
                  required 
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Category *</label>
                <select 
                  name="category" 
                  className="adm-form-input" 
                  value={artistForm.category} 
                  onChange={handleArtistFormChange} 
                  required
                >
                  <option value="DJ">DJ</option>
                  <option value="Singer">Singer</option>
                  <option value="Dancer">Dancer</option>
                  <option value="Comedian">Comedian</option>
                  <option value="Band">Band</option>
                  <option value="Anchor">Anchor</option>
                  <option value="Musician">Musician</option>
                  <option value="Magician">Magician</option>
                  <option value="Stand-up Comic">Stand-up Comic</option>
                </select>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Location / City</label>
                <input 
                  name="location" 
                  type="text"
                  className="adm-form-input" 
                  value={artistForm.location} 
                  onChange={handleArtistFormChange} 
                  placeholder="e.g. Mumbai" 
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Starting Price</label>
                <input 
                  name="price" 
                  type="text"
                  className="adm-form-input" 
                  value={artistForm.price} 
                  onChange={handleArtistFormChange} 
                  placeholder="e.g. ₹50,000 onwards" 
                />
                <span className="adm-form-hint">Tip: Use "On Request" if pricing varies.</span>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Star Rating (1.0 to 5.0)</label>
                <input 
                  name="rating" 
                  type="number" 
                  step="0.1" 
                  min="1" 
                  max="5" 
                  className="adm-form-input" 
                  value={artistForm.rating} 
                  onChange={handleArtistFormChange} 
                  placeholder="4.5"
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Events / Shows Handled</label>
                <input 
                  name="eventsCount" 
                  type="number" 
                  className="adm-form-input" 
                  value={artistForm.eventsCount} 
                  onChange={handleArtistFormChange} 
                  placeholder="e.g. 150" 
                />
              </div>

              <div className="adm-form-group full-width">
                <label className="adm-form-label">Short Biography / Description</label>
                <textarea 
                  name="bio" 
                  className="adm-form-input" 
                  rows={3} 
                  value={artistForm.bio} 
                  onChange={handleArtistFormChange} 
                  placeholder="Brief description about the artist's style, experience, and prominent performances..."
                />
              </div>

              <div className="adm-form-group full-width">
                <label className="adm-form-label">Upload Photo (Cloudinary)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="adm-form-input" 
                  onChange={(e) => handleImageUpload(e, 'artist')}
                  style={{ padding: '10px' }}
                />
                {uploadingImage && <div style={{ color: '#c9a84c', marginTop: '8px', fontSize: '0.9rem' }}>Uploading to Cloudinary...</div>}
                <div style={{ margin: '12px 0', textAlign: 'center', color: '#888' }}>OR</div>
                <label className="adm-form-label">Photo Link (URL)</label>
                <input 
                  name="imageUrl" 
                  type="text"
                  className="adm-form-input" 
                  value={artistForm.imageUrl} 
                  onChange={handleArtistFormChange} 
                  placeholder="https://images.unsplash.com/photo-..." 
                />
                {artistForm.imageUrl && (
                  <img src={artistForm.imageUrl} alt="Preview" className="img-preview" />
                )}
              </div>

              <div className="adm-form-group full-width">
                <label className="adm-form-label">YouTube Video Link (Optional)</label>
                <input 
                  name="videoUrl" 
                  type="text"
                  className="adm-form-input" 
                  value={artistForm.videoUrl} 
                  onChange={handleArtistFormChange} 
                  placeholder="e.g. https://www.youtube.com/watch?v=..." 
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Display Order Index</label>
                <input 
                  name="order" 
                  type="number" 
                  className="adm-form-input" 
                  value={artistForm.order} 
                  onChange={handleArtistFormChange} 
                  placeholder="0" 
                />
                <span className="adm-form-hint">Note: Lower numbers display first on the site.</span>
              </div>

              {/* Toggle flags switches */}
              <div className="adm-toggles">
                <div className="adm-toggle-row">
                  <div className="adm-toggle-label">
                    <span className="toggle-icon" style={{ color: '#22c55e' }}>●</span>
                    Active Status (Visible on site)
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="isActive" 
                      checked={artistForm.isActive} 
                      onChange={handleArtistFormChange} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="adm-toggle-row">
                  <div className="adm-toggle-label">
                    <span className="toggle-icon" style={{ color: '#a78bfa' }}><FaStar /></span>
                    Featured Artist
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="isFeatured" 
                      checked={artistForm.isFeatured} 
                      onChange={handleArtistFormChange} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="adm-toggle-row">
                  <div className="adm-toggle-label">
                    <span className="toggle-icon" style={{ color: '#fb923c' }}><FaFire /></span>
                    Trending Section Collage
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="isTrending" 
                      checked={artistForm.isTrending} 
                      onChange={handleArtistFormChange} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="adm-toggle-row">
                  <div className="adm-toggle-label">
                    <span className="toggle-icon" style={{ color: '#e8c97a' }}><FaCrown /></span>
                    Exclusive Flip Book
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="isExclusive" 
                      checked={artistForm.isExclusive} 
                      onChange={handleArtistFormChange} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="adm-form-footer">
                <button type="button" onClick={() => setShowArtistModal(false)} className="adm-btn-cancel">Cancel</button>
                <button type="submit" className="adm-btn-save" disabled={loading}>
                  {loading ? 'Saving Changes...' : 'Save Artist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT TESTIMONIAL MODAL --- */}
      {showTestimonialModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Edit Client Review' : 'Create Customer Review'}</h2>
              <button onClick={() => setShowTestimonialModal(false)} className="admin-modal-close">✕</button>
            </div>
            
            <form onSubmit={saveTestimonial} className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-form-label">Client / Reviewer Name *</label>
                <input 
                  name="name" 
                  type="text"
                  className="adm-form-input" 
                  value={testimonialForm.name} 
                  onChange={handleTestiFormChange} 
                  placeholder="e.g. Ramesh Patel" 
                  required 
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Role / Organization</label>
                <input 
                  name="role" 
                  type="text"
                  className="adm-form-input" 
                  value={testimonialForm.role} 
                  onChange={handleTestiFormChange} 
                  placeholder="e.g. Event Planner, Wedding Couple" 
                />
              </div>

              <div className="adm-form-group full-width">
                <label className="adm-form-label">Testimonial Content *</label>
                <textarea 
                  name="content" 
                  className="adm-form-input" 
                  rows={4} 
                  value={testimonialForm.content} 
                  onChange={handleTestiFormChange} 
                  placeholder="Write the feedback message here..."
                  required
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Rating Stars (1 to 5)</label>
                <select 
                  name="rating" 
                  className="adm-form-input" 
                  value={testimonialForm.rating} 
                  onChange={handleTestiFormChange}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                  <option value="3">⭐⭐⭐ (3 Stars)</option>
                  <option value="2">⭐⭐ (2 Stars)</option>
                  <option value="1">⭐ (1 Star)</option>
                </select>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Upload Avatar (Cloudinary)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="adm-form-input" 
                  onChange={(e) => handleImageUpload(e, 'testimonial')}
                  style={{ padding: '10px' }}
                />
                {uploadingImage && <div style={{ color: '#c9a84c', marginTop: '8px', fontSize: '0.9rem' }}>Uploading to Cloudinary...</div>}
                
                <label className="adm-form-label" style={{ marginTop: '12px' }}>OR Avatar URL</label>
                <input 
                  name="imageUrl" 
                  type="text"
                  className="adm-form-input" 
                  value={testimonialForm.imageUrl} 
                  onChange={handleTestiFormChange} 
                  placeholder="https://..." 
                />
                {testimonialForm.imageUrl && (
                  <img src={testimonialForm.imageUrl} alt="Preview" className="img-preview" style={{ marginTop: '10px', maxHeight: '100px' }} />
                )}
              </div>

              <div className="adm-toggles">
                <div className="adm-toggle-row">
                  <div className="adm-toggle-label">
                    <span className="toggle-icon" style={{ color: '#22c55e' }}>●</span>
                    Show feedback on homepage slider
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="isActive" 
                      checked={testimonialForm.isActive} 
                      onChange={handleTestiFormChange} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="adm-form-footer">
                <button type="button" onClick={() => setShowTestimonialModal(false)} className="adm-btn-cancel">Cancel</button>
                <button type="submit" className="adm-btn-save" disabled={loading}>
                  {loading ? 'Saving Review...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Toast Notifications */}
      {toast && (
        <div className="admin-toast">
          {toast}
        </div>
      )}
    </div>
  );
}
