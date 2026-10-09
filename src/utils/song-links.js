// Derive safe search destinations for current and previously saved songs alike.
export function songLinks({ title, artist }) {
  const query = `${title.trim()} ${artist.trim()}`
  return {
    youtube: `https://www.youtube.com/results?${new URLSearchParams({ search_query: query })}`,
    spotify: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    appleMusic: `https://music.apple.com/us/search?${new URLSearchParams({ term: query })}`,
  }
}
