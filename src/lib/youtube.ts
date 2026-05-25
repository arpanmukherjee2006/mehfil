const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubeTrack {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
}

// Helper to parse ISO 8601 duration string (e.g. PT3M45S -> 3:45)
export function parseISO8601Duration(durationStr: string): string {
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function searchYouTubeSongs(query: string, maxResults = 25): Promise<YouTubeTrack[]> {
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables.');
    return getFallbackSongs(query);
  }

  try {
    // 1. Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query + ' song')}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;
    
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const errData = await searchRes.json();
      console.error('YouTube Search API error:', errData);
      return getFallbackSongs(query);
    }
    
    const searchData = await searchRes.json();
    const items = searchData.items || [];
    
    if (items.length === 0) {
      return [];
    }

    const videoIds = items.map((item: any) => item.id.videoId).filter(Boolean).join(',');
    
    // 2. Fetch video details to get accurate durations
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    
    if (!detailsRes.ok) {
      // Fallback: use search results without accurate duration
      return items.map((item: any) => ({
        id: item.id.videoId,
        title: cleanSongTitle(item.snippet.title),
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        duration: '3:30', // Dummy fallback duration
      }));
    }

    const detailsData = await detailsRes.json();
    const detailsItems = detailsData.items || [];
    
    // Map video details to custom track format
    return detailsItems.map((item: any) => {
      const durationStr = item.contentDetails?.duration || 'PT3M30S';
      return {
        id: item.id,
        title: cleanSongTitle(item.snippet.title),
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        duration: parseISO8601Duration(durationStr),
      };
    });
  } catch (err) {
    console.error('Error fetching from YouTube API:', err);
    return getFallbackSongs(query);
  }
}

// Clean up YouTube titles (e.g. remove "(Official Video)", "Lyrical", etc.)
function cleanSongTitle(title: string): string {
  return title
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s*\(Official\s*Video\)/gi, '')
    .replace(/\s*\[Official\s*Video\]/gi, '')
    .replace(/\s*\(Official\s*Audio\)/gi, '')
    .replace(/\s*\(Lyrical\s*Video\)/gi, '')
    .replace(/\s*\(Lyrical\)/gi, '')
    .replace(/\s*\(Lyrics\)/gi, '')
    .replace(/\s*\|.*/g, '') // remove vertical bar and everything after
    .trim();
}

// Fallback high-quality mock database in case API limits are exceeded or key fails
function getFallbackSongs(query: string): YouTubeTrack[] {
  console.log(`Using fallback mock songs for query: "${query}"`);
  
  const allMocks: YouTubeTrack[] = [
    { id: 'kJQP7kiw5Fk', title: 'Despacito', channelTitle: 'Luis Fonsi', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', duration: '3:47' },
    { id: 'JGwWNGJdvx8', title: 'Shape of You', channelTitle: 'Ed Sheeran', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', duration: '3:53' },
    { id: '2Vv-BfVoq4g', title: 'Perfect', channelTitle: 'Ed Sheeran', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', duration: '4:23' },
    { id: 'OPf0YbXqDm0', title: 'Uptown Funk', channelTitle: 'Mark Ronson ft. Bruno Mars', thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80', duration: '4:30' },
    { id: 'BddP6PYo2gs', title: 'Kesariya (Lofi)', channelTitle: 'Arijit Singh', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', duration: '4:12' },
    { id: 'h7GyJr3Mndw', title: 'Apna Bana Le', channelTitle: 'Arijit Singh', thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80', duration: '3:24' },
    { id: '34Na4j8AVgA', title: 'Starboy', channelTitle: 'The Weeknd', thumbnail: 'https://images.unsplash.com/photo-1487180144351-b8472da7a4c3?w=400&q=80', duration: '3:50' },
    { id: 'D7gd2M4Ftc0', title: 'Blinding Lights', channelTitle: 'The Weeknd', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', duration: '3:21' },
    { id: 'PKh8P-Kx7yA', title: 'Kabira', channelTitle: 'Tochi Raina, Rekha Bhardwaj', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', duration: '3:43' },
    { id: 'fKopy74weus', title: 'Kahani Suno 2.0', channelTitle: 'Kaifi Khalil', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', duration: '2:53' },
    { id: 'VuG7ge_8I8U', title: 'Mi Amor', channelTitle: 'Sharn', thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80', duration: '3:05' },
    { id: 'dZ0fwJojJLA', title: 'Brown Munde', channelTitle: 'AP Dhillon, Gurinder Gill', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', duration: '4:27' },
  ];

  const q = query.toLowerCase();
  const filtered = allMocks.filter(
    (song) => song.title.toLowerCase().includes(q) || song.channelTitle.toLowerCase().includes(q)
  );

  return filtered.length > 0 ? filtered : allMocks.slice(0, 8);
}
