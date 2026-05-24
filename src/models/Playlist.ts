import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ISong {
  id: string; // YouTube Video ID
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration?: string;
  addedAt: Date;
}

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  songs: ISong[];
  createdAt: Date;
}

const SongSchema = new Schema<ISong>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  channelTitle: { type: String, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const PlaylistSchema = new Schema<IPlaylist>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  songs: { type: [SongSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Avoid Re-compiling the model in serverless Next.js environment
export default models.Playlist || model<IPlaylist>('Playlist', PlaylistSchema);
