import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeSongs } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'new bollywood songs 2026';
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 20;

  try {
    const songs = await searchYouTubeSongs(query, limit);
    return NextResponse.json({ success: true, songs });
  } catch (error: any) {
    console.error('Search API Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
