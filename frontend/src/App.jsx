import React, { useEffect, useState } from 'react'
import { fetchArticles } from './api'

export default function App() {
  const [articles, setArticles] = useState([])
  useEffect(() => { fetchArticles().then(setArticles).catch(console.error) }, [])

  return (
    <div className="container">
      <h1>BeyondChats Articles</h1>
      <div className="grid">
        {articles.map(a => (
          <article key={a.id} className="card">
            <h2>{a.title}</h2>
            <div className="meta">Published: {a.published_at || '—'}</div>
            <div className="body" dangerouslySetInnerHTML={{ __html: a.body }} />
            {a.references && a.references.length > 0 && (
              <div className="refs">
                <h4>References</h4>
                <ul>{a.references.map((r, i) => <li key={i}><a href={r} target="_blank" rel="noreferrer">{r}</a></li>)}</ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
