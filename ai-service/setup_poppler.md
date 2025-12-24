# Poppler Setup for PDF Image Extraction

## Windows Setup

`pdf2image` requires Poppler to convert PDF pages to images for OCR.

### Option 1: Download Pre-built Binaries (Recommended)

1. Download Poppler for Windows from:
   https://github.com/oschwartz10612/poppler-windows/releases/

2. Extract the ZIP file to a location like:
   `C:\poppler` or `C:\Program Files\poppler`

3. Add the `bin` folder to your system PATH:
   - `C:\poppler\Library\bin` (or wherever you extracted it)

### Option 2: Use Conda (If using Anaconda/Miniconda)

```bash
conda install -c conda-forge poppler
```

### Verify Installation

Run in Python:
```python
from pdf2image import convert_from_path
# If no error about poppler, it's installed correctly
```

## Alternative: Use Local Poppler Path

If you don't want to add to PATH, update the code to specify poppler path:

```python
images = convert_from_path(file_path, dpi=300, poppler_path=r'C:\poppler\Library\bin')
```
