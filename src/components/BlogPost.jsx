import { useState, useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { getPostBySlug, urlForImage } from '../lib/blog'
import styles from './BlogPost.module.css'
import Footer from './Footer'

const ptComponents = {
  types: {
    image: ({ value }) => (
      <img src={urlForImage(value)} alt="" className={styles.bodyImage} />
    ),
  },
}

export default function BlogPost({ slug, onBack, onPlayTrivela }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    getPostBySlug(slug)
      .then((data) => {
        if (!active) return
        if (!data) {
          setNotFound(true)
        } else {
          setPost(data)
        }
      })
      .catch((e) => {
        console.error('Failed to load post:', e)
        if (active) setNotFound(true)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug])

  if (loading) {
    return <div className={styles.wrap}><p className={styles.loading}>Loading article…</p></div>
  }

  if (notFound || !post) {
    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Blog</button>
        <p className={styles.loading}>Article not found.</p>
      </div>
    )
  }

  const sportColor = post.sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const sportLabel = post.sport === 'basketball' ? '🏀 Basketball' : post.sport === 'football' ? '⚽ Football' : 'Trivela'
  
function handleFooterNav(target) {
    if (target === 'home') {
      window.location.href = '/'
    } else if (target === 'feedback') {
      window.history.pushState({}, '', '/blog/feedback')
      setScreenLocal?.('blogFeedback') // placeholder, see note below
    } else if (target === 'about') {
      window.history.pushState({}, '', '/blog/about')
    } else if (target === 'howToPlay') {
      window.history.pushState({}, '', '/blog/how-to-play')
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Blog</button>
        <button className={styles.playBtn} onClick={onPlayTrivela}>Play Trivela</button>
      </header>

      <article className={styles.article}>
        <span className={styles.sportPill} style={{ background: sportColor }}>{sportLabel}</span>

        <h1 className={styles.title}>{post.title}</h1>

        <p className={styles.meta}>
          {post.authorName} · {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {post.category && <> · {post.category.title}</>}
        </p>

        {post.coverImage && (
          <img src={urlForImage(post.coverImage)} alt={post.title} className={styles.coverImage} />
        )}

        <div className={styles.body}>
          <PortableText value={post.body} components={ptComponents} />
        </div>

        {post.tags?.length > 0 && (
          <div className={styles.tagRow}>
            {post.tags.map((tag) => (
              <span key={tag.slug.current} className={styles.tagPill}>{tag.title}</span>
            ))}
          </div>
        )}

        <div className={styles.ctaBox}>
          <p className={styles.ctaText}>Enjoyed this? Test your knowledge in today's Daily Challenge.</p>
          <button className={styles.ctaBtn} onClick={onPlayTrivela}>Play Now</button>
        </div>
      </article>
            <Footer onNavigate={handleFooterNav} context="blog" />

    </div>
  )
}