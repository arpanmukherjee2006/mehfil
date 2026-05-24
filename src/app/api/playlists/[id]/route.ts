import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Playlist from '@/models/Playlist';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/playlists/[id] - Fetch detailed playlist
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { isConnected } = await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    if (!isConnected) {
      return NextResponse.json({ success: false, dbConnected: false, message: 'Database offline' }, { status: 503 });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return NextResponse.json({ success: false, message: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, playlist, dbConnected: true });
  } catch (error: any) {
    console.error('Playlist GET ID Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/playlists/[id] - Update playlist (Rename or Add/Remove Songs)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { isConnected } = await connectToDatabase();
    const params = await context.params;
    const { id } = params;
    
    const body = await request.json();
    const { name, description, songs, action, song } = body;

    if (!isConnected) {
      return NextResponse.json({ success: false, dbConnected: false, message: 'Database offline' }, { status: 503 });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return NextResponse.json({ success: false, message: 'Playlist not found' }, { status: 404 });
    }

    // Handle adding a song
    if (action === 'add' && song) {
      // Avoid duplicate song addition
      const songExists = playlist.songs.some((s: any) => s.id === song.id);
      if (!songExists) {
        playlist.songs.push({
          id: song.id,
          title: song.title,
          channelTitle: song.channelTitle,
          thumbnail: song.thumbnail,
          duration: song.duration,
          addedAt: new Date()
        });
      }
    } 
    // Handle removing a song
    else if (action === 'remove' && song) {
      playlist.songs = playlist.songs.filter((s: any) => s.id !== song.id);
    } 
    // Handle full songs override
    else if (songs) {
      playlist.songs = songs;
    }

    // Handle name/description update
    if (name) playlist.name = name;
    if (description !== undefined) playlist.description = description;

    await playlist.save();
    return NextResponse.json({ success: true, playlist, dbConnected: true });
  } catch (error: any) {
    console.error('Playlist PUT ID Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/playlists/[id] - Delete playlist
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { isConnected } = await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    if (!isConnected) {
      return NextResponse.json({ success: false, dbConnected: false, message: 'Database offline' }, { status: 503 });
    }

    const playlist = await Playlist.findByIdAndDelete(id);
    if (!playlist) {
      return NextResponse.json({ success: false, message: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Playlist deleted successfully', dbConnected: true });
  } catch (error: any) {
    console.error('Playlist DELETE ID Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
