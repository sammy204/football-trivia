import { useState, useEffect } from 'react'
import { getAllPosts, getFeaturedPosts, getAllCategories, getAllTags, urlForImage } from '../lib/blog'
import styles from './BlogHome.module.css'
import Footer from './Footer'

function ArticleCard({ post, onOpenPost, featured = false }) {
  const sportColor = post.sport === 'basketball' ? '#FF6B35' : '#00FF87'
  return (
    <div className={featured ? styles.featuredCard : styles.articleCard} onClick={() => onOpenPost(post.slug.current)}>
      <div className={styles.thumbWrap}>
        {post.coverImage && (
          <img src={urlForImage(post.coverImage)} alt={post.title} className={styles.thumb} />
        )}
        <span className={styles.sportPill} style={{ background: sportColor }}>
          {post.sport === 'basketball' ? '🏀 Basketball' : post.sport === 'football' ? '⚽ Football' : 'Trivela'}
        </span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{post.title}</h3>
        <p className={styles.cardExcerpt}>{post.excerpt}</p>
        <p className={styles.cardMeta}>
          {post.authorName} · {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

export default function BlogHome({ onOpenPost, onBack, onPlayTrivela, onNavigate }) {
  const [posts, setPosts] = useState([])
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [allPosts, featuredPosts, cats, allTags] = await Promise.all([
          getAllPosts(),
          getFeaturedPosts(),
          getAllCategories(),
          getAllTags(),
        ])
        setPosts(allPosts)
        setFeatured(featuredPosts)
        setCategories(cats)
        setTags(allTags)
      } catch (e) {
        console.error('Failed to load blog content:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

function handleFooterNav(target) {
  if (target === 'home') {
    window.location.href = '/'
  } else if (target === 'feedback') {
    window.history.pushState({}, '', '/blog/feedback')
    onNavigate?.('blogFeedback')
  } else if (target === 'about') {
    window.history.pushState({}, '', '/blog/about')
    onNavigate?.('blogAbout')
 } else if (target === 'howToPlay') {
    window.history.pushState({}, '', '/blog/how-to-play')
    onNavigate?.('blogHowToPlay')   
}
}

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>

        <button className={styles.playBtn} onClick={onPlayTrivela}>Play Trivela</button>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Sports Knowledge. Game Insights. Pure Passion.</h1>
        <p className={styles.heroSub}>
          {posts.length} articles · Football & Basketball
        </p>
      </section>

      {loading ? (
        <p className={styles.loading}>Loading articles…</p>
      ) : (
        <div className={styles.layout}>
          <main className={styles.main}>
            {featured.length > 0 && (
              <>
                <h2 className={styles.sectionTitle}>Featured</h2>
                <div className={styles.featuredGrid}>
                  {featured.slice(0, 3).map((post) => (
                    <ArticleCard key={post._id} post={post} onOpenPost={onOpenPost} featured />
                  ))}
                </div>
              </>
            )}

            <h2 className={styles.sectionTitle}>Latest Articles</h2>
            <div className={styles.latestList}>
              {filteredPosts.map((post) => (
                <ArticleCard key={post._id} post={post} onOpenPost={onOpenPost} />
              ))}
            </div>
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarBox}>
              <p className={styles.sidebarTitle}>Search</p>
              <input
                className={styles.searchInput}
                placeholder="Search articles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.sidebarBox}>
              <p className={styles.sidebarTitle}>Trivia of the Day</p>
              <p className={styles.trivialBoxText}>
                Test your knowledge with today's Daily Challenge.
              </p>
              <button className={styles.trivialBoxBtn} onClick={onPlayTrivela}>Play Now</button>
            </div>

            <div className={styles.sidebarBox}>
              <p className={styles.sidebarTitle}>Categories</p>
              {categories.map((cat) => (
                <p key={cat.slug.current} className={styles.categoryItem}>
                  {cat.title} <span className={styles.count}>({cat.postCount})</span>
                </p>
              ))}
            </div>

            <div className={styles.sidebarBox}>
              <p className={styles.sidebarTitle}>Tags</p>
              <div className={styles.tagCloud}>
                {tags.map((tag) => (
                  <span key={tag.slug.current} className={styles.tagPill}>
                    {tag.title}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
        <Footer onNavigate={handleFooterNav} context="blog" />
    </div>
  )
}