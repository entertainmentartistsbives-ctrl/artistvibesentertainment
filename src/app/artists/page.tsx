'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaStar, FaRedo, FaFire, FaCrown, FaUsers, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { BsStarFill } from 'react-icons/bs';
import BookingModal from '@/components/BookingModal/BookingModal';
import ArtistDetailsModal from '@/components/ArtistDetailsModal/ArtistDetailsModal';
import IntentSection from '@/components/IntentSection/IntentSection';
import s from './artists.module.css';

interface Artist {
  id:number; name:string; category:string; location:string; bio:string;
  price:string; imageUrl:string; isExclusive:boolean; isFeatured:boolean;
  isTrending:boolean; isActive:boolean; rating:number; eventsCount:number; videoUrl?:string;
}
type RowType = 'trending'|'exclusive'|'featured';
type SectionType = 'ALL'|RowType;
interface RowState { data:Artist[]; loading:boolean; error:string|null; }

const CATEGORIES = [
  { label: 'ALL',          icon: '🎭' },
  { label: 'DJ',           icon: '🎧' },
  { label: 'SINGER',       icon: '🎤' },
  { label: 'DANCER',       icon: '💃' },
  { label: 'COMEDIAN',     icon: '😂' },
  { label: 'BAND',         icon: '🎸' },
  { label: 'ANCHOR',       icon: '🎙️' },
  { label: 'MUSICIAN',     icon: '🎹' },
  { label: 'MAGICIAN',     icon: '🪄' },
  { label: 'STAND-UP',     icon: '🎭' },
];
const SECTION_TABS:{id:SectionType;label:string;icon:React.ReactNode;color:string}[] = [
  {id:'ALL',      label:'All Artists', icon:<FaUsers />,   color:'#ffffff'},
  {id:'trending', label:'Trending',    icon:<FaFire />,    color:'#ff6b35'},
  {id:'exclusive',label:'Exclusive',   icon:<FaCrown />,   color:'#d4a843'},
  {id:'featured', label:'Featured',    icon:<BsStarFill />,color:'#a78bfa'},
];
const ROW_CONFIG = [
  {type:'trending'  as RowType, tag:'TRENDING',  title:'Trending Artists',  subtitle:"The most sought-after performers making waves across India's live event scene."},
  {type:'exclusive' as RowType, tag:'EXCLUSIVE', title:'Exclusive Elite',   subtitle:'Premium artists managed exclusively by ArtistVibes Entertainment.'},
  {type:'featured'  as RowType, tag:'FEATURED',  title:'Featured Picks',    subtitle:'Our hand-picked selection of top-tier talent for your high-profile celebrations.'},
];

function initials(n:string){return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();}

// Cloudinary face-detection transform: auto-crops to the face in any photo
function getSmartImageUrl(url:string, w=600, h=750):string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Insert face-detection crop transformation between /upload/ and the version/filename
  return url.replace('/upload/', `/upload/c_fill,g_face,w_${w},h_${h},q_auto,f_auto/`);
}
function price(p:string|null|undefined){
  if(!p||p.trim()===''||p==='On Request') return 'On Request';
  const n=parseInt(p.replace(/[^0-9]/g,''));
  return !isNaN(n)&&n>0?`From ₹${n.toLocaleString('en-IN')}`:p;
}

/* ── TRENDING: collage of 5 images with auto-cycling ── */
function TrendingCollage({artists,onView,onBook,loading,error,onRetry}:{
  artists:Artist[];loading:boolean;error:string|null;onRetry:()=>void;
  onView:(a:Artist)=>void;onBook:(a:Artist)=>void;
}){
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (artists.length === 0) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % artists.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [artists.length]);

  if(loading) return <div style={{textAlign:'center',padding:'3rem',color:'rgba(255,255,255,0.3)'}}>Loading...</div>;
  if(error) return <div className="discovery-row__error"><p>⚠️ {error}</p><button className="discovery-btn discovery-btn--retry" onClick={onRetry}><FaRedo/> Retry</button></div>;
  if(!artists.length) return <div className="discovery-row__empty">No trending artists found.</div>;

  const displayArtists: Artist[] = [];
  for (let i = 0; i < 5; i++) {
    if (artists.length > 0) {
      displayArtists.push(artists[(startIndex + i) % artists.length]);
    }
  }
  const positions = [s.collageTL, s.collageTR, s.collageCenter, s.collageBL, s.collageBR];
  return (
    <div className={s.trendingWrap}>
      <div className={s.exclHeading}>
        <div className={s.exclHeadingLine}/>
        <div className={s.exclHeadingText}>
          <span className={s.exclHeadingPill}><FaFire style={{fontSize:8}}/> Trending Now</span>
          <h2 className={s.exclHeadingTitle}>Trending <span>Artists</span></h2>
        </div>
        <div className={s.exclHeadingLine}/>
      </div>
      <div className={s.collageGrid}>
        {displayArtists.map((a,i)=>{
          const hasImg = a.imageUrl&&!a.imageUrl.startsWith('/images/');
          return (
            <div key={i} className={positions[i]||s.collageTL}>
              <div className={s.collageFrame}>
                {hasImg
                  ? <img key={a.id} src={getSmartImageUrl(a.imageUrl,400,500)} alt={a.name} loading="lazy" className={s.collageFadeImg}/>
                  : <div className={s.collagePlaceholder}>{initials(a.name)}</div>}
                
                {/* Category pill top-left - always visible */}
                <span className={s.collageCatPill}>{a.category}</span>

                <div className={s.collageOverlay}>
                  <div className={s.collageName}>{a.name}</div>
                  <div className={s.collageBtns}>
                    <button className={s.collageBtnView} onClick={()=>onView(a)}>View</button>
                    <button className={s.collageBtnBook} onClick={()=>onBook(a)}>Book Now</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── TRENDING: 3-column Grid Gallery ── */
function TrendingGrid({artists,onView,onBook,loading,error,onRetry}:{
  artists:Artist[];loading:boolean;error:string|null;onRetry:()=>void;
  onView:(a:Artist)=>void;onBook:(a:Artist)=>void;
}){
  const INITIAL_COUNT = 6; 
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  
  const handleToggleView = () => {
    if (visibleCount >= artists.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount(visibleCount + 6);
    }
  };

  if(loading) return <div style={{textAlign:'center',padding:'3rem',color:'rgba(255,255,255,0.3)'}}>Loading...</div>;
  if(error) return <div className="discovery-row__error"><p>⚠️ {error}</p><button className="discovery-btn discovery-btn--retry" onClick={onRetry}><FaRedo/> Retry</button></div>;
  if(!artists.length) return <div className="discovery-row__empty">No trending artists found.</div>;

  const displayedItems = artists.slice(0, visibleCount);

  return (
    <div className={s.sectionContainer}>
      <div className={s.exclHeading}>
        <div className={s.exclHeadingLine}/>
        <div className={s.exclHeadingText}>
          <span className={s.exclHeadingPill}><FaFire style={{fontSize:8}}/> Trending Now</span>
          <h2 className={s.exclHeadingTitle}>Trending <span>Artists</span></h2>
        </div>
        <div className={s.exclHeadingLine}/>
      </div>

      {/* 3-Column Grid */}
      <div className={s.gridContainer}>
        {displayedItems.map((item, index) => {
          const hasImg = item.imageUrl && !item.imageUrl.startsWith('/images/');
          return (
            <div key={item.id || index} className={s.card}>
              
              {/* Top Image Section */}
              <div className={s.imageWrapper}>
                {hasImg ? (
                  <img src={getSmartImageUrl(item.imageUrl,600,750)} alt={item.name} className={s.image} loading="lazy" />
                ) : (
                  <div className={s.imagePlaceholder}>{initials(item.name)}</div>
                )}
                
                {/* Floating Badges */}
                <div className={s.topBadges}>
                  <span className={s.categoryBadge}>{item.category}</span>
                  <span className={s.ratingBadge}>★ {item.rating}.0</span>
                </div>
                
                {/* Fade out overlay */}
                <div className={s.imageOverlay}></div>
              </div>
              
              {/* Bottom Content Section */}
              <div className={s.cardContent}>
                <h3 className={s.itemName}>{item.name}</h3>
                <p className={s.itemLocation}><FaMapMarkerAlt style={{display:'inline',marginRight:4,color:'#d4a843'}}/> {item.location}</p>
                
                <div className={s.priceRow}>
                  <span className={s.priceLabel}>FROM</span>
                  <span className={s.priceValue}>{price(item.price)}</span>
                </div>

                {/* Action Buttons */}
                <div className={s.cardActions}>
                  <button className={s.btnOutline} onClick={() => onView(item)}>VIEW PROFILE</button>
                  <button className={s.btnSolid} onClick={() => onBook(item)}>BOOK NOW</button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {artists.length > INITIAL_COUNT && (
        <div className={s.buttonContainer}>
          <button onClick={handleToggleView} className={s.toggleButton}>
            {visibleCount >= artists.length ? 'SHOW LESS' : 'SHOW MORE'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── EXCLUSIVE: 3-column Grid Gallery ── */
function ExclusiveGrid({artists,onView,onBook,loading,error,onRetry}:{
  artists:Artist[];loading:boolean;error:string|null;onRetry:()=>void;
  onView:(a:Artist)=>void;onBook:(a:Artist)=>void;
}){
  const INITIAL_COUNT = 6; 
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  
  const handleToggleView = () => {
    if (visibleCount >= artists.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount(visibleCount + 6);
    }
  };

  if(loading) return <div style={{textAlign:'center',padding:'3rem',color:'rgba(255,255,255,0.3)'}}>Loading...</div>;
  if(error) return <div className="discovery-row__error"><p>⚠️ {error}</p><button className="discovery-btn discovery-btn--retry" onClick={onRetry}><FaRedo/> Retry</button></div>;
  if(!artists.length) return <div className="discovery-row__empty">No exclusive artists found.</div>;

  const displayedItems = artists.slice(0, visibleCount);

  return (
    <div className={s.sectionContainer}>
      <div className={s.exclHeading}>
        <div className={s.exclHeadingLine}/>
        <div className={s.exclHeadingText}>
          <span className={s.exclHeadingPill}><FaCrown style={{fontSize:8}}/> Exclusive Elite</span>
          <h2 className={s.exclHeadingTitle}>Premium <span>Artists</span></h2>
        </div>
        <div className={s.exclHeadingLine}/>
      </div>

      {/* 3-Column Grid */}
      <div className={s.gridContainer}>
        {displayedItems.map((item, index) => {
          const hasImg = item.imageUrl && !item.imageUrl.startsWith('/images/');
          return (
            <div key={item.id || index} className={s.card}>
              
              {/* Top Image Section */}
              <div className={s.imageWrapper}>
                {hasImg ? (
                  <img src={getSmartImageUrl(item.imageUrl,600,750)} alt={item.name} className={s.image} loading="lazy" />
                ) : (
                  <div className={s.imagePlaceholder}>{initials(item.name)}</div>
                )}
                
                {/* Floating Badges */}
                <div className={s.topBadges}>
                  <span className={s.categoryBadge}>{item.category}</span>
                  <span className={s.ratingBadge}>★ {item.rating}.0</span>
                </div>
                
                {/* Fade out overlay */}
                <div className={s.imageOverlay}></div>
              </div>
              
              {/* Bottom Content Section */}
              <div className={s.cardContent}>
                <h3 className={s.itemName}>{item.name}</h3>
                <p className={s.itemLocation}><FaMapMarkerAlt style={{display:'inline',marginRight:4,color:'#d4a843'}}/> {item.location}</p>
                
                <div className={s.priceRow}>
                  <span className={s.priceLabel}>FROM</span>
                  <span className={s.priceValue}>{price(item.price)}</span>
                </div>

                {/* Action Buttons */}
                <div className={s.cardActions}>
                  <button className={s.btnOutline} onClick={() => onView(item)}>VIEW PROFILE</button>
                  <button className={s.btnSolid} onClick={() => onBook(item)}>BOOK NOW</button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {artists.length > INITIAL_COUNT && (
        <div className={s.buttonContainer}>
          <button onClick={handleToggleView} className={s.toggleButton}>
            {visibleCount >= artists.length ? 'SHOW LESS' : 'SHOW MORE'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── EXCLUSIVE: premium book flip ── */
function ExclusiveLayout({artists,onView,onBook,loading,error,onRetry,hideDots}:{
  artists:Artist[];loading:boolean;error:string|null;onRetry:()=>void;
  onView:(a:Artist)=>void;onBook:(a:Artist)=>void;hideDots?:boolean;
}){
  const [cur,setCur]=useState(0);
  const [visible,setVisible]=useState(true);
  const [animKey,setAnimKey]=useState(0);
  const total=artists.length;

  useEffect(() => {
    setCur(0);
  }, [artists]);

  const navigate=(dir:'next'|'prev')=>{
    setVisible(false);
    setAnimKey(k=>k+1);
    setTimeout(()=>{ setCur(c=>dir==='next'?(c+1)%total:(c-1+total)%total); setVisible(true); },220);
  };

  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setAnimKey(k=>k+1);
      setTimeout(()=>{ setCur(c=>(c+1)%total); setVisible(true); },220);
    }, 4000);
    return () => clearInterval(interval);
  }, [total]);

  if(loading) return (
    <div className={s.exclLoadingWrap}>
      <div className={s.exclSkeleton}/>
    </div>
  );
  if(error) return <div className="discovery-row__error"><p>⚠️ {error}</p><button className="discovery-btn discovery-btn--retry" onClick={onRetry}><FaRedo/> Retry</button></div>;
  if(!artists.length) return <div className="discovery-row__empty">No exclusive artists found.</div>;

  const a=artists[cur] || artists[0];
  if(!a) return <div className="discovery-row__empty">No exclusive artists found.</div>;
  const hasImg=a.imageUrl&&!a.imageUrl.startsWith('/images/');
  return (
    <div className={s.exclusiveWrap}>
      {/* Heading */}
      <div className={s.exclHeading}>
        <div className={s.exclHeadingLine}/>
        <div className={s.exclHeadingText}>
          <span className={s.exclHeadingPill}><FaCrown style={{fontSize:8}}/> Exclusive Elite</span>
          <h2 className={s.exclHeadingTitle}>Premium <span>Artists</span></h2>
        </div>
        <div className={s.exclHeadingLine}/>
      </div>

      <div className={s.exclCardWrap}>
        {total>1&&(
          <button className={`${s.navBtn} ${s.navBtnLeft}`} onClick={()=>navigate('prev')} aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        <div
          key={animKey}
          style={{opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(10px)',transition:'opacity 0.22s ease,transform 0.22s ease',animation:'cardFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both'}}
        >
          <div className={s.exclusiveCard}>
            {/* Left: image */}
            <div className={s.exclusiveLeft}>
              {hasImg
                ?<img src={getSmartImageUrl(a.imageUrl,500,750)} alt={a.name}/>
                :<div className={s.exclusivePlaceholder}>{initials(a.name)}</div>}
              {/* Gradient overlay for image */}
              <div className={s.exclImgOverlay}/>
              <div className={s.exclusivePageNum}>
                {String(cur+1).padStart(2,'0')}<span>/{String(total).padStart(2,'0')}</span>
              </div>
            </div>
            {/* Right: info */}
            <div className={s.exclusiveRight}>
              <span className={s.exclusiveCatPill}>{a.category}</span>
              <h2 className={s.exclusiveName}>{a.name}</h2>
              <div className={s.exclusiveMeta}>
                <span><FaMapMarkerAlt style={{color:'#d4a843',fontSize:11}}/>{a.location}</span>
                <span><FaStar style={{color:'#d4a843',fontSize:11}}/>{a.rating}.0 Rating</span>
              </div>
              {a.bio&&<p className={s.exclusiveBio}>{a.bio.slice(0,140)}{a.bio.length>140?'…':''}</p>}
              <div className={s.exclusivePriceLabel}>Starting From</div>
              <div className={s.exclusivePrice}>{price(a.price)}</div>
              <div className={s.exclusiveBtns}>
                <button className={s.exclusiveBtnView} onClick={()=>onView(a)}>View Profile</button>
                <button className={s.exclusiveBtnBook} onClick={()=>onBook(a)}>Book This Artist <FaArrowRight style={{fontSize:11}}/></button>
              </div>
            </div>
          </div>
        </div>
        {total>1&&(
          <button className={`${s.navBtn} ${s.navBtnRight}`} onClick={()=>navigate('next')} aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>

      {total>1&&!hideDots&&(
        <div className={s.exclDots}>
          {artists.map((_,i)=>(
            <button key={i} className={`${s.exclDot} ${i===cur?s.exclDotActive:''}`}
              onClick={()=>{setVisible(false);setAnimKey(k=>k+1);setTimeout(()=>{setCur(i);setVisible(true);},220);}}
              aria-label={`Artist ${i+1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── FEATURED: premium full-bleed cards ── */
function FeaturedLayout({artists,onView,onBook,loading,error,onRetry,hideDots}:{
  artists:Artist[];loading:boolean;error:string|null;onRetry:()=>void;
  onView:(a:Artist)=>void;onBook:(a:Artist)=>void;hideDots?:boolean;
}){
  const [cur,setCur]=useState(0);
  const [animKey,setAnimKey]=useState(0);
  const visible=3;
  const max=Math.max(0,artists.length-visible);

  useEffect(() => {
    setCur(0);
  }, [artists]);

  const navigate=(dir:'next'|'prev')=>{
    setAnimKey(k=>k+1);
    setCur(c=>dir==='next'?Math.min(max,c+1):Math.max(0,c-1));
  };

  useEffect(() => {
    if (max <= 0) return;
    const interval = setInterval(() => {
      setAnimKey(k=>k+1);
      setCur(c => c >= max ? 0 : c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [max]);

  if(loading) return (
    <div className={s.featLoadingGrid}>
      {[0,1,2].map(i=>(<div key={i} className={s.featSkeleton} style={{animationDelay:`${i*0.15}s`}}/>))}
    </div>
  );
  if(error) return <div className="discovery-row__error"><p>⚠️ {error}</p><button className="discovery-btn discovery-btn--retry" onClick={onRetry}><FaRedo/> Retry</button></div>;
  if(!artists.length) return <div className="discovery-row__empty">No featured artists found.</div>;
  const shown=artists.slice(cur,cur+visible);
  return (
    <div className={s.featuredWrap}>
      {/* Section heading */}
      <div className={s.featHeading}>
        <div className={s.featHeadingLine}/>
        <div className={s.featHeadingText}>
          <span className={s.featHeadingPill}>★ Hand-Picked</span>
          <h2 className={s.featHeadingTitle}>Featured <span>Artists</span></h2>
        </div>
        <div className={s.featHeadingLine}/>
      </div>

      <div className={s.featCarouselWrap}>
        {/* Left nav */}
        <button
          className={`${s.featNavBtn} ${s.featNavLeft}`}
          onClick={()=>navigate('prev')}
          disabled={cur===0}
          aria-label="Previous"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Cards */}
        <div className={s.featuredRow} key={animKey}>
          {shown.map((a,i)=>{
            const hasImg=a.imageUrl&&!a.imageUrl.startsWith('/images/');
            return (
              <div key={a.id} className={s.featCard} style={{animationDelay:`${i*0.1}s`}}>
                {/* Full-bleed background */}
                <div className={s.featBg}>
                  {hasImg
                    ?<img src={getSmartImageUrl(a.imageUrl,600,750)} alt={a.name} loading="lazy"/>
                    :<div className={s.featBgFallback}>{initials(a.name)}</div>}
                </div>
                {/* Gradient overlays */}
                <div className={s.featGradTop}/>
                <div className={s.featGradBot}/>
                {/* Shimmer sweep */}
                <div className={s.featShimmer}/>
                {/* Rating badge */}
                <div className={s.featRatingBadge}>
                  <FaStar style={{fontSize:9,color:'#d4a843'}}/>
                  <span>{a.rating}.0</span>
                </div>
                {/* Category pill top-left */}
                <span className={s.featCatPill}>{a.category}</span>
                {/* Bottom content */}
                <div className={s.featContent}>
                  <h3 className={s.featName}>{a.name}</h3>
                  {a.location&&(
                    <div className={s.featLocation}>
                      <FaMapMarkerAlt style={{fontSize:10,color:'#d4a843',flexShrink:0}}/>
                      <span>{a.location}</span>
                    </div>
                  )}
                  <div className={s.featPriceRow}>
                    <span className={s.featPriceLabel}>From</span>
                    <span className={s.featPriceVal}>{price(a.price)}</span>
                  </div>
                  <div className={s.featBtns}>
                    <button className={s.featBtnView} onClick={()=>onView(a)}>View Profile</button>
                    <button className={s.featBtnBook} onClick={()=>onBook(a)}>Book Now</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right nav */}
        <button
          className={`${s.featNavBtn} ${s.featNavRight}`}
          onClick={()=>navigate('next')}
          disabled={cur>=max}
          aria-label="Next"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Dots */}
      {artists.length>visible&&!hideDots&&(
        <div className={s.featDots}>
          {Array.from({length:max+1}).map((_,i)=>(
            <button
              key={i}
              className={`${s.featDot} ${i===cur?s.featDotActive:''}`}
              onClick={()=>{setAnimKey(k=>k+1);setCur(i);}}
              aria-label={`Page ${i+1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── FEATURED: 3-column Grid Gallery ── */
function FeaturedGrid({artists,onView,onBook,loading,error,onRetry}:{
  artists:Artist[];loading:boolean;error:string|null;onRetry:()=>void;
  onView:(a:Artist)=>void;onBook:(a:Artist)=>void;
}){
  const INITIAL_COUNT = 6; 
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  
  const handleToggleView = () => {
    if (visibleCount >= artists.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount(visibleCount + 6);
    }
  };

  if(loading) return <div style={{textAlign:'center',padding:'3rem',color:'rgba(255,255,255,0.3)'}}>Loading...</div>;
  if(error) return <div className="discovery-row__error"><p>⚠️ {error}</p><button className="discovery-btn discovery-btn--retry" onClick={onRetry}><FaRedo/> Retry</button></div>;
  if(!artists.length) return <div className="discovery-row__empty">No featured artists found.</div>;

  const displayedItems = artists.slice(0, visibleCount);

  return (
    <div className={s.sectionContainer}>
      <div className={s.featHeading}>
        <div className={s.featHeadingLine}/>
        <div className={s.featHeadingText}>
          <span className={s.featHeadingPill}>★ Hand-Picked</span>
          <h2 className={s.featHeadingTitle}>Featured <span>Artists</span></h2>
        </div>
        <div className={s.featHeadingLine}/>
      </div>

      {/* 3-Column Grid */}
      <div className={s.gridContainer}>
        {displayedItems.map((item, index) => {
          const hasImg = item.imageUrl && !item.imageUrl.startsWith('/images/');
          return (
            <div key={item.id || index} className={s.card}>
              
              {/* Top Image Section */}
              <div className={s.imageWrapper}>
                {hasImg ? (
                  <img src={getSmartImageUrl(item.imageUrl,600,750)} alt={item.name} className={s.image} loading="lazy" />
                ) : (
                  <div className={s.imagePlaceholder}>{initials(item.name)}</div>
                )}
                
                {/* Floating Badges */}
                <div className={s.topBadges}>
                  <span className={s.categoryBadge}>{item.category}</span>
                  <span className={s.ratingBadge}>★ {item.rating}.0</span>
                </div>
                
                {/* Fade out overlay */}
                <div className={s.imageOverlay}></div>
              </div>
              
              {/* Bottom Content Section */}
              <div className={s.cardContent}>
                <h3 className={s.itemName}>{item.name}</h3>
                <p className={s.itemLocation}><FaMapMarkerAlt style={{display:'inline',marginRight:4,color:'#d4a843'}}/> {item.location}</p>
                
                <div className={s.priceRow}>
                  <span className={s.priceLabel}>FROM</span>
                  <span className={s.priceValue}>{price(item.price)}</span>
                </div>

                {/* Action Buttons */}
                <div className={s.cardActions}>
                  <button className={s.btnOutline} onClick={() => onView(item)}>VIEW PROFILE</button>
                  <button className={s.btnSolid} onClick={() => onBook(item)}>BOOK NOW</button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {artists.length > INITIAL_COUNT && (
        <div className={s.buttonContainer}>
          <button onClick={handleToggleView} className={s.toggleButton}>
            {visibleCount >= artists.length ? 'SHOW LESS' : 'SHOW MORE'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── MAIN CONTENT ── */
function ArtistsDiscoveryContent(){
  const searchParams=useSearchParams();
  const urlCat=searchParams.get('category')?.toUpperCase()||'ALL';
  const [activeSection,setActiveSection]=useState<SectionType>('ALL');
  const [activeCategory,setActiveCategory]=useState(urlCat);
  const [sectionVisible,setSectionVisible]=useState(true);
  const [rows,setRows]=useState<Record<RowType,RowState>>({
    trending:{data:[],loading:true,error:null},
    exclusive:{data:[],loading:true,error:null},
    featured:{data:[],loading:true,error:null},
  });
  const [modalOpen,setModalOpen]=useState(false);
  const [selectedArtist,setSelectedArtist]=useState<{id?:number;name?:string}|null>(null);
  const [viewModalOpen,setViewModalOpen]=useState(false);
  const [viewArtist,setViewArtist]=useState<any>(null);

  const fetchRow=useCallback(async(type:RowType,cat:string)=>{
    setRows(p=>({...p,[type]:{...p[type],loading:true,error:null}}));
    try{
      const q=cat!=='ALL'?`?category=${encodeURIComponent(cat)}`:'';
      const res=await fetch(`/api/discovery/${type}${q}`);
      if(!res.ok) throw new Error(`Failed to load ${type}`);
      const json=await res.json();
      if(!json.success) throw new Error(json.message);
      setRows(p=>({...p,[type]:{data:json.data,loading:false,error:null}}));
    }catch(e:any){
      setRows(p=>({...p,[type]:{data:[],loading:false,error:e.message}}));
    }
  },[]);

  const fetchAll=useCallback((cat:string)=>{
    fetchRow('trending',cat); fetchRow('exclusive',cat); fetchRow('featured',cat);
  },[fetchRow]);

  useEffect(()=>{fetchAll(activeCategory);},[activeCategory,fetchAll]);

  const handleCat=(cat:string)=>{
    setActiveCategory(cat);
    const newUrl = cat==='ALL' ? '/artists' : `/artists?category=${encodeURIComponent(cat)}`;
    window.history.replaceState(null, '', newUrl);
  };
  const handleSection=(sec:SectionType)=>{ setSectionVisible(false); setTimeout(()=>{setActiveSection(sec);handleCat('ALL');setSectionVisible(true);},200); };
  const openBooking=(a:Artist)=>{ setSelectedArtist({id:a.id,name:a.name}); setModalOpen(true); };
  const openView=(a:Artist)=>{ setViewArtist(a); setViewModalOpen(true); };

  const visibleRows = activeSection==='ALL' ? ROW_CONFIG : ROW_CONFIG.filter(r=>r.type===activeSection);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#000000]" style={{ paddingTop: '80px' }}>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-[#d4a843]/10 blur-[150px] rounded-full animate-pulse"/>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-[#ff4d4d]/5 blur-[120px] rounded-full animate-pulse" style={{animationDelay:'1s'}}/>
        </div>
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-[#d4a843] animate-ping"/>
            <span className="text-[10px] font-black uppercase tracking-[4px] text-white/70">Premium Talent Roster</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-8 leading-[1] animate-slideUp">
            Browse &amp;&nbsp;<span className="text-gradient">Book Artists</span>
          </h1>
          <div className="flex justify-center gap-4 animate-fadeIn" style={{animationDelay:'300ms'}}>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent to-[#d4a843] rounded-full"/>
            <div className="w-24 h-1 bg-gradient-to-l from-transparent to-[#d4a843] rounded-full"/>
          </div>
        </div>
      </section>

      {/* INTENT */}
      <section className="bg-[#050505] border-y border-white/5" style={{paddingTop:0}}>
        <div className="container" style={{paddingTop:0}}>
          <div style={{marginTop:'-2rem'}}><IntentSection/></div>
        </div>
      </section>

      {/* STICKY FILTER */}
      <section className={s.stickyNav}>
        <div className="container">
          {/* Section Tabs */}
          <div className={s.tabBar}>
            {SECTION_TABS.map(tab=>{
              const isActive=activeSection===tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={()=>handleSection(tab.id)}
                  className={`${s.tabBtn} ${isActive?s.tabBtnActive:''}`}
                  style={{'--tab-color':tab.color} as React.CSSProperties}
                >
                  <span className={s.tabIcon}>{tab.icon}</span>
                  <span className={s.tabLabel}>{tab.label}</span>
                  {isActive&&<span className={s.tabActiveDot}/>}
                </button>
              );
            })}
          </div>

          {/* Category Filter Bar - Hidden on 'ALL' section */}
          {activeSection !== 'ALL' && (
            <div className={s.filterBar} style={{ 
              marginTop: '0', 
              borderTop: 'none', 
              background: 'transparent',
              '--active-color': SECTION_TABS.find(t => t.id === activeSection)?.color || '#d4a843'
            } as React.CSSProperties}>
              <div className={s.filterLabel}>
                <FaStar style={{ fontSize: 10, color: SECTION_TABS.find(t => t.id === activeSection)?.color || '#d4a843' }} /> Filter By
              </div>
              <div className={s.filterDivider} />
              <div className={s.filterPills}>
                {CATEGORIES.map(cat => {
                  const isCatActive = activeCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => handleCat(cat.label)}
                      className={`${s.filterPill} ${isCatActive ? s.filterPillActive : ''}`}
                    >
                      <span className={s.filterPillIcon}>{cat.icon}</span>
                      {cat.label}
                      {isCatActive && <span className={s.filterPillDot} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <section style={{background:'#000',minHeight:'80vh',padding:'48px 0 80px'}}>
        <div className="container" style={{opacity:sectionVisible?1:0,transform:sectionVisible?'translateY(0)':'translateY(16px)',transition:'opacity 0.25s ease,transform 0.25s ease'}}>
          {visibleRows.map(cfg=>{
            const accentColors:Record<string,string>={trending:'#ff6b35',exclusive:'#d4a843',featured:'#a78bfa'};
            const color=accentColors[cfg.type];
            return (
              <div key={cfg.type} style={{marginBottom:64}}>
                {cfg.type==='trending'&&(
                  activeSection === 'trending' && activeCategory === 'ALL' ? (
                    <TrendingGrid artists={rows.trending.data} loading={rows.trending.loading}
                      error={rows.trending.error} onRetry={()=>fetchRow('trending',activeCategory)}
                      onView={openView} onBook={openBooking}/>
                  ) : (
                    <TrendingCollage artists={rows.trending.data} loading={rows.trending.loading}
                      error={rows.trending.error} onRetry={()=>fetchRow('trending',activeCategory)}
                      onView={openView} onBook={openBooking}/>
                  )
                )}
                {cfg.type==='exclusive'&&(
                  activeSection === 'exclusive' && activeCategory === 'ALL' ? (
                    <ExclusiveGrid artists={rows.exclusive.data} loading={rows.exclusive.loading}
                      error={rows.exclusive.error} onRetry={()=>fetchRow('exclusive',activeCategory)}
                      onView={openView} onBook={openBooking}/>
                  ) : (
                    <ExclusiveLayout artists={rows.exclusive.data} loading={rows.exclusive.loading}
                      error={rows.exclusive.error} onRetry={()=>fetchRow('exclusive',activeCategory)}
                      onView={openView} onBook={openBooking} hideDots={activeSection==='ALL'}/>
                  )
                )}
                {cfg.type==='featured'&&(
                  activeSection === 'featured' && activeCategory === 'ALL' ? (
                    <FeaturedGrid artists={rows.featured.data} loading={rows.featured.loading}
                      error={rows.featured.error} onRetry={()=>fetchRow('featured',activeCategory)}
                      onView={openView} onBook={openBooking}/>
                  ) : (
                    <FeaturedLayout artists={rows.featured.data} loading={rows.featured.loading}
                      error={rows.featured.error} onRetry={()=>fetchRow('featured',activeCategory)}
                      onView={openView} onBook={openBooking} hideDots={activeSection==='ALL'}/>
                  )
                )}
              </div>
            );
          })}
        </div>
      </section>

      {viewModalOpen&&viewArtist&&(
        <ArtistDetailsModal artist={viewArtist} onClose={()=>setViewModalOpen(false)}
          onBook={()=>{setViewModalOpen(false);openBooking(viewArtist);}}/>
      )}
      {modalOpen&&(
        <BookingModal onClose={()=>setModalOpen(false)}
          artistName={selectedArtist?.name} artistId={selectedArtist?.id}/>
      )}
    </>
  );
}

export default function ArtistsPage(){
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000] flex items-center justify-center"><div className="text-[#d4a843] animate-pulse text-lg tracking-widest uppercase">Loading...</div></div>}>
      <ArtistsDiscoveryContent/>
    </Suspense>
  );
}
