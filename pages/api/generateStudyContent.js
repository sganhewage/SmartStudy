// pages/api/generateStudyContent.js
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { uploadToGridFS } from '@/models/gridfsUtils'; // update path if needed
import connect from '@/dbConfig';
import jwt from 'jsonwebtoken';
import User from '@/models/userModel';
import mongoose from 'mongoose';

// Important for file uploads in Pages Router
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connect();

  const form = formidable({ multiples: true, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing failed:', err);
      return res.status(400).json({ message: 'Form parsing error' });
    }

    console.log("FIELDS:", fields);
console.log("FILES:", files);

    try {
      // Extract and parse form fields
      const {
        sessionName,
        sessionDescription,
        instructions,
        generationList,
        configMap
      } = fields;

      const parsedGenerations = generationList;
      const parsedConfig = configMap;

      // Handle files
      const uploadedFiles = [];
      
      // Check if files.files exists (your form field name)
      if (files.files) {
        const fileArray = Array.isArray(files.files) ? files.files : [files.files];
        uploadedFiles.push(...fileArray);
      } else {
        // Fallback: collect all files regardless of field name
        Object.values(files).forEach(file => {
          if (Array.isArray(file)) {
            uploadedFiles.push(...file);
          } else if (file && file.filepath) {
            uploadedFiles.push(file);
          }
        });
      }

      console.log(`Processing ${uploadedFiles.length} files`);

      const gridfsFiles = [];
      for (const file of uploadedFiles) {
        const fileBuffer = await fs.readFile(file.filepath);
        const meta = await uploadToGridFS(file.originalFilename, file.mimetype, fileBuffer);

        gridfsFiles.push({
          fileName: meta.filename,
          fileType: meta.contentType,
          gridFsId: meta.fileId,
        });

        console.log(meta.fileId);
      }

      // Get user token
      const token = req.cookies?.token;
      if (!token) return res.status(401).json({ message: 'Unauthorized' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Save session
      const session = user.sessions.create({
        name: sessionName[0], // assuming sessionName is an array
        description: sessionDescription[0] || '', // assuming sessionDescription is an array
        instructions: instructions[0] || '', // assuming instructions is an array
        files: gridfsFiles,
        generationList: parsedGenerations,
        configMap: parsedConfig,
        createdAt: new Date(),
      });

      await user.sessions.push(session);
      await user.save();
      
      //print session id
      console.log('New session created with ID:', session._id);
      

      return res.status(200).json({
        message: 'Session created successfully',
        sessionId: user.sessions[user.sessions.length - 1]._id
      });
    } catch (e) {
      console.error('Upload error:', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
}
