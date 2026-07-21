import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: 'uogxzaud',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // fast, cached reads — fine for public blog content
})

// ─── Image URL helper ──────────────────────────────────────────────────────
// Sanity stores images as references; this builds a usable URL.
export function urlForImage(source) {
  if (!source?.asset?._ref) return null
  const ref = source.asset._ref // e.g. image-abc123-1200x630-jpg
  const [, id, dimensions, format] = ref.split('-')
  return `https://cdn.sanity.io/images/uogxzaud/production/${id}-${dimensions}.${format}`
}

// ─── Fetch all posts (for blog home / latest list) ──────────────────────────
export async function getAllPosts() {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    sport,
    featured,
    publishedAt,
    authorName,
    "category": category->{title, slug, sport},
    "tags": tags[]->{title, slug}
  }`
  return sanityClient.fetch(query)
}

// ─── Fetch featured posts only ───────────────────────────────────────────────
export async function getFeaturedPosts() {
  const query = `*[_type == "post" && featured == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    sport,
    publishedAt,
    authorName,
    "category": category->{title, slug, sport}
  }`
  return sanityClient.fetch(query)
}

// ─── Fetch a single post by slug ─────────────────────────────────────────────
export async function getPostBySlug(slug) {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    sport,
    publishedAt,
    authorName,
    body,
    "category": category->{title, slug, sport},
    "tags": tags[]->{title, slug}
  }`
  return sanityClient.fetch(query, { slug })
}

// ─── Fetch posts by category slug ────────────────────────────────────────────
export async function getPostsByCategory(categorySlug) {
  const query = `*[_type == "post" && category->slug.current == $categorySlug] | order(publishedAt desc) {
    _id, title, slug, excerpt, coverImage, sport, publishedAt, authorName,
    "category": category->{title, slug, sport}
  }`
  return sanityClient.fetch(query, { categorySlug })
}

// ─── Fetch posts by tag slug ──────────────────────────────────────────────────
export async function getPostsByTag(tagSlug) {
  const query = `*[_type == "post" && $tagSlug in tags[]->slug.current] | order(publishedAt desc) {
    _id, title, slug, excerpt, coverImage, sport, publishedAt, authorName,
    "category": category->{title, slug, sport}
  }`
  return sanityClient.fetch(query, { tagSlug })
}

// ─── Fetch all categories (for sidebar, with post counts) ───────────────────
export async function getAllCategories() {
  const query = `*[_type == "category"] {
    title,
    slug,
    sport,
    "postCount": count(*[_type == "post" && references(^._id)])
  }`
  return sanityClient.fetch(query)
}

// ─── Fetch all tags (for tag cloud) ───────────────────────────────────────────
export async function getAllTags() {
  const query = `*[_type == "tag"] {
    title,
    slug,
    "postCount": count(*[_type == "post" && references(^._id)])
  }`
  return sanityClient.fetch(query)
}