import Footer from './Footer'
import styles from './BlogHome.module.css'

const privacySections = [
  ['Who We Are', <>Trivela is operated from Lagos, Nigeria. For support, privacy, account-deletion, or security questions, contact <strong>ogabisamuel99@gmail.com</strong>.</>],
  ['Information We Collect', <>We may collect account information such as your email address, display name, profile image, Firebase user ID, and Player ID. We also collect gameplay information such as scores, matches, tournaments, leaderboards, streaks, achievements, multiplayer connections, friend requests, teams, coins, rewards, and reports of abuse or cheating. We may collect device, browser, IP address, usage, performance, error, installation, and notification information. Trivela may also use local storage and similar technologies for preferences and app functionality.</>],
  ['How We Use Information', <>We use information to create and manage accounts, authenticate users, save progress, operate quizzes and multiplayer features, maintain leaderboards and rewards, send notifications, prevent abuse and cheating, respond to support requests, improve Trivela, and comply with legal obligations. We do not sell personal information.</>],
  ['Public Information', <>Your display name, avatar, Player ID, scores, rankings, achievements, and multiplayer or tournament participation may be visible to other Trivela users. Do not include sensitive information in public profile content.</>],
  ['Notifications and Local Storage', <>If you grant permission, Trivela may send game invitations, challenge reminders, tournament updates, streak reminders, and service announcements. You can disable notifications in Trivela or your device settings. Browser storage may remember preferences, gameplay status, notification settings, and installation prompts.</>],
  ['Service Providers and Transfers', <>Trivela may use Firebase/Google, Vercel Analytics, Sanity, hosting providers, email providers, push-notification providers, and security or error-monitoring services. These providers may process information on our behalf. Some providers may process or store information outside your country, including in the United States.</>],
  ['Retention and Account Deletion', <>We retain information for as long as reasonably necessary to provide Trivela, maintain account and leaderboard functionality, prevent fraud and abuse, resolve disputes, and meet legal or security requirements. If you want to delete your Trivela account and associated personal information, email <strong>ogabisamuel99@gmail.com</strong> with the subject “Trivela Account Deletion Request” and include the email address or Player ID connected to your account. We may verify the request before handling it. Some information may be retained where necessary for security, legal compliance, dispute resolution, or anonymised statistics.</>],
  ['Your Rights', <>Depending on your location and applicable law, you may have rights to access, correct, delete, restrict, or object to certain processing of your information, withdraw consent, request a copy of your information, or complain to a data-protection authority.</>],
  ["Children's Privacy", <>Trivela is intended for users aged 13 and over. We do not knowingly collect personal information from children under 13. If we learn that a child under 13 has created an account, we will take reasonable steps to delete the account and associated personal information. Contact us if you believe this has occurred.</>],
  ['Security and Changes', <>We use reasonable safeguards including secure connections, authentication controls, access restrictions, database security rules, and ongoing maintenance. To report a suspected security vulnerability, email <strong>ogabisamuel99@gmail.com</strong> with “Trivela Security Report” in the subject and include a description, steps to reproduce the issue, and its potential impact. Do not include passwords or private user data in a report. No online service can guarantee complete security. We may update this policy as Trivela changes; the “Last updated” date will show when it was revised.</>],
]

const termsSections = [
  ['Acceptance of These Terms', <>By accessing or using Trivela, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use Trivela.</>],
  ['The Trivela Service', <>Trivela provides sports trivia, quizzes, challenges, leaderboards, multiplayer games, tournaments, profiles, notifications, and related blog content. Features may change, be suspended, or be discontinued as the service develops.</>],
  ['Accounts', <>You are responsible for providing accurate information, keeping your login credentials private, and all activity under your account. You must not impersonate another person, create accounts for abuse, or share account access in a way that creates security or fairness risks.</>],
  ['Fair Play and Prohibited Conduct', <>You must not cheat, exploit bugs, use bots or automation, manipulate scores or leaderboards, interfere with another player’s experience, harass or threaten users, submit unlawful or harmful content, attempt unauthorised access, or use Trivela to violate any law.</>],
  ['Leaderboards, Tournaments, and Coins', <>Scores, rankings, tournament results, and rewards may be reviewed or corrected where we identify errors, cheating, or abuse. Unless expressly stated otherwise, Trivela coins and rewards have no cash value, are not money, and cannot be exchanged for cash or transferred outside Trivela. We may adjust or remove balances connected to abuse or technical errors.</>],
  ['User Content', <>If you submit a username, avatar, feedback, report, or other content, you grant Trivela permission to use it as needed to operate, display, moderate, and improve the service. You must have the right to submit that content, and it must not infringe another person’s rights.</>],
  ['Intellectual Property', <>Trivela, its branding, software, design, questions, content, and features are owned by or licensed to Trivela and may not be copied, modified, sold, or reverse-engineered except where permitted by law.</>],
  ['Third-Party Services', <>Trivela may rely on third-party services for authentication, hosting, analytics, blog content, email, notifications, and infrastructure. Their services may have separate terms and privacy policies, and we are not responsible for services we do not control.</>],
  ['Suspension and Termination', <>We may suspend or terminate access for cheating, abuse, security concerns, violation of these Terms, or legal reasons. You may stop using Trivela at any time. Account deletion requests are handled under the Privacy Policy.</>],
  ['Disclaimers and Liability', <>Trivela is provided on an “as available” basis. We do not guarantee that the service will always be uninterrupted, error-free, completely accurate, or completely secure. To the extent permitted by law, Trivela is not responsible for indirect losses arising from use of the service.</>],
  ['Changes and Contact', <>We may update these Terms as Trivela changes. Continued use after an update means you accept the revised Terms. Questions should be sent to <strong>ogabisamuel99@gmail.com</strong>.</>],
]

export default function LegalPage({ type, onBack, onPlayTrivela }) {
  const isPrivacy = type === 'privacy'
  const sections = isPrivacy ? privacySections : termsSections

  const handleFooterNav = (target) => {
    if (target === 'home') {
      onPlayTrivela()
      return
    }

    const routes = {
      blog: '/blog',
      howToPlay: '/blog/how-to-play',
      feedback: '/blog/feedback',
      about: '/blog/about',
    }
    const path = routes[target]
    if (path) {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Blog</button>
        <button className={styles.playBtn} onClick={onPlayTrivela}>Play Trivela</button>
      </header>

      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px' }}>
        <p style={{ color: '#00FF87', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trivela Legal</p>
        <h1 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 40, margin: '8px 0 10px' }}>
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </h1>
        <p style={{ color: 'rgba(230,240,232,0.45)', fontSize: 13, marginBottom: 34 }}>Last updated: 22 July 2026</p>
        {sections.map(([title, content]) => (
          <section key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 9 }}>{title}</h2>
            <p style={{ color: 'rgba(230,240,232,0.65)', fontSize: 14, lineHeight: 1.75, margin: 0 }}>{content}</p>
          </section>
        ))}
      </main>

      <Footer onNavigate={handleFooterNav} context="blog" />
    </div>
  )
}
