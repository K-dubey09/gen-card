import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './DocumentLibrary.css';

const DocumentLibrary = () => {
  const { API_URL } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('study');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/documents`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/bmp',
        'image/tiff'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Only PDF, TXT, DOC, DOCX, and image files (JPG, PNG, BMP, TIFF) are allowed');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('category', category);

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Document uploaded successfully!');
        setSelectedFile(null);
        setDescription('');
        setTags('');
        setCategory('study');
        fetchDocuments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload document');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Document deleted successfully');
        fetchDocuments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('text')) return '📃';
    if (fileType.includes('image') || fileType.includes('jpeg') || fileType.includes('jpg') || fileType.includes('png')) return '🖼️';
    return '📎';
  };

  return (
    <div className="document-library">
      <div className="library-header">
        <h2>📚 Document Library</h2>
        <p>Upload and manage your study documents</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Upload Section */}
      <div className="upload-section">
        <h3>📤 Upload New Document</h3>
        <form onSubmit={handleUpload} className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>
                <span className="file-label">
                  {selectedFile ? selectedFile.name : '📎 Choose File (PDF, TXT, DOC, or Images)'}
                </span>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.bmp,.tiff"
                  className="file-input"
                />
              </label>
              {selectedFile && (
                <div className="file-info">
                  {getFileIcon(selectedFile.type)} {formatFileSize(selectedFile.size)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                <option value="study">Study Material</option>
                <option value="notes">Notes</option>
                <option value="assignment">Assignment</option>
                <option value="reference">Reference</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document..."
              className="description-input"
            />
          </div>

          <div className="form-group">
            <label>Tags (Optional, comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. math, algebra, chapter-5"
              className="tags-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="upload-btn"
          >
            {loading ? 'Uploading...' : '📤 Upload Document'}
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="documents-section">
        <h3>📑 Your Documents ({documents.length})</h3>
        
        {loading && documents.length === 0 ? (
          <div className="loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <p>📭 No documents uploaded yet</p>
            <p>Upload your first document to get started!</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc._id} className="document-card">
                <div className="doc-icon">
                  {getFileIcon(doc.fileType)}
                </div>
                <div className="doc-info">
                  <h4>{doc.originalName}</h4>
                  {doc.description && (
                    <p className="doc-description">{doc.description}</p>
                  )}
                  <div className="doc-meta">
                    <span className="doc-size">{formatFileSize(doc.fileSize)}</span>
                    <span className="doc-category">{doc.category}</span>
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="doc-tags">
                      {doc.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {doc.sessionCount > 0 && (
                    <div className="doc-sessions">
                      🎴 {doc.sessionCount} card session(s)
                    </div>
                  )}
                  <div className="doc-date">
                    Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="doc-actions">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('generate-from-doc', { detail: doc }))}
                    className="generate-btn"
                    title="Generate cards from this document"
                  >
                    🎴 Generate Cards
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="delete-btn"
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLibrary;
