# Handwritten Notes OCR Setup Guide

## Overview
The Card Maker now supports reading handwritten notes from images using Optical Character Recognition (OCR). This feature allows you to upload photos of handwritten notes and generate flashcards directly from them.

## Supported File Types
- **Images**: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.tiff`
- **Documents**: `.pdf`, `.txt`, `.doc`, `.docx`

## Prerequisites

### 1. Install Tesseract OCR

#### Windows
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (tesseract-ocr-w64-setup-v5.x.x.exe)
3. During installation, note the installation path (default: `C:\Program Files\Tesseract-OCR`)
4. **Important**: Check the option to add Tesseract to system PATH, or manually add it:
   - Right-click "This PC" → Properties → Advanced System Settings
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\Program Files\Tesseract-OCR`
   - Click OK to save

#### macOS
```bash
brew install tesseract
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

### 2. Install Python Dependencies
```bash
cd ai-service
pip install -r requirements.txt
```

This will install:
- `pytesseract==0.3.10` - Python wrapper for Tesseract
- `Pillow==10.1.0` - Image processing library

## Verify Installation

### Check Tesseract
```bash
tesseract --version
```

You should see output like:
```
tesseract 5.x.x
```

### Test OCR
Create a test image with text and run:
```bash
python -c "import pytesseract; from PIL import Image; print(pytesseract.image_to_string(Image.open('test.jpg')))"
```

## Usage

### 1. Start the AI Service
```bash
cd ai-service
python app.py
```

You should see:
```
🤖 AI CARD GENERATOR SERVICE
============================================================
🚀 Starting Python AI microservice...
🔌 Endpoint: http://localhost:5001/generate-cards
🔑 OpenAI API: Configured
📸 OCR Support: Enabled (Handwritten notes supported)
============================================================
```

### 2. Upload Handwritten Notes

#### Via Dashboard
1. Go to "Study Cards" section
2. Click "Upload File" tab
3. Select an image of your handwritten notes (JPG, PNG, etc.)
4. Set the number of cards to generate
5. Click "Generate Cards"

#### Via Documents Library
1. Go to "Documents" section
2. Click "Upload New Document"
3. Choose an image file with handwritten notes
4. Add description, tags, and category
5. Click "Upload Document"
6. Once uploaded, click "Generate Cards" on the document

## Tips for Best Results

### Image Quality
- **Resolution**: Use high-resolution images (1080p or higher)
- **Lighting**: Ensure good, even lighting without shadows
- **Focus**: Make sure the text is sharp and in focus
- **Contrast**: High contrast between text and background works best

### Handwriting
- **Legibility**: Write as clearly as possible
- **Size**: Larger text is easier to recognize
- **Spacing**: Leave adequate space between lines and words
- **Background**: Use plain white or light-colored paper

### Camera Tips
- Hold the camera parallel to the page (avoid angles)
- Fill the frame with the page
- Avoid glare and reflections
- Use good lighting (natural light works best)

## Troubleshooting

### Error: "Tesseract not found"
**Solution**: Tesseract is not installed or not in system PATH
- Windows: Reinstall Tesseract and ensure it's added to PATH
- Mac/Linux: Run `which tesseract` to verify installation

### Error: "OCR extraction failed"
**Solution**: Image quality issues
- Check image is clear and readable
- Try taking a new photo with better lighting
- Ensure text is in focus and not blurry

### Low Quality OCR Results
**Solution**: Improve image quality
- Use higher resolution camera
- Improve lighting conditions
- Write more clearly
- Try scanning instead of photographing

### "Text too short" Error
**Solution**: OCR didn't extract enough text
- Ensure there's sufficient text in the image (minimum 50 characters)
- Check image quality and lighting
- Try different OCR settings or reprocess

## Technical Details

### OCR Configuration
The system uses two OCR modes:
1. **PSM 3** (default): Fully automatic page segmentation
2. **PSM 6** (fallback): Single uniform block of text

If first mode extracts less than 50 characters, it automatically tries the second mode.

### Text Extraction Flow
```
Image Upload → Tesseract OCR → Text Extraction → AI Processing → Card Generation
```

### Supported Languages
Currently configured for English. To add other languages:
1. Install language pack: `tesseract-ocr-[lang]`
2. Modify OCR config in `ai-service/app.py`

## Advanced Configuration

### Custom Tesseract Path (Windows)
If Tesseract is installed in a non-default location, edit `ai-service/app.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Your\Custom\Path\tesseract.exe'
```

### OCR Parameters
Modify the OCR configuration in `extract_text_from_image()` function:

```python
# For handwritten text (less strict)
custom_config = r'--oem 3 --psm 6'

# For printed text (more accurate)
custom_config = r'--oem 3 --psm 3'

# With specific language
custom_config = r'--oem 3 --psm 3 -l eng'
```

## Support

For issues or questions:
1. Check Tesseract installation: `tesseract --version`
2. Check Python dependencies: `pip list | grep -E "pytesseract|Pillow"`
3. Review AI service logs for detailed error messages
4. Ensure image meets quality guidelines above

## Resources
- [Tesseract Documentation](https://tesseract-ocr.github.io/)
- [pytesseract GitHub](https://github.com/madmaze/pytesseract)
- [Improving OCR Results](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
