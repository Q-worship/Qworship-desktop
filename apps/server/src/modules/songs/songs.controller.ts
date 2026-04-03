import { Request, Response } from 'express';
import { Song, ISong } from './song.model.js';
import { SongParser } from './songParser.js'; // The legacy parsing engine

// Get all songs for organization
export const getSongs = async (req: any, res: Response) => {
  try {
    // In our new architecture we don't have hardcoded organizations for everyone yet. 
    // We fetch globally or rely on UI-side filtering if user has no org context.
    const songs = await Song.find().sort({ title: 1 });
    
    // Convert structure to frontend format natively
    const formattedSongs = songs.map((s) => ({
      ...s.toObject(),
      id: s._id.toString(),
      verseOrder: s.structure && s.structure.length > 0 ? s.structure.join(", ") : undefined,
    }));

    res.json({ success: true, songs: formattedSongs });
  } catch (error) {
    console.error("Songs fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch songs" });
  }
};

// Get single song logic
export const getSongById = async (req: any, res: Response) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ success: false, error: "Song not found" });

    res.json({ success: true, song: { ...song.toObject(), id: song._id.toString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch song" });
  }
};

// Create a new song into MongoDB
export const createSong = async (req: any, res: Response) => {
  try {
    const { title, artist, album, lyrics, structure, key, tempo, tags, sections, authors, topics, ccliNumber } = req.body;
    
    // We map frontend 'sections' into our embedded schema format
    const newSong = await Song.create({
      title,
      artist: artist || '',
      album: album || '',
      lyrics,
      structure: Array.isArray(structure) ? structure : [],
      sections: Array.isArray(sections) ? sections : [],
      key: key || '',
      tempo: tempo || 120,
      tags: tags || [],
      authors: authors || [],
      topics: topics || [],
      ccliNumber: ccliNumber || '',
      createdBy: req.user._id,
      organizationId: req.user._id, // Assuming personal library namespace for now
    });

    res.json({ success: true, song: { ...newSong.toObject(), id: newSong._id.toString() } });
  } catch (error: any) {
    console.error("Song creation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSong = async (req: any, res: Response) => {
  try {
    const updated = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: "Not found" });
    
    res.json({ success: true, song: { ...updated.toObject(), id: updated._id.toString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Update failed" });
  }
};

export const deleteSong = async (req: any, res: Response) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Song deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Deletion failed" });
  }
};

export const getSongForProjection = async (req: Request, res: Response) => {
  try {
    const { songId } = req.body;
    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ success: false, error: "Song not found" });

    res.json({ success: true, song: { ...song.toObject(), id: song._id.toString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch for projection" });
  }
};

export const searchSongs = async (req: any, res: Response) => {
  try {
    const { query } = req.body;
    const regex = new RegExp(query, 'i');
    const songs = await Song.find({
      $or: [{ title: regex }, { artist: regex }, { lyrics: regex }]
    });

    res.json({ 
      success: true, 
      songs: songs.map(s => ({ ...s.toObject(), id: s._id.toString() })) 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Search failed" });
  }
};

// Legacy Bulk Importer Handler
export const importSong = async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    const { buffer } = req.file;
    const { format } = req.body;

    let parsedSong;
    if (format === "TEXT") {
      parsedSong = SongParser.parseTextFile(buffer.toString("utf-8"));
    } else if (format === "DOCX") {
      parsedSong = await SongParser.parseDOCXFile(buffer);
    } else if (format === "PDF") {
      parsedSong = await SongParser.parsePDFFile(buffer);
    }

    if (!parsedSong) return res.status(400).json({ success: false, error: "Failed to parse song" });

    // Reconstruct legacy song data into precise Mongoose bindings
    const newSong = await Song.create({
      title: parsedSong.title,
      artist: parsedSong.artist || "",
      lyrics: parsedSong.lyrics,
      structure: parsedSong.structure || [],
      // The importer leaves sections blank initially until edited on the dashboard
      sections: [], 
      organizationId: req.user._id,
      createdBy: req.user._id,
    });

    res.json({ success: true, song: { ...newSong.toObject(), id: newSong._id.toString() } });
  } catch (error: any) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
