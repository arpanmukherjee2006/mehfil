import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Playlist from '@/models/Playlist';

// GET /api/playlists - List all playlists
export async function GET() {
  try {
    const { isConnected } = await connectToDatabase();
    
    if (!isConnected) {
      return NextResponse.json({ 
        success: true, 
        playlists: [], 
        dbConnected: false,
        message: 'Database connection offline. Operating in local-only mode.' 
      });
    }

    const playlists = await Playlist.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, playlists, dbConnected: true });
  } catch (error: any) {
    console.error('Playlists GET API Error:', error);
    return NextResponse.json({ 
      success: true, 
      playlists: [], 
      dbConnected: false, 
      error: error.message 
    });
  }
}

// POST /api/playlists - Create new playlist
export async function POST(request: NextRequest) {
  try {
    const { isConnected } = await connectToDatabase();
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Playlist name is required' }, { status: 400 });
    }

    if (!isConnected) {
      return NextResponse.json({ 
        success: false, 
        dbConnected: false,
        message: 'Database connection offline. Playlist created locally instead.' 
      });
    }

    const newPlaylist = new Playlist({
      name,
      description: description || '',
      songs: []
    });

    await newPlaylist.save();
    return NextResponse.json({ success: true, playlist: newPlaylist, dbConnected: true });
  } catch (error: any) {
    console.error('Playlists POST API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
